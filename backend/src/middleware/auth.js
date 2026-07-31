import jwt from "jsonwebtoken";

// Não exige login, mas se houver token válido, popula req.userId.
// Usado em rotas públicas que precisam saber "o usuário atual já curtiu/repostou isso?".
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    try {
      req.userId = jwt.verify(token, process.env.JWT_SECRET).userId;
    } catch (err) {
      // token inválido/expirado: segue como visitante anônimo
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
