const express = require('express');
const router = express.Router();
const AfastamentoController = require('../controllers/afastamentoController');

router.post('/', AfastamentoController.createAfastamento);
router.get('/', AfastamentoController.getAfastamentos);
router.put('/:id/aprovar', AfastamentoController.aprovarSolicitacao);
router.delete('/:id', AfastamentoController.deletarPorId);

module.exports = router;
