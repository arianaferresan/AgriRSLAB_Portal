const express = require('express');
const path = require('path');
const auth = require('../middlewares/auth');
const { createSecureUpload, handleUploadErrors } = require('../middlewares/upload');
const sobreController = require('../controllers/sobreController');

const router = express.Router();
const uploadDir = path.resolve(__dirname, '..', 'upload', 'sobre');

const upload = createSecureUpload({
    destination: uploadDir,
    maxFileSize: 10 * 1024 * 1024,
    fields: [
        { name: 'imagem', maxCount: 1, allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
    ]
}).single('imagem');

router.get('/publico', sobreController.getSobrePublico);
router.get('/admin', auth, sobreController.getSobreAdmin);
router.put('/admin', auth, upload, handleUploadErrors, sobreController.salvarSobre);

module.exports = router;
