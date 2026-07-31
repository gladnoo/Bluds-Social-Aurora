import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { canViewProfile } from "./users.js";
import { notify, notifyMentions } from "../lib/notifications.js";
import { getBlockedIds } from "../lib/blocks.js";
import { uploadToStorage } from "../lib/supabase.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB por imagem
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Apenas imagens são permitidas"));
    cb(null, true);
  },
});

const router = Router();

function extOf(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot);
}

const postInclude = {
  author: true,
  likes: true,
  reposts: true,
  bookmarks: true,
  _count: { select: { replies: true } },
  poll: { include: { options: { include: { votes: true } } } },
  quoteOf: {
    include: {
      author: true,
      likes: true,
      reposts: true,
      bookmarks: true,
      _count: { select: { replies: true } },
      poll: { include: { options: { include: { votes: true } } } },
    },
  },
};

function serializePost(post, currentUserId) {
  if (!post) return null;

  let images = [];
  try {
    images = JSON.parse(post.images || "[]");
  } catch {
    images = [];
  }

  let poll = null;
  if (post.poll) {
    const totalVotes = post.poll.options.reduce((sum, o) => sum + o.votes.length, 0);
    poll = {
      id: post.poll.id,
      totalVotes,
      votedOptionId: currentUserId
        ? post.poll.options.find((o) => o.votes.some((v) => v.userId === currentUserId))?.id ?? null
        : null,
      options: post.poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        voteCount: o.votes.length,
      })),
    };
  }

  return {
    id: post.id,
    content: post.content,
    images,
    editedAt: post.editedAt,
    createdAt: post.createdAt,
    author: {
      id: post.author.id,
      username: post.author.username,
      displayName: post.author.displayName,
      avatarUrl: post.author.avatarUrl,
    },
    poll,
    likeCount: post.likes.length,
    likedByMe: currentUserId ? post.likes.some((l) => l.userId === currentUserId) : false,
    repostCount: post.reposts.length,
    repostedByMe: currentUserId ? post.reposts.some((r) => r.userId === currentUserId) : false,
    bookmarkedByMe: currentUserId ? post.bookmarks.some((b) => b.userId === currentUserId) : false,
    replyCount: post._count?.replies ?? 0,
    replyToId: post.replyToId ?? null,
    quoteOf: post.quoteOf ? serializePost(post.quoteOf, currentUserId) : null,
  };
}

// Hashtags em alta (últimos 200 posts)
router.get("/trending/tags", async (req, res) => {
  const posts = await prisma.post.findMany({
    where: { replyToId: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { content: true },
  });

  const counts = {};
  const regex = /#(\w+)/g;
  for (const p of posts) {
    let m;
    while ((m = regex.exec(p.content))) {
      const tag = m[1].toLowerCase();
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }

  const trending = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  res.json(trending);
});

// Posts que contêm uma hashtag
router.get("/hashtag/:tag", optionalAuth, async (req, res) => {
  const tag = req.params.tag;
  const posts = await prisma.post.findMany({
    where: { content: { contains: `#${tag}` }, replyToId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude,
  });
  res.json(posts.map((p) => serializePost(p, req.userId)));
});

const PAGE_SIZE = 20;

// Feed principal — ?feed=following filtra só quem o usuário logado segue
// ?page=N (a partir de 0) pra scroll infinito
router.get("/", optionalAuth, async (req, res) => {
  const currentUserId = req.userId;
  const onlyFollowing = req.query.feed === "following";
  const page = Math.max(0, parseInt(req.query.page) || 0);
  const takeCount = (page + 1) * PAGE_SIZE;

  const blockedIds = await getBlockedIds(currentUserId);

  let allowedAuthorIds = null;
  if (onlyFollowing) {
    if (!currentUserId) return res.json({ items: [], hasMore: false });
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId, accepted: true },
      select: { followingId: true },
    });
    allowedAuthorIds = [currentUserId, ...following.map((f) => f.followingId)];
  }

  const blockFilter = blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {};

  const [posts, reposts] = await Promise.all([
    prisma.post.findMany({
      where: {
        replyToId: null,
        ...blockFilter,
        ...(allowedAuthorIds ? { authorId: { in: allowedAuthorIds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: takeCount,
      include: postInclude,
    }),
    prisma.repost.findMany({
      where: {
        ...(blockedIds.length > 0 ? { userId: { notIn: blockedIds }, post: { authorId: { notIn: blockedIds } } } : {}),
        ...(allowedAuthorIds ? { userId: { in: allowedAuthorIds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: takeCount,
      include: { user: true, post: { include: postInclude } },
    }),
  ]);

  const merged = [
    ...posts.map((p) => ({ sortDate: p.createdAt, repostedBy: null, post: p })),
    ...reposts.map((r) => ({
      sortDate: r.createdAt,
      repostedBy: { username: r.user.username, displayName: r.user.displayName },
      post: r.post,
    })),
  ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

  const pageItems = merged
    .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    .map((item) => ({ repostedBy: item.repostedBy, post: serializePost(item.post, currentUserId) }));

  const hasMore = posts.length === takeCount || reposts.length === takeCount;

  res.json({ items: pageItems, hasMore });
});

// Posts de um usuário (perfil) — aba "Posts"
router.get("/user/:username", optionalAuth, async (req, res) => {
  const { user, allowed } = await canViewProfile(req.params.username, req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!allowed) return res.json([]);

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, replyToId: null },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  res.json(posts.map((p) => serializePost(p, req.userId)));
});

// Respostas de um usuário — aba "Respostas"
router.get("/user/:username/replies", optionalAuth, async (req, res) => {
  const { user, allowed } = await canViewProfile(req.params.username, req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!allowed) return res.json([]);

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, NOT: { replyToId: null } },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  res.json(posts.map((p) => serializePost(p, req.userId)));
});

// Posts curtidos por um usuário — aba "Curtidas"
router.get("/user/:username/likes", optionalAuth, async (req, res) => {
  const { user, allowed } = await canViewProfile(req.params.username, req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!allowed) return res.json([]);

  const likes = await prisma.like.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { post: { include: postInclude } },
  });
  res.json(likes.map((l) => serializePost(l.post, req.userId)));
});

// Posts com imagem de um usuário — aba "Mídia"
router.get("/user/:username/media", optionalAuth, async (req, res) => {
  const { user, allowed } = await canViewProfile(req.params.username, req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!allowed) return res.json([]);

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, replyToId: null, NOT: { images: "[]" } },
    orderBy: { createdAt: "desc" },
    include: postInclude,
  });
  res.json(posts.map((p) => serializePost(p, req.userId)));
});

// Posts salvos pelo usuário logado
router.get("/bookmarks/me", requireAuth, async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    include: { post: { include: postInclude } },
  });
  res.json(bookmarks.map((b) => serializePost(b.post, req.userId)));
});

