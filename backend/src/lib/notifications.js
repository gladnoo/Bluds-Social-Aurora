import { prisma } from "./prisma.js";
import { sendPushToUser } from "./push.js";

const PUSH_LABELS = {
  like: "curtiu seu post",
  reply: "respondeu seu post",
  repost: "repostou seu post",
  follow: "começou a te seguir",
  mention: "mencionou você",
};

// Cria uma notificação, exceto quando a pessoa estaria notificando a si mesma.
// Também dispara um push notification de verdade (best-effort) pro destinatário.
export async function notify({ type, recipientId, actorId, postId = null }) {
  if (recipientId === actorId) return;

  await prisma.notification.create({ data: { type, recipientId, actorId, postId } });

  const actor = await prisma.user.findUnique({ where: { id: actorId } });
  sendPushToUser(recipientId, {
    title: "Bluds",
    body: `${actor?.displayName || "Alguém"} ${PUSH_LABELS[type] || "interagiu com você"}`,
    url: postId ? `/post/${postId}` : `/profile/${actor?.username || ""}`,
  }).catch(() => {}); // nunca deixa o push quebrar a ação principal
}

// Detecta @menções num texto e cria notificação pros usuários mencionados que existem.
export async function notifyMentions({ content, actorId, postId }) {
  const usernames = [...new Set([...content.matchAll(/@(\w+)/g)].map((m) => m[1]))];
  if (usernames.length === 0) return;

  const users = await prisma.user.findMany({ where: { username: { in: usernames } } });
  await Promise.all(
    users.map((u) => notify({ type: "mention", recipientId: u.id, actorId, postId }))
  );
}
