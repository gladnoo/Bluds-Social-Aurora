import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const router = Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password || !displayName) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha precisa ter pelo menos 6 caracteres" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return res.status(409).json({ error: "Usuário ou e-mail já cadastrado" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashed, displayName },
    });

    const token = makeToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar conta" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = username ou email

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = makeToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

export default router;
