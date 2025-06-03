"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
  Area,
  AreaChart,
  CartesianGrid as RechartsCartesianGrid,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
} from "recharts"
import type { TooltipProps } from "recharts"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import { SkipLink } from "@/components/accessibility/skip-link"
import { LiveRegion } from "@/components/accessibility/live-region"
import { FocusTrap } from "@/components/accessibility/focus-trap"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { MetricsOverview } from "@/components/dashboard/metrics-overview"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AttendanceHeatmap } from "@/components/dashboard/attendance-heatmap"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Unidade = {
  id: string
  nome: string
}

type funcionariosRecentes = {
  id: string
  nome: string
}

interface RegistrosHojePorSecretaria {
  secretaria_id: string
  total_registros_hoje: number
  nome: string
}

interface RegistroMesTodo {
  secretaria_id: string
  secretaria_nome: string
  total_registros: number
}

interface RegistroDiario {
  data: string
  registrototal: string
}

interface FuncionarioSecretaria {
  secretaria_id: number
  total_funcionarios: string
}

type SecretariaStats = {
  unidades: Unidade[]
  funcionarios?: FuncionarioSecretaria
  registrosHoje?: RegistrosHojePorSecretaria
  registrosMes?: RegistroMesTodo
  registrosDiarios: RegistroDiario[]
  funcionariosRecentes: funcionariosRecentes[]
}

interface CustomPayload {
  dataCompleta: string
  total: number
}

// Função para obter o nome do mês a partir da data
const obterNomeMes = (data: string) => {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  const partes = data.split("/")
  if (partes.length === 3) {
    const mes = Number.parseInt(partes[1], 10) - 1
    return meses[mes]
  }
  return ""
}

// Função para formatar números grandes
const formatarNumero = (numero: number) => {
  return new Intl.NumberFormat("pt-BR").format(numero)
}

// Componente de tooltip personalizado com acessibilidade
const TooltipPersonalizado = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const { dataCompleta, total } = payload[0].payload as CustomPayload

    return (
      <div
        className="bg-white p-3 sm:p-4 rounded-xl shadow-xl border border-slate-300 backdrop-blur-sm transform transition-transform duration-200 scale-105 max-w-xs"
        role="tooltip"
        aria-label={`Dados para ${dataCompleta}: ${formatarNumero(total)} registros`}
      >
        <p className="text-xs sm:text-sm font-semibold text-slate-800 mb-1 truncate">{dataCompleta}</p>
        <p className="text-lg sm:text-xl font-bold text-blue-700">{formatarNumero(total)} registros</p>
        <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full mt-2"></div>
      </div>
    )
  }

  return null
}

