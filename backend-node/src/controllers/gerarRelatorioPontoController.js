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
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado.' });
            }

            const funcionario = result.rows[0];

            // Totais
            let totalHorasNormais = 0;
            let totalHorasExtras = 0;
            let totalHorasDesconto = 0;

            const registros = result.rows.map(row => {
                const baseDate = '1970-01-01';
                const horaEntrada = new Date(`${baseDate}T${row.hora_entrada}Z`);
                const horaSaida = new Date(`${baseDate}T${row.hora_saida}Z`);
                let horasExtras = 0, horasDesconto = 0;
                let justificativa = '';

                // Jornada esperada com base na escala
                let jornadaFim = new Date(horaEntrada);
                const jornadas = {
                    '8h': 17, '12h': 19, '16h': 22, '24h': 24,
                    '12x36': 19, '24x72': 31, '32h': 16, '20h': 16
                };
                const fimHora = jornadas[row.tipo_escala];
                if (fimHora) jornadaFim.setHours(fimHora, 0, 0);

                // Comparação para horas extras ou desconto
                if (horaSaida > jornadaFim) {
                    horasExtras = differenceInMinutes(horaSaida, jornadaFim) / 60;
                    justificativa = 'Horas extras';
                } else if (horaSaida < jornadaFim) {
                    horasDesconto = differenceInMinutes(jornadaFim, horaSaida) / 60;
                    justificativa = 'Saída antecipada';
                }

                const horasNormais = parseFloat(row.total_trabalhado || '0.00');
                totalHorasNormais += horasNormais;
                totalHorasExtras += horasExtras;
                totalHorasDesconto += horasDesconto;

                return {
                    data: format(new Date(row.data), 'dd/MM/yyyy'),
                    hora_entrada: (row.hora_entrada && row.hora_entrada !== '00:00:00') ? formatarHora(row.hora_entrada) : '--',
                    hora_saida: (row.hora_saida && row.hora_saida !== '00:00:00') ? formatarHora(row.hora_saida) : '--',
                    horas_normais: formatarDecimalParaHoraOuTracos(horasNormais),
                    horas_extras: formatarDecimalParaHoraOuTracos(horasExtras),
                    horas_desconto: formatarDecimalParaHoraOuTracos(horasDesconto),


                    justificativa: justificativa || '--',
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
                    total_total_trabalhado: totalHorasNormais.toFixed(2),
                    total_horas_extras: totalHorasExtras.toFixed(2),
                    total_horas_desconto: totalHorasDesconto.toFixed(2),
                },
                registros,
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }




};

// Formatar horas decimais para "HH:mm:ss" ou retorna "--" 

function formatarDecimalParaHoraOuTracos(valorDecimal) {
    if (!valorDecimal || isNaN(valorDecimal)) return '--';

    const totalSegundos = Math.floor(valorDecimal * 3600);
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    const horaFormatada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    // Se for igual a 00:00:00, retorna '--'
    return horaFormatada === '00:00:00' ? '--' : horaFormatada;
}

