const db = require('../config/db');

module.exports = {
    // Criar uma nova unidade com upload de foto
    async criarUnidade(req, res) {
        try {
            const { nome, localizacao, secretaria_id } = req.body;
            const foto = req.file ? req.file.filename : null;

            if (!nome || !localizacao || !secretaria_id) {
                return res.status(400).json({ error: "Os campos 'nome', 'localizacao' e 'secretaria_id' são obrigatórios." });
            }

            // Verifica se a unidade já existe
            const unidadeExistente = await db.query(
                `SELECT * FROM Unidades WHERE nome = $1 AND localizacao = $2`,
                [nome, localizacao]
            );

            if (unidadeExistente.rows.length > 0) {
                return res.status(409).json({ error: "A unidade já existe com o mesmo nome e localização." });
            }

            // Insere a nova unidade
            const result = await db.query(
                `INSERT INTO Unidades (nome, localizacao, foto, secretaria_id) VALUES ($1, $2, $3, $4) RETURNING *`,
                [nome, localizacao, foto, secretaria_id]
            );

            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async atualizarUnidade(req, res) {
        try {
            const { id } = req.params;
            const { nome, localizacao, secretaria_id } = req.body;
            const foto = req.file?.filename;

            if (!nome && !localizacao && !secretaria_id && !foto) {
                return res.status(400).json({ error: "Pelo menos um campo ('nome', 'localizacao', 'secretaria_id' ou 'foto') deve ser enviado." });
            }

            const fields = [];
            const values = [];
            let index = 1;

            if (nome) {
                fields.push(`nome = $${index}`);
                values.push(nome);
                index++;
            }

            if (localizacao) {
                fields.push(`localizacao = $${index}`);
                values.push(localizacao);
                index++;
            }

            if (secretaria_id) {
                fields.push(`secretaria_id = $${index}`);
                values.push(secretaria_id);
                index++;
            }

            if (foto) {
                fields.push(`foto = $${index}`);
                values.push(foto);
                index++;
            }

            values.push(id);

            const result = await db.query(
                `UPDATE Unidades SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index} RETURNING *`,
                values
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Unidade não encontrada.' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Listar todas as unidades
    async listarUnidades(req, res) {
        try {
            const result = await db.query(`SELECT * FROM Unidades ORDER BY created_at DESC`);
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Obter uma unidade por ID
    async obterUnidadePorId(req, res) {
        try {
            const { id } = req.params;

            const result = await db.query(`SELECT * FROM Unidades WHERE id = $1`, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Unidade não encontrada.' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },



    // ---> retorna os dados de faltas por unidade no mês atual (a partir do primeiro registro do mês)
    async listarFaltasPorUnidade(req, res) {
        try {
            const unidadeId = parseInt(req.params.unidadeId, 10);

            if (isNaN(unidadeId)) {
                return res.status(400).json({ erro: 'ID da unidade inválido.' });
            }

            const query = `
        WITH primeiro_ponto_mes AS (
          SELECT 
            MIN(rp.data_hora::date) AS data_inicio
          FROM registros_ponto rp
          JOIN funcionarios f ON f.id = rp.funcionario_id
          WHERE f.unidade_id = $1
            AND rp.data_hora::date >= date_trunc('month', CURRENT_DATE)
            AND rp.data_hora::date <= CURRENT_DATE
        ),
        funcionarios_com_dias AS (
          SELECT
            f.id AS funcionario_id,
            f.unidade_id,
            u.nome AS unidade_nome,
            f.tipo_escala::text AS escala,
            f.data_admissao::date AS referencia,
            gd.dia
          FROM funcionarios f
          JOIN unidades u ON u.id = f.unidade_id
          JOIN LATERAL gerar_dias_por_escala(
            date_trunc('month', CURRENT_DATE)::date,
            CURRENT_DATE,  -- Limita até hoje!
            f.tipo_escala::text,
            f.data_admissao::date
          ) AS gd(dia) ON TRUE
          WHERE f.unidade_id = $1
        ),
        faltas_detalhadas AS (
          SELECT
            fcd.unidade_id,
            fcd.unidade_nome,
            fcd.dia
          FROM funcionarios_com_dias fcd
          LEFT JOIN registros_ponto rp
            ON rp.funcionario_id = fcd.funcionario_id
           AND rp.data_hora::date = fcd.dia
           AND (rp.hora_entrada IS NOT NULL OR rp.hora_saida IS NOT NULL)
          WHERE rp.id IS NULL
        )
        SELECT
          unidade_nome,
          TO_CHAR(date_trunc('month', CURRENT_DATE), 'MM/YYYY') AS mes_referencia,
          COUNT(*) AS total_faltas
        FROM faltas_detalhadas
        GROUP BY unidade_nome
        ORDER BY unidade_nome;
      `;

            const { rows } = await db.query(query, [unidadeId]);

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao listar faltas por unidade:', error);
            return res.status(500).json({ erro: 'Erro interno no servidor.' });
        }
    },



    // ---> retorna as faltas por unidade e por dia — perfeito para alimentar seu gráfico.
    async listarFaltasPorDia(req, res) {
        try {
            const unidadeId = parseInt(req.params.unidadeId, 10);

            if (isNaN(unidadeId)) {
                return res.status(400).json({ erro: 'ID da unidade inválido.' });
            }

            const query = `
        WITH funcionarios_unidade AS (
          SELECT f.id AS funcionario_id, f.nome, f.tipo_escala::text AS tipo_escala,
                 f.data_admissao::date AS referencia, f.unidade_id, u.nome AS unidade_nome
          FROM funcionarios f
          JOIN unidades u ON u.id = f.unidade_id
          WHERE f.unidade_id = $1
        ),
        dias_uteis AS (
          SELECT 
            f.funcionario_id,
            f.nome,
            f.tipo_escala,
            f.referencia,
            f.unidade_id,
            f.unidade_nome,
            gd.dia
          FROM funcionarios_unidade f
          JOIN LATERAL gerar_dias_por_escala(
            date_trunc('month', CURRENT_DATE)::date,
            (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date,
            f.tipo_escala,
            f.referencia
          ) AS gd(dia) ON true
        ),
        faltas_por_dia AS (
          SELECT
            d.unidade_nome,
            d.dia AS data_falta,
            COUNT(*) AS quantidade_de_faltas
          FROM dias_uteis d
          LEFT JOIN registros_ponto rp
            ON rp.funcionario_id = d.funcionario_id
            AND rp.data_hora::date = d.dia
            AND (rp.hora_entrada IS NOT NULL OR rp.hora_saida IS NOT NULL)
          WHERE rp.id IS NULL
          GROUP BY d.unidade_nome, d.dia
          ORDER BY d.dia
        )
        SELECT 
          unidade_nome,
          quantidade_de_faltas,
          to_char(data_falta, 'DD/MM/YYYY') AS data_falta
        FROM faltas_por_dia;
      `;

            const { rows } = await db.query(query, [unidadeId]);

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao listar faltas por dia:', error);
            return res.status(500).json({ erro: 'Erro interno no servidor.' });
        }
    },

    // ---> que retorna a quantidade de registros de ponto de hoje por unidade_id
    async getRegistrosDeHoje(req, res) {
        const { id } = req.params;

        try {
            const query = `
            SELECT
                u.id AS unidade_id,
                u.nome AS unidade_nome,
                COUNT(r.id) FILTER (
                    WHERE r.data_hora::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date
                ) AS total_registros_hoje
            FROM
                unidades u
            LEFT JOIN
                funcionarios f ON f.unidade_id = u.id
            LEFT JOIN
                registros_ponto r ON r.funcionario_id = f.id
            WHERE
                u.id = $1
            GROUP BY
                u.id, u.nome;
        `;

            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Unidade não encontrada.' });
            }

            return res.json(rows[0]);
        } catch (error) {
            console.error('Erro ao buscar registros de hoje por unidade:', error);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
    },




    // ---> Retorna as presenças por dia no mês para uma unidade específica
    async getPresencasPorDiaNoMes(req, res) {
        const { id } = req.params;

        try {
            const query = `
        SELECT
            u.id AS unidade_id,
            u.nome AS unidade_nome,
            COUNT(r.id) FILTER (
                WHERE (r.data_hora AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = d
            ) AS total_registros,
            to_char(d, 'DD/MM/YYYY') AS data
        FROM
            unidades u
        LEFT JOIN
            funcionarios f ON f.unidade_id = u.id
        LEFT JOIN
            registros_ponto r ON r.funcionario_id = f.id
        JOIN (
            SELECT generate_series(
                date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date,
                (date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month - 1 day')::date,
                '1 day'
            ) AS d
        ) dias ON true
        WHERE
            u.id = $1
        GROUP BY
            u.id, u.nome, d
        ORDER BY
            d;
      `;

            const { rows } = await db.query(query, [id]);

            return res.json(rows);
        } catch (error) {
            console.error('Erro ao buscar presenças por dia no mês:', error);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
    },



    // ===>  Últimos 5 funcionários por unidade
    async ultimosCadastradosPorUnidade(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID da unidade é obrigatório.' });
        }

        try {
            const query = `
				SELECT
					id,
					nome,
					cargo,
					matricula,
					data_admissao,
					created_at
				FROM funcionarios
				WHERE unidade_id = $1
				ORDER BY created_at DESC
				LIMIT 5
			`;

            const { rows } = await db.query(query, [id]);

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao buscar últimos funcionários cadastrados:', error);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    },

    // Listar funcionários de uma unidade
    async listarFuncionariosDaUnidade(req, res) {
        const { id } = req.params;
        const { data_inicio, data_fim } = req.query;

        try {
            const params = [id];
            let query = `
            SELECT f.*
            FROM funcionarios f
            WHERE f.unidade_id = $1
        `;

            if (data_inicio && data_fim) {
                query += ` AND f.created_at::date BETWEEN $2 AND $3`;
                params.push(data_inicio, data_fim);
            }

            query += ` ORDER BY f.nome`;

            const result = await db.query(query, params);
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar funcionários da unidade' });
        }
    }
    ,

    // --> Listar registros de ponto de uma unidade com filtros de data e paginação
    async listarRegistrosDaUnidade(req, res) {
        const { id } = req.params;
        const { data_inicio, data_fim, page = 1, limit = 20 } = req.query;

        try {
            const params = [id];
            let paramIndex = 2;
            let query = `
        SELECT 
            r.*, 
            f.nome AS funcionario_nome, 
            f.tipo_escala AS tipo_escala,
            u.nome AS unidade_nome
        FROM registros_ponto r
        INNER JOIN funcionarios f ON r.funcionario_id = f.id
        INNER JOIN unidades u ON f.unidade_id = u.id
        WHERE f.unidade_id = $1
        `;

            if (data_inicio && data_fim) {
                query += ` AND r.data_hora::date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
                params.push(data_inicio, data_fim);
                paramIndex += 2;
            }

            query += ` ORDER BY r.data_hora DESC`;

            // Paginação
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit), offset);

            const result = await db.query(query, params);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Erro ao listar registros:", error);
            res.status(500).json({ error: "Erro ao listar registros da unidade" });
        }
    },


    // --- >  Obter dados completos da unidade por ID
    async obterDadosUnidade(req, res) {
        const { id } = req.params;

        const query = `
      SELECT 
        u.id AS unidade_id,
        u.nome AS nome_unidade,
        u.localizacao,
        u.foto,
        s.id AS secretaria_id,
        s.nome AS nome_secretaria,
        s.sigla AS sigla_secretaria,
        COUNT(f.id) AS total_funcionarios,
        STRING_AGG(DISTINCT f.cargo, ', ') AS cargos,
        STRING_AGG(DISTINCT f.tipo_escala::text, ', ') AS escalas,
        TO_CHAR(MIN(f.data_admissao), 'DD/MM/YYYY') AS primeira_admissao,
        TO_CHAR(MAX(f.data_admissao), 'DD/MM/YYYY') AS ultima_admissao
      FROM unidades u
      JOIN secretarias s ON s.id = u.secretaria_id
      LEFT JOIN funcionarios f ON f.unidade_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.nome, u.localizacao, u.foto, s.id, s.nome, s.sigla;
    `;

        try {
            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ mensagem: 'Unidade não encontrada' });
            }

            const unidade = rows[0];
            unidade.total_funcionarios = Number(unidade.total_funcionarios);

            return res.status(200).json(unidade);
        } catch (error) {
            console.error('Erro ao buscar dados da unidade:', error);
            return res.status(500).json({ mensagem: 'Erro interno do servidor' });
        }
    },


    async listarFuncionariosPorUnidade(req, res) {
        const { id } = req.params;
        const { data_inicio, data_fim } = req.query;

        try {
            if (!data_inicio || !data_fim) {
                return res.status(400).json({ error: 'Os parâmetros data_inicio e data_fim são obrigatórios' });
            }

            const query = `
            SELECT f.*
            FROM funcionarios f
            WHERE f.unidade_id = $1
              AND f.created_at::date BETWEEN $2 AND $3
            ORDER BY f.nome
          `;

            const result = await db.query(query, [id, data_inicio, data_fim]);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Erro ao listar funcionários da unidade:', error);
            res.status(500).json({ error: 'Erro ao listar funcionários da unidade' });
        }
    },

    async listarRegistrosPorUnidadePorData(req, res) {
        const { id } = req.params;     // unidade_id
        const { data } = req.query;    // data no formato 'YYYY-MM-DD'

        try {
            if (!data) {
                return res.status(400).json({ error: "O parâmetro 'data' é obrigatório." });
            }

            const query = `
            SELECT rp.*, f.nome, f.cargo
            FROM registros_ponto rp
            JOIN funcionarios f ON f.id = rp.funcionario_id
            WHERE rp.unidade_id = $1
              AND rp.data_hora::date = $2
            ORDER BY f.nome
          `;

            const result = await db.query(query, [id, data]);
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Erro ao listar registros por unidade e data:', error);
            res.status(500).json({ error: 'Erro ao listar registros por unidade e data' });
        }
    }
    ,


    // Deletar uma unidade
    async deletarUnidade(req, res) {
        try {
            const { id } = req.params;

            const result = await db.query(
                `DELETE FROM Unidades WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Unidade não encontrada.' });
            }

            res.status(200).json({ message: 'Unidade deletada com sucesso.' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};
