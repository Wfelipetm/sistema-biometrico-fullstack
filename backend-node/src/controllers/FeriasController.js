const db = require('../config/db');

module.exports = {

    // solicitar férias
    async createFerias(req, res) {
        const {
            funcionario_id,
            unidade_id,
            data_inicio,
            data_fim,
            dias_ferias,
            status = 'solicitada',
        } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO ferias (funcionario_id, unidade_id, data_inicio, data_fim, dias_ferias, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [funcionario_id, unidade_id, data_inicio, data_fim, dias_ferias, status]
            );

            return res.status(201).json({
                message: 'Férias cadastradas com sucesso.',
                ferias: result.rows[0],
            });
        } catch (error) {
            console.error('Erro ao cadastrar férias:', error);
            return res.status(500).json({ error: 'Erro ao cadastrar férias.' });
        }
    },

    // mostrar férias
    async getFerias(req, res) {
        const { funcionario_id, unidade_id, status } = req.query;

        let query = 'SELECT * FROM ferias WHERE 1=1';
        const params = [];

        if (funcionario_id) {
            params.push(funcionario_id);
            query += ` AND funcionario_id = $${params.length}`;
        }

        if (unidade_id) {
            params.push(unidade_id);
            query += ` AND unidade_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        query += ' ORDER BY data_inicio DESC';

        try {
            const result = await db.query(query, params);
            return res.status(200).json(result.rows);
        } catch (error) {
            console.error('Erro ao buscar férias:', error);
            return res.status(500).json({ error: 'Erro ao buscar férias.' });
        }
    },

    // total solicitadas 
    async totalSolicitadas(req, res) {
        try {
            const result = await db.query(
                `SELECT 
                    f.unidade_id,
                    u.nome AS nome_unidade,
                    COUNT(*) AS total_ferias_solicitadas
                 FROM ferias f
                 JOIN unidades u ON f.unidade_id = u.id
                 WHERE f.status = 'solicitada'
                 GROUP BY f.unidade_id, u.nome
                 ORDER BY total_ferias_solicitadas DESC`
            );

            return res.status(200).json({
                message: 'Total de férias solicitadas por unidade.',
                dados: result.rows,
            });
        } catch (error) {
            console.error('Erro ao buscar total de férias solicitadas:', error);
            return res.status(500).json({ error: 'Erro ao buscar total de férias solicitadas.' });
        }
    },


    async listarPorUnidade(req, res) {
        const { unidadeId } = req.params;

        try {
            const query = `
            SELECT 
                fer.id,  
                f.nome AS nome_funcionario,
                u.nome AS nome_unidade,
                fer.status AS status_ferias,
                TO_CHAR(fer.data_inicio, 'DD/MM/YYYY') AS data_inicio,
                TO_CHAR(fer.data_fim, 'DD/MM/YYYY') AS data_fim,
                u.id AS unidade_id
            FROM 
                ferias fer
            JOIN 
                funcionarios f ON fer.funcionario_id = f.id
            JOIN 
                unidades u ON f.unidade_id = u.id
            WHERE 
                u.id = $1
        `;

            const { rows } = await db.query(query, [unidadeId]);

            res.status(200).json({ sucesso: true, dados: rows });
        } catch (erro) {
            console.error('Erro ao buscar férias:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
        }
    },




    async aprovarSolicitacao(req, res) {
        const { id } = req.params;

        try {
            const resultado = await db.query(
                `UPDATE ferias
         SET status = 'aprovada', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
                [id]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({ mensagem: 'Solicitação de férias não encontrada.' });
            }

            res.status(200).json({
                mensagem: 'Solicitação de férias aprovada com sucesso.',
                ferias: resultado.rows[0],
            });
        } catch (erro) {
            console.error('Erro ao aprovar solicitação:', erro);
            res.status(500).json({ mensagem: 'Erro ao aprovar solicitação de férias.' });
        }
    },




    async feriasGrafico(req, res) {
        const { unidadeId } = req.params;

        try {
            const { rows } = await db.query(
                `
        SELECT 
          fer.id,
          f.nome AS nome_funcionario,
          u.nome AS nome_unidade,
          fer.status AS status_ferias,
          fer.data_inicio,
          fer.data_fim,
          u.id AS unidade_id
        FROM 
          ferias fer
        JOIN 
          funcionarios f ON fer.funcionario_id = f.id
        JOIN 
          unidades u ON f.unidade_id = u.id
        WHERE 
          u.id = $1
          AND fer.status = 'aprovada'
        `,
                [unidadeId]
            );

            res.json(rows);
        } catch (error) {
            console.error('Erro ao buscar férias aprovadas para gráfico:', error);
            res.status(500).json({ erro: 'Erro ao buscar férias aprovadas para gráfico' });
        }
    },



    async deletarPorId(req, res) {
        const { id } = req.params;

        try {
            const resultado = await db.query(
                'DELETE FROM ferias WHERE id = $1 RETURNING *',
                [id]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({ mensagem: 'Férias não encontrada para deletar.' });
            }

            res.status(200).json({
                mensagem: 'Férias deletada com sucesso.',
                feriasDeletada: resultado.rows[0],
            });
        } catch (erro) {
            console.error('Erro ao deletar férias:', erro);
            res.status(500).json({ mensagem: 'Erro interno ao deletar férias.' });
        }
    }




};
