const express = require('express');
const router = express.Router();
const vagasController = require('../controllers/vagasController');
const auth = require('../middlewares/auth');

// Rotas públicas
router.get('/publicos', vagasController.listarVagasPublicas);

// Rotas administrativas
router.post('/', auth, vagasController.criarVaga);
router.get('/', auth, vagasController.listarVagas); // lista tudo
router.get('/:id', vagasController.buscarVagaPorId);
router.put('/:id', auth, vagasController.atualizarVaga);
router.delete('/:id', auth, vagasController.deletarVaga);
router.patch('/:id/exibir', auth, vagasController.atualizarExibir);

module.exports = router;
