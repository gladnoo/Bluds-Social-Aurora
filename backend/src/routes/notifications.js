import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const LABELS = {
  like: "curtiu seu post",
  reply: "respondeu seu post",
  repost: "repostou seu post",
  follow: "começou a te seguir",
  mention: "mencionou você",
};

router.get("/", requireAuth, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: true },
  });

  const postIds = notifications.map((n) => n.postId).filter(Boolean);
  const posts = postIds.length
    ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, content: true } })
    : [];
  const postMap = Object.fromEntries(posts.map((p) => [p.id, p]));

  res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      label: LABELS[n.type] || n.type,
      read: n.read,
      createdAt: n.createdAt,
      postId: n.postId,
      postPreview: n.postId ? postMap[n.postId]?.content ?? null : null,
      actor: {
        username: n.actor.username,
        displayName: n.actor.displayName,
        avatarUrl: n.actor.avatarUrl,
      },
    }))
  );
});

router.get("/unread-count", requireAuth, async (req, res) => {
  const count = await prisma.notification.count({ where: { recipientId: req.userId, read: false } });
  res.json({ count });
});

router.post("/read-all", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({ where: { recipientId: req.userId, read: false }, data: { read: true } });
  res.json({ ok: true });
});

export default router;
