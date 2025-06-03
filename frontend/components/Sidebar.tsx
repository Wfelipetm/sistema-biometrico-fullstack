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
import { useTheme } from "next-themes"
import logoDark from "../public/images/logo_biometrico_dark4.png"
import logoLight from "../public/images/logo_biometrico_light4.png"
import Image from "next/image"

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
            "flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-200",
            "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background",
            "dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50",
            "cursor-pointer",
            active
              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
            collapsed ? "justify-center px-2 sm:px-3 py-3 sm:py-3.5" : "px-3 sm:px-4 py-3 sm:py-3.5",
            isMobile ? "min-h-[48px]" : "min-h-[44px]", // Área de toque consistente
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label={collapsed ? `${label}${description ? ` - ${description}` : ""}` : undefined}
        >
          {/* Icon com alinhamento centralizado */}
          <div className="flex items-center justify-center flex-shrink-0">
            <Icon
              className={cn(
                "h-5 w-5 transition-all duration-200",
                active ? "text-white drop-shadow-sm" : "text-slate-600 dark:text-slate-400",
                isHovered && !active ? "text-blue-600 dark:text-blue-400" : "",
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
                    "ml-2 h-5 px-2 text-xs font-semibold transition-all duration-200 flex-shrink-0",
                    active
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
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
              "absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50",
              "bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg",
              "opacity-0 pointer-events-none transition-all duration-200 whitespace-nowrap",
              "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-1",
              "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:-translate-x-1",
              "before:border-4 before:border-transparent before:border-r-slate-900",
            )}
          >
            <div className="font-semibold text-sm leading-tight">{label}</div>
            {description && (
              <div className="text-xs text-slate-300 mt-1 leading-relaxed font-normal">{description}</div>
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
  <div className="mt-auto border-t bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
    <div className={cn("transition-all duration-200", collapsed ? "p-2 sm:p-3" : "p-3 sm:p-4")}>
      {!collapsed ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
            <Sparkles className="h-3 w-3 text-blue-500 flex-shrink-0" />
            <span className="truncate leading-tight">Sistema Biométrico v2.0</span>
          </div>
          {!isMobile && (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              © 2025 Desenvolvido por <span className="font-semibold text-blue-600 dark:text-blue-400">SMCTIC</span>
            </p>
          )}
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
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
    theme,
    isGestor,
    collapsed,
    onToggleCollapse,
    isMobile,
  }: {
    theme: string | undefined
    isGestor: boolean
    collapsed: boolean
    onToggleCollapse: () => void
    isMobile: boolean
  }) => (
    <div
      className={cn(
        "relative border-b bg-gradient-to-r from-white to-blue-50 dark:from-slate-900 dark:to-blue-950",
        "transition-all duration-300",
        collapsed ? "h-16 sm:h-18" : "h-18 sm:h-20",
      )}
    >
      <div
        className={cn(
          "h-full flex items-center",
          collapsed ? "justify-center px-2 sm:px-3" : "justify-between px-3 sm:px-4",
        )}
      >
        {/* Logo/Brand area com alinhamento centralizado */}
        <Link
          href={isGestor ? "/dashboard/unidades" : "/dashboard"}
          className={cn(
            "flex items-center gap-2 font-semibold transition-all duration-200",
            "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg",
            collapsed ? "p-2" : "flex-1 py-2",
          )}
        >
          {collapsed ? (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center justify-start w-full">
              <Image
                src={theme === "light" ? logoLight : logoDark}
                alt="Logo Prefeitura Itaguaí - Sistema Biométrico"
                style={{
                  height: isMobile ? 44 : 52,
                  width: "auto",
                  maxWidth: isMobile ? 200 : 260,
                }}
                className="object-contain transition-transform duration-200 hover:scale-105"
                priority
              />
            </div>
          )}
        </Link>

        {/* Botões de toggle com alinhamento consistente */}
        {!collapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Recolher sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        )}

        {collapsed && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-white dark:bg-slate-800 border shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Expandir sidebar"
          >
            <ChevronRight className="h-3 w-3 text-slate-600 dark:text-slate-400" />
          </Button>
        )}
      </div>
    </div>
  ),
)
SidebarLogo.displayName = "SidebarLogo"

export default function Sidebar({ className, collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()
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
        "flex flex-col h-full border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out shadow-sm",
        collapsed ? (isMobile ? "w-12" : "w-16") : isMobile ? "w-56" : "w-64",
        className,
      )}
    >
      <SidebarLogo
        theme={theme}
        isGestor={isGestor}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobile={isMobile}
      />

      <ScrollArea className="flex-1 py-2 sm:py-3">
        <nav className={cn("grid gap-1", collapsed ? "px-1 sm:px-2" : "px-2 sm:px-3")}>
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
