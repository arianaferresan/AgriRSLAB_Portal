const fs = require('fs');
const multer = require('multer');
const path = require('path');

const MIME_BY_EXTENSION = {
  '.gif': ['image/gif'],
  '.jpeg': ['image/jpeg'],
  '.jpg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const DANGEROUS_EXTENSIONS = new Set([
  '.bat', '.cmd', '.com', '.cpl', '.exe', '.hta', '.html', '.jar', '.js',
  '.jsp', '.msi', '.php', '.ps1', '.py', '.scr', '.sh', '.svg', '.vbs',
]);

function sanitizeFieldName(fieldname) {
  return String(fieldname || 'arquivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'arquivo';
}

function buildSafeFilename(prefix, file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const safePrefix = sanitizeFieldName(prefix || file.fieldname);
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${safePrefix}-${unique}${ext}`;
}

function createSecureUpload({ destination, fields, maxFileSize, filenamePrefix }) {
  fs.mkdirSync(destination, { recursive: true });

  const fieldConfig = new Map(
    fields.map((field) => [
      field.name,
      {
        ...field,
        allowedExtensions: new Set(field.allowedExtensions.map((ext) => ext.toLowerCase())),
      },
    ])
  );

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => cb(null, buildSafeFilename(filenamePrefix, file)),
  });

  return multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, cb) => {
      const config = fieldConfig.get(file.fieldname);
      if (!config) {
        return cb(new Error('Campo de arquivo nao permitido.'));
      }

      const ext = path.extname(file.originalname || '').toLowerCase();
      if (!ext || DANGEROUS_EXTENSIONS.has(ext)) {
        return cb(new Error('Arquivo nao permitido.'));
      }

      if (!config.allowedExtensions.has(ext)) {
        return cb(new Error('Formato de arquivo invalido.'));
      }

      const allowedMimes = MIME_BY_EXTENSION[ext] || [];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Tipo MIME invalido para o arquivo enviado.'));
      }

      return cb(null, true);
    },
  });
}

function handleUploadErrors(err, _req, res, next) {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ mensagem: 'Tamanho maximo do arquivo excedido.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ mensagem: 'Campo de arquivo nao permitido.' });
    }
    return res.status(400).json({ mensagem: 'Upload invalido.' });
  }

  return res.status(400).json({ mensagem: err.message || 'Upload invalido.' });
}

module.exports = {
  createSecureUpload,
  handleUploadErrors,
};
