import { prisma } from "./prisma.js";

// IDs de todo mundo que o usuário bloqueou OU que bloqueou o usuário (bloqueio é sempre mútuo em efeito)
export async function getBlockedIds(userId) {
  if (!userId) return [];
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
  });
  return rows.map((r) => (r.blockerId === userId ? r.blockedId : r.blockerId));
}

export async function isBlocked(userIdA, userIdB) {
  if (!userIdA || !userIdB) return false;
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
  return !!row;
}
