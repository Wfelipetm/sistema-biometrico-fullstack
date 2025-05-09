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

    // Atualizar uma unidade existente
    async atualizarUnidade(req, res) {
        try {
            const { id } = req.params;
            const { nome, localizacao, secretaria_id } = req.body;

            if (!nome && !localizacao && !secretaria_id) {
                return res.status(400).json({ error: "Pelo menos um campo ('nome', 'localizacao' ou 'secretaria_id') deve ser enviado." });
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
