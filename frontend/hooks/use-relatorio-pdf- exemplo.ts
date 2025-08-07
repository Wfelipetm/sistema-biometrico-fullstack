"use client"

import { useState } from "react"
import { toast } from "sonner"

export function useRelatorioPDFtodo() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const gerarRelatorioUnidadePDF = async (
        unidadeId: string | number,
        mes: string,
        ano: string
    ) => {
        if (!unidadeId) {
            toast.warning("Selecione uma unidade")
            return
        }
        try {
            setIsLoading(true)
            setError(null)

            // ÚNICA URL utilizada
            const pdfUrl = `${process.env.NEXT_PUBLIC_API_URL}/relat/relatorio-unidade-sempdf?unidade_id=${unidadeId}&mes=${mes}&ano=${ano}`
            window.open(pdfUrl, '_blank')

            setIsLoading(false)
            toast.success("Relatório gerado com sucesso!")
        } catch (error) {
            console.error("[RelatorioUnidade] Erro ao gerar relatório:", error)
            setIsLoading(false)
            setError("Erro ao gerar relatório. Por favor, tente novamente.")
            toast.error("Erro ao gerar relatório. Por favor, tente novamente.")
        }
    }

    return {
        gerarRelatorioUnidadePDF,
        loading: isLoading,
        error,
    }
}
