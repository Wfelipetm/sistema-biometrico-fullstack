"use client"

import type React from "react"

import { useMemo, memo, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Users,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

// Hook personalizado para detectar mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return isMobile
}

// Memoized NavLink component with enhanced responsive design
const NavLink = memo(
  ({
    href,
    active,
    icon: Icon,
    label,
    collapsed,
    badge,
    description,
    isMobile,
  }: {
    href: string
    active: boolean
    icon: React.ElementType
    label: string
    collapsed: boolean
    badge?: string | number
    description?: string
    isMobile: boolean
  }) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <div className="relative group">
        <Link
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-300",
            "hover:bg-gradient-to-r hover:from-itaguai-50 hover:to-itaguai-100 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-itaguai-500 focus:ring-offset-2 focus:ring-offset-background",
            "cursor-pointer transform hover:scale-[1.02]",
            active ? "bg-gradient-itaguai text-white shadow-itaguai" : "text-itaguai-700 hover:text-itaguai-900",
            collapsed ? "justify-center px-3 py-4" : "px-4 py-4",
            isMobile ? "min-h-[52px]" : "min-h-[48px]",
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label={collapsed ? `${label}${description ? ` - ${description}` : ""}` : undefined}
        >
          {/* Icon com alinhamento centralizado */}
          <div className="flex items-center justify-center flex-shrink-0">
            <Icon
              className={cn(
                "h-5 w-5 transition-all duration-300",
                active ? "text-white drop-shadow-sm" : "text-itaguai-600",
                isHovered && !active ? "text-itaguai-700 scale-110" : "",
              )}
            />
          </div>

          {/* Label e badge com alinhamento melhorado */}
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="truncate font-semibold text-sm leading-tight">{label}</span>
              {badge && (
                <Badge
                  variant={active ? "secondary" : "outline"}
                  className={cn(
                    "ml-2 h-5 px-2 text-xs font-bold transition-all duration-300 flex-shrink-0",
                    active
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-itaguai-50 text-itaguai-700 border-itaguai-200",
                  )}
                >
                  {badge}
                </Badge>
              )}
            </div>
          )}

          {/* Indicador ativo com posicionamento preciso */}
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm" />
          )}
        </Link>

        {/* Tooltip para estado collapsed - apenas desktop */}
        {collapsed && !isMobile && (
          <div
            className={cn(
              "absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50",
              "bg-itaguai-900 text-white text-sm px-3 py-2 rounded-xl shadow-itaguai-lg",
              "opacity-0 pointer-events-none transition-all duration-300 whitespace-nowrap",
              "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-1",
              "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:-translate-x-1",
              "before:border-4 before:border-transparent before:border-r-itaguai-900",
            )}
          >
            <div className="font-semibold text-sm leading-tight">{label}</div>
            {description && (
              <div className="text-xs text-itaguai-300 mt-1 leading-relaxed font-normal">{description}</div>
            )}
          </div>
        )}
      </div>
    )
  },
)
NavLink.displayName = "NavLink"

