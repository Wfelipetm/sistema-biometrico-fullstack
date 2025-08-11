const express = require('express');
const funcionarioController = require('../controllers/funcionarioController');
const router = express.Router();
// const upload = require('../middleware/multerConfigRegistro');


// Rota para criar funcionário
// router.post('/criar_funcionario', funcionarioController.criarFuncionario);


// Rota para listar todos os funcionarios 
router.get('/funcionarios', funcionarioController.listarFuncionarios);

// Rota para listar todos os funcionários de uma unidade específica
router.get('/unidade/:unidadeId/funcionarios', funcionarioController.listarFuncionariosPorUnidade);


router.get('/funcionario/:id', funcionarioController.obterFuncionarioPorId);


// // Rota para criar funcionario 
// router.post('/funcionario', funcionarioController.criarFuncionario);

//Rota para atualizar funcionario 
router.put('/funcionario/:id', funcionarioController.atualizarFuncionario);

//Rota para deletar funcionario 
router.put('/funcionario-inativo/:id', funcionarioController.inativarFuncionario);


module.exports = router;
