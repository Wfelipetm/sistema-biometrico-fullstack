const db = require('../config/db');

module.exports = {

    // Solicitar afastamento
    async createAfastamento(req, res) {
        const {
            funcionario_id,
            unidade_id,
            data_inicio,
            data_fim,
            dias_afastamento,
            motivo,
            status = 'solicitado',
        } = req.body;

        try {
            const result = await db.query(
                `INSERT INTO afastamentos (funcionario_id, unidade_id, data_inicio, data_fim, dias_afastamento, motivo, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [funcionario_id, unidade_id, data_inicio, data_fim, dias_afastamento, motivo, status]
            );

            return res.status(201).json({
                message: 'Afastamento cadastrado com sucesso.',
                afastamento: result.rows[0],
            });
        } catch (error) {
            console.error('Erro ao cadastrar afastamento:', error);
            return res.status(500).json({ error: 'Erro ao cadastrar afastamento.' });
        }
    },

    // Mostrar afastamentos
    async getAfastamentos(req, res) {
        const { funcionario_id, unidade_id, status } = req.query;

        let query = 'SELECT * FROM afastamentos WHERE 1=1';
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
            console.error('Erro ao buscar afastamentos:', error);
            return res.status(500).json({ error: 'Erro ao buscar afastamentos.' });
        }
    },

    // Aprovar solicitação de afastamento
    async aprovarSolicitacao(req, res) {
        const { id } = req.params;

        try {
            const resultado = await db.query(
                `UPDATE afastamentos
                 SET status = 'aprovado', updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [id]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({ mensagem: 'Afastamento não encontrado.' });
            }

            res.status(200).json({
                mensagem: 'Solicitação de afastamento aprovada com sucesso.',
                afastamento: resultado.rows[0],
            });
        } catch (erro) {
            console.error('Erro ao aprovar solicitação:', erro);
            res.status(500).json({ mensagem: 'Erro ao aprovar solicitação de afastamento.' });
        }
    },

    // Deletar afastamento por ID
    async deletarPorId(req, res) {
        const { id } = req.params;

        try {
            const resultado = await db.query(
                `DELETE FROM afastamentos WHERE id = $1 RETURNING *`,
                [id]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({ mensagem: 'Afastamento não encontrado.' });
            }

            res.status(200).json({
                mensagem: 'Afastamento deletado com sucesso.',
                afastamento: resultado.rows[0],
            });
        } catch (erro) {
            console.error('Erro ao deletar afastamento:', erro);
            res.status(500).json({ mensagem: 'Erro ao deletar afastamento.' });
        }
    },
};
