import { Router } from "express";
import { runNewsBot } from "../lib/newsBot.js";

const router = Router();

// Protegida por um segredo compartilhado (não é rota de usuário logado —
// quem chama é um serviço externo de agendamento, tipo cron-job.org).
router.post("/trigger", async (req, res) => {
  const secret = req.headers["x-bot-secret"];
  if (!process.env.BOT_SECRET || secret !== process.env.BOT_SECRET) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    const result = await runNewsBot();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao rodar o bot" });
  }
});

export default router;