const express = require('express');
const router = express.Router();
const FeriasController = require('../controllers/FeriasController');

// Rota para registrar férias
router.post('/ferias', FeriasController.registrarFerias);

// Rota para listar todas as férias
router.get('/ferias', FeriasController.listarFerias);

// Rota para deletar um registro de férias pelo ID
router.delete('/ferias/:id', FeriasController.deletarFerias);

module.exports = router;
