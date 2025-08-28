const db = require('../config/db');
const { format, parse } = require('date-fns');

module.exports = {

    // POST
    // Cria um novo registro de ponto (entrada ou saída) para um funcionário em uma unidade.

    async criarRegistroPonto(req, res) {
        const { funcionario_id, unidade_id, hora_entrada, hora_saida, id_biometrico, data } = req.body;

        if (!funcionario_id || !unidade_id || !hora_entrada || !hora_saida || !data) {
            return res.status(400).json({
                error: 'Todos os campos são obrigatórios (funcionario_id, unidade_id, hora_entrada, hora_saida, data)',
            });
        }

        try {
            // Verifica se o funcionário está ativo
            const statusResult = await db.query(
                `SELECT status, tipo_escala FROM funcionarios WHERE id = $1`,
                [funcionario_id]
            );
            if (!statusResult.rows.length || statusResult.rows[0].status !== 1) {
                return res.status(403).json({ error: 'Funcionário inativo não pode bater ponto.' });
            }
            const escala = statusResult.rows[0]?.tipo_escala || '8h';

            // Jornada esperada por escala
            const jornadas = {
                '24h': 22, '24x72': 22, '8h': 8, '12h': 12, '16h': 16,
                '12x36': 12, '32h': 32, '20h': 20, 'default': 8
            };
            const jornadaEsperada = jornadas[escala] || jornadas['default'];

            // Monta datas de entrada e saída
            const dataEntrada = new Date(`${data}T${hora_entrada}`);
            let dataSaida = new Date(`${data}T${hora_saida}`);
            if (escala === '24h' || escala === '24x72') {
                dataSaida.setDate(dataSaida.getDate() + 1);
            } else if (dataSaida < dataEntrada) {
                dataSaida.setDate(dataSaida.getDate() + 1);
            }

            let pausaAlmoco = 0;
            if (escala === '24h' || escala === '24x72') {
                pausaAlmoco = 2; // 2 horas
            } else if (escala === '8h' || escala === '12h') {
                pausaAlmoco = 1; // 1 hora
            }

            // Calcula horas trabalhadas descontando pausa de almoço
            let horasTrabalhadas = ((dataSaida - dataEntrada) / (1000 * 60 * 60)) - pausaAlmoco;
            if (horasTrabalhadas < 0) horasTrabalhadas = 0;

            // Calcula diferença para jornada esperada
            let diferenca = horasTrabalhadas - jornadaEsperada;
            let horaExtra = diferenca > 0 ? diferenca : 0;
            let horaDesconto = diferenca < 0 ? Math.abs(diferenca) : 0;
            let horasNormais = Math.min(horasTrabalhadas, jornadaEsperada);
            let totalTrabalhado = horasTrabalhadas;
            let horaSaidaAjustada = dataSaida.toTimeString().slice(0, 8);

            // Função para converter para formato interval PostgreSQL
            function toPgInterval(hours) {
                const h = Math.floor(hours);
                const m = Math.round((hours - h) * 60);
                return `${h}:${m.toString().padStart(2, '0')}:00`;
            }

            // Insere no banco
            const result = await db.query(
                `
                INSERT INTO registros_ponto (
                    funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico,
                    horas_normais, hora_extra, hora_desconto, total_trabalhado, hora_saida_ajustada
                ) VALUES ($1, $2, $3, $4, $5, $6, $7::interval, $8::interval, $9::interval, $10::interval, $11::interval)
                RETURNING *
                `,
                [
                    funcionario_id, unidade_id, data, hora_entrada, hora_saida, id_biometrico || null,
                    toPgInterval(horasNormais),
                    toPgInterval(horaExtra),
                    toPgInterval(horaDesconto),
                    toPgInterval(totalTrabalhado),
                    toPgInterval((dataSaida - dataEntrada) / (1000 * 60 * 60))
                ]
            );

            return res.status(201).json({
                ...result.rows[0],
                funcionario_id,
                unidade_id,
                data_hora: data,
                hora_entrada,
                hora_saida,
                horas_normais: toPgInterval(horasNormais),
                hora_extra: toPgInterval(horaExtra),
                hora_desconto: toPgInterval(horaDesconto),
                total_trabalhado: toPgInterval(totalTrabalhado),
                hora_saida_ajustada: horaSaidaAjustada
            });

        } catch (error) {
            console.error('[ERRO] Falha ao criar registro de ponto:', error.message);
            return res.status(500).json({ error: 'Erro ao registrar ponto. Contate o suporte.' });
        }
    }
    ,



    // POST
    // Calcular e registrar ponto com base na entrada e saída, considerando a escala do funcionário feito para assistencia
    async calcularERegistrarPontoAssistencia(req, res) {
        const { funcionario_id, unidade_id, data, hora_entrada, hora_saida, id_biometrico } = req.body;

        if (!funcionario_id || !unidade_id || !data || !hora_entrada) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
        }

        try {
            // 1. Verifica se existe saída em aberto para o funcionário
            const pendenteResult = await db.query(
                `SELECT id, data_hora, hora_entrada FROM registros_ponto 
                 WHERE funcionario_id = $1 AND hora_saida IS NULL 
                 ORDER BY data_hora DESC LIMIT 1`,
                [funcionario_id]
            );
            if (pendenteResult.rowCount > 0) {
                const pendente = pendenteResult.rows[0];
                const dataPendente = pendente.data_hora instanceof Date
                    ? pendente.data_hora.toISOString().slice(0, 10)
                    : pendente.data_hora.split('T')[0];
                if (dataPendente !== data) {
                    // Formata a data para dd/MM/yyyy
                    const [ano, mes, dia] = dataPendente.split('-');
                    const dataFormatada = `${dia}/${mes}/${ano}`;
                    return res.status(400).json({
                        error: `Você tem saída em aberto no dia ${dataFormatada}. Favor procurar o RH!`
                    });
                }
            }

            // Verifica se o funcionário está ativo
            const statusResult = await db.query(
                `SELECT status, tipo_escala FROM funcionarios WHERE id = $1`,
                [funcionario_id]
            );
            if (!statusResult.rows.length || statusResult.rows[0].status !== 1) {
                return res.status(403).json({ error: 'Funcionário inativo não pode bater ponto.' });
            }
            const escala = statusResult.rows[0]?.tipo_escala || '8h';

            const jornadas = {
                '24h': 22, '24x72': 22, '8h': 8, '12h': 12, '16h': 16,
                '12x36': 12, '32h': 32, '20h': 20, 'default': 8
            };
            const jornadaEsperada = jornadas[escala] || jornadas['default'];

            let pausaAlmoco = 0;
            if (['24h', '24x72', '16h'].includes(escala)) {
                pausaAlmoco = 2;
            } else if (['8h', '12h'].includes(escala)) {
                pausaAlmoco = 1;
            }

            // Se hora_saida não foi enviada, é registro de entrada (INSERT)
            if (!hora_saida) {
                // Verifica se já existe registro COMPLETO (entrada e saída) para o dia
                const registroCompleto = await db.query(
                    `SELECT id FROM registros_ponto 
                     WHERE funcionario_id = $1 
                       AND unidade_id = $2
                       AND data_hora::date = $3
                       AND hora_entrada IS NOT NULL 
                       AND hora_saida IS NOT NULL`,
                    [funcionario_id, unidade_id, data]
                );
                if (registroCompleto.rowCount > 0) {
                    return res.status(400).json({
                        error: `Você já registrou entrada e saída neste dia. Não é possível registrar nova entrada.`
                    });
                }

                const result = await db.query(
                    `
                    INSERT INTO registros_ponto (
                        funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                    `,
                    [
                        funcionario_id, unidade_id, data, hora_entrada, null, id_biometrico || null
                    ]
                );
                return res.status(201).json(result.rows[0]);
            }

            // Se hora_saida foi enviada, é registro de saída (UPDATE)
            // Busca o registro de entrada do funcionário e unidade SEM saída (independente da data)
            const registroResult = await db.query(
                `SELECT * FROM registros_ponto WHERE funcionario_id = $1 AND unidade_id = $2 AND hora_saida IS NULL ORDER BY data_hora DESC LIMIT 1`,
                [funcionario_id, unidade_id]
            );
            if (registroResult.rowCount === 0) {
                return res.status(404).json({ error: 'Registro de entrada não encontrado para o dia.' });
            }
            const registro = registroResult.rows[0];

            // dataEntrada: sempre do registro do banco (data_hora + hora_entrada)
            const dataEntradaStr = registro.data_hora instanceof Date
                ? registro.data_hora.toISOString().slice(0, 10)
                : registro.data_hora.split('T')[0];
            const dataEntrada = new Date(`${dataEntradaStr}T${registro.hora_entrada}`);

            // dataSaida: use a data e hora enviados no payload (que pode ser o dia seguinte)
            let dataSaida = new Date(`${data}T${hora_saida}`);

            // Se a saída for menor ou igual à entrada, soma 1 dia (virada de dia)
            if (dataSaida <= dataEntrada) {
                dataSaida.setDate(dataSaida.getDate() + 1);
            }

            // Calcula tempo trabalhado em horas (com fração de segundos)
            let tempoTrabalhado = (dataSaida - dataEntrada) / (1000 * 60 * 60);

            // Desconta pausa de almoço só se trabalhou mais que a pausa
            let horasTrabalhadas = tempoTrabalhado;
            if (tempoTrabalhado > pausaAlmoco) {
                horasTrabalhadas = tempoTrabalhado - pausaAlmoco;
            }

            // Calcula diferença para jornada esperada
            let diferenca = horasTrabalhadas - jornadaEsperada;
            let horaExtra = 0;
            let horaDesconto = 0;

            if (diferenca > 0) {
                horaExtra = diferenca;
            } else if (diferenca < 0) {
                horaDesconto = Math.abs(diferenca);
            }

            let horasNormais = Math.min(horasTrabalhadas, jornadaEsperada);
            let totalTrabalhado = horasTrabalhadas;
            let horaSaidaAjustada = dataSaida.toTimeString().slice(0, 8);

            // Função para converter para formato interval PostgreSQL
            function toPgInterval(hours) {
                const h = Math.floor(hours);
                const m = Math.round((hours - h) * 60);
                return `${h}:${m.toString().padStart(2, '0')}:00`;
            }

            // Atualiza o registro preenchendo hora_saida e os campos calculados
            const result = await db.query(
                `
                UPDATE registros_ponto
                SET hora_saida = $1,
                    horas_normais = $2::interval,
                    hora_extra = $3::interval,
                    hora_desconto = $4::interval,
                    total_trabalhado = $5::interval,
                    hora_saida_ajustada = $6::interval,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *
                `,
                [
                    hora_saida,
                    toPgInterval(horasNormais),
                    toPgInterval(horaExtra),
                    toPgInterval(horaDesconto),
                    toPgInterval(totalTrabalhado),
                    toPgInterval((dataSaida - dataEntrada) / (1000 * 60 * 60)),
                    registro.id
                ]
            );

            console.log('--- DEPURAÇÃO REGISTRO DE SAÍDA ---');
            console.log('dataEntrada:', dataEntrada);
            console.log('dataSaida:', dataSaida);
            console.log('horasTrabalhadas:', horasTrabalhadas);
            console.log('jornadaEsperada:', jornadaEsperada);
            console.log('diferenca:', diferenca);
            console.log('horaExtra:', horaExtra);
            console.log('horaDesconto:', horaDesconto);
            console.log('toPgInterval(horaDesconto):', toPgInterval(horaDesconto));
            console.log('horasNormais:', horasNormais);
            console.log('totalTrabalhado:', totalTrabalhado);
            console.log('horaSaidaAjustada:', horaSaidaAjustada);

            return res.status(200).json({
                ...result.rows[0],
                horas_normais: toPgInterval(horasNormais),
                hora_extra: toPgInterval(horaExtra),
                hora_desconto: toPgInterval(horaDesconto),
                total_trabalhado: toPgInterval(totalTrabalhado),
                hora_saida_ajustada: horaSaidaAjustada
            });

        } catch (error) {
            console.error('[ERRO] Falha ao criar registro de ponto:', error);
            return res.status(500).json({ error: 'Erro ao registrar ponto.', detalhe: error.message, stack: error.stack });
        }
    },




    // Calcular e registrar ponto com base na entrada e saída, considerando a escala do funcionário.
    async calcularERegistrarPonto(req, res) {
        const { funcionario_id, unidade_id, data, hora_entrada, hora_saida, id_biometrico } = req.body;

        if (!funcionario_id || !unidade_id || !data || !hora_entrada) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
        }

        // Função para converter para formato interval PostgreSQL (com precisão de segundos)
        function toPgInterval(hours) {
            const totalSeconds = Math.round(hours * 3600);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        try {
            // Verifica se o funcionário está ativo
            const statusResult = await db.query(
                `SELECT status, tipo_escala FROM funcionarios WHERE id = $1`,
                [funcionario_id]
            );
            if (!statusResult.rows.length || statusResult.rows[0].status !== 1) {
                return res.status(403).json({ error: 'Funcionário inativo não pode bater ponto.' });
            }
            const escala = statusResult.rows[0]?.tipo_escala || '8h';

            const jornadas = {
                '24h': 22, '24x72': 22, '8h': 8, '12h': 12, '16h': 16,
                '12x36': 12, '32h': 32, '20h': 20, 'default': 8
            };
            const jornadaEsperada = jornadas[escala] || jornadas['default'];

            let pausaAlmoco = 0;
            if (['24h', '24x72', '16h'].includes(escala)) {
                pausaAlmoco = 2;
            } else if (['8h', '12h'].includes(escala)) {
                pausaAlmoco = 1;
            }

            // Se hora_saida não foi enviada, é registro de entrada (INSERT)
            if (!hora_saida) {
                // Verifica se já existe registro COMPLETO (entrada e saída) para o dia
                const registroCompleto = await db.query(
                    `SELECT id FROM registros_ponto 
                     WHERE funcionario_id = $1 
                       AND unidade_id = $2
                       AND data_hora::date = $3
                       AND hora_entrada IS NOT NULL 
                       AND hora_saida IS NOT NULL`,
                    [funcionario_id, unidade_id, data]
                );
                if (registroCompleto.rowCount > 0) {
                    return res.status(400).json({
                        error: `Você já registrou entrada e saída neste dia. Não é possível registrar nova entrada.`
                    });
                }

                const result = await db.query(
                    `
                    INSERT INTO registros_ponto (
                        funcionario_id, unidade_id, data_hora, hora_entrada, hora_saida, id_biometrico
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                    `,
                    [
                        funcionario_id, unidade_id, data, hora_entrada, null, id_biometrico || null
                    ]
                );
                return res.status(201).json(result.rows[0]);
            }

            // Se hora_saida foi enviada, é registro de saída (UPDATE)
            // Busca o registro de entrada do funcionário e unidade SEM saída (independente da data)
            const registroResult = await db.query(
                `SELECT * FROM registros_ponto WHERE funcionario_id = $1 AND unidade_id = $2 AND hora_saida IS NULL ORDER BY data_hora DESC LIMIT 1`,
                [funcionario_id, unidade_id]
            );
            if (registroResult.rowCount === 0) {
                return res.status(404).json({ error: 'Registro de entrada não encontrado para o dia.' });
            }
            const registro = registroResult.rows[0];

            // dataEntrada: sempre do registro do banco (data_hora + hora_entrada)
            const dataEntradaStr = registro.data_hora instanceof Date
                ? registro.data_hora.toISOString().slice(0, 10)
                : registro.data_hora.split('T')[0];
            const dataEntrada = new Date(`${dataEntradaStr}T${registro.hora_entrada}`);

            // dataSaida: use a data e hora enviados no payload (que pode ser o dia seguinte)
            let dataSaida = new Date(`${data}T${hora_saida}`);

            // Se a saída for menor ou igual à entrada, soma 1 dia (virada de dia)
            if (dataSaida <= dataEntrada) {
                dataSaida.setDate(dataSaida.getDate() + 1);
            }

            // Calcula tempo trabalhado em horas (com fração de segundos)
            let tempoTrabalhado = (dataSaida - dataEntrada) / (1000 * 60 * 60);

            // Desconta pausa de almoço só se trabalhou mais que a pausa
            let horasTrabalhadas = tempoTrabalhado;
            if (tempoTrabalhado > pausaAlmoco) {
                horasTrabalhadas = tempoTrabalhado - pausaAlmoco;
            }

            // Calcula diferença para jornada esperada
            let diferenca = horasTrabalhadas - jornadaEsperada;
            let horaExtra = 0;
            let horaDesconto = 0;

            if (diferenca > 0) {
                horaExtra = diferenca;
            } else if (diferenca < 0) {
                horaDesconto = Math.abs(diferenca);
            }

            let horasNormais = Math.min(horasTrabalhadas, jornadaEsperada);
            let totalTrabalhado = horasTrabalhadas;
            let horaSaidaAjustada = dataSaida.toTimeString().slice(0, 8);

            // Atualiza o registro preenchendo hora_saida e os campos calculados
            const result = await db.query(
                `
                UPDATE registros_ponto
                SET hora_saida = $1,
                    horas_normais = $2::interval,
                    hora_extra = $3::interval,
                    hora_desconto = $4::interval,
                    total_trabalhado = $5::interval,
                    hora_saida_ajustada = $6::interval,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING *
                `,
                [
                    hora_saida,
                    toPgInterval(horasNormais),
                    toPgInterval(horaExtra),
                    toPgInterval(horaDesconto),
                    toPgInterval(totalTrabalhado),
                    toPgInterval((dataSaida - dataEntrada) / (1000 * 60 * 60)),
                    registro.id
                ]
            );

            console.log('--- DEPURAÇÃO REGISTRO DE SAÍDA ---');
            console.log('dataEntrada:', dataEntrada);
            console.log('dataSaida:', dataSaida);
            console.log('horasTrabalhadas:', horasTrabalhadas);
            console.log('jornadaEsperada:', jornadaEsperada);
            console.log('diferenca:', diferenca);
            console.log('horaExtra:', horaExtra);
            console.log('horaDesconto:', horaDesconto);
            console.log('toPgInterval(horaDesconto):', toPgInterval(horaDesconto));
            console.log('horasNormais:', horasNormais);
            console.log('totalTrabalhado:', totalTrabalhado);
            console.log('horaSaidaAjustada:', horaSaidaAjustada);

            return res.status(200).json({
                ...result.rows[0],
                horas_normais: toPgInterval(horasNormais),
                hora_extra: toPgInterval(horaExtra),
                hora_desconto: toPgInterval(horaDesconto),
                total_trabalhado: toPgInterval(totalTrabalhado),
                hora_saida_ajustada: horaSaidaAjustada
            });

        } catch (error) {
            console.error('[ERRO] Falha ao criar registro de ponto:', error);
            return res.status(500).json({ error: 'Erro ao registrar ponto.', detalhe: error.message, stack: error.stack });
        }
    },

    // GET
    // Listar todos os registros de ponto de todos os funcionários, incluindo dados de biometria e a unidade.
    async listarRegistrosPonto(req, res) {
        try {
            const result = await db.query(
                `
            SELECT rp.id, 
                   f.id AS funcionario_id,  -- ID do funcionário
                   f.nome AS funcionario, 
                   u.nome AS unidade, 
                   rp.data_hora,  -- Data e hora de entrada ou saída
                   rp.hora_entrada, 
                   rp.hora_saida, 
                   f.id_biometrico  -- Biometria do funcionário
            FROM public.registros_ponto rp
            INNER JOIN public.funcionarios f ON rp.funcionario_id = f.id
            INNER JOIN public.unidades u ON rp.unidade_id = u.id
            WHERE f.status = 1
            `
            );

            // Formatar as datas de cada registro no formato dd/MM/yyyy
            const registrosFormatados = result.rows.map(registro => {
                return {
                    ...registro,
                    data_hora: format(new Date(registro.data_hora), 'dd/MM/yyyy'),
                };
            });

            res.status(200).json(registrosFormatados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // GET
    // Ler registros de ponto de um usuário específico em um mês específico
    async lerPontoUsuario(req, res) {
        const { funcionario_id, mes, ano } = req.query;

        if (!funcionario_id || !mes || !ano) {
            return res.status(400).json({
                error: 'Os parâmetros funcionario_id, mes e ano são obrigatórios.'
            });
        }

        try {
            const query = `
                SELECT 
                    rp.data_hora::DATE AS data, 
                    rp.hora_entrada, 
                    rp.hora_saida, 
                    f.nome AS funcionario_nome,
                    f.data_admissao,
                    f.cargo,
                    f.matricula,
                    f.tipo_escala,
                    f.cpf,
                    f.email,
                    u.nome AS unidade_nome
                FROM 
                    Registros_Ponto rp
                INNER JOIN 
                    funcionarios f ON rp.funcionario_id = f.id
                INNER JOIN 
                    unidades u ON rp.unidade_id = u.id
                WHERE 
                    f.id = $1
                    AND f.status = 1
                    AND EXTRACT(MONTH FROM rp.data_hora) = $2
                    AND EXTRACT(YEAR FROM rp.data_hora) = $3
                ORDER BY 
                    rp.data_hora ASC
            `;

            const result = await db.query(query, [funcionario_id, mes, ano]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado para o funcionário nesse mês.' });
            }

            const registrosFormatados = result.rows.map(row => ({
                data: format(new Date(row.data), 'dd/MM/yyyy'), // Formata data do registro de ponto
                hora_entrada: row.hora_entrada,
                hora_saida: row.hora_saida,
                funcionario_nome: row.funcionario_nome,
                data_admissao: format(new Date(row.data_admissao), 'dd/MM/yyyy'), // Formata data de admissão
                cargo: row.cargo,
                matricula: row.matricula,
                tipo_escala: row.tipo_escala,
                cpf: row.cpf,
                email: row.email,
                unidade_nome: row.unidade_nome
            }));

            res.status(200).json(registrosFormatados);
        } catch (error) {
            console.error("Erro ao buscar registros de ponto:", error);
            res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    },

    // GET
    // Listar todos os registros de ponto de um mês específico para todos os funcionários
    async listarPontosMes(req, res) {
        const { mes, ano } = req.query;

        if (!mes || !ano) {
            return res.status(400).json({
                error: 'Os parâmetros mes e ano são obrigatórios.'
            });
        }

        try {
            const query = `
        SELECT 
            rp.data_hora::DATE AS data, 
            rp.hora_entrada, 
            rp.hora_saida, 
            f.matricula AS funcionario_matricula,
            f.nome AS funcionario_nome,
            u.nome AS unidade_nome
        FROM 
            Registros_Ponto rp
        INNER JOIN 
            funcionarios f ON rp.funcionario_id = f.id
        INNER JOIN 
            unidades u ON rp.unidade_id = u.id
        WHERE 
            EXTRACT(MONTH FROM rp.data_hora) = $1
            AND EXTRACT(YEAR FROM rp.data_hora) = $2
            AND f.status = 1
        ORDER BY 
            rp.data_hora ASC, f.nome ASC
    `;

            const result = await db.query(query, [mes, ano]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado para esse mês.' });
            }

            const registrosFormatados = result.rows.map(row => ({
                ...row,
                data: format(new Date(row.data), 'dd/MM/yyyy')
            }));

            res.status(200).json(registrosFormatados);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },



    // GET
    // Listar todos os registros de ponto do mês para uma unidade específica e incluir funcionários sem registro
    async listarPontosMesUnidade(req, res) {
        const { mes, ano, unidade_id, limit = 100, offset = 0 } = req.query;

        // Verificação dos parâmetros obrigatórios
        if (!mes || !ano || !unidade_id) {
            return res.status(400).json({
                error: 'Os parâmetros mes, ano e unidade_id são obrigatórios.'
            });
        }

        try {
            // Query otimizada com LIMIT e OFFSET para paginação
            const query = `
        SELECT 
            f.matricula AS funcionario_matricula,
            f.nome AS funcionario_nome,
            u.nome AS unidade_nome,
            COALESCE(rp.data_hora::DATE, NULL) AS data,
            COALESCE(rp.hora_entrada, NULL) AS hora_entrada,
            COALESCE(rp.hora_saida, NULL) AS hora_saida
        FROM 
            funcionarios f
        INNER JOIN 
            unidades u ON f.unidade_id = u.id
        LEFT JOIN 
            Registros_Ponto rp ON f.id = rp.funcionario_id 
            AND EXTRACT(MONTH FROM rp.data_hora) = $1
            AND EXTRACT(YEAR FROM rp.data_hora) = $2
        WHERE 
            f.unidade_id = $3
            AND f.status = 1
        ORDER BY 
            f.nome ASC, rp.data_hora ASC
        LIMIT $4 OFFSET $5
    `;

            // Executando a query com parâmetros de paginação
            const result = await db.query(query, [mes, ano, unidade_id, limit, offset]);

            // Verificando se nenhum dado foi encontrado
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum funcionário encontrado para essa unidade.' });
            }

            // Formatando as datas no formato desejado
            const registrosFormatados = result.rows.map(row => ({
                ...row,
                data: row.data ? format(new Date(row.data), 'dd/MM/yyyy') : null
            }));

            // Retornando os dados com sucesso
            res.status(200).json(registrosFormatados);
        } catch (error) {
            // Capturando erro e retornando mensagem mais amigável
            console.error(error);  // Log de erro para análise futura
            res.status(500).json({ error: 'Erro ao consultar os registros. Tente novamente mais tarde.' });
        }
    },

    async levantarHorasMensais(req, res) {
        try {
            const { funcionario_id, ano, mes } = req.query;
            if (!funcionario_id || !ano || !mes) {
                return res.status(400).json({ error: 'Os parâmetros funcionario_id, ano e mes são obrigatórios.' });
            }

            const result = await db.query(
                `SELECT 
                rp.id,
                rp.funcionario_id,
                f.nome,
                f.unidade_id,
                f.matricula,
                f.tipo_escala,
                f.telefone,
                f.data_admissao,
                f.cargo,
                f.cpf,
                rp.data_hora,
                rp.hora_entrada,
                rp.hora_saida,
                rp.id_biometrico,
                rp.created_at,
                rp.updated_at,
                rp.horas_normais,
                rp.hora_extra,
                rp.hora_desconto,
                rp.total_trabalhado,
                rp.hora_saida_ajustada
            FROM public.registros_ponto rp
            INNER JOIN public.funcionarios f ON rp.funcionario_id = f.id
            WHERE rp.funcionario_id = $1
              AND EXTRACT(YEAR FROM rp.data_hora) = $2
              AND TO_CHAR(rp.data_hora, 'MM') = $3 
              AND f.status = 1
            ORDER BY rp.data_hora;`,
                [funcionario_id, ano, mes]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: 'Nenhum registro encontrado para esse período.'
                });
            }

            res.status(200).json({
                registros: result.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // listar registro de ponto do dia por id de unidade 
    async getRegistrosDoDia(req, res) {
        const { unidade_id } = req.params;

        if (!unidade_id) {
            return res.status(400).json({ error: 'unidade_id é obrigatório' });
        }

        try {
            const query = `
                SELECT rp.unidade_id, rp.data_hora, f.id AS funcionario_id, f.nome AS funcionario_nome
                FROM registros_ponto rp
                INNER JOIN funcionarios f ON rp.funcionario_id = f.id
                WHERE rp.unidade_id = $1
                  AND f.status = 1
                  AND rp.data_hora >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
                  AND rp.data_hora < date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 day'
                ORDER BY rp.data_hora DESC;
            `;

            const { rows } = await db.query(query, [unidade_id]);

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao buscar registros:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },



    //PUT
    // Atualizar um registro de ponto existente (hora de entrada ou saída) baseado em data.
    async atualizarRegistroPonto(req, res) {
        const { id } = req.params;
        const { hora_entrada, hora_saida } = req.body;

        if (!id || (!hora_entrada && !hora_saida)) {
            return res.status(400).json({ error: 'Informe pelo menos hora_entrada ou hora_saida.' });
        }

        // Validação simples para formato HH:mm
        const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (hora_entrada && !horaRegex.test(hora_entrada)) {
            return res.status(400).json({ error: 'Formato de hora_entrada inválido. Use HH:mm (ex: 09:00)' });
        }
        if (hora_saida && !horaRegex.test(hora_saida)) {
            return res.status(400).json({ error: 'Formato de hora_saida inválido. Use HH:mm (ex: 18:00)' });
        }

        try {
            // Busca o registro para pegar funcionario_id, unidade_id, data_hora, id_biometrico
            const registroResult = await db.query(
                `SELECT funcionario_id, unidade_id, data_hora, id_biometrico, hora_entrada, hora_saida FROM registros_ponto WHERE id = $1`,
                [id]
            );
            if (registroResult.rowCount === 0) {
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            const registro = registroResult.rows[0];

            // Use os valores antigos se não forem enviados novos
            const novaHoraEntrada = hora_entrada || registro.hora_entrada;
            const novaHoraSaida = hora_saida || registro.hora_saida;

            // Se ainda não tem ambos, apenas atualize o campo informado
            if (!novaHoraEntrada || !novaHoraSaida) {
                // Atualiza só o campo informado
                const result = await db.query(
                    `
                UPDATE registros_ponto
                SET
                    hora_entrada = COALESCE($1, hora_entrada),
                    hora_saida = COALESCE($2, hora_saida),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
                `,
                    [hora_entrada, hora_saida, id]
                );
                return res.status(200).json(result.rows[0]);
            }

            // Monta datas de entrada e saída
            const data = format(new Date(registro.data_hora), 'yyyy-MM-dd');
            const dataEntrada = new Date(`${data}T${novaHoraEntrada}`);
            let dataSaida = new Date(`${data}T${novaHoraSaida}`);
            if (['24h', '24x72'].includes(escala)) {
                dataSaida.setDate(dataSaida.getDate() + 1);
            } else if (dataSaida < dataEntrada) {
                dataSaida.setDate(dataSaida.getDate() + 1);
            }

            // Calcula horas trabalhadas descontando pausa de almoço
            let horasTrabalhadas = ((dataSaida - dataEntrada) / (1000 * 60 * 60)) - pausaAlmoco;
            if (horasTrabalhadas < 0) horasTrabalhadas = 0;

            // Calcula diferença para jornada esperada
            let diferenca = horasTrabalhadas - jornadaEsperada;
            let horaExtra = 0;
            let horaDesconto = 0;

            if (horasTrabalhadas > 0) {
                if (diferenca > 0) {
                    horaExtra = diferenca;
                } else if (diferenca < 0) {
                    horaDesconto = Math.abs(diferenca);
                }
            }
            let horasNormais = Math.min(horasTrabalhadas, jornadaEsperada);
            let totalTrabalhado = horasTrabalhadas;

            function toPgInterval(hours) {
                const h = Math.floor(hours);
                const m = Math.round((hours - h) * 60);
                return `${h}:${m.toString().padStart(2, '0')}:00`;
            }

            // Atualiza o registro com todos os campos calculados
            const result = await db.query(
                `
            UPDATE registros_ponto
            SET hora_entrada = $1,
                hora_saida = $2,
                horas_normais = $3::interval,
                hora_extra = $4::interval,
                hora_desconto = $5::interval,
                total_trabalhado = $6::interval,
                hora_saida_ajustada = $7::interval,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
            `,
                [
                    hora_entrada,
                    hora_saida,
                    toPgInterval(horasNormais),
                    toPgInterval(horaExtra),
                    toPgInterval(horaDesconto),
                    toPgInterval(totalTrabalhado),
                    toPgInterval((dataSaida - dataEntrada) / (1000 * 60 * 60)),
                    id
                ]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Registro não encontrado' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },



    async excluirRegistroPonto(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID é obrigatório para exclusão.' });
        }

        try {
            const result = await db.query(
                `DELETE FROM Registros_Ponto WHERE id = $1`,
                [id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Registro não encontrado.' });
            }

            res.status(200).json({ message: 'Registro excluído com sucesso' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


};