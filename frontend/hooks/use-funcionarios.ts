"use client"

import { useState, useEffect, useMemo } from "react"
import { api } from "@/lib/api"

export type Funcionario = {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  unidade_id?: number; // <-- ADICIONADO
  unidade_nome?: string;
  matricula?: number;
  data_admissao?: string;
  secretaria_id?: number;
};

export function useFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        setLoading(true)
        const response = await api.get("/funci/funcionarios")
        setFuncionarios(response.data) // Certifique-se que response.data tem unidade_id
        setError(null)
      } catch (err) {
        console.error("Erro ao buscar funcionários:", err)
        setError("Não foi possível carregar os funcionários.")
      } finally {
        setLoading(false)
      }
    }

    fetchFuncionarios()
  }, [])

  const searchFuncionarios = useMemo(() => {
    return (searchTerm: string) => {
      if (!searchTerm.trim()) return []

      return funcionarios.filter((funcionario) => funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    }
  }, [funcionarios])

  return {
    funcionarios,
    searchFuncionarios,
    loading,
    error,
  }
}