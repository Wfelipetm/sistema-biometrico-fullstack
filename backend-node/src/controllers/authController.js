const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require("dotenv");

dotenv.config();

// Cadastro de usuário
async function cadastrarUsuario(req, res) {
    const { nome, email, senha, papel } = req.body;

    try {
        const emailCheckQuery = 'SELECT * FROM usuarios WHERE email = $1';
        const emailCheckResult = await db.query(emailCheckQuery, [email]);

        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const insertQuery = `
            INSERT INTO usuarios (nome, email, senha, papel)
            VALUES ($1, $2, $3, $4)
            RETURNING id, nome, email, papel
        `;
        const result = await db.query(insertQuery, [nome, email, senhaHash, papel]);
        const novoUsuario = result.rows[0];

        const token = jwt.sign({ id: novoUsuario.id, papel: novoUsuario.papel }, process.env.SECRET_KEY, { expiresIn: 999999 });

        res.status(201).json({
            token,
            usuario: { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, papel: novoUsuario.papel },
        });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// Login de usuário
async function loginUsuario(req, res) {
    const { email, senha } = req.body;

    try {
        const userQuery = 'SELECT * FROM usuarios WHERE email = $1';
        const userResult = await db.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const usuario = userResult.rows[0];

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign({ id: usuario.id, papel: usuario.papel }, process.env.SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel },
        });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}


// Buscar todos os usuários
async function buscarUsuarios(req, res) {
    // Verificar se o usuário tem permissão de admin
    if (req.usuario.papel !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    try {
        // Consulta ao banco de dados para buscar os usuários
        const query = 'SELECT id, nome, email, papel FROM usuarios';
        const result = await db.query(query);

        // Verificar se existem usuários cadastrados
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nenhum usuário encontrado' });
        }

        // Retornar a lista de usuários
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

// Atualizar usuário
async function atualizarUsuario(req, res) {
    const { id } = req.params;
    const { nome, email, senha, papel } = req.body;

    if (req.usuario.papel !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    // Atualização no banco de dados
    try {
        const updateQuery = `
            UPDATE usuarios SET nome = $1, email = $2, senha = $3, papel = $4 WHERE id = $5
            RETURNING id, nome, email, papel
        `;
        const senhaHash = senha ? await bcrypt.hash(senha, 10) : null;
        const result = await db.query(updateQuery, [nome, email, senhaHash, papel, id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}


// Deletar usuário
async function deletarUsuario(req, res) {
    const { id } = req.params;

    try {
        const userCheckQuery = 'SELECT * FROM usuarios WHERE id = $1';
        const userCheckResult = await db.query(userCheckQuery, [id]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const deleteQuery = 'DELETE FROM usuarios WHERE id = $1';
        await db.query(deleteQuery, [id]);

        res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

module.exports = { 
    cadastrarUsuario, 
    loginUsuario, 
    atualizarUsuario, 
    deletarUsuario,
    buscarUsuarios
};
