const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middlewares/auth');
const { createSecureUpload, handleUploadErrors } = require('../middlewares/upload');

const {
    createProjeto,
    getAllProjetos,
    getProjetosPublicados,
    getProjetosPublicosComDestaque,
    getProjetoById,
    updateProjeto,
    deleteProjeto
} = require('../controllers/projetosController');

const uploadDir = path.resolve(__dirname, '..', 'upload', 'projetos');

const upload = createSecureUpload({
    destination: uploadDir,
    maxFileSize: 10 * 1024 * 1024,
    fields: [
        { name: 'imagem', maxCount: 1, allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
    ]
}).fields([{ name: 'imagem', maxCount: 1 }]);

router.get('/publicos-com-destaque', getProjetosPublicosComDestaque);
router.get('/publicos', getProjetosPublicados);
router.get('/', auth, getAllProjetos);
router.get('/:id', getProjetoById);
router.post('/', auth, upload, handleUploadErrors, createProjeto);
router.put('/:id', auth, upload, handleUploadErrors, updateProjeto);
router.delete('/:id', auth, deleteProjeto);

module.exports = router;
