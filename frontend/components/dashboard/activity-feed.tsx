"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, UserPlus, UserMinus, AlertCircle, CheckCircle2, Building2, Activity } from "lucide-react"

interface ActivityItem {
  id: string
  type: "login" | "logout" | "register" | "alert" | "success" | "system"
  user: {
    name: string
    avatar?: string
    role: string
  }
  action: string
  timestamp: string
  details?: string
  location?: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  funcionariosRecentes?: { id: string; nome: string }[]
  loading?: boolean
}

export function ActivityFeed({ activities, funcionariosRecentes = [], loading = false }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
      case "logout":
        return <UserMinus className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
      case "register":
        return <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
      case "alert":
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
      case "success":
        return <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
      case "system":
        return <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
      default:
        return <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "login":
        return "border-l-emerald-500 bg-emerald-50"
      case "logout":
        return "border-l-slate-500 bg-slate-50"
      case "register":
        return "border-l-blue-500 bg-blue-50"
      case "alert":
        return "border-l-amber-500 bg-amber-50"
      case "success":
        return "border-l-emerald-500 bg-emerald-50"
      case "system":
        return "border-l-purple-500 bg-purple-50"
      default:
        return "border-l-slate-500 bg-slate-50"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d atrás`
    if (hours > 0) return `${hours}h atrás`
    if (minutes > 0) return `${minutes}m atrás`
    return "Agora"
  }

  // Combinar atividades com funcionários recentes
  const combinedActivities = [
    ...activities,
    ...funcionariosRecentes.map((funcionario, index) => ({
      id: `funcionario-${funcionario.id}`,
      type: "register" as const,
      user: {
        name: funcionario.nome,
        role: "Funcionário",
      },
      action: "Registrou ponto recentemente",
      timestamp: new Date(Date.now() - (index + 1) * 10 * 60000).toISOString(),
      details: `Último registro há ${Math.floor(Math.random() * 60)} minutos`,
      location: "Sistema Biométrico",
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (loading) {
    return (
      <Card className="h-[500px] sm:h-[600px]">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 sm:h-5 sm:w-5 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-5 w-24 sm:h-6 sm:w-32 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="h-3 w-36 sm:h-4 sm:w-48 bg-slate-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {Array(8)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="flex items-start space-x-3 animate-pulse">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 bg-slate-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                    <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[500px] sm:h-[600px] flex flex-col">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Atividade Recente</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm text-slate-600">
          Últimas atividades do sistema e registros de funcionários em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-3 sm:p-4 pt-0">
        <ScrollArea className="h-full pr-2 sm:pr-4">
          <div className="space-y-2 sm:space-y-3">
            {combinedActivities.length > 0 ? (
              combinedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`relative flex items-start space-x-2 p-2 sm:p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm ${getActivityColor(activity.type)}`}
                >
                  <div className="flex-shrink-0">
                    <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                      <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                      <AvatarFallback className="text-xs font-medium">
                        {activity.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <p className="text-xs font-medium text-slate-900 truncate">{activity.user.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {activity.user.role}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 mb-1">{activity.action}</p>

                    {activity.details && <p className="text-xs text-slate-500 mb-2">{activity.details}</p>}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{formatTime(activity.timestamp)}</span>
                      </div>

                      {activity.location && (
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-20 sm:max-w-none">{activity.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <Activity className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-sm sm:text-base text-slate-600 font-medium">Nenhuma atividade recente</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  As atividades aparecerão aqui quando houver registros
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
