import webpush from "web-push";
import { prisma } from "./prisma.js";

const configured = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contato@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Manda um push pra todos os dispositivos inscritos de um usuário.
// Nunca lança erro pra fora — push é "melhor esforço", não pode derrubar a rota que chamou.
export async function sendPushToUser(userId, payload) {
  if (!configured) return; // chaves VAPID não configuradas: recurso desligado, sem quebrar nada

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        // 404/410 = inscrição expirada/inválida (usuário desinstalou, trocou de navegador, etc.)
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
