const express = require('express');
const router = express.Router();
const path = require('path');
const emailController = require('../controllers/emailController');
const { createSecureUpload, handleUploadErrors } = require('../middlewares/upload');

const uploadDir = path.resolve(__dirname, '..', 'upload', 'candidaturas');

const upload = createSecureUpload({
  destination: uploadDir,
  maxFileSize: 10 * 1024 * 1024,
  fields: [
    { name: 'cv', maxCount: 1, allowedExtensions: ['.pdf', '.doc', '.docx'] }
  ]
});

router.post('/contato', emailController.enviarContato);
router.post('/candidatura', upload.single('cv'), handleUploadErrors, emailController.enviarCandidatura);

module.exports = router;
