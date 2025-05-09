const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");

dotenv.config();

function criarToken(usuarioId, papel) {
    return jwt.sign({ id: usuarioId, papel }, process.env.SECRET_KEY, { expiresIn: 999999999 });
}

function validarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.SECRET_KEY);
        req.usuario = { id: payload.id, papel: payload.papel };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

function autorizarPapel(papeisPermitidos) {
    return (req, res, next) => {
        const { papel } = req.usuario;
        if (!papeisPermitidos.includes(papel)) {
            return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
        }
        next();
    };
}

module.exports = { criarToken, validarToken, autorizarPapel };
