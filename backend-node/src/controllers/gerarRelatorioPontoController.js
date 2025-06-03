const PDFDocument = require('pdfkit');
const { format, differenceInMinutes } = require('date-fns');
const db = require('../config/db');

const formatarHora = (hora) => {
    if (!hora) return '00:00:00';
    const partes = hora.split(':');
    return [partes[0].padStart(2, '0'), partes[1]?.padStart(2, '0') || '00', partes[2]?.padStart(2, '0') || '00'].join(':');
};

module.exports = {
    async gerarRelatorioPonto(req, res) {
        const { funcionario_id, mes, ano } = req.query;
        if (!funcionario_id || !mes || !ano) return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });

        try {
            const query = `
                SELECT 
                    rp.data_hora::DATE AS data, rp.hora_entrada, rp.hora_saida, f.nome AS funcionario_nome,
                    f.data_admissao, f.cargo, f.matricula, f.tipo_escala, f.cpf, f.email,
                    u.nome AS unidade_nome, rp.total_trabalhado
                FROM Registros_Ponto rp
                INNER JOIN funcionarios f ON rp.funcionario_id = f.id
                INNER JOIN unidades u ON rp.unidade_id = u.id
                WHERE f.id = $1 AND EXTRACT(MONTH FROM rp.data_hora) = $2 AND EXTRACT(YEAR FROM rp.data_hora) = $3
                ORDER BY rp.data_hora ASC
            `;

            const result = await db.query(query, [funcionario_id, mes, ano]);
            if (result.rows.length === 0) return res.status(404).json({ error: 'Nenhum registro encontrado.' });

            const funcionario = result.rows[0];
            const registros = result.rows.map(row => {
                const baseDate = '1970-01-01';
                const horaEntrada = new Date(`${baseDate}T${row.hora_entrada}Z`);
                const horaSaida = new Date(`${baseDate}T${row.hora_saida}Z`);
                let horasExtras = 0, justificativa = '';

                let jornadaFim = new Date(horaEntrada);
                const jornadas = { '8h': 17, '12h': 19, '16h': 22, '24h': 24, '12x36': 19, '24x72': 31, '32h': 16, '20h': 16 };
                if (jornadas[row.tipo_escala]) jornadaFim.setHours(jornadas[row.tipo_escala], 0, 0);

                if (horaSaida > jornadaFim) {
                    horasExtras = (differenceInMinutes(horaSaida, jornadaFim) / 60).toFixed(2);
                    justificativa = 'Horas extras';
                }

                return {
                    data: format(new Date(row.data), 'dd/MM/yyyy'),
                    hora_entrada: formatarHora(row.hora_entrada),
                    hora_saida: formatarHora(row.hora_saida),
                    total_trabalhado: row.total_trabalhado || '0.00',
                    horas_extras: horasExtras,
                    justificativa: justificativa || '-',
                };
            });

            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment;filename=relatorio_ponto_${funcionario.matricula}_${mes}_${ano}.pdf`,
            });

            const doc = new PDFDocument({ bufferPages: true, size: 'A4', layout: 'landscape' });
            doc.on('data', chunk => res.write(chunk));
            doc.on('end', () => res.end());




            // Cabeçalho

            const margin = 30;
            const colWidth = (doc.page.width - 2 * margin) / 6;
            const rowHeight = 20;
            const deslocamentoEsquerda = -1; // Ajuste conforme necessário

            // Cabeçalho centralizado
            doc.fontSize(16).text('Relatório de Ponto', { align: 'center', underline: true }).moveDown();

            // Informações do funcionário movidas para a esquerda
            doc.fontSize(12)
                .text(`Funcionário: ${funcionario.funcionario_nome}`, margin - deslocamentoEsquerda)
                .text(`Matrícula: ${funcionario.matricula}`, margin - deslocamentoEsquerda)
                .text(`Cargo: ${funcionario.cargo}`, margin - deslocamentoEsquerda)
                .text(`Escala: ${funcionario.tipo_escala}`, margin - deslocamentoEsquerda)
                .text(`Unidade: ${funcionario.unidade_nome}`, margin - deslocamentoEsquerda)
                .text(`Mês/Ano: ${mes}/${ano}`, margin - deslocamentoEsquerda)
                .moveDown();






            const tableTop = doc.y;
            const headers = ['Data', 'Entrada', 'Saída', 'Horas Normais', 'Horas Extras', 'Justificativa'];
            doc.fontSize(10).font('Helvetica-Bold');
            headers.forEach((header, i) => doc.text(header, margin + i * colWidth, tableTop, { width: colWidth, align: 'center' }));
            doc.moveTo(margin, tableTop + rowHeight - 5).lineTo(doc.page.width - margin, tableTop + rowHeight - 5).stroke();

            let y = tableTop + rowHeight;
            doc.font('Helvetica');
            registros.forEach(reg => {
                Object.values(reg).forEach((text, i) => doc.text(text, margin + i * colWidth, y, { width: colWidth, align: 'center' }));
                doc.moveTo(margin, y + rowHeight - 5).lineTo(doc.page.width - margin, y + rowHeight - 5).stroke();
                y += rowHeight;
            });

            doc.end();
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    },





    async gerarRelatorioPontosemPDF(req, res) {
        const { funcionario_id, mes, ano } = req.query;
        if (!funcionario_id || !mes || !ano) {
            return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
        }

        try {
            const query = `
        SELECT 
            rp.data_hora::DATE AS data, 
            rp.hora_entrada, 
            rp.hora_saida, 
            rp.horas_normais, 
            rp.hora_extra, 
            rp.hora_desconto,
            rp.total_trabalhado,
            f.nome AS funcionario_nome, 
            f.data_admissao, 
            f.cargo, 
            f.matricula, 
            f.tipo_escala,
            f.cpf,
            f.email,
            u.nome AS unidade_nome
        FROM Registros_Ponto rp
        INNER JOIN funcionarios f ON rp.funcionario_id = f.id
        INNER JOIN unidades u ON rp.unidade_id = u.id
        WHERE f.id = $1 AND EXTRACT(MONTH FROM rp.data_hora) = $2 AND EXTRACT(YEAR FROM rp.data_hora) = $3
        ORDER BY rp.data_hora ASC
    `;

            const result = await db.query(query, [funcionario_id, mes, ano]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado.' });
            }

            const funcionario = result.rows[0];

            // Totais
            let totalHorasNormais = 0;
            let totalHorasExtras = 0;
            let totalHorasDesconto = 0;

            // Função para converter interval (objeto) em string "HH:mm:ss"
            function intervalToString(interval) {
                if (!interval) return '--';
                if (typeof interval === 'string') return interval; // Já pode estar como string dependendo do driver
                const h = String(interval.hours || 0).padStart(2, '0');
                const m = String(interval.minutes || 0).padStart(2, '0');
                const s = String(interval.seconds || 0).padStart(2, '0');
                return `${h}:${m}:${s}`;
            }

            const registros = result.rows.map(row => {
                // Converte os campos interval do Postgres para string
                const horas_normais = intervalToString(row.total_trabalhado);
                const horas_extras = intervalToString(row.hora_extra);
                const horas_desconto = intervalToString(row.hora_desconto);

                totalHorasNormais += timeToDecimal(horas_normais);
                totalHorasExtras += timeToDecimal(horas_extras);
                totalHorasDesconto += timeToDecimal(horas_desconto);

                return {
                    data: format(new Date(row.data), 'dd/MM/yyyy'),
                    hora_entrada: row.hora_entrada || '--',
                    hora_saida: row.hora_saida || '--',
                    horas_normais: horas_normais,
                    horas_extras: horas_extras,
                    horas_desconto: horas_desconto,
                    justificativa: ' ',
                };
            });

            return res.status(200).json({
                funcionario: {
                    nome: funcionario.funcionario_nome,
                    matricula: funcionario.matricula,
                    cargo: funcionario.cargo,
                    tipo_escala: funcionario.tipo_escala,
                    unidade_nome: funcionario.unidade_nome,
                    mes_ano: `${mes}/${ano}`,
                },
                totais: {
                    total_total_trabalhado: decimalToHora(totalHorasNormais),
                    total_horas_extras: decimalToHora(totalHorasExtras),
                    total_horas_desconto: decimalToHora(totalHorasDesconto),
                },
                registros,
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }
}

// Função utilitária:
function timeToDecimal(timeStr) {
    if (!timeStr || timeStr === '--' || timeStr === '00:00:00') return 0;
    const [h, m, s] = timeStr.split(':').map(Number);
    return h + m / 60 + s / 3600;
}

function decimalToHora(decimal) {
    if (!decimal) return '--';
    const horas = Math.floor(decimal);
    const minutos = Math.floor((decimal - horas) * 60);
    const segundos = Math.round((((decimal - horas) * 60) - minutos) * 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}