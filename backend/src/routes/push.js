import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/vapid-public-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
});

router.post("/subscribe", requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Inscrição inválida" });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });
  res.status(201).json({ ok: true });
});

router.post("/unsubscribe", requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: "endpoint é obrigatório" });
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
  res.json({ ok: true });
});

export default router;
