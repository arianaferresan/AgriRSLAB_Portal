const express = require('express');
const router = express.Router();
const path = require('path');
const artigosController = require('../controllers/artigosController');
const auth = require('../middlewares/auth');
const { createSecureUpload, handleUploadErrors } = require('../middlewares/upload');

const uploadDir = path.resolve(__dirname, '..', 'upload');

const upload = createSecureUpload({
    destination: uploadDir,
    maxFileSize: 20 * 1024 * 1024,
    fields: [
        { name: 'imagem', maxCount: 1, allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
        { name: 'pdf', maxCount: 1, allowedExtensions: ['.pdf'] }
    ]
}).fields([
    { name: 'imagem', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]);

router.get('/publicos', artigosController.listarArtigosPublicos);

router.post('/', auth, upload, handleUploadErrors, artigosController.criarArtigo);
router.get('/', auth, artigosController.listarArtigos);
router.put('/:id', auth, upload, handleUploadErrors, artigosController.atualizarArtigo);
router.delete('/:id', auth, artigosController.deletarArtigo);

router.get('/:id/download', artigosController.downloadPdf);

module.exports = router;
