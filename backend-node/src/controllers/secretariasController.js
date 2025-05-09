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