// Detalhe de um post + suas respostas (thread)
router.get("/:id", optionalAuth, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { ...postInclude, replyTo: { include: { author: true } } },
  });
  if (!post) return res.status(404).json({ error: "Post não encontrado" });

  const replies = await prisma.post.findMany({
    where: { replyToId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: postInclude,
  });

  res.json({
    post: serializePost(post, req.userId),
    replyTo: post.replyTo
      ? { id: post.replyTo.id, author: { username: post.replyTo.author.username, displayName: post.replyTo.author.displayName } }
      : null,
    replies: replies.map((r) => serializePost(r, req.userId)),
  });
});

// Criar post — texto, resposta, quote, até 4 imagens e/ou enquete (multipart/form-data)
router.post("/", requireAuth, upload.array("images", 4), async (req, res) => {
  const { content, replyToId, quoteOfId, pollOptions } = req.body;
  const files = req.files || [];

  let parsedOptions = [];
  if (pollOptions) {
    try {
      parsedOptions = JSON.parse(pollOptions).map((s) => (s || "").trim()).filter(Boolean).slice(0, 4);
    } catch {
      parsedOptions = [];
    }
  }
  const hasPoll = parsedOptions.length >= 2;

  if ((!content || !content.trim()) && files.length === 0 && !hasPoll) {
    return res.status(400).json({ error: "O post não pode estar vazio" });
  }
  if (content && content.length > 280) {
    return res.status(400).json({ error: "O post pode ter no máximo 280 caracteres" });
  }
  if (pollOptions && !hasPoll) {
    return res.status(400).json({ error: "A enquete precisa de pelo menos 2 opções" });
  }

  if (replyToId) {
    const parent = await prisma.post.findUnique({ where: { id: replyToId } });
    if (!parent) return res.status(404).json({ error: "Post original não encontrado" });
  }
  if (quoteOfId) {
    const quoted = await prisma.post.findUnique({ where: { id: quoteOfId } });
    if (!quoted) return res.status(404).json({ error: "Post citado não encontrado" });
  }

  const post = await prisma.post.create({
    data: {
      content: content || "",
      images: "[]",
      authorId: req.userId,
      replyToId: replyToId || null,
      quoteOfId: quoteOfId || null,
      ...(hasPoll ? { poll: { create: { options: { create: parsedOptions.map((text) => ({ text })) } } } } : {}),
    },
    include: postInclude,
  });

  if (files.length > 0) {
    const urls = await Promise.all(
      files.map((f, i) =>
        uploadToStorage(f.buffer, f.mimetype, `posts/${post.id}-${i}-${Date.now()}${extOf(f.originalname)}`)
      )
    );
    await prisma.post.update({ where: { id: post.id }, data: { images: JSON.stringify(urls) } });
    post.images = JSON.stringify(urls);
  }

  if (replyToId) {
    const parent = await prisma.post.findUnique({ where: { id: replyToId } });
    if (parent) await notify({ type: "reply", recipientId: parent.authorId, actorId: req.userId, postId: post.id });
  }
  if (content) await notifyMentions({ content, actorId: req.userId, postId: post.id });

  res.status(201).json(serializePost(post, req.userId));
});