function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SecretariaStats>({
    unidades: [],
    funcionarios: undefined,
    funcionariosRecentes: [],
    registrosHoje: undefined,
    registrosMes: undefined,
    registrosDiarios: [],
  })
  const [loading, setLoading] = useState(true)
  const [secretariaNome, setSecretariaNome] = useState<string>("")
  const [mesAtual, setMesAtual] = useState<string>("")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStatus, setLoadingStatus] = useState("Iniciando...")
  const [announceMessage, setAnnounceMessage] = useState("")

  const [chartType, setChartType] = useState("area")
  const [timeRange, setTimeRange] = useState("30")

  // Função para anunciar mudanças para screen readers
  const announceToScreenReader = useCallback((message: string) => {
    setAnnounceMessage(message)
    setTimeout(() => setAnnounceMessage(""), 1000)
  }, [])

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Atalhos de teclado para navegação rápida
      if (event.altKey) {
        switch (event.key) {
          case "1":
            event.preventDefault()
            document.getElementById("metrics-section")?.focus()
            announceToScreenReader("Navegando para seção de métricas")
            break
          case "2":
            event.preventDefault()
            document.getElementById("activity-section")?.focus()
            announceToScreenReader("Navegando para seção de atividades")
            break
          case "3":
            event.preventDefault()
            document.getElementById("charts-section")?.focus()
            announceToScreenReader("Navegando para seção de gráficos")
            break
        }
      }
    },
    [announceToScreenReader],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (!user?.secretaria_id || !user?.unidade_id) return

    const urls = {
      unidades: `${API_URL}/secre/${user.secretaria_id}/unidades`,
      funcionarios: `${API_URL}/secre/${user.secretaria_id}/total-funcionarios`,
      funcionariosRecentes: `${API_URL}/unid/${user.unidade_id}/funcionarios`,
      registrosHoje: `${API_URL}/secre/reg-hoje-por-secre/${user.secretaria_id}`,
      registrosMes: `${API_URL}/secre/${user.secretaria_id}/registros-mensais`,
      registrosDiarios: `${API_URL}/secre/grafico-reg-secre-mes-todo/${user.secretaria_id}`,
    }

    const fetchAll = async () => {
      setLoading(true)
      setLoadingProgress(0)
      setLoadingStatus("Iniciando carregamento...")
      announceToScreenReader("Iniciando carregamento dos dados do dashboard")

      try {
        const requests = Object.values(urls).map((url) => fetch(url))
        const totalRequests = requests.length
        let completedRequests = 0

        const results = await Promise.allSettled(
          requests.map(async (requestPromise, index) => {
            const key = Object.keys(urls)[index]
            const statusMessage = `Carregando ${key}...`
            setLoadingStatus(statusMessage)

            try {
              const response = await requestPromise
              completedRequests++
              const progress = Math.round((completedRequests / totalRequests) * 100)
              setLoadingProgress(progress)

              if (progress % 25 === 0) {
                announceToScreenReader(`Progresso do carregamento: ${progress}%`)
              }

              return { key, response }
            } catch (error) {
              completedRequests++
              setLoadingProgress(Math.round((completedRequests / totalRequests) * 100))
              throw { key, error }
            }
          }),
        )

        for (const result of results) {
          if (result.status === "fulfilled") {
            const { key, response } = result.value

            if (response.ok) {
              try {
                const data = await response.json()
                // atualiza o estado só se a resposta é válida
                switch (key) {
                  case "unidades":
                    setStats((prev) => ({ ...prev, unidades: data }))
                    break
                  case "funcionarios":
                    setStats((prev) => ({ ...prev, funcionarios: data }))
                    break
                  case "funcionariosRecentes":
                    setStats((prev) => ({
                      ...prev,
                      funcionariosRecentes: data,
                    }))
                    break
                  case "registrosHoje":
                    setSecretariaNome(data.nome || "")
                    setStats((prev) => ({ ...prev, registrosHoje: data }))
                    break
                  case "registrosMes":
                    setStats((prev) => ({ ...prev, registrosMes: data }))
                    break
                  case "registrosDiarios":
                    setStats((prev) => ({ ...prev, registrosDiarios: data }))
                    if (data && data.length > 0) {
                      setMesAtual(obterNomeMes(data[0].data))
                    }
                    break
                }
              } catch (err) {
                console.error(`Erro ao converter JSON da resposta ${key}:`, err)
              }
            } else {
              console.warn(`Erro HTTP na resposta ${key}: ${response.status} ${response.statusText}`)
            }
          } else {
            console.warn(`Falha na requisição:`, result.reason)
          }
        }

        setLoadingStatus("Finalizando...")
        announceToScreenReader("Carregamento concluído. Dashboard pronto para uso.")

        // Simular um pequeno delay para mostrar a conclusão do carregamento
        setTimeout(() => {
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error("Erro inesperado ao buscar dados:", err)
        setLoadingStatus("Erro ao carregar dados")
        announceToScreenReader("Erro ao carregar dados do dashboard")
        setTimeout(() => {
          setLoading(false)
        }, 1000)
      }
    }

    fetchAll()
  }, [user?.secretaria_id, user?.unidade_id, announceToScreenReader])

  // Preparar dados para o gráfico
  const dadosGrafico = stats.registrosDiarios
    .map((item) => ({
      dia: item.data.split("/")[0],
      dataCompleta: item.data,
      total: Number.parseInt(item.registrototal, 10),
    }))
    .sort((a, b) => Number.parseInt(a.dia, 10) - Number.parseInt(b.dia, 10))

  // Preparar dados para métricas
  const metricsData = {
    unidades: stats.unidades.length,
    funcionarios: Number(stats.funcionarios?.total_funcionarios) || 0,
    registrosHoje: stats.registrosHoje?.total_registros_hoje || 0,
    registrosMes: stats.registrosMes?.total_registros || 0,
    funcionariosAtivos: 0, // Remover simulação
    funcionariosInativos: 0, // Remover simulação
    alertas: 0, // Remover simulação
    eficiencia: 0, // Remover simulação
    crescimento: 0, // Remover simulação
  }

  if (loading) {
    return (
      <FocusTrap active={loading}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
              <LoadingIndicator size="lg" variant="spinner" message={loadingStatus} progress={loadingProgress} />
            </div>

            <div className="mt-8 opacity-30 hidden lg:block" aria-hidden="true">
              <DashboardSkeleton />
            </div>
          </div>
        </div>
      </FocusTrap>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Skip Links para navegação rápida */}
      <SkipLink href="#main-content">Pular para conteúdo principal</SkipLink>
      <SkipLink href="#metrics-section">Pular para métricas</SkipLink>
      <SkipLink href="#activity-section">Pular para atividades</SkipLink>
      <SkipLink href="#charts-section">Pular para gráficos</SkipLink>

      {/* Live Region para anúncios de screen reader */}
      <LiveRegion message={announceMessage} />

      <main id="main-content" className="p-3 sm:p-4 lg:px-6 lg:pt-6 lg:pb-6 space-y-4 sm:space-y-6" tabIndex={-1}>
        {/* Instruções de navegação por teclado */}
        <div className="sr-only">
          <p>Use Alt+1 para ir para métricas, Alt+2 para atividades, Alt+3 para gráficos</p>
        </div>

        {/* Seção de Métricas Expandida */}
        <section
          id="metrics-section"
          aria-labelledby="metrics-heading"
          tabIndex={-1}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <h2 id="metrics-heading" className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
            Visão Geral das Métricas
          </h2>
          <MetricsOverview data={metricsData} loading={false} />
        </section>

        {/* Seção de Atividades */}
        <section
          id="activity-section"
          aria-labelledby="activity-heading"
          tabIndex={-1}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <h2 id="activity-heading" className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
            Atividades Recentes
          </h2>

          <ActivityFeed activities={[]} funcionariosRecentes={stats.funcionariosRecentes} loading={false} />
        </section>

        {/* Seção de Análises Avançadas */}
        <section
          id="charts-section"
          aria-labelledby="charts-heading"
          tabIndex={-1}
          className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
        >
          <h2 id="charts-heading" className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
            Análises e Relatórios
          </h2>

          <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
            {/* Gráfico Principal */}
            <Card className="xl:col-span-1">
              <CardHeader className="space-y-2 sm:space-y-3 p-3 sm:p-4">
                <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        Registros Diários
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-slate-600 font-medium truncate">
                        Visualização dos dados de {mesAtual}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Controles do Gráfico */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
                      <Select
                        value={timeRange}
                        onValueChange={(value) => {
                          setTimeRange(value)
                          announceToScreenReader(`Período alterado para ${value} dias`)
                        }}
                      >
                        <SelectTrigger
                          className="w-24 sm:w-32 h-7 sm:h-8 text-xs focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          aria-label="Selecionar período de tempo"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 sm:p-4 pt-0">
                <div
                  className="h-[300px] sm:h-[350px] lg:h-[400px] w-full"
                  role="img"
                  aria-label={`Gráfico de área mostrando registros de ponto diários para ${mesAtual}. ${dadosGrafico.length} pontos de dados disponíveis.`}
                >
                  {dadosGrafico && dadosGrafico.length > 0 ? (
                    <RechartsResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={dadosGrafico}
                        margin={{
                          top: 20,
                          right: 10,
                          left: 10,
                          bottom: 20,
                        }}
                      >
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1e40af" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#1e40af" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <RechartsCartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                        <RechartsXAxis
                          dataKey="dia"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#374151", fontSize: 10 }}
                          padding={{ left: 5, right: 5 }}
                        />
                        <RechartsYAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#374151", fontSize: 10 }}
                          width={40}
                        />
                        <RechartsTooltip content={<TooltipPersonalizado />} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#1e40af"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorTotal)"
                          activeDot={{
                            r: 6,
                            strokeWidth: 0,
                            fill: "#1e40af",
                            className: "animate-ping-slow",
                          }}
                        />
                      </AreaChart>
                    </RechartsResponsiveContainer>
                  ) : (
                    <div
                      className="flex items-center justify-center h-full"
                      role="status"
                      aria-label="Nenhum dado disponível"
                    >
                      <p className="text-sm sm:text-base text-slate-600 font-medium text-center px-4">
                        Nenhum dado disponível para o período
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mapa de Frequência */}
            <div className="xl:col-span-1">
              <AttendanceHeatmap data={[]} loading={false} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
