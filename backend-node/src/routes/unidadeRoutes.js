const express = require('express');
const unidadeController = require('../controllers/unidadeController');
const router = express.Router();
const upload = require('../middleware/multerConfigUnidade');


// Rota para criar uma nova unidade
router.post('/unidade', upload.single('foto'), unidadeController.criarUnidade);

// Rota para atualizar uma unidade
router.put('/unidade/:id', upload.single("foto"), unidadeController.atualizarUnidade);

// Rota para listar todas as unidades
router.get('/unidades', unidadeController.listarUnidades);

// Rota para buscar funcionários de uma unidade (com filtros opcionais de data)
router.get('/:id/funcionarios', unidadeController.listarFuncionariosDaUnidade);

router.get('/:id/registros', unidadeController.listarRegistrosDaUnidade);

// Nova rota para listar funcionários por unidade e filtro de datas
router.get('/unid/:id/registros', unidadeController.listarFuncionariosPorUnidade);

// Rota para obter uma unidade por ID
router.get('/unidade/:id', unidadeController.obterUnidadePorId);

// Rota para deletar uma unidade
router.delete('/unidade/:id', unidadeController.deletarUnidade);

// Rota para retornar os dados de uma unidade específica
router.get('/dados-unidade/:id', unidadeController.obterDadosUnidade);

// ---> retorna os dados de faltas por unidade no mês atual
router.get('/unidades/:unidadeId/faltas', unidadeController.listarFaltasPorUnidade);

// ---> retorna as faltas por unidade e por dia — perfeito para alimentar seu gráfico.
router.get('/unidades/:unidadeId/faltas-dia', unidadeController.listarFaltasPorDia);

// --->  que retorna a quantidade de registros de ponto de hoje por unidade_id
router.get('/unid/:id/registros-hoje', unidadeController.getRegistrosDeHoje);

// ---> Últimos 5 funcionários por unidade
router.get('/ultimos-funcionarios/:id', unidadeController.ultimosCadastradosPorUnidade);

// ---> Retorna as presenças por dia no mês para uma unidade específica
router.get('/unid/:id/presencas-mensais', unidadeController.getPresencasPorDiaNoMes);




module.exports = router;
