const express = require('express');
const router = express.Router();
const secretariasController = require('../controllers/secretariasController');

router.get('/', secretariasController.listarSecretarias);
router.get('/:id', secretariasController.obterSecretariaPorId);
router.post('/', secretariasController.criarSecretaria);
router.put('/:id', secretariasController.atualizarSecretaria);
router.delete('/:id', secretariasController.excluirSecretaria);
router.get('/:id/unidades', secretariasController.listarUnidadesDaSecretaria);




module.exports = router;