// Enhanced Footer component with responsive design
const SidebarFooter = memo(({ collapsed, isMobile }: { collapsed: boolean; isMobile: boolean }) => (
  <div className="mt-auto border-t border-itaguai-200 bg-gradient-to-r from-itaguai-50 to-white">
    <div className={cn("transition-all duration-300", collapsed ? "p-3" : "p-4")}>
      {!collapsed ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-itaguai-600">
            <Sparkles className="h-3 w-3 text-itaguai-500 flex-shrink-0" />
            <span className="truncate leading-tight">Sistema Biométrico v2.0</span>
          </div>
          {!isMobile && (
            <div className="text-xs text-itaguai-500 leading-relaxed font-medium space-y-1">
              <p>© 2025 Prefeitura de Itaguaí</p>
              <p>
                Desenvolvido por <span className="font-semibold text-itaguai-600">SMCTIC</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-gradient-itaguai rounded-xl flex items-center justify-center shadow-itaguai">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  </div>
))
SidebarFooter.displayName = "SidebarFooter"

// Enhanced Logo component with better responsive design
const SidebarLogo = memo(
  ({
    isGestor,
    collapsed,
    onToggleCollapse,
    isMobile,
  }: {
    isGestor: boolean
    collapsed: boolean
    onToggleCollapse: () => void
    isMobile: boolean
  }) => (
    <div
      className={cn(
        "relative border-b border-itaguai-200 bg-gradient-to-r from-white to-itaguai-50",
        "transition-all duration-300",
        collapsed ? "h-18" : "h-20",
      )}
    >
      <div className={cn("h-full flex items-center", collapsed ? "justify-center px-3" : "justify-between px-4")}>
        {/* Logo/Brand area com alinhamento centralizado */}
        <Link
          href={isGestor ? "/dashboard/unidades" : "/dashboard"}
          className={cn(
            "flex items-center gap-3 font-bold transition-all duration-300",
            "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-itaguai-500 focus:ring-offset-2 rounded-xl",
            collapsed ? "p-2" : "flex-1 py-2",
          )}
        >
          {collapsed ? (
            <div className="w-12 h-12 bg-gradient-itaguai rounded-xl flex items-center justify-center shadow-itaguai">
              <Home className="h-6 w-6 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-itaguai rounded-xl flex items-center justify-center shadow-itaguai">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-itaguai-900 tracking-tight leading-tight">Sistema Biométrico</h2>
              </div>
            </div>
          )}
        </Link>

        {/* Botões de toggle com alinhamento consistente */}
        {!collapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-9 w-9 flex-shrink-0 hover:bg-itaguai-100 transition-all duration-300 focus:ring-2 focus:ring-itaguai-500 focus:ring-offset-2 rounded-xl"
            aria-label="Recolher sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-itaguai-600" />
          </Button>
        )}

        {collapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-white border border-itaguai-200 shadow-itaguai hover:bg-itaguai-50 transition-all duration-300 focus:ring-2 focus:ring-itaguai-500 focus:ring-offset-2 rounded-xl"
            aria-label="Expandir sidebar"
          >
            <ChevronRight className="h-3 w-3 text-itaguai-600" />
          </Button>
        )}
      </div>
    </div>
  ),
)
SidebarLogo.displayName = "SidebarLogo"

export default function Sidebar({ className, collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isMobile = useIsMobile()

  // Use controlled or internal collapsed state
  const collapsed = controlledCollapsed ?? internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !collapsed) {
      setCollapsed(true)
    }
  }, [isMobile, collapsed, setCollapsed])

  // Memoized derived state
  const isAdmin = useMemo(() => user?.papel === "admin", [user?.papel])
  const isGestor = useMemo(() => user?.papel === "gestor", [user?.papel])
  const isQuiosque = useMemo(() => pathname.startsWith("/dashboard/quiosque"), [pathname])
  const isQuiosqueUser = useMemo(() => user?.papel === "quiosque", [user?.papel])

  // Toggle collapse handler
  const handleToggleCollapse = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  // Enhanced routes with badges and descriptions
  const routes = useMemo(() => {
    const baseRoutes = [
      // Só mostra "Secretaria" se NÃO for gestor
      ...(!isGestor
        ? [
            {
              label: "Secretaria",
              icon: LayoutDashboard,
              href: "/dashboard",
              active: pathname === "/dashboard",
              description: "Visão geral da secretaria",
              badge: "Novo",
            },
          ]
        : []),
      {
        label: "Unidades",
        icon: Building2,
        href: "/dashboard/unidades",
        active: pathname.startsWith("/dashboard/unidades"),
        description: "Gerenciar unidades organizacionais",
      },
      {
        label: "Funcionários",
        icon: Users,
        href: "/dashboard/funcionarios",
        active: pathname.startsWith("/dashboard/funcionarios"),
        description: "Cadastro e gestão de funcionários",
        badge: 150,
      },
      {
        label: "Registros",
        icon: ClipboardList,
        href: "/dashboard/registros",
        active: pathname.startsWith("/dashboard/registros"),
        description: "Histórico de registros de ponto",
      },
      {
        label: "Relatórios",
        icon: CalendarClock,
        href: "/dashboard/relatorios",
        active: pathname.startsWith("/dashboard/relatorios"),
        description: "Relatórios e análises",
        badge: "3",
      },
    ]

    // Apenas para usuários com papel "quiosque"
    if (isQuiosqueUser) {
      baseRoutes.push({
        label: "Modo Quiosque",
        icon: Monitor,
        href: "/dashboard/quiosque",
        active: pathname.startsWith("/dashboard/quiosque"),
        description: "Interface de quiosque para funcionários",
      })
    }

    return baseRoutes
  }, [isGestor, isQuiosqueUser, pathname])

  // Early return for quiosque mode
  if (isQuiosque) {
    return null
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-itaguai-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60",
        "transition-all duration-300 ease-in-out shadow-itaguai",
        collapsed ? (isMobile ? "w-16" : "w-20") : isMobile ? "w-64" : "w-72",
        className,
      )}
    >
      <SidebarLogo
        isGestor={isGestor}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobile={isMobile}
      />

      <ScrollArea className="flex-1 py-4">
        <nav className={cn("grid gap-2", collapsed ? "px-2" : "px-4")}>
          {routes.map((route) => (
            <NavLink
              key={route.href}
              href={route.href}
              active={route.active}
              icon={route.icon}
              label={route.label}
              collapsed={collapsed}
              badge={route.badge}
              description={route.description}
              isMobile={isMobile}
            />
          ))}
        </nav>
      </ScrollArea>

      <SidebarFooter collapsed={collapsed} isMobile={isMobile} />
    </div>
  )
}
