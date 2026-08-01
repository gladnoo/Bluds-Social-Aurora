import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { isBlocked } from "../lib/blocks.js";
import { notify } from "../lib/notifications.js";
import { uploadToStorage } from "../lib/supabase.js";
import { computeBadges } from "../lib/badges.js";

function extOf(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Apenas imagens são permitidas"));
    cb(null, true);
  },
});

const router = Router();

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// Confere se um usuário (viewerId) pode ver o conteúdo de um perfil (privacidade)
async function canViewProfile(username, viewerId) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return { user: null, allowed: false };
  if (viewerId && (await isBlocked(viewerId, user.id))) return { user, allowed: false };
  if (!user.isPrivate) return { user, allowed: true };
  if (viewerId === user.id) return { user, allowed: true };
  if (!viewerId) return { user, allowed: false };

  const rel = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
  });
  return { user, allowed: !!rel?.accepted };
}

// IMPORTANTE: rotas fixas (/search, /suggestions, /me...) sempre precisam vir
// ANTES de "/:username", senão o Express tenta interpretá-las como um nome de usuário.

router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  const users = await prisma.user.findMany({
    where: { OR: [{ username: { contains: q } }, { displayName: { contains: q } }] },
    take: 20,
  });
  res.json(users.map(publicUser));
});

router.get("/suggestions", requireAuth, async (req, res) => {
  const following = await prisma.follow.findMany({ where: { followerId: req.userId }, select: { followingId: true } });
  const excludeIds = [req.userId, ...following.map((f) => f.followingId)];

  const users = await prisma.user.findMany({
    where: { id: { notIn: excludeIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  res.json(users.map(publicUser));
});

// Pedidos de seguidor pendentes (só faz sentido pra conta privada)
router.get("/me/follow-requests", requireAuth, async (req, res) => {
  const requests = await prisma.follow.findMany({
    where: { followingId: req.userId, accepted: false },
    include: { follower: true },
  });
  res.json(requests.map((r) => ({ requestId: r.id, ...publicUser(r.follower) })));
});

router.post("/me/follow-requests/:requestId/accept", requireAuth, async (req, res) => {
  const request = await prisma.follow.findUnique({ where: { id: req.params.requestId } });
  if (!request || request.followingId !== req.userId) return res.status(404).json({ error: "Pedido não encontrado" });
  await prisma.follow.update({ where: { id: request.id }, data: { accepted: true } });
  res.json({ ok: true });
});

router.post("/me/follow-requests/:requestId/reject", requireAuth, async (req, res) => {
  const request = await prisma.follow.findUnique({ where: { id: req.params.requestId } });
  if (!request || request.followingId !== req.userId) return res.status(404).json({ error: "Pedido não encontrado" });
  await prisma.follow.delete({ where: { id: request.id } });
  res.json({ ok: true });
});

// Trocar senha
router.patch("/me/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Preencha os dois campos" });
  if (newPassword.length < 6) return res.status(400).json({ error: "A nova senha precisa ter pelo menos 6 caracteres" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: "Senha atual incorreta" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
  res.json({ ok: true });
});

// Apagar a própria conta (apaga tudo em cascata: posts, curtidas, seguidores etc.)
router.delete("/me", requireAuth, async (req, res) => {
  await prisma.user.delete({ where: { id: req.userId } });
  res.status(204).end();
});

// Perfil de um usuário pelo username
router.get("/:username", optionalAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const [postsCount, followersCount, followingCount, totalLikesReceived] = await Promise.all([
    prisma.post.count({ where: { authorId: user.id, replyToId: null } }),
    prisma.follow.count({ where: { followingId: user.id, accepted: true } }),
    prisma.follow.count({ where: { followerId: user.id, accepted: true } }),
    prisma.like.count({ where: { post: { authorId: user.id } } }),
  ]);

  const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
  const badges = computeBadges({ postsCount, followersCount, totalLikesReceived, accountAgeDays });

  let followedByMe = false;
  let pending = false;
  if (req.userId && req.userId !== user.id) {
    const rel = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
    });
    if (rel) {
      followedByMe = rel.accepted;
      pending = !rel.accepted;
    }
  }

  const blockedByMe = req.userId ? await isBlocked(req.userId, user.id) : false;

  const isMe = req.userId === user.id;
  const canSeePosts = !blockedByMe && (!user.isPrivate || isMe || followedByMe);

  res.json({
    ...publicUser(user),
    followedByMe,
    pending,
    blockedByMe,
    canSeePosts,
    badges,
    _count: { posts: postsCount, followers: followersCount, following: followingCount },
  });
});

