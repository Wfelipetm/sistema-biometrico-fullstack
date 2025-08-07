"use client"

import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import { getDay, format as formatDateFns, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RelatorioData, RegistroRelatorio, decimalToHHMMSS } from "./relatorio-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


const API_BASE_URL = `${API_URL}`
export function useRelatorioPDFtodos() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Variáveis de configuração do PDF
    const logoBase64 = "data:image/png;base64,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";
    const primaryColor: [number, number, number] = [0, 102, 175];
    const whiteColor: [number, number, number] = [255, 255, 255];
    const lightGrayColor: [number, number, number] = [240, 240, 240];
    const darkGrayColor: [number, number, number] = [80, 80, 80];

    // Agora para múltiplos funcionários
    const gerarRelatorioPDF = async (unidadeId: string, mes: string, ano: string) => {
        console.log('[PDF-TODOS] Iniciando geração de PDF ÚNICO', { unidadeId, mes, ano });
        if (!unidadeId) {
            toast.warning("Selecione uma unidade")
            console.warn('[PDF-TODOS] Unidade não informada');
            return
        }
        setLoading(true)
        setError(null)
        try {
            // Busca dados da unidade
            const url = `${API_BASE_URL}/relat/relatorio-unidade-sempdf?unidade_id=${unidadeId}&mes=${mes}&ano=${ano}`;
            console.log('[PDF-TODOS] Buscando dados da unidade:', url);
            const response = await fetch(url)
            if (!response.ok) {
                toast.warning("Nenhum registro encontrado para a unidade e período selecionados. Verifique a data informada!")
                console.warn('[PDF-TODOS] Resposta não OK', response.status, response.statusText);
                return
            }
            // Espera um array de relatórios
            const resposta = await response.json();
            console.log('[PDF-TODOS] Dados recebidos:', resposta);
            const relatorios: RelatorioData[] = resposta.funcionarios || [];
            if (!Array.isArray(relatorios) || relatorios.length === 0) {
                toast.warning("Nenhum registro encontrado para a unidade e período selecionados. Verifique a data informada!")
                console.warn('[PDF-TODOS] Nenhum relatório encontrado');
                return;
            }
            // Cria UM PDF único
            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            let isFirst = true;
            for (const data of relatorios) {
                if (!data?.funcionario || !Array.isArray(data.registros)) {
                    console.warn('[PDF-TODOS] Dados de funcionário ou registros inválidos', data);
                    continue;
                }
                if (!isFirst) doc.addPage();
                isFirst = false;
                console.log('[PDF-TODOS] Adicionando folha para funcionário', data.funcionario.matricula, data.funcionario.nome);
                // ...restante do código de geração de cada folha permanece igual...
                const diasNoMes = new Date(Number(ano), Number(mes), 0).getDate();
                const registrosMap = new Map(
                    data.registros.map((registro) => [registro.data, registro])
                );
                const registrosCompletos: RegistroRelatorio[] = Array.from({ length: diasNoMes }, (_, index) => {
                    const dia = (index + 1).toString().padStart(2, "0");
                    const mesFormatado = mes.padStart(2, "0");
                    const dataCompleta = `${dia}/${mesFormatado}/${ano}`;
                    const dataCompacta = `${dia}/${mesFormatado}`;
                    const registro = registrosMap.get(dataCompleta);
                    return {
                        data: dataCompacta,
                        hora_entrada: registro?.hora_entrada || "--",
                        hora_saida: registro?.hora_saida || "--",
                        horas_normais: registro?.horas_normais || "--",
                        horas_extras: registro?.horas_extras || "--",
                        horas_desconto: registro?.horas_desconto || "--",
                        justificativa: registro?.justificativa || "",
                    };
                });
                // Gerar folha para cada funcionário (código igual, mas usando o mesmo doc)
                try {
                    const margin = 5;
                    const pageWidth = doc.internal.pageSize.width;
                    const pageHeight = doc.internal.pageSize.height;
                    const usableWidth = pageWidth - margin * 2;
                    const usableHeight = pageHeight - margin * 2;

                    const headerMargin = 5
                    const headerWidth = pageWidth - headerMargin * 2

                    doc.setFillColor(...primaryColor)
                    doc.rect(headerMargin, 0, headerWidth, 20, "F")
                    if (logoBase64) {
                        doc.addImage(logoBase64, "PNG", margin + 4, 3, 12, 14) // x, y, largura, altura
                    }

                    doc.setTextColor(...whiteColor)
                    doc.setFontSize(12)
                    doc.setFont("helvetica", "bold")
                    doc.text("RELATÓRIO DE PONTO", margin + 18, 10)

                    doc.setFontSize(8)
                    doc.setFont("helvetica", "normal")
                    doc.text("Sistema de Controle de Ponto Biométrico", margin + 18, 14)

                    doc.setFontSize(7)
                    const today = formatDateFns(new Date(), "dd/MM/yyyy, HH:mm")
                    doc.text(`Emitido em: ${today}`, pageWidth - margin - 45, 9)

                    doc.setFontSize(9)
                    doc.setFont("helvetica", "bold")
                    doc.text("PREFEITURA DE ITAGUAÍ", pageWidth - margin - 45, 14)

                    doc.setFillColor(...lightGrayColor)
                    doc.rect(margin, 20.5, usableWidth, 14, "F")

                    doc.setTextColor(...darkGrayColor)
                    doc.setFontSize(8)
                    doc.setFont("helvetica", "bold")
                    doc.text("Informações do Funcionário", margin + 5, 25)

                    doc.setFontSize(7)
                    doc.setFont("helvetica", "normal")
                    doc.text(`Nome: ${data.funcionario.nome.toUpperCase()}`, margin + 5, 29)
                    doc.text(`Matrícula: ${data.funcionario.matricula}`, margin + 80, 25)
                    doc.text(`Cargo: ${data.funcionario.cargo}`, margin + 120, 25)
                    doc.text(`Unidade: ${data.funcionario.unidade_nome}`, margin + 180, 29)
                    doc.text(`Escala: ${data.funcionario.tipo_escala}`, margin + 80, 29)
                    doc.text(`Referência: ${data.funcionario.mes_ano}`, margin + 120, 29)

                    // Tabela com todos os dias
                    const diasDaSemana = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]

                    const tableStartY = 33
                    const rowCount = registrosCompletos.length + 1
                    const availableHeight = pageHeight - tableStartY - 30
                    const rowHeight = Math.min(5, availableHeight / rowCount)

                    autoTable(doc, {
                        startY: tableStartY,
                        head: [
                            [
                                { content: "Data", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Dia", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Entrada", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Saída", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Horas Normais", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Horas Extras", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Descontos", styles: { fontStyle: "bold", halign: "center" } },
                                { content: "Justificativa", styles: { fontStyle: "bold", halign: "center" } },
                            ],
                        ],
                        body: registrosCompletos.map((registro) => {
                            const dataCompleta = parse(registro.data + "/" + ano, "dd/MM/yyyy", new Date())
                            const diaSemana = formatDateFns(dataCompleta, "EEEE", { locale: ptBR })

                            const isWeekend = getDay(dataCompleta) === 0 || getDay(dataCompleta) === 6
                            const cinza: [number, number, number] | undefined = isWeekend ? [245, 245, 255] : undefined

                            return [
                                {
                                    content: registro.data, styles: {
                                        halign: "center", fontStyle: registro.data ? "bold" : "normal",
                                        textColor: registro.data ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: diaSemana, styles: {
                                        halign: "center", fontStyle: diaSemana ? "bold" : "normal",
                                        textColor: diaSemana ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.hora_entrada, styles: {
                                        halign: "center", fontStyle: registro.hora_entrada ? "bold" : "normal",
                                        textColor: registro.hora_entrada ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.hora_saida, styles: {
                                        halign: "center", fontStyle: registro.hora_saida ? "bold" : "normal",
                                        textColor: registro.hora_saida ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.horas_normais, styles: {
                                        halign: "center", fontStyle: registro.horas_normais ? "bold" : "normal",
                                        textColor: registro.horas_normais ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.horas_extras, styles: {
                                        halign: "center", fontStyle: registro.horas_extras ? "bold" : "normal",
                                        textColor: registro.horas_extras ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.horas_desconto, styles: {
                                        halign: "center", fontStyle: registro.horas_desconto ? "bold" : "normal",
                                        textColor: registro.horas_desconto ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.justificativa || "--", styles: {
                                        halign: "center", fontStyle: registro.justificativa ? "bold" : "normal",
                                        textColor: registro.justificativa ? [0, 0, 0] : [150, 150, 150],
                                    }
                                },
                                {
                                    content: registro.horas_normais !== "--" ? registro.horas_normais : "--", styles: {
                                        halign: "center", fontStyle: registro.horas_normais ? "bold" : "normal",
                                        textColor: registro.horas_normais ? [0, 0, 0] : [150, 150, 150],
                                    }
                                }, // simplificação
                            ]
                        }),
                        theme: "grid",
                        styles: {
                            fontSize: 7,
                            cellPadding: 0.5,
                            minCellHeight: rowHeight,
                            valign: "middle",
                            lineColor: [220, 220, 220],
                            lineWidth: 0.1,
                        },
                        headStyles: {
                            fillColor: [0, 102, 175],
                            textColor: [255, 255, 255],
                            fontSize: 7,
                            halign: "center",
                        },
                        alternateRowStyles: {
                            fillColor: [250, 250, 255],
                        },
                        columnStyles: {
                            0: { cellWidth: usableWidth * 0.09 }, // Data
                            1: { cellWidth: usableWidth * 0.09 }, // Dia
                            2: { cellWidth: usableWidth * 0.09 }, // Entrada
                            3: { cellWidth: usableWidth * 0.09 }, // Saída
                            4: { cellWidth: usableWidth * 0.09 }, // Horas Normais
                            5: { cellWidth: usableWidth * 0.09 }, // Horas Extras
                            6: { cellWidth: usableWidth * 0.09 }, // Descontos
                            7: { cellWidth: usableWidth * 0.37 }, // Justificativa
                            // 8: { cellWidth: usableWidth * 0.09 }, // Total Trabalhado
                        },
                        margin: { left: margin, right: margin },
                        pageBreak: "avoid",
                    })

                    const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } }
                    const posY = docWithAutoTable.lastAutoTable?.finalY ?? 70

                    // Totais
                    if (data.totais) {
                        const { total_total_trabalhado, total_horas_extras, total_horas_desconto } = data.totais;

                        doc.setFontSize(7);
                        doc.setTextColor(80, 80, 80);

                        doc.text(
                            `Horas Normais Total: ${total_total_trabalhado}   Horas Extras Total: ${total_horas_extras}   Horas Desconto Total: ${total_horas_desconto}`,
                            margin,
                            posY + 5,
                        );

                        const summaryData = [
                            [
                                { content: "Horas Normais Total", styles: { fontStyle: "bold" as const } },
                                { content: total_total_trabalhado, styles: { fontStyle: "bold" as const } },
                                { content: "Horas Extras Total", styles: { fontStyle: "bold" as const } },
                                { content: total_horas_extras, styles: { fontStyle: "bold" as const } },
                                { content: "Horas Desconto Total", styles: { fontStyle: "bold" as const } },
                                { content: total_horas_desconto, styles: { fontStyle: "bold" as const } },
                            ],
                        ];

                        autoTable(doc, {
                            startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 2,
                            head: [],
                            body: summaryData,
                            theme: "grid",
                            styles: {
                                fontSize: 8,
                                cellPadding: 1,
                                lineColor: primaryColor,
                                lineWidth: 0.1,
                            },
                            columnStyles: {
                                0: { fontStyle: "bold" as const, fillColor: [240, 240, 250] },
                                2: { fontStyle: "bold" as const, fillColor: [240, 240, 250] },
                                4: { fontStyle: "bold" as const, fillColor: [240, 240, 250] },
                            },
                            margin: { left: margin, right: margin },
                        })

                        // Frase de confirmação (logo abaixo)
                        doc.text(
                            "Conforme demonstrativo das marcações acima, que representam o ocorrido no respectivo período, estou de acordo:",
                            pageWidth / 2,
                            posY + 11,
                            { align: "center" },
                        )
                    }

                    const signatureY = (docWithAutoTable.lastAutoTable?.finalY ?? 70) + 12 // REDUCED
                    const leftSignX = pageWidth / 4
                    const rightSignX = (pageWidth / 4) * 3

                    doc.setDrawColor(...primaryColor)
                    doc.setLineWidth(0.5)
                    doc.line(leftSignX - 40, signatureY, leftSignX + 40, signatureY)
                    doc.line(rightSignX - 40, signatureY, rightSignX + 40, signatureY)

                    doc.setFontSize(7)
                    doc.text(data.funcionario.nome.toUpperCase(), leftSignX, signatureY + 4, { align: "center" })
                    doc.text("Assinatura e carimbo do superior", rightSignX, signatureY + 4, { align: "center" })

                    doc.setFillColor(...whiteColor)
                    doc.rect(0, pageHeight - 6, pageWidth, 6, "F")
                    doc.setTextColor(...primaryColor)
                    doc.setFontSize(7)
                    doc.text(
                        "Prefeitura Municipal de Itaguaí - Sistema de Controle de Ponto Biométrico. Desenvolvido por SMCTIC",
                        pageWidth / 2,
                        pageHeight - 3,
                        { align: "center" },
                    )
                } catch (pdfError) {
                    console.error('[PDF-TODOS] Erro ao gerar folha para funcionário', data.funcionario.matricula, pdfError);
                }
            }
            // Salva UM PDF único ao final
            const fileName = `relatorio_unidade_${unidadeId}_${mes.padStart(2, "0")}_${ano}.pdf`;
            console.log('[PDF-TODOS] Salvando PDF único', fileName);
            doc.save(fileName);
            console.log('[PDF-TODOS] PDF único salvo com sucesso', fileName);
            console.log('[PDF-TODOS] Finalizou geração do PDF único');
        } catch (err) {
            toast.warning("Nenhum registro encontrado para a unidade e período selecionados. Verifique a data informada!")
            console.error('[PDF-TODOS] Erro geral na geração de PDFs', err);
        } finally {
            setLoading(false)
            console.log('[PDF-TODOS] Finalizou função gerarRelatorioPDF', { unidadeId, mes, ano });
        }
    }
    return {
        gerarRelatorioPDF,
        loading,
        error,
    }
}