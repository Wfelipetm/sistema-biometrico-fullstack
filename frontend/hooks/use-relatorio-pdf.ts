"use client"

import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

type RegistroRelatorio = {
  data: string
  hora_entrada: string
  hora_saida: string
  horas_normais: string
  horas_extras: string
  horas_desconto: string
  justificativa: string
}

type RelatorioData = {
  funcionario: {
    nome: string
    matricula: string
    cargo: string
    unidade_nome: string
    tipo_escala: string
    mes_ano: string
  }
  registros: RegistroRelatorio[]
  totais?: {
    total_horas_normais: string
    total_horas_extras: string
    total_horas_desconto: string
  }
}

const API_BASE_URL = "http://biometrico.itaguai.rj.gov.br:3001"

export function useRelatorioPDF() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gerarRelatorioPDF = async (funcionarioId: string, mes: string, ano: string) => {
    if (!funcionarioId) {
      toast.warning("Selecione um funcionário")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `${API_BASE_URL}/relat/relatoriosempdf?funcionario_id=${funcionarioId}&mes=${mes}&ano=${ano}`,
      )

      // Se não encontrar registros, mostra apenas o toast estilizado
      if (!response.ok) {
        toast.warning("Nenhum registro encontrado para o funcionário e período selecionados. Verifique a data informada!")
        return
      }

      const data: RelatorioData = await response.json()

      if (!data?.funcionario || !data?.registros || !Array.isArray(data.registros) || data.registros.length === 0) {
        toast.warning("Nenhum registro encontrado para o funcionário e período selecionados. Verifique a data informada!")
        return
      }

      // Ordenar registros por data
      const registrosOrdenados = data.registros.sort((a, b) => {
        const [diaA, mesA, anoA] = a.data.split("/").map(Number)
        const [diaB, mesB, anoB] = b.data.split("/").map(Number)
        const dateA = new Date(anoA, mesA - 1, diaA)
        const dateB = new Date(anoB, mesB - 1, diaB)
        return dateA.getTime() - dateB.getTime()
      })

      // Gerar PDF
      const doc = new jsPDF({ orientation: "landscape" })

      // Cabeçalho
      doc.setFontSize(16)
      doc.text(`Relatório de Ponto - ${data.funcionario.nome}`, 14, 20)

      doc.setFontSize(12)
      doc.text(`Matrícula: ${data.funcionario.matricula}`, 14, 30)
      doc.text(`Cargo: ${data.funcionario.cargo}`, 14, 37)
      doc.text(`Unidade: ${data.funcionario.unidade_nome}`, 14, 44)
      doc.text(`Escala: ${data.funcionario.tipo_escala}`, 14, 51)
      doc.text(`Período: ${data.funcionario.mes_ano}`, 14, 58)

      // Tabela
      autoTable(doc, {
        startY: 65,
        head: [["Data", "Entrada", "Saída", "H. Normais", "H. Extras", "H. Desconto", "Justificativa"]],
        body: registrosOrdenados.map((registro) => [
          registro.data,
          registro.hora_entrada,
          registro.hora_saida,
          registro.horas_normais,
          registro.horas_extras,
          registro.horas_desconto,
          registro.justificativa,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
      })

      // Totais
      const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } }
      const posY = docWithAutoTable.lastAutoTable?.finalY ?? 70

      if (data.totais) {
        doc.setFontSize(10)
        doc.text(
          `Totais - Normais: ${data.totais.total_horas_normais} | Extras: ${data.totais.total_horas_extras} | Desconto: ${data.totais.total_horas_desconto}`,
          14,
          posY + 10,
        )
      }

      // Salvar PDF
      const fileName = `relatorio_${data.funcionario.matricula}_${mes.padStart(2, "0")}_${ano}.pdf`
      doc.save(fileName)
    } catch (err) {
      // Erro inesperado: mostra toast genérico, não erro do servidor
      toast.warning("Nenhum registro encontrado para o funcionário e período selecionados. Verifique a data informada!")
    } finally {
      setLoading(false)
    }
  }

  return {
    gerarRelatorioPDF,
    loading,
    error,
  }
}