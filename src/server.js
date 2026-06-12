const express = require('express');
const rotas = require("./routes");
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    if (process.env.NODE_ENV === "production" && configuredOrigins.includes("*")) {
      throw new Error("CORS_ORIGIN nao pode ser '*' em producao");
    }
    return configuredOrigins;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("CORS_ORIGIN deve ser configurado em producao");
  }

  return [`http://localhost:${PORT}`, "http://127.0.0.1:3000"];
}

const allowedOrigins = getAllowedOrigins();

// Middleware para permitir que o frontend acesse a API
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }
}));

// Middleware para analisar o corpo das requisições como JSON
app.use(express.json());

// O __dirname aqui é: '../public'
const projectRoot = path.join(__dirname, '../public');

// --- Definição das Pastas Estáticas (NÃO MEXER A ORDEM IMPORTA!) ---
// 1. 'pagina-inicial' COMO SE FOSSE A RAIZ '/'
app.use(express.static(path.join(__dirname, 'pagina-inicial')));

app.use(express.static(projectRoot));

// 2. Sirva o resto da pasta 'Paginas' (para /HeaderFooter/style.css)
app.use(express.static(__dirname));

// Servir arquivos estáticos (como as imagens e PDFs upados)
// Agora 'http://localhost:3000/uploads/imagem.jpg' funcionará
app.use('/uploads', express.static('src/upload')); 

// Redirecione a raiz '/' para '/pagina-inicial/'
app.get('/', (_req, res) => {
  res.redirect('/pagina-inicial/');
});

// routes da aplicação
app.use('/api', rotas);
app.use('/api/auth', authRoutes);

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📁 Arquivos estáticos em http://localhost:${PORT}/uploads`);
});

// Middleware para rotas não encontradas
app.use(function(_req, res){
  res.status(404).json({ error: "Rota não encontrada"});
});
