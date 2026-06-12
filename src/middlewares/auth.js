const jwt = require("jsonwebtoken");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET nao configurado");
  }
  return secret;
}

// Tenta ler o token do Header ou de Cookies
function extractToken(req) {
  let token = null;
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (header && typeof header === "string") {
    const parts = header.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }
  return token;
}

function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Token ausente" });
    }
    const payload = jwt.verify(token, getSecret());
    
    // Anexa o usuário na requisição
    req.user = {
      idusuario: payload.sub,
      mail: payload.mail,
    };
    return next();
  } catch (err) {
    if (err.message === "JWT_SECRET nao configurado") {
      console.error("Erro de configuracao de autenticacao:", err.message);
      return res.status(500).json({ error: "Autenticacao indisponivel" });
    }
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

module.exports = auth;
