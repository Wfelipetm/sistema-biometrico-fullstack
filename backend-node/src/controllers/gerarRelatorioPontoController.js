const PDFDocument = require('pdfkit');
const { format, differenceInMinutes } = require('date-fns');
const db = require('../config/db');

const formatarHora = (hora) => {
    if (!hora) return '00:00:00';
    const partes = hora.split(':');
    return [partes[0].padStart(2, '0'), partes[1]?.padStart(2, '0') || '00', partes[2]?.padStart(2, '0') || '00'].join(':');
};

module.exports = {

    // Endpoint para gerar relatório de ponto
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
                WHERE f.id = $1 AND f.status = 1 AND EXTRACT(MONTH FROM rp.data_hora) = $2 AND EXTRACT(YEAR FROM rp.data_hora) = $3
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
    // Endpoint para gerar relatório de ponto sem PDF
    async gerarRelatorioPontosemPDF(req, res) {
        const { funcionario_id, mes, ano } = req.query;
        if (!funcionario_id || !mes || !ano) {
            return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes.' });
        }

        try {
            // Query para buscar registros de ponto
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
            WHERE f.id = $1 AND f.status = 1 AND EXTRACT(MONTH FROM rp.data_hora) = $2 AND EXTRACT(YEAR FROM rp.data_hora) = $3
            ORDER BY rp.data_hora ASC
        `;

            const result = await db.query(query, [funcionario_id, mes, ano]);

            // Query para buscar férias do funcionário
            const feriasQuery = `
            SELECT data_inicio, data_fim 
            FROM ferias 
            WHERE funcionario_id = $1 AND 
                  ((EXTRACT(MONTH FROM data_inicio) = $2 AND EXTRACT(YEAR FROM data_inicio) = $3) OR
                   (EXTRACT(MONTH FROM data_fim) = $2 AND EXTRACT(YEAR FROM data_fim) = $3))
        `;
            const feriasResult = await db.query(feriasQuery, [funcionario_id, mes, ano]);
            const ferias = feriasResult.rows;

            // Função para verificar se uma data está dentro do período de férias
            const isFerias = (data) => {
                return ferias.some(f => {
                    const inicio = new Date(f.data_inicio);
                    const fim = new Date(f.data_fim);
                    return data >= inicio && data <= fim;
                });
            };

            // Query para buscar afastamentos do funcionário
            const afastamentosQuery = `
    SELECT data_inicio, data_fim, motivo 
    FROM afastamentos 
    WHERE funcionario_id = $1 AND 
          ((EXTRACT(MONTH FROM data_inicio) = $2 AND EXTRACT(YEAR FROM data_inicio) = $3) OR
           (EXTRACT(MONTH FROM data_fim) = $2 AND EXTRACT(YEAR FROM data_fim) = $3))
`;
            const afastamentosResult = await db.query(afastamentosQuery, [funcionario_id, mes, ano]);
            const afastamentos = afastamentosResult.rows;

            // Função para verificar se uma data está dentro do período de afastamento e retornar o motivo
            const getMotivoAfastamento = (data) => {
                const afastamento = afastamentos.find(a => {
                    const inicio = new Date(a.data_inicio);
                    const fim = new Date(a.data_fim);
                    return data >= inicio && data <= fim;
                });
                return afastamento ? afastamento.motivo : null;
            };

            // Gerar todas as datas do mês
            const diasNoMes = new Date(ano, mes, 0).getDate();
            const todasAsDatas = Array.from({ length: diasNoMes }, (_, i) => {
                const dia = i + 1;
                return new Date(ano, mes - 1, dia);
            });

            // Mapear registros existentes
            const registrosMap = new Map(result.rows.map(row => [row.data.toISOString().split('T')[0], row]));

            // Totais em segundos
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

            // Construir registros para o mês inteiro
            const registros = todasAsDatas.map(data => {
                const dataISO = data.toISOString().split('T')[0];
                const registro = registrosMap.get(dataISO);

                const motivoAfastamento = getMotivoAfastamento(data);
                const justificativa = motivoAfastamento || (isFerias(data) ? 'Férias' : '--');

                if (registro) {
                    const horas_normais = intervalToString(registro.horas_normais);
                    const horas_extras = intervalToString(registro.hora_extra);
                    const horas_desconto = intervalToString(registro.hora_desconto);

                    if (horas_normais !== '--') totalHorasNormais += timeToSeconds(horas_normais);
                    if (horas_extras !== '--') totalHorasExtras += timeToSeconds(horas_extras);
                    if (horas_desconto !== '--') totalHorasDesconto += timeToSeconds(horas_desconto);

                    return {
                        data: format(data, 'dd/MM/yyyy'),
                        hora_entrada: registro.hora_entrada || '--',
                        hora_saida: registro.hora_saida || '--',
                        horas_normais,
                        horas_extras,
                        horas_desconto,
                        justificativa,
                    };
                } else {
                    return {
                        data: format(data, 'dd/MM/yyyy'),
                        hora_entrada: '--',
                        hora_saida: '--',
                        horas_normais: '--',
                        horas_extras: '--',
                        horas_desconto: '--',
                        justificativa,
                    };
                }
            });

            // Dados do funcionário
            const funcionario = result.rows[0];

            // Calcular horas ajustadas após compensação
            let horasExtrasAjustadas = totalHorasExtras;
            let horasDescontoAjustadas = totalHorasDesconto;

            if (totalHorasExtras > 0 && totalHorasDesconto > 0) {
                const saldoHoras = totalHorasExtras - totalHorasDesconto;

                if (saldoHoras >= 0) {
                    // Tem mais extras que descontos
                    horasExtrasAjustadas = saldoHoras;
                    horasDescontoAjustadas = 0;
                } else {
                    // Tem mais descontos que extras
                    horasExtrasAjustadas = 0;
                    horasDescontoAjustadas = Math.abs(saldoHoras);
                }
            }

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
                    total_horas_normais: totalHorasNormais > 0 ? secondsToHora(totalHorasNormais) : '--',
                    total_horas_extras: totalHorasExtras > 0 ? secondsToHora(totalHorasExtras) : '--',
                    total_horas_desconto: totalHorasDesconto > 0 ? secondsToHora(totalHorasDesconto) : '--',
                    total_horas_extras_ajustada: horasExtrasAjustadas > 0 ? secondsToHora(horasExtrasAjustadas) : '00:00:00',
                    total_horas_desconto_ajustada: horasDescontoAjustadas > 0 ? secondsToHora(horasDescontoAjustadas) : '00:00:00',
                },
                registros,
            });
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    },

    // Endpoint para relatório por unidade sem PDF
    async gerarRelatorioPorunidadesemPDF(req, res) {
        const { unidade_id, mes, ano } = req.query;
        if (!unidade_id || !mes || !ano) {
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
                    u.nome AS unidade_nome,
                    f.id AS funcionario_id
                FROM Registros_Ponto rp
                INNER JOIN funcionarios f ON rp.funcionario_id = f.id
                INNER JOIN unidades u ON rp.unidade_id = u.id
                WHERE rp.unidade_id = $1
                  AND f.status = 1
                  AND EXTRACT(MONTH FROM rp.data_hora) = $2
                  AND EXTRACT(YEAR FROM rp.data_hora) = $3
                ORDER BY f.nome, rp.data_hora ASC
            `;

            const result = await db.query(query, [unidade_id, mes, ano]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Nenhum registro encontrado para a unidade no período selecionado.' });
            }

            // Buscar nome da unidade
            const unidadeNome = result.rows[0].unidade_nome;

            // Query para buscar férias de todos os funcionários da unidade
            const feriasQuery = `
                SELECT funcionario_id, data_inicio, data_fim 
                FROM ferias 
                WHERE funcionario_id IN (
                    SELECT DISTINCT f.id
                    FROM funcionarios f
                    WHERE f.unidade_id = $1
                )
                  AND (
                      (EXTRACT(MONTH FROM data_inicio) = $2 AND EXTRACT(YEAR FROM data_inicio) = $3) OR
                      (EXTRACT(MONTH FROM data_fim) = $2 AND EXTRACT(YEAR FROM data_fim) = $3)
                  )
            `;
            const feriasResult = await db.query(feriasQuery, [unidade_id, mes, ano]);
            const feriasMap = new Map();
            feriasResult.rows.forEach(f => {
                if (!feriasMap.has(f.funcionario_id)) {
                    feriasMap.set(f.funcionario_id, []);
                }
                feriasMap.get(f.funcionario_id).push({
                    inicio: new Date(f.data_inicio),
                    fim: new Date(f.data_fim),
                });
            });

            // Query para buscar afastamentos de todos os funcionários da unidade
            const afastamentosQuery = `
                SELECT funcionario_id, data_inicio, data_fim, motivo 
                FROM afastamentos 
                WHERE funcionario_id IN (
                    SELECT DISTINCT f.id
                    FROM funcionarios f
                    WHERE f.unidade_id = $1
                )
                  AND (
                      (EXTRACT(MONTH FROM data_inicio) = $2 AND EXTRACT(YEAR FROM data_inicio) = $3) OR
                      (EXTRACT(MONTH FROM data_fim) = $2 AND EXTRACT(YEAR FROM data_fim) = $3)
                  )
            `;
            const afastamentosResult = await db.query(afastamentosQuery, [unidade_id, mes, ano]);
            const afastamentosMap = new Map();
            afastamentosResult.rows.forEach(a => {
                if (!afastamentosMap.has(a.funcionario_id)) {
                    afastamentosMap.set(a.funcionario_id, []);
                }
                afastamentosMap.get(a.funcionario_id).push({
                    inicio: new Date(a.data_inicio),
                    fim: new Date(a.data_fim),
                    motivo: a.motivo
                });
            });

            // Função para verificar se uma data está dentro do período de férias
            const isFerias = (funcionarioId, data) => {
                const ferias = feriasMap.get(funcionarioId) || [];
                return ferias.some(f => data >= f.inicio && data <= f.fim);
            };

            // Função para verificar se uma data está dentro do período de afastamento e retornar o motivo
            const getMotivoAfastamento = (funcionarioId, data) => {
                const afastamentos = afastamentosMap.get(funcionarioId) || [];
                const afastamento = afastamentos.find(a => data >= a.inicio && data <= a.fim);
                return afastamento ? afastamento.motivo : null;
            };

            // Gerar todas as datas do mês
            const diasNoMes = new Date(ano, mes, 0).getDate();
            const todasAsDatas = Array.from({ length: diasNoMes }, (_, i) => {
                const dia = i + 1;
                return new Date(ano, mes - 1, dia);
            });

            // Agrupar registros por funcionário
            const funcionariosMap = new Map();

            result.rows.forEach(row => {
                const funcionarioId = row.funcionario_id;

                if (!funcionariosMap.has(funcionarioId)) {
                    funcionariosMap.set(funcionarioId, {
                        funcionario: {
                            id: funcionarioId,
                            nome: row.funcionario_nome,
                            matricula: row.matricula,
                            cargo: row.cargo,
                            tipo_escala: row.tipo_escala,
                            unidade_nome: row.unidade_nome,
                            mes_ano: `${mes}/${ano}`
                        },
                        totais: {
                            total_horas_normais: 0,
                            total_horas_extras: 0,
                            total_horas_desconto: 0
                        },
                        registros: []
                    });
                }

                const funcionarioData = funcionariosMap.get(funcionarioId);

                // Converter os intervalos em strings legíveis
                const horas_normais = intervalToString(row.horas_normais);
                const horas_extras = intervalToString(row.hora_extra);
                const horas_desconto = intervalToString(row.hora_desconto);

                // Acumular totais para este funcionário
                if (horas_normais !== '--') {
                    funcionarioData.totais.total_horas_normais += timeToSeconds(horas_normais);
                }
                if (horas_extras !== '--') {
                    funcionarioData.totais.total_horas_extras += timeToSeconds(horas_extras);
                }
                if (horas_desconto !== '--') {
                    funcionarioData.totais.total_horas_desconto += timeToSeconds(horas_desconto);
                }

                // Adicionar registro ao funcionário
                funcionarioData.registros.push({
                    data: format(new Date(row.data), 'dd/MM/yyyy'),
                    hora_entrada: row.hora_entrada || '--',
                    hora_saida: row.hora_saida || '--',
                    horas_normais,
                    horas_extras,
                    horas_desconto,
                    justificativa: ' '
                });
            });

            // Preencher dias sem registros para cada funcionário
            for (const [funcionarioId, funcionarioData] of funcionariosMap.entries()) {
                const registrosMap = new Map(funcionarioData.registros.map(r => [r.data, r]));

                todasAsDatas.forEach(data => {
                    const dataFormatada = format(data, 'dd/MM/yyyy');
                    if (!registrosMap.has(dataFormatada)) {
                        const motivoAfastamento = getMotivoAfastamento(funcionarioId, data);
                        let justificativa = '--';

                        if (motivoAfastamento) {
                            justificativa = motivoAfastamento;
                        } else if (isFerias(funcionarioId, data)) {
                            justificativa = 'Férias';
                        }

                        funcionarioData.registros.push({
                            data: dataFormatada,
                            hora_entrada: '--',
                            hora_saida: '--',
                            horas_normais: '--',
                            horas_extras: '--',
                            horas_desconto: '--',
                            justificativa,
                        });
                    }
                });

                // Ordenar registros por data
                funcionarioData.registros.sort((a, b) => new Date(a.data) - new Date(b.data));

                // Calcular horas ajustadas após compensação
                const totalSegundosNormais = funcionarioData.totais.total_horas_normais;
                const totalSegundosExtras = funcionarioData.totais.total_horas_extras;
                const totalSegundosDesconto = funcionarioData.totais.total_horas_desconto;

                let horasExtrasAjustadas = totalSegundosExtras;
                let horasDescontoAjustadas = totalSegundosDesconto;

                if (totalSegundosExtras > 0 && totalSegundosDesconto > 0) {
                    const saldoHoras = totalSegundosExtras - totalSegundosDesconto;

                    if (saldoHoras >= 0) {
                        // Tem mais extras que descontos
                        horasExtrasAjustadas = saldoHoras;
                        horasDescontoAjustadas = 0;
                    } else {
                        // Tem mais descontos que extras
                        horasExtrasAjustadas = 0;
                        horasDescontoAjustadas = Math.abs(saldoHoras);
                    }
                }

                // Converter totais de segundos para formato de hora
                funcionarioData.totais.total_horas_normais = totalSegundosNormais > 0
                    ? secondsToHora(totalSegundosNormais)
                    : '--';

                funcionarioData.totais.total_horas_extras = totalSegundosExtras > 0
                    ? secondsToHora(totalSegundosExtras)
                    : '--';

                funcionarioData.totais.total_horas_desconto = totalSegundosDesconto > 0
                    ? secondsToHora(totalSegundosDesconto)
                    : '--';

                funcionarioData.totais.total_horas_extras_ajustada = horasExtrasAjustadas > 0
                    ? secondsToHora(horasExtrasAjustadas)
                    : '00:00:00';

                funcionarioData.totais.total_horas_desconto_ajustada = horasDescontoAjustadas > 0
                    ? secondsToHora(horasDescontoAjustadas)
                    : '00:00:00';
            }

            // Preparar a resposta com todos os funcionários
            const response = {
                unidade: {
                    id: unidade_id,
                    nome: unidadeNome
                },
                periodo: {
                    mes,
                    ano
                },
                funcionarios: Array.from(funcionariosMap.values())
            };

            return res.status(200).json(response);

        } catch (error) {
            console.error('Erro ao gerar relatório por unidade:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }
}



// Função auxiliar para converter interval para string
function intervalToString(interval) {
    if (!interval) return '--';
    if (typeof interval === 'string') return interval;
    const h = String(interval.hours || 0).padStart(2, '0');
    const m = String(interval.minutes || 0).padStart(2, '0');
    const s = String(interval.seconds || 0).padStart(2, '0');
    return `${h}:${m}:${s}`;
}
function timeToSeconds(timeStr) {
    if (!timeStr || timeStr === '--' || timeStr === '00:00:00') return 0;
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60 + s;
}
function secondsToHora(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}