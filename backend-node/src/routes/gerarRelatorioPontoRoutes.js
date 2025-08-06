const express = require('express');
const gerarRelatorioPontoController = require('../controllers/gerarRelatorioPontoController');

const router = express.Router();

router.get('/relatorio', gerarRelatorioPontoController.gerarRelatorioPonto);

router.get('/relatoriosempdf', gerarRelatorioPontoController.gerarRelatorioPontosemPDF);

router.get('/relatorio-unidade-sempdf', gerarRelatorioPontoController.gerarRelatorioPorunidadesemPDF);

module.exports = router;
