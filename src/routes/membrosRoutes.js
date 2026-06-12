const express = require('express');
const router = express.Router();
const path = require('path');
const membrosController = require('../controllers/membrosController');
const auth = require('../middlewares/auth');
const { createSecureUpload, handleUploadErrors } = require('../middlewares/upload');

const uploadDir = path.resolve(__dirname, '..', 'upload', 'membros');

const upload = createSecureUpload({
    destination: uploadDir,
    maxFileSize: 10 * 1024 * 1024,
    fields: [
        { name: 'foto', maxCount: 1, allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
    ]
}).fields([
    { name: 'foto', maxCount: 1 }
]);

router.post('/', auth, upload, handleUploadErrors, membrosController.criarMembro);
router.get('/', auth, membrosController.listarMembros);
router.get('/publicos', membrosController.listarMembrosPublicos);
router.put('/:id', auth, upload, handleUploadErrors, membrosController.atualizarMembro);
router.delete('/:id', auth, membrosController.deletarMembro);

module.exports = router;