// Editar o texto de um post (só o autor)
router.patch("/:id", requireAuth, async (req, res) => {
  const { content } = req.body;
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post não encontrado" });
  if (post.authorId !== req.userId) return res.status(403).json({ error: "Sem permissão" });
  if (!content || !content.trim()) return res.status(400).json({ error: "O post não pode ficar vazio" });
  if (content.length > 280) return res.status(400).json({ error: "O post pode ter no máximo 280 caracteres" });

  const updated = await prisma.post.update({
    where: { id: req.params.id },
    data: { content, editedAt: new Date() },
    include: postInclude,
  });
  res.json(serializePost(updated, req.userId));
});

// Apagar post (só o autor)
router.delete("/:id", requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post não encontrado" });
  if (post.authorId !== req.userId) return res.status(403).json({ error: "Sem permissão" });

  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Fixar / desafixar post no perfil (alterna)
router.post("/:id/pin", requireAuth, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Post não encontrado" });
  if (post.authorId !== req.userId) return res.status(403).json({ error: "Sem permissão" });

  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const newPinnedId = me.pinnedPostId === post.id ? null : post.id;

  await prisma.user.update({ where: { id: req.userId }, data: { pinnedPostId: newPinnedId } });
  res.json({ pinnedPostId: newPinnedId });
});

// Votar em uma enquete
router.post("/:id/poll/vote", requireAuth, async (req, res) => {
  const { optionId } = req.body;
  const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { poll: true } });
  if (!post || !post.poll) return res.status(404).json({ error: "Enquete não encontrada" });

  const option = await prisma.pollOption.findUnique({ where: { id: optionId } });
  if (!option || option.pollId !== post.poll.id) return res.status(400).json({ error: "Opção inválida" });

  const existing = await prisma.pollVote.findUnique({
    where: { userId_postId: { userId: req.userId, postId: post.id } },
  });
  if (existing) return res.status(400).json({ error: "Você já votou nessa enquete" });

  await prisma.pollVote.create({ data: { userId: req.userId, postId: post.id, optionId } });

  const updated = await prisma.post.findUnique({ where: { id: post.id }, include: postInclude });
  res.json(serializePost(updated, req.userId));
});

// Curtir / descurtir
router.post("/:id/like", requireAuth, async (req, res) => {
  const postId = req.params.id;
  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: req.userId, postId } } });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: "Post não encontrado" });
    await prisma.like.create({ data: { userId: req.userId, postId } });
    await notify({ type: "like", recipientId: post.authorId, actorId: req.userId, postId });
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, include: postInclude });
  res.json(serializePost(post, req.userId));
});

// Repostar / desfazer repost
router.post("/:id/repost", requireAuth, async (req, res) => {
  const postId = req.params.id;
  const original = await prisma.post.findUnique({ where: { id: postId } });
  if (!original) return res.status(404).json({ error: "Post não encontrado" });

  const existing = await prisma.repost.findUnique({ where: { userId_postId: { userId: req.userId, postId } } });
  if (existing) {
    await prisma.repost.delete({ where: { id: existing.id } });
  } else {
    await prisma.repost.create({ data: { userId: req.userId, postId } });
    await notify({ type: "repost", recipientId: original.authorId, actorId: req.userId, postId });
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, include: postInclude });
  res.json(serializePost(post, req.userId));
});

// Salvar / remover dos salvos
router.post("/:id/bookmark", requireAuth, async (req, res) => {
  const postId = req.params.id;
  const existing = await prisma.bookmark.findUnique({ where: { userId_postId: { userId: req.userId, postId } } });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
  } else {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: "Post não encontrado" });
    await prisma.bookmark.create({ data: { userId: req.userId, postId } });
  }

  const post = await prisma.post.findUnique({ where: { id: postId }, include: postInclude });
  res.json(serializePost(post, req.userId));
});

export default router;
