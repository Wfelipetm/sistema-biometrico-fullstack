"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Download, Upload, Settings, Calendar, Bell, Search, RefreshCw, BarChart3 } from "lucide-react"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  variant: "default" | "secondary" | "outline" | "destructive"
  badge?: string
  onClick: () => void
  disabled?: boolean
}

interface QuickActionsProps {
  onAction: (actionId: string) => void
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: "add-employee",
      title: "Novo Funcionário",
      description: "Cadastrar novo funcionário",
      icon: <Plus className="h-4 w-4" />,
      variant: "default",
      onClick: () => onAction("add-employee"),
    },
    {
      id: "export-data",
      title: "Exportar Dados",
      description: "Baixar relatórios",
      icon: <Download className="h-4 w-4" />,
      variant: "outline",
      onClick: () => onAction("export-data"),
    },
    {
      id: "import-data",
      title: "Importar Dados",
      description: "Carregar dados em lote",
      icon: <Upload className="h-4 w-4" />,
      variant: "outline",
      onClick: () => onAction("import-data"),
    },
    {
      id: "manage-units",
      title: "Gerenciar Unidades",
      description: "Configurar unidades",
      icon: <Settings className="h-4 w-4" />,
      variant: "secondary",
      onClick: () => onAction("manage-units"),
    },
    {
      id: "view-reports",
      title: "Relatórios",
      description: "Visualizar relatórios",
      icon: <BarChart3 className="h-4 w-4" />,
      variant: "outline",
      badge: "Novo",
      onClick: () => onAction("view-reports"),
    },
    {
      id: "schedule-meeting",
      title: "Agendar Reunião",
      description: "Criar nova reunião",
      icon: <Calendar className="h-4 w-4" />,
      variant: "outline",
      onClick: () => onAction("schedule-meeting"),
    },
    {
      id: "notifications",
      title: "Notificações",
      description: "Gerenciar alertas",
      icon: <Bell className="h-4 w-4" />,
      variant: "outline",
      badge: "3",
      onClick: () => onAction("notifications"),
    },
    {
      id: "search-records",
      title: "Buscar Registros",
      description: "Pesquisar histórico",
      icon: <Search className="h-4 w-4" />,
      variant: "outline",
      onClick: () => onAction("search-records"),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Ações Rápidas</CardTitle>
        <CardDescription className="text-slate-600">Acesso rápido às funcionalidades principais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              className="h-auto p-4 flex flex-col items-center space-y-2 relative group hover:scale-105 transition-transform"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.badge && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {action.badge}
                </Badge>
              )}

              <div className="p-2 rounded-lg bg-white/50 group-hover:bg-white/80 transition-colors">{action.icon}</div>

              <div className="text-center">
                <p className="text-xs font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600">Última atualização: há 2 minutos</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onAction("refresh")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
