const express = require('express');
const router = express.Router();
const FeriasController = require('../controllers/feriasController');



router.post('/', FeriasController.createFerias);
router.get("/", FeriasController.getFerias)
router.get('/ferias-solicitadas/total', FeriasController.totalSolicitadas);
router.get('/ferias-por-unidade/:unidadeId', FeriasController.listarPorUnidade);
router.put('/atualizar-ferias/:id/aprovar', FeriasController.aprovarSolicitacao);
router.delete('/:id', FeriasController.deletarPorId);
router.get('/grafico/:unidadeId', FeriasController.feriasGrafico);



module.exports = router;
