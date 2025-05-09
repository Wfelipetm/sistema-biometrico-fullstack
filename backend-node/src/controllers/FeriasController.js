const db = require('../config/db'); // Conexão com o banco

module.exports = {
    async registrarFerias(req, res) {
        try {
            const { funcionario_id, data_inicio, data_fim } = req.body;

            // Verifica se todos os dados foram fornecidos
            if (!funcionario_id || !data_inicio || !data_fim) {
                return res.status(400).json({ error: 'Os campos funcionario_id, data_inicio e data_fim são obrigatórios.' });
            }

            // Insere as férias no banco de dados
            const result = await db.query(
                `INSERT INTO ferias (funcionario_id, data_inicio, data_fim) 
                 VALUES ($1, $2, $3) RETURNING *;`,
                [funcionario_id, data_inicio, data_fim]
            );

            res.status(201).json({ message: 'Férias registradas com sucesso!', ferias: result.rows[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async listarFerias(req, res) {
        try {
            const result = await db.query(`SELECT * FROM ferias ORDER BY data_inicio DESC;`);
            res.status(200).json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async deletarFerias(req, res) {
        try {
            const { id } = req.params;

            const result = await db.query(`DELETE FROM ferias WHERE id = $1 RETURNING *;`, [id]);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Registro de férias não encontrado.' });
            }

            res.status(200).json({ message: 'Férias removidas com sucesso!', ferias: result.rows[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};




