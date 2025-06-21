"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, Calendar, FileText, Clock } from "lucide-react"
import { AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, type TooltipProps } from "recharts"
import type { NameType } from "recharts/types/component/DefaultTooltipContent"
import type { ValueType } from "tailwindcss/types/config"
import { Button } from "@/components/ui/button"
import CadastrarFeriasModal from "@/components/CadastrarFeriasModal"
import { toast } from "@/components/ui/toast-custom"
import { useAuth } from "@/contexts/AuthContext"
const API_URL = process.env.NEXT_PUBLIC_API_URL

type Unidade = {
  id: string
  nome: string
  localizacao: string
  foto: string
}

type Funcionario = {
  id: number
  nome: string
  cargo?: string
  data_admissao?: string
}

interface CustomPayload {
  name: string
  value: number
}
interface UltimosFuncionariosCadastrados {
  nome: string
  cargo: string
  matricula: number
}

interface FeriasSolicitadasPorUnidade {
  unidade_id: number
  nome_unidade: string
  total_ferias_solicitadas: string // vem como string do backend
}

export default function UnidadeDetalhesPage() {
  const { user } = useAuth(); // Adicione esta linha para acessar o papel do usuário
  const params = useParams()
  const id = params.id as string
  const [unidade, setUnidade] = useState<Unidade | null>(null)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFuncionarios: 0,
    presencaHoje: 0,
    feriasAgendadas: 0,
    horasFaltantes: 0,
  })
  const [dadosGrafico, setDadosGrafico] = useState<
    { dia: number; presentes: number; faltantes: number; ferias: number }[]
  >([])

  const [ultimosFuncionarios, setUltimosFuncionarios] = useState<UltimosFuncionariosCadastrados[]>([])
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [showCadastroFeriasModal, setShowCadastroFeriasModal] = useState(false)

  useEffect(() => {
    const fetchUltimosFuncionarios = async () => {
      try {
        const res = await api.get(`/unid/ultimos-funcionarios/${id}`)
        setUltimosFuncionarios(res.data)
      } catch (error) {
        console.error("Erro ao buscar últimos funcionários:", error)
        toast.error("Erro ao carregar funcionários", "Não foi possível carregar os últimos funcionários cadastrados.")
      }
    }

    if (id) {
      fetchUltimosFuncionarios()
    }
  }, [id])

  const atualizarDados = useCallback(async () => {
    console.log("Atualizando a página...")
    if (!id) return

    setIsLoading(true)
    try {
      const responseUnidade = await api.get(`/unid/unidade/${id}`)
      setUnidade(responseUnidade.data)

      const responseFuncionarios = await api.get(`/unid/${id}/funcionarios`)
      setFuncionarios(responseFuncionarios.data)
      const total = responseFuncionarios.data.length

      const responsePresencaMensal = await api.get(`/unid/unid/${id}/presencas-mensais`)
      const responseFeriasGrafico = await api.get(`/ferias/grafico/${id}`)

      const feriasPorDiaMap = new Map<number, number>()
      const getDiasEntre = (start: Date, end: Date) => {
        const dias: number[] = []
        const dt = new Date(start)
        while (dt <= end) {
          dias.push(dt.getDate())
          dt.setDate(dt.getDate() + 1)
        }
        return dias
      }

      for (const feria of responseFeriasGrafico.data as {
        status_ferias: string
        data_inicio: string
        data_fim: string
      }[]) {
        if (feria.status_ferias !== "aprovada") continue

        const start = new Date(feria.data_inicio)
        const end = new Date(feria.data_fim)
        const diasFerias = getDiasEntre(start, end)

        for (const dia of diasFerias) {
          feriasPorDiaMap.set(dia, (feriasPorDiaMap.get(dia) ?? 0) + 1)
        }
      }

      const dadosGraficoTransformado = responsePresencaMensal.data.map(
        (item: { total_registros: string; data: string }) => {
          const [diaStr] = item.data.split("/")
          const dia = Number.parseInt(diaStr, 10)
          const presentes = Number.parseInt(item.total_registros, 10) || 0

          const ferias = feriasPorDiaMap.get(dia) ?? 0
          // let faltantes = total - presentes - ferias
          // if (faltantes < 0) faltantes = 0

          return { dia, presentes, ferias }
        },
      )

      const responseFaltas = await api.get(`/unid/unidades/${id}/faltas`)
      const horasFaltantes = Number(responseFaltas.data[0]?.total_faltas ?? 0)

      const responsePresencasHoje = await api.get(`/unid/unid/${id}/registros-hoje`)
      const presencaHoje = Number(responsePresencasHoje.data?.total_registros_hoje ?? 0)

      const responseFerias = await api.get("/ferias/ferias-solicitadas/total")
      const feriasData: FeriasSolicitadasPorUnidade[] = responseFerias.data.dados
      const feriasDaUnidade = feriasData.find((f) => f.unidade_id === Number(id))
      const totalFerias = feriasDaUnidade ? Number(feriasDaUnidade.total_ferias_solicitadas) : 0

      setStats({
        totalFuncionarios: total,
        presencaHoje,
        feriasAgendadas: totalFerias,
        horasFaltantes,
      })
      setDadosGrafico(dadosGraficoTransformado)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados", "Não foi possível carregar as informações da unidade.")
      setUnidade(null)
      setFuncionarios([])
      setStats({
        totalFuncionarios: 0,
        presencaHoje: 0,
        feriasAgendadas: 0,
        horasFaltantes: 0,
      })
      setDadosGrafico([])
    } finally {
      setIsLoading(false)
    }
  }, [id])

  // -- >  atualizar quando o ID mudar
  useEffect(() => {
    if (id) atualizarDados()
  }, [id, atualizarDados])

  // -- >  atualizar quando o modal for fechado
  useEffect(() => {
    if (!showCadastroFeriasModal) {
      atualizarDados()
    }
  }, [showCadastroFeriasModal, atualizarDados])

  if (isLoading) return <div className="p-4">Carregando...</div>

  if (!unidade) {
    return <div className="p-4 text-center">Unidade não encontrada ou ocorreu um erro.</div>
  }

  function TooltipPersonalizado({ active, payload, label }: TooltipProps<ValueType, NameType>) {
    if (active && payload && payload.length) {
      const typedPayload = payload as unknown as CustomPayload[]

      const pres = typedPayload.find((p) => p.name === "presentes")?.value || 0
      // const falt = typedPayload.find((p) => p.name === "faltantes")?.value || 0
      const feri = typedPayload.find((p) => p.name === "ferias")?.value || 0

      return (
        <div className="bg-white p-2 rounded shadow border text-sm">
          <p className="text-muted-foreground">Dia {label}</p>
          <p className="text-primary font-semibold">Presentes: {pres}</p>
          {/* <p className="text-red-500 font-semibold">Faltantes: {falt}</p> */}
          <p className="text-green-500 font-semibold">Férias: {feri}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">Dashboard da Unidade</h1>
        </div>
        {user?.papel !== "gestor" && (
          <Button
            onClick={() => setShowCadastroFeriasModal(true)}
            className="bg-blue-500 text-white hover:bg-blue-700"
          >
            + Cadastrar Férias
          </Button>
        )}
      </div>

      <Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-blue-900">{unidade.nome}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Imagem da unidade */}
            <div className="flex-shrink-0">
              <img
                src={`${API_URL}/uploads/${unidade.foto}`}
                alt={unidade.nome}
                className="w-full h-[400px] rounded-md object-contain border shadow"
              />
            </div>
            {/* Últimos Funcionários Cadastrados */}
            {ultimosFuncionarios.length > 0 && (
              <Card className="w-full shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-blue-900">Últimos Funcionários Cadastrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {ultimosFuncionarios.slice(0, 4).map((funcionario) => (
                      <div key={funcionario.matricula} className="flex items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-medium">{funcionario.nome.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">{funcionario.nome}</p>
                            <p className="text-sm text-blue-700">{funcionario.cargo || "-"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Matrícula</p>
                          <p className="text-xs text-blue-700">{funcionario.matricula}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1º Card - Aura azul */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50 ring-2 ring-blue-100 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalFuncionarios}</div>
            <p className="text-xs text-blue-700">Ativos na unidade</p>
          </CardContent>
        </Card>

        {/* 2º Card - Aura azul */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50 ring-2 ring-blue-100 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Presença Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.presencaHoje}</div>
            <p className="text-xs text-blue-700">
              {stats.totalFuncionarios > 0 ? Math.round((stats.presencaHoje / stats.totalFuncionarios) * 100) : 0}% de presença
            </p>
          </CardContent>
        </Card>

        {/* 3º Card - Aura verde */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-green-400 hover:bg-green-50 ring-2 ring-green-100 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Férias Agendadas</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.feriasAgendadas}</div>
            <p className="text-xs text-blue-700">Próximos 30 dias</p>
          </CardContent>
        </Card>

        {/* 4º Card - Aura vermelha */}
        <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-red-400 hover:bg-red-50 ring-2 ring-red-100 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Horas Faltantes</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.horasFaltantes}h</div>
            <p className="text-xs text-blue-700">No mês atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras */}
      <h2 className="text-xl font-semibold text-blue-900">Gráfico Resumo</h2>
      <Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-blue-900">Presença de Funcionários no Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#1e3a8a" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#1e3a8a" }} />
                <Tooltip content={<TooltipPersonalizado />} />
                <Area type="monotone" dataKey="presentes" stroke="#0ea5e9" fill="#bae6fd" name="presentes" />
                {/* <Area type="monotone" dataKey="faltantes" stroke="#ef4444" fill="#fecaca" name="faltantes" /> */}
                <Area type="monotone" dataKey="ferias" stroke="#22c55e" fill="#bbf7d0" name="ferias" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {showCadastroFeriasModal && (
        <CadastrarFeriasModal
          funcionarios={funcionarios}
          unidadeId={Number(id)}
          onClose={() => setShowCadastroFeriasModal(false)}
          open={showCadastroFeriasModal}
        />
      )}
    </div>
  )
}
