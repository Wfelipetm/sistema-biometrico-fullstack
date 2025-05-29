const express = require('express');
const router = express.Router();
const secretariasController = require('../controllers/secretariasController');





router.get('/', secretariasController.listarSecretarias);
router.get('/:id', secretariasController.obterSecretariaPorId);
router.post('/', secretariasController.criarSecretaria);
router.put('/:id', secretariasController.atualizarSecretaria);
router.delete('/:id', secretariasController.excluirSecretaria);
router.get('/:id/unidades', secretariasController.listarUnidadesDaSecretaria);
router.get('/usuario/:id', secretariasController.obterSecretariaPorUsuarioId);
router.get('/:id/funcionarios', secretariasController.listarFuncionariosPorSecretaria);


// ---> total de registros de hoje por secretaria
router.get('/reg-hoje-por-secre/:id', secretariasController.getTotalRegistrosHojePorSecretaria);

//  ---> retornar o total de registros no mês atual por secretaria
router.get('/:id/registros-mensais', secretariasController.getTotalRegistrosMesPorSecretaria);

router.get('/grafico-reg-secre-mes-todo/:id', secretariasController.getRegistrosDiariosPorSecretaria);


router.get('/:id/total-funcionarios', secretariasController.getTotalFuncionariosPorSecretaria);



module.exports = router;
