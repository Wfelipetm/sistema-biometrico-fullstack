const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/enviar-email', async (req, res) => {
    const { subject, recipient, body } = req.body;

    if (!subject || !recipient || !body) {
        return res.status(400).json({ message: 'Dados incompletos para envio de e-mail.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVER,
            port: parseInt(process.env.MAIL_PORT),
            secure: false,
            auth: {
                user: process.env.MAIL_DEFAULT_SENDER_EMAIL,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `${process.env.MAIL_DEFAULT_SENDER_NAME} <${process.env.MAIL_DEFAULT_SENDER_EMAIL}>`,
            to: recipient,
            subject: subject,
            text: body,
            headers: {
                'X-Mailer': 'Nodemailer',
                'X-Priority': '3',
                'Content-Type': 'text/plain; charset=UTF-8'
            }
        };

        await transporter.sendMail(mailOptions);

        const dataHora = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });

        console.log(`[${dataHora}] E-mail enviado com sucesso para ${recipient}`);
        res.status(200).json({ message: 'E-mail enviado com sucesso!' });

    } catch (error) {
        const dataHora = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });

        console.error(`[${dataHora}] Erro ao enviar e-mail: ${error.message}`);
        res.status(500).json({ message: 'Erro ao enviar e-mail', error: error.message });
    }
});

module.exports = router;
