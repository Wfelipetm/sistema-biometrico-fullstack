"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp } from "lucide-react"

interface HeatmapData {
  date: string
  value: number
  level: 0 | 1 | 2 | 3 | 4
}

interface AttendanceHeatmapProps {
  data: HeatmapData[]
  loading?: boolean
}

export function AttendanceHeatmap({ data, loading = false }: AttendanceHeatmapProps) {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-slate-100"
      case 1:
        return "bg-blue-200"
      case 2:
        return "bg-blue-400"
      case 3:
        return "bg-blue-600"
      case 4:
        return "bg-blue-800"
      default:
        return "bg-slate-100"
    }
  }

  const getWeeks = () => {
    const weeks = []
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1)

    for (let i = 0; i < 16; i++) {
      const week = []
      for (let j = 0; j < 7; j++) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + i * 7 + j)

        const dataPoint = data.find((d) => d.date === date.toISOString().split("T")[0])
        week.push({
          date: date.toISOString().split("T")[0],
          value: dataPoint?.value || 0,
          level: dataPoint?.level || 0,
        })
      }
      weeks.push(week)
    }
    return weeks
  }

  const getMonthLabels = () => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const today = new Date()
    const labels = []

    for (let i = 3; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
      labels.push(months[month.getMonth()])
    }
    return labels
  }

  if (loading) {
    return (
      <Card className="h-[500px] sm:h-[600px]">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 sm:h-5 sm:w-5 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-5 w-32 sm:h-6 sm:w-40 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="h-3 w-48 sm:h-4 sm:w-64 bg-slate-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-1 sm:space-y-2">
            {Array(16)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="flex space-x-1">
                  {Array(7)
                    .fill(null)
                    .map((_, j) => (
                      <div key={j} className="h-2 w-2 sm:h-3 sm:w-3 bg-slate-200 rounded animate-pulse"></div>
                    ))}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const weeks = data.length > 0 ? getWeeks() : []
  const monthLabels = getMonthLabels()
  const totalRegistros = data.reduce((sum, item) => sum + item.value, 0)
  const avgDaily = data.length > 0 ? Math.round(totalRegistros / data.length) : 0

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Mapa de Frequência</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
              {avgDaily} registros/dia
            </Badge>
          </div>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-600">
          Padrão de registros de ponto dos últimos 4 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-3 sm:p-4 pt-0">
        {data.length > 0 ? (
          <div className="space-y-2 sm:space-y-3 h-full flex flex-col">
            {/* Month labels */}
            <div className="flex justify-between text-xs text-slate-500 px-1 sm:px-2">
              {monthLabels.map((month, index) => (
                <span key={index}>{month}</span>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex-1 overflow-auto">
              <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex space-x-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`h-2 w-2 sm:h-3 sm:w-3 rounded-sm ${getLevelColor(day.level)} hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer`}
                        title={`${day.date}: ${day.value} registros`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-3 border-t border-slate-200 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <span>Menos</span>
                <div className="flex space-x-1">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div key={level} className={`h-2 w-2 sm:h-3 sm:w-3 rounded-sm ${getLevelColor(level)}`} />
                  ))}
                </div>
                <span>Mais</span>
              </div>

              <div className="text-xs text-slate-500">Total: {totalRegistros.toLocaleString()} registros</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Calendar className="h-10 w-10 text-slate-400 mb-3" />
            <p className="text-xs sm:text-sm text-slate-600 font-medium">Nenhum dado de frequência disponível</p>
            <p className="text-xs text-slate-500 mt-1">Os dados aparecerão aqui quando houver registros históricos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
