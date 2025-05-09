const express = require('express');
const unidadeController = require('../controllers/unidadeController');
const router = express.Router();
const upload = require('../middleware/multerConfigUnidade');


// Rota para criar uma nova unidade
router.post('/unidade', upload.single('foto'),unidadeController.criarUnidade);

// Rota para atualizar uma unidade
router.put('/unidade/:id', unidadeController.atualizarUnidade);

// Rota para listar todas as unidades
router.get('/unidades', unidadeController.listarUnidades);


// Rota para obter uma unidade por ID
router.get('/unidade/:id', unidadeController.obterUnidadePorId);

// Rota para deletar uma unidade
router.delete('/unidade/:id', unidadeController.deletarUnidade);

module.exports = router;
