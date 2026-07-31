import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { targetType, targetId, reason } = req.body;
  if (!["post", "user"].includes(targetType)) return res.status(400).json({ error: "Tipo inválido" });
  if (!targetId || !reason) return res.status(400).json({ error: "Preencha o motivo da denúncia" });

  await prisma.report.create({ data: { reporterId: req.userId, targetType, targetId, reason } });
  res.status(201).json({ ok: true });
});

export default router;
