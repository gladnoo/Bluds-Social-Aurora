import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import notificationRoutes from "./routes/notifications.js";
import reportRoutes from "./routes/reports.js";
import pushRoutes from "./routes/push.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => res.json({ status: "Bluds Social API no ar 🐦" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/push", pushRoutes);

app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));

// Erros de upload (multer) e outros erros síncronos das rotas caem aqui
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Algo deu errado" });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`🐦 Bluds Social API rodando em http://localhost:${PORT}`));
