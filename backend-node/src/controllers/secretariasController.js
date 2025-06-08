const db = require('../config/db');
const { format } = require('date-fns');

module.exports = {
    async listarSecretarias(req, res) {
        try {
            const result = await db.query('SELECT * FROM secretarias ORDER BY id');
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar secretarias' });
        }
    },

    async obterSecretariaPorId(req, res) {
        const { id } = req.params;
        try {
            const result = await db.query('SELECT * FROM secretarias WHERE id = $1', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Secretaria não encontrada' });
            }
            res.status(200).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar secretaria' });
        }
    },

    async criarSecretaria(req, res) {
        const { nome, sigla } = req.body;
        try {
            const result = await db.query(
                'INSERT INTO secretarias (nome, sigla) VALUES ($1, $2) RETURNING *',
                [nome.toUpperCase(), sigla.toUpperCase()]
            );
            res.status(201).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar secretaria' });
        }
    },

    async obterSecretariaPorUsuarioId(req, res) {
        const { id } = req.params;

        try {
            const result = await db.query(`
                SELECT s.*
                FROM usuarios u
                INNER JOIN secretarias s ON u.secretaria_id = s.id
                WHERE u.id = $1
            `, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Secretaria não encontrada para o usuário informado' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error("Erro ao buscar secretaria por usuário:", error);
            res.status(500).json({ error: 'Erro ao buscar secretaria por usuário' });
        }
    }
    ,

    //  --->   contar os registros de ponto de hoje de toda a secretaria

    async getTotalRegistrosHojePorSecretaria(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "secretaria_id é obrigatório" });
        }

        try {
            const query = `
            SELECT 
                s.nome AS nome_secretaria,
                COUNT(rp.id) AS total_registros_hoje
            FROM secretarias s
            LEFT JOIN unidades u ON u.secretaria_id = s.id
            LEFT JOIN funcionarios f ON f.unidade_id = u.id
            LEFT JOIN registros_ponto rp ON rp.funcionario_id = f.id 
                AND TO_CHAR(rp.data_hora, 'YYYY-MM-DD') = TO_CHAR(NOW() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD')
            WHERE s.id = $1
            GROUP BY s.nome;
        `;

            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                // Secretaria existe mas não tem unidades nem registros
                const secretariaNomeQuery = `SELECT nome FROM secretarias WHERE id = $1`;
                const { rows: nomeRows } = await db.query(secretariaNomeQuery, [id]);

                if (nomeRows.length === 0) {
                    return res.status(404).json({ error: "Secretaria não encontrada" });
                }

                return res.status(200).json({
                    secretaria_id: id,
                    nome: nomeRows[0].nome,
                    total_registros_hoje: 0,
                });
            }

            return res.status(200).json({
                secretaria_id: id,
                nome: rows[0].nome_secretaria,
                total_registros_hoje: Number(rows[0].total_registros_hoje),
            });
        } catch (error) {
            console.error("Erro ao buscar total de registros da secretaria:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }
    ,

    //  ---> retornar o total de registros no mês atual por secretaria
    async getTotalRegistrosMesPorSecretaria(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'secretaria_id é obrigatório' });
        }

        try {
            const query = `
            SELECT 
                s.id AS secretaria_id,
                s.nome AS secretaria_nome,
                COUNT(rp.id) AS total_registros
            FROM registros_ponto rp
            JOIN funcionarios f ON rp.funcionario_id = f.id
            JOIN unidades u ON f.unidade_id = u.id
            JOIN secretarias s ON u.secretaria_id = s.id
            WHERE s.id = $1
              AND EXTRACT(MONTH FROM rp.data_hora) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM rp.data_hora) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY s.id, s.nome;
        `;

            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado para essa secretaria neste mês.' });
            }

            return res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Erro ao buscar registros mensais da secretaria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    // ---> 
    async getRegistrosDiariosPorSecretaria(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'secretaria_id é obrigatório' });
        }

        try {
            const query = `
            SELECT 
                TO_CHAR(rp.data_hora, 'DD/MM/YYYY') AS data,
                COUNT(rp.id) AS registroTotal
            FROM registros_ponto rp
            JOIN funcionarios f ON rp.funcionario_id = f.id
            JOIN unidades u ON f.unidade_id = u.id
            JOIN secretarias s ON u.secretaria_id = s.id
            WHERE s.id = $1
              AND rp.data_hora >= date_trunc('month', current_date)
              AND rp.data_hora < (date_trunc('month', current_date) + INTERVAL '1 month')
            GROUP BY data
            ORDER BY data;
        `;

            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado para essa secretaria neste mês.' });
            }

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao buscar registros diários da secretaria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    // ---> Retorna o total de funcionários cadastrados vinculados à uma secretaria específica, 
    async getTotalFuncionariosPorSecretaria(req, res) {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'secretaria_id é obrigatório' });
        }

        try {
            const query = `
            SELECT
                u.secretaria_id,
                COUNT(f.id) AS total_funcionarios
            FROM
                funcionarios f
            JOIN
                unidades u ON f.unidade_id = u.id
            WHERE
                u.secretaria_id = $1
            GROUP BY
                u.secretaria_id;
        `;

            const { rows } = await db.query(query, [id]);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum funcionário encontrado para essa secretaria.' });
            }

            return res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Erro ao buscar total de funcionários por secretaria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    // ---> Retorna os últimos funcionários cadastrados vinculados à uma secretaria específica
    async getUltimosFuncionariosBySecretaria(req, res) {
        const { id } = req.params; // id da secretaria
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        if (!id) {
            return res.status(400).json({ error: 'secretaria_id é obrigatório' });
        }

        try {
            const query = `
            SELECT
                f.*,
                s.nome AS secretaria_nome,
                u.nome AS unidade_nome
            FROM
                funcionarios f
            JOIN
                unidades u ON f.unidade_id = u.id
            JOIN
                secretarias s ON u.secretaria_id = s.id
            WHERE
                s.id = $1
            ORDER BY
                f.created_at DESC
            LIMIT $2
        `;
            const values = [id, limit];
            const { rows } = await db.query(query, values);

            if (rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum funcionário encontrado para essa secretaria.' });
            }

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Erro ao buscar últimos funcionários por secretaria:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async listarFuncionariosPorSecretaria(req, res) {
        const { id } = req.params; // id da secretaria

        try {
            const result = await db.query(
                `SELECT f.*, u.nome AS unidade_nome
             FROM funcionarios f
             JOIN unidades u ON f.unidade_id = u.id
             WHERE u.secretaria_id = $1
             ORDER BY f.nome`,
                [id]
            );

            res.status(200).json(result.rows);
        } catch (error) {
            console.error("Erro ao listar funcionários da secretaria:", error);
            res.status(500).json({ error: 'Erro ao listar funcionários da secretaria' });
        }
    }
    ,
    async listarUnidadesDaSecretaria(req, res) {
        const { id } = req.params;
        try {
            const result = await db.query(
                `SELECT u.* 
                 FROM unidades u 
                 WHERE u.secretaria_id = $1 
                 ORDER BY u.id`,
                [id]
            );

            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao listar unidades da secretaria' });
        }
    }
    ,

    async atualizarSecretaria(req, res) {
        const { id } = req.params;
        const { nome, sigla } = req.body;
        try {
            const result = await db.query(
                `UPDATE secretarias
         SET nome = $1,
             sigla = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
                [nome.toUpperCase(), sigla.toUpperCase(), id]
            );

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Secretaria não encontrada' });
            }

            res.status(200).json(result.rows[0]);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar secretaria' });
        }
    },

    async excluirSecretaria(req, res) {
        const { id } = req.params;
        try {
            const result = await db.query('DELETE FROM secretarias WHERE id = $1 RETURNING *', [id]);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Secretaria não encontrada' });
            }
            res.status(200).json({ message: 'Secretaria excluída com sucesso' });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao deletar secretaria' });
        }
    }
};