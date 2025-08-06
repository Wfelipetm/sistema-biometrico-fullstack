const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const dotenv = require("dotenv");
const passport = require('passport');

dotenv.config();

// Cadastro de usuário

async function cadastrarUsuario(req, res) {
    const { nome, email, senha, papel, secretaria_id, unidade_id } = req.body;

    // Verificação se o secretaria_id é válido
    if (!secretaria_id || isNaN(secretaria_id)) {
        return res.status(400).json({ error: "Secretaria inválida" });
    }

    // Verificação se o unidade_id é válido
    if (!unidade_id || isNaN(unidade_id)) {
        return res.status(400).json({ error: "Unidade inválida" });
    }

    try {
        const emailCheckQuery = 'SELECT * FROM usuarios WHERE email = $1';
        const emailCheckResult = await db.query(emailCheckQuery, [email]);

        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const insertQuery = `
            INSERT INTO usuarios (nome, email, senha, papel, secretaria_id, unidade_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nome, email, papel, secretaria_id, unidade_id
        `;
        const result = await db.query(insertQuery, [nome, email, senhaHash, papel, secretaria_id, unidade_id]);
        const novoUsuario = result.rows[0];

        const token = jwt.sign(
            { id: novoUsuario.id, papel: novoUsuario.papel },
            process.env.SECRET_KEY,
            { expiresIn: 999999 }
        );

        res.status(201).json({
            token,
            usuario: {
                id: novoUsuario.id,
                nome: novoUsuario.nome,
                email: novoUsuario.email,
                papel: novoUsuario.papel,
                secretaria_id: novoUsuario.secretaria_id,
                unidade_id: novoUsuario.unidade_id
            },
        });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}


// Login de usuário com suporte LDAP
async function loginUsuario(req, res) {
    const { email, senha, data, password } = req.body;

    // Se 'data' foi enviado, use-o ao invés de 'email'
    const loginData = data || email;
    const passwordField = senha || password;

    console.log('Dados recebidos:', { email, data, senha, password, loginData, passwordField: passwordField ? '***' : null });

    if (!loginData || !passwordField) {
        return res.status(400).json({
            error: 'Por favor, preencha todos os campos',
            received: { loginData: !!loginData, password: !!passwordField }
        });
    }

    try {
        // Se contém '@', é login por email (local)
        if (loginData.includes('@')) {
            console.log('Login LOCAL detectado');
            const userQuery = "SELECT * FROM usuarios WHERE email = $1";
            const userResult = await db.query(userQuery, [loginData]);

            if (userResult.rows.length === 0) {
                return res.status(401).json({ error: "Credenciais inválidas" });
            }

            const usuario = userResult.rows[0];
            const senhaCorreta = await bcrypt.compare(passwordField, usuario.senha);

            if (!senhaCorreta) {
                return res.status(401).json({ error: "Credenciais inválidas" });
            }

            const token = jwt.sign(
                { id: usuario.id, papel: usuario.papel },
                process.env.SECRET_KEY,
                { expiresIn: "24h" }
            );

            return res.status(200).json({
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    papel: usuario.papel,
                    secretaria_id: usuario.secretaria_id || null,
                    unidade_id: usuario.unidade_id || null,
                    ldap_user: usuario.ldap_user || false
                },
            });
        }
        // Se contém '.', é login LDAP (usuario.dominio)
        else if (loginData.includes('.')) {
            console.log('Login LDAP detectado');
            const username = loginData;
            req.body.username = username;
            req.body.password = passwordField;

            console.log('Tentando autenticação LDAP para usuário:', username);

            passport.authenticate("ldapauth", { session: false }, async (err, ldapUser, info) => {
                console.log('Resultado da autenticação LDAP:');
                console.log('Erro:', err);
                console.log('Usuário LDAP:', ldapUser);

                if (err) {
                    console.error('Erro LDAP:', err);
                    return res.status(500).json({
                        error: "Erro interno no servidor",
                        details: err.message
                    });
                }

                if (!ldapUser) {
                    console.log('Falha na autenticação LDAP');
                    return res.status(401).json({ error: "Usuário ou senha inválidos" });
                }

                try {
                    const username = ldapUser.sAMAccountName;
                    const nome = ldapUser.cn;
                    const email = ldapUser.mail;
                    const dn = ldapUser.dn;
                    const memberOf = ldapUser.memberOf;
                    const description = ldapUser.description;
                    const department = ldapUser.department;

                    // Verifica se usuário já existe no banco
                    let userQuery = "SELECT * FROM usuarios WHERE email = $1 OR nome = $2";
                    let userResult = await db.query(userQuery, [email, username]);

                    let usuario;

                    if (userResult.rows.length === 0) {
                        // Cria novo usuário LDAP no banco
                        const insertQuery = `
                            INSERT INTO usuarios (nome, email, senha, papel, secretaria_id, unidade_id, ldap_user)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                            RETURNING id, nome, email, papel, secretaria_id, unidade_id
                        `;

                        // Senha temporária para usuários LDAP (não será usada)
                        const senhaTemp = await bcrypt.hash('ldap_user_' + Date.now(), 10);

                        const result = await db.query(insertQuery, [
                            nome,
                            email,
                            senhaTemp,
                            'quiosque', // papel padrão para usuários LDAP
                            null, // secretaria_id - pode ser definido depois
                            null, // unidade_id - pode ser definido depois
                            true  // marca como usuário LDAP
                        ]);

                        usuario = result.rows[0];
                    } else {
                        // Atualiza dados do usuário existente
                        usuario = userResult.rows[0];

                        const updateQuery = `
                            UPDATE usuarios SET nome = $1, email = $2, ldap_user = $3, updated_at = NOW()
                            WHERE id = $4
                            RETURNING id, nome, email, papel, secretaria_id, unidade_id
                        `;

                        const result = await db.query(updateQuery, [nome, email, true, usuario.id]);
                        usuario = result.rows[0];
                    }

                    const token = jwt.sign(
                        { id: usuario.id, papel: usuario.papel },
                        process.env.SECRET_KEY,
                        { expiresIn: "24h" }
                    );

                    return res.status(200).json({
                        token,
                        usuario: {
                            id: usuario.id,
                            nome: usuario.nome,
                            email: usuario.email,
                            papel: usuario.papel,
                            secretaria_id: usuario.secretaria_id,
                            unidade_id: usuario.unidade_id,
                            ldap_user: true,
                            matricula: description,
                            departamento: department
                        },
                    });

                } catch (error) {
                    console.error('Erro ao processar usuário LDAP:', error);
                    return res.status(500).json({
                        error: "Erro ao salvar usuário LDAP",
                        message: error.message
                    });
                }
            })(req, res);
        } else {
            console.log('Formato de login inválido:', loginData);
            return res.status(400).json({
                error: 'Formato de login inválido',
                info: 'Use email (com @) para login local ou usuario.dominio para LDAP'
            });
        }
    } catch (error) {
        console.error("Erro ao realizar login:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
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

async function verificarSenhaUsuario(req, res) {
    const { email, senha } = req.body;

    try {
        // Busca o usuário pelo email
        const query = 'SELECT id, nome, email, senha FROM usuarios WHERE email = $1';
        const result = await db.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const usuario = result.rows[0];

        // Compara a senha informada com o hash do banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        // Se chegou aqui, a senha está correta
        return res.status(200).json({ success: true, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
    } catch (error) {
        console.error('Erro ao verificar senha:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
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
    buscarUsuarios,
    verificarSenhaUsuario
};
