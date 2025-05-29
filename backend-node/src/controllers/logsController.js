const db = require('../config/db');


module.exports = {
    async registrarLog(req, res) {
        const {
            usuario_id,
            acao,
            rota,
            metodo_http,
            status_code,
            dados,
            ip,
            user_agent,
            sistema,
            modulo
        } = req.body;

        try {
            await db.query(`
      INSERT INTO logs_sistema (
        usuario_id,
        acao,
        rota,
        metodo_http,
        status_code,
        dados,
        ip,
        user_agent,
        sistema,
        modulo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
                usuario_id || null,
                acao,
                rota || null,
                metodo_http || null,
                status_code || null,
                dados ? JSON.stringify(dados) : null,
                ip || req.ip,
                user_agent || req.headers['user-agent'],
                sistema || 'web',
                modulo || null
            ]);

            res.status(201).json({ mensagem: 'Log registrado com sucesso.' });
        } catch (erro) {
            console.error('Erro ao registrar log:', erro);
            res.status(500).json({ erro: 'Erro ao registrar log.' });
        }
    }

}