// Atualizar perfil (nome, bio, privacidade)
router.patch("/me", requireAuth, async (req, res) => {
  const { displayName, bio, isPrivate } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(bio !== undefined && { bio }),
      ...(isPrivate !== undefined && { isPrivate }),
    },
  });
  res.json(publicUser(user));
});

// Upload de foto de perfil
router.post("/me/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });
  const avatarUrl = await uploadToStorage(
    req.file.buffer,
    req.file.mimetype,
    `avatars/${req.userId}-${Date.now()}${extOf(req.file.originalname)}`
  );
  const user = await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl } });
  res.json(publicUser(user));
});

// Upload de banner de perfil
router.post("/me/banner", requireAuth, upload.single("banner"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });
  const bannerUrl = await uploadToStorage(
    req.file.buffer,
    req.file.mimetype,
    `banners/${req.userId}-${Date.now()}${extOf(req.file.originalname)}`
  );
  const user = await prisma.user.update({ where: { id: req.userId }, data: { bannerUrl } });
  res.json(publicUser(user));
});

// Trocar nome de usuário
router.patch("/me/username", requireAuth, async (req, res) => {
  const { username } = req.body;
  if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: "Usuário deve ter 3-20 caracteres, só letras, números e _" });
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== req.userId) return res.status(409).json({ error: "Esse usuário já está em uso" });

  const user = await prisma.user.update({ where: { id: req.userId }, data: { username } });
  res.json(publicUser(user));
});

// Trocar e-mail (exige a senha atual por segurança)
router.patch("/me/email", requireAuth, async (req, res) => {
  const { email, currentPassword } = req.body;
  if (!email || !currentPassword) return res.status(400).json({ error: "Preencha os dois campos" });

  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const valid = await bcrypt.compare(currentPassword, me.password);
  if (!valid) return res.status(401).json({ error: "Senha incorreta" });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== req.userId) return res.status(409).json({ error: "Esse e-mail já está em uso" });

  const user = await prisma.user.update({ where: { id: req.userId }, data: { email } });
  res.json(publicUser(user));
});

// Exportar todos os meus dados (perfil, posts, curtidas, salvos) como JSON
router.get("/me/export", requireAuth, async (req, res) => {
  const [user, posts, likes, bookmarks] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId } }),
    prisma.post.findMany({ where: { authorId: req.userId } }),
    prisma.like.findMany({ where: { userId: req.userId }, include: { post: { select: { id: true, content: true } } } }),
    prisma.bookmark.findMany({ where: { userId: req.userId }, include: { post: { select: { id: true, content: true } } } }),
  ]);

  res.json({
    exportedAt: new Date().toISOString(),
    profile: publicUser(user),
    posts,
    likedPosts: likes.map((l) => l.post),
    bookmarkedPosts: bookmarks.map((b) => b.post),
  });
});

// Bloquear / desbloquear um usuário (também desfaz o follow nos dois sentidos)
router.post("/:username/block", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado" });
  if (target.id === req.userId) return res.status(400).json({ error: "Você não pode bloquear a si mesmo" });

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: req.userId, blockedId: target.id } },
  });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return res.json({ blockedByMe: false });
  }

  await prisma.block.create({ data: { blockerId: req.userId, blockedId: target.id } });
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: req.userId, followingId: target.id },
        { followerId: target.id, followingId: req.userId },
      ],
    },
  });
  res.json({ blockedByMe: true });
});
router.post("/:username/follow", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado" });
  if (target.id === req.userId) return res.status(400).json({ error: "Você não pode seguir a si mesmo" });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return res.json({ followedByMe: false, pending: false });
  }

  const accepted = !target.isPrivate;
  await prisma.follow.create({ data: { followerId: req.userId, followingId: target.id, accepted } });
  await notify({ type: "follow", recipientId: target.id, actorId: req.userId });
  res.json({ followedByMe: accepted, pending: !accepted });
});

export { canViewProfile };
export default router;
