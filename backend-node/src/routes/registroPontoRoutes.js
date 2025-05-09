const express = require('express');
const registroPontoController = require('../controllers/registroPontoController');
const router = express.Router();




// Rota para listar registros de ponto
router.get('/registros-ponto', registroPontoController.listarRegistrosPonto);


// Rota para levantar horas mensais de um funcionário
// http://biometrico.itaguai.rj.gov.br:3001/reg/levantamento-horas?funcionario_id=42&ano=2025&mes=03
router.get('/levantamento-horas', registroPontoController.levantarHorasMensais);



// Rota para busar o ponto do mes inteiro de um funcionario
router.get('/pontos', registroPontoController.lerPontoUsuario);//só retorna um registro 



//Listar registros de ponto (entrada e saída) dos funcionários de uma unidade para um mês e ano específicos. 
//Ela também inclui funcionários que não possuem registros de ponto para o mês especificado.
router.get('/pontos-unidade', registroPontoController.listarPontosMesUnidade);



//
router.get('/pontos-mes', registroPontoController.listarPontosMes);// não é bom


// Rota para criar um novo registro de ponto
router.post('/registros-ponto', registroPontoController.criarRegistroPonto);


// Rota para atualizar um registro de ponto
router.put('/registros-ponto/:id', registroPontoController.atualizarRegistroPonto);



// Rota para excluir um registro de ponto
router.delete('/registros-ponto/:id', registroPontoController.excluirRegistroPonto);



module.exports = router;
