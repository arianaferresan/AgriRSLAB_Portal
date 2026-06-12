const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticiaController');
const path = require('path');
const auth = require('../middlewares/auth');
const { createSecureUpload, handleUploadErrors } = require('../middlewares/upload');

const uploadDir = path.resolve(__dirname, '..', '..', 'public', 'uploads', 'noticias');

const upload = createSecureUpload({
    destination: uploadDir,
    filenamePrefix: 'noticia',
    maxFileSize: 10 * 1024 * 1024,
    fields: [
        { name: 'imagem', maxCount: 1, allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }
    ]
});

router.get('/admin', auth, noticeController.getAllNoticiasAdmin);
router.get('/sugeridas', noticeController.getNoticiasSugeridas);
router.get('/destaques', noticeController.getDestaqueNoticias);
router.get('/defesas', noticeController.getDefesasNoticias);
router.get('/eventos', noticeController.getEventosMesAtual);
router.get('/', noticeController.getAllNoticias);
router.post('/', auth, upload.single('imagem'), handleUploadErrors, noticeController.createNoticia);
router.put('/:id', auth, upload.single('imagem'), handleUploadErrors, noticeController.updateNoticia);
router.patch('/:id/toggle', auth, noticeController.toggleNoticiaExibir);
router.delete('/:id', auth, noticeController.deleteNoticia);
router.get('/:id', noticeController.getNoticiaById);

module.exports = router;
