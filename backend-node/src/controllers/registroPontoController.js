const db = require('../config/db');
const { format, parse } = require('date-fns');

module.exports = {

    // POST
    // Cria um novo registro de ponto (entrada ou saída) para um funcionário em uma unidade.
    async criarRegistroPonto(req, res) {
        // Recebe os dados da requisição
        const {
            funcionario_id,
            unidade_id,
            hora_entrada,
            hora_saida,
            id_biometrico,
            data_entrada,
            data_saida,
            data, // compatibilidade com formato antigo
        } = req.body

        console.log("[DEBUG] Requisição recebida:", req.body)

        // Validação básica
        if (!funcionario_id || !unidade_id) {
            return res.status(400).json({
                error: "Campos obrigatórios: funcionario_id, unidade_id",
            })
        }

        // Verifica se é entrada ou saída (pelo menos um deve estar preenchido)
        if (!hora_entrada && !hora_saida) {
            return res.status(400).json({
                error: "Você deve informar pelo menos hora_entrada ou hora_saida",
            })
        }

        try {
            // Verifica existência do funcionário e obtém tipo de escala
            console.log("[DEBUG] Verificando existência do funcionário...")
            const funcionarioResult = await db.query(`SELECT id, nome, tipo_escala FROM funcionarios WHERE id = $1`, [
                funcionario_id,
            ])

            if (funcionarioResult.rows.length === 0) {
                console.warn("[ERRO] Funcionário não encontrado:", funcionario_id)
                return res.status(404).json({ error: "Funcionário não encontrado" })
            }

            const funcionario = funcionarioResult.rows[0]
            console.log("[DEBUG] Funcionário encontrado:", funcionario.nome, "Escala:", funcionario.tipo_escala)

            // Verifica existência da unidade
            console.log("[DEBUG] Verificando existência da unidade...")
            const unidadeResult = await db.query(`SELECT id, nome FROM unidades WHERE id = $1`, [unidade_id])

            if (unidadeResult.rows.length === 0) {
                console.warn("[ERRO] Unidade não encontrada:", unidade_id)
                return res.status(404).json({ error: "Unidade não encontrada" })
            }

            const unidadeNome = unidadeResult.rows[0].nome

            // Determina se é escala especial
            const isEscalaEspecial = ["12x36", "24x72"].includes(funcionario.tipo_escala)
            console.log("[DEBUG] Escala especial:", isEscalaEspecial ? "SIM" : "NÃO")

            // 🔄 Compatibilidade: aceita tanto formato novo quanto antigo
            const dataEntradaFinal = data_entrada || data || new Date().toISOString().split("T")[0]
            const dataSaidaFinal = data_saida || data || new Date().toISOString().split("T")[0]

            // Determina a data_hora para compatibilidade
            let dataHora
            if (hora_entrada) {
                dataHora = `${dataEntradaFinal}T${hora_entrada}:00`
            } else if (hora_saida) {
                dataHora = `${dataSaidaFinal}T${hora_saida}:00`
            } else {
                dataHora = new Date().toISOString()
            }

            // LÓGICA PARA ESCALAS ESPECIAIS
            if (isEscalaEspecial) {
                console.log("[DEBUG] Aplicando lógica para escala especial:", funcionario.tipo_escala)

                // CASO 1: REGISTRANDO ENTRADA (hora_entrada preenchida)
                if (hora_entrada) {
                    console.log("[DEBUG] Registrando ENTRADA para escala especial")

                    // Verifica se já existe entrada em aberto
                    const entradaAberta = await db.query(
                        `SELECT id, data_entrada, hora_entrada 
             FROM registros_ponto 
             WHERE funcionario_id = $1 AND hora_saida IS NULL AND hora_entrada IS NOT NULL
               AND data_entrada >= CURRENT_DATE - INTERVAL '3 days'
             ORDER BY data_entrada DESC, hora_entrada DESC LIMIT 1`,
                        [funcionario_id],
                    )

                    if (entradaAberta.rows.length > 0) {
                        const registro = entradaAberta.rows[0]
                        console.warn("[ERRO] Funcionário já possui entrada em aberto:", registro)
                        return res.status(400).json({
                            error: `Funcionário já possui entrada em aberto desde ${registro.data_entrada} às ${registro.hora_entrada}. Complete a saída antes de registrar nova entrada.`,
                        })
                    }

                    // Cria novo registro com ENTRADA preenchida e SAÍDA NULL
                    const result = await db.query(
                        `INSERT INTO registros_ponto (
                funcionario_id, unidade_id, data_hora, 
                data_entrada, hora_entrada, 
                data_saida, hora_saida, 
                id_biometrico
            ) VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6) 
            RETURNING *`,
                        [funcionario_id, unidade_id, dataHora, dataEntradaFinal, hora_entrada, id_biometrico || null],
                    )

                    console.log("[SUCCESS] ✅ Registro de ENTRADA criado com sucesso:", {
                        id: result.rows[0].id,
                        funcionario: funcionario.nome,
                        escala: funcionario.tipo_escala,
                        entrada: `${dataEntradaFinal} ${hora_entrada}`,
                    })

                    return res.status(201).json({
                        ...result.rows[0],
                        funcionario_nome: funcionario.nome,
                        unidade_nome: unidadeNome,
                        tipo_escala: funcionario.tipo_escala,
                        mensagem: "Entrada registrada com sucesso",
                    })
                }

                // CASO 2: REGISTRANDO SAÍDA (hora_saida preenchida)
                if (hora_saida) {
                    console.log("[DEBUG] Registrando SAÍDA para escala especial")

                    // Verifica se existe entrada em aberto para fechar
                    const entradaAberta = await db.query(
                        `SELECT id, data_entrada, hora_entrada 
             FROM registros_ponto 
             WHERE funcionario_id = $1 AND hora_saida IS NULL AND hora_entrada IS NOT NULL
               AND data_entrada >= CURRENT_DATE - INTERVAL '3 days'
             ORDER BY data_entrada DESC, hora_entrada DESC LIMIT 1`,
                        [funcionario_id],
                    )

                    if (entradaAberta.rows.length === 0) {
                        console.warn("[ERRO] Funcionário não possui entrada em aberto para registrar saída")
                        return res.status(400).json({
                            error: "Funcionário não possui entrada em aberto para registrar saída. Registre uma entrada primeiro.",
                        })
                    }

                    // Cria novo registro com ENTRADA NULL e SAÍDA preenchida
                    const result = await db.query(
                        `INSERT INTO registros_ponto (
                funcionario_id, unidade_id, data_hora, 
                data_entrada, hora_entrada, 
                data_saida, hora_saida, 
                id_biometrico
            ) VALUES ($1, $2, $3, NULL, NULL, $4, $5, $6) 
            RETURNING *`,
                        [funcionario_id, unidade_id, dataHora, dataSaidaFinal, hora_saida, id_biometrico || null],
                    )

                    // Calcula duração do turno
                    const entradaRegistro = entradaAberta.rows[0]
                    const entradaDateTime = new Date(`${entradaRegistro.data_entrada}T${entradaRegistro.hora_entrada}:00`)
                    const saidaDateTime = new Date(`${dataSaidaFinal}T${hora_saida}:00`)
                    const diffMs = saidaDateTime.getTime() - entradaDateTime.getTime()
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
                    const duracaoTurno = `${diffHours}h ${diffMinutes}min`

                    console.log("[SUCCESS] ✅ Registro de SAÍDA criado com sucesso:", {
                        id: result.rows[0].id,
                        funcionario: funcionario.nome,
                        escala: funcionario.tipo_escala,
                        saida: `${dataSaidaFinal} ${hora_saida}`,
                        entrada_relacionada: `${entradaRegistro.data_entrada} ${entradaRegistro.hora_entrada}`,
                        duracao: duracaoTurno,
                    })

                    return res.status(201).json({
                        ...result.rows[0],
                        funcionario_nome: funcionario.nome,
                        unidade_nome: unidadeNome,
                        tipo_escala: funcionario.tipo_escala,
                        entrada_relacionada: {
                            id: entradaRegistro.id,
                            data: entradaRegistro.data_entrada,
                            hora: entradaRegistro.hora_entrada,
                        },
                        duracao_turno: duracaoTurno,
                        mensagem: "Saída registrada com sucesso",
                    })
                }
            } else {
                // LÓGICA PARA ESCALAS NORMAIS (não especiais)
                console.log("[DEBUG] Aplicando lógica para escala normal")

                // Verifica se já existe ponto registrado no mesmo instante
                const pontoExistente = await db.query(
                    `SELECT id FROM registros_ponto 
           WHERE funcionario_id = $1 AND data_hora = $2`,
                    [funcionario_id, dataHora],
                )

                if (pontoExistente.rows.length > 0) {
                    console.warn("[INFO] Ponto já registrado para o funcionário:", funcionario_id)
                    return res.status(200).json({ message: "Você já bateu o ponto neste horário." })
                }

                // Para escalas normais, cria registro completo com entrada e saída
                const result = await db.query(
                    `INSERT INTO registros_ponto (
              funcionario_id, unidade_id, data_hora, 
              data_entrada, hora_entrada, 
              data_saida, hora_saida, 
              id_biometrico
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
          RETURNING *`,
                    [
                        funcionario_id,
                        unidade_id,
                        dataHora,
                        dataEntradaFinal,
                        hora_entrada,
                        dataSaidaFinal,
                        hora_saida,
                        id_biometrico || null,
                    ],
                )

                console.log("[SUCCESS] ✅ Registro normal criado com sucesso:", {
                    id: result.rows[0].id,
                    funcionario: funcionario.nome,
                    escala: funcionario.tipo_escala,
                })

                return res.status(201).json({
                    ...result.rows[0],
                    funcionario_nome: funcionario.nome,
                    unidade_nome: unidadeNome,
                    tipo_escala: funcionario.tipo_escala,
                    mensagem: "Registro de ponto criado com sucesso",
                })
            }
        } catch (error) {
            console.error("[ERRO] Falha ao criar registro de ponto:", error.message)
            console.error("[STACK]", error.stack)

            // Tratamento específico para erros de trigger
            if (error.message.includes("deve ser posterior") || error.message.includes("negativo")) {
                return res.status(400).json({
                    error: "Erro de validação de horários. Verifique se a data/hora de saída é posterior à entrada.",
                    details: error.message,
                })
            }

            return res.status(500).json({ error: "Erro ao registrar ponto. Contate o suporte." })
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
          SELECT unidade_id, data_hora
          FROM registros_ponto
          WHERE unidade_id = $1
            AND data_hora >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo')
            AND data_hora < date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 day'
          ORDER BY data_hora DESC;
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

        if (!id || !hora_entrada || !hora_saida) {
            return res.status(400).json({ error: 'Campos obrigatórios: id, hora_entrada, hora_saida' });
        }

        // Validação simples para formato HH:mm
        const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!horaRegex.test(hora_entrada) || !horaRegex.test(hora_saida)) {
            return res.status(400).json({ error: 'Formato de hora inválido. Use HH:mm (ex: 09:00)' });
        }

        try {
            const result = await db.query(
                `
            UPDATE Registros_Ponto
            SET hora_entrada = $1, hora_saida = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
            `,
                [hora_entrada, hora_saida, id]
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