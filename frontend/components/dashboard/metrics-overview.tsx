"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  Users,
  Clock,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react"

interface MetricsData {
  unidades: number
  funcionarios: number
  registrosHoje: number
  registrosMes: number
  funcionariosAtivos: number
  funcionariosInativos: number
  alertas: number
  eficiencia: number
  crescimento: number
}

interface MetricsOverviewProps {
  data: MetricsData
  loading?: boolean
}

export function MetricsOverview({ data, loading = false }: MetricsOverviewProps) {
  const metaRegistrosDiarios = 100
  const progressoMeta = Math.min(100, Math.round((data.registrosHoje / metaRegistrosDiarios) * 100))

  const getStatusColor = (value: number, threshold: number) => {
    if (value >= threshold * 0.9) return "success"
    if (value >= threshold * 0.7) return "warning"
    return "destructive"
  }

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
    if (growth < 0) return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
    return <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
  }

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array(8)
          .fill(null)
          .map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 sm:h-4 bg-slate-200 rounded w-16 sm:w-20"></div>
                  <div className="h-6 sm:h-8 w-6 sm:w-8 bg-slate-200 rounded-lg"></div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="h-6 sm:h-8 bg-slate-200 rounded w-12 sm:w-16 mb-2"></div>
                <div className="h-3 sm:h-4 bg-slate-200 rounded w-20 sm:w-24"></div>
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Unidades */}
      <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
            Unidades
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.unidades}</div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Total de unidades</p>
          <div className="flex items-center justify-between">
            <Badge variant="info" className="text-xs">
              Ativas
            </Badge>
            <span className="text-xs text-slate-500">100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Funcionários */}
      <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
            Funcionários
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors flex-shrink-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.funcionarios}</div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Total cadastrados</p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <UserCheck className="h-3 w-3 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-700 truncate">{data.funcionariosAtivos} ativos</span>
            </div>
            <div className="flex items-center space-x-1">
              <UserX className="h-3 w-3 text-slate-500 flex-shrink-0" />
              <span className="text-slate-600 truncate">{data.funcionariosInativos} inativos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registros Hoje */}
      <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/10"></div>
        <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-bl-3xl"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">Hoje</CardTitle>
          <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.registrosHoje}</div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Registros de ponto</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Meta diária</span>
              <span className="font-medium text-amber-700">{progressoMeta}%</span>
            </div>
            <Progress
              value={progressoMeta}
              className="h-1.5"
              indicatorColor="bg-gradient-to-r from-amber-500 to-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Registros Mês */}
      <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
            Este Mês
          </CardTitle>
          <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
            <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
          <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.registrosMes}</div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">Total de registros</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.crescimento)}
              <span
                className={`text-xs font-medium ${
                  data.crescimento > 0 ? "text-emerald-600" : data.crescimento < 0 ? "text-red-600" : "text-slate-600"
                }`}
              >
                {data.crescimento > 0 ? "+" : ""}
                {data.crescimento}%
              </span>
            </div>
            <Badge
              variant={data.crescimento > 0 ? "success" : data.crescimento < 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {data.crescimento > 0 ? "Crescimento" : data.crescimento < 0 ? "Declínio" : "Estável"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cards adicionais em telas maiores */}
      <div className="hidden lg:contents">
        {/* Eficiência */}
        <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-600/10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
              Eficiência
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors flex-shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.eficiencia}%</div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Taxa de eficiência</p>
            <Progress
              value={data.eficiencia}
              className="h-2"
              indicatorColor={
                data.eficiencia >= 90
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : data.eficiencia >= 70
                    ? "bg-gradient-to-r from-amber-500 to-amber-600"
                    : "bg-gradient-to-r from-red-500 to-red-600"
              }
            />
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
              Alertas
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors flex-shrink-0">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.alertas}</div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Requer atenção</p>
            <Badge variant={data.alertas > 0 ? "destructive" : "success"} className="w-full justify-center text-xs">
              {data.alertas > 0 ? "Ação necessária" : "Tudo em ordem"}
            </Badge>
          </CardContent>
        </Card>

        {/* Funcionários Ativos */}
        <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-teal-600/10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
              Ativos Hoje
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors flex-shrink-0">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.funcionariosAtivos}</div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Funcionários presentes</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {data.funcionarios > 0 ? Math.round((data.funcionariosAtivos / data.funcionarios) * 100) : 0}% do total
              </span>
              <Badge variant="success" className="text-xs">
                Online
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tendência Semanal */}
        <Card className="group relative overflow-hidden bg-white border border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-cyan-600/10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs font-semibold text-slate-800 uppercase tracking-wide truncate">
              Tendência
            </CardTitle>
            <div className="p-1.5 sm:p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">+12.5%</div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Crescimento semanal</p>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-1.5 rounded-full"
                  style={{ width: "75%" }}
                ></div>
              </div>
              <span className="text-xs text-cyan-700 font-medium">75%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
