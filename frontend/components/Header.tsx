"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Menu, Moon, Sun, LogOut, User, Settings, Bell, Shield, ChevronDown, Keyboard } from "lucide-react"
import { useTheme } from "next-themes"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Sidebar from "./Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import ModalSenhaAdmin from "@/components/modal-senha-quiosque"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// Hook personalizado para detectar tamanhos de tela
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      setBreakpoint({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    checkBreakpoint()
    window.addEventListener("resize", checkBreakpoint)

    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])

  return breakpoint
}

// Memoized constants to prevent recreation
const ROLE_COLORS = {
  admin: "bg-error-100 text-error-800 border-error-200",
  gestor: "bg-itaguai-100 text-itaguai-800 border-itaguai-200",
  funcionario: "bg-success-100 text-success-800 border-success-200",
  quiosque: "bg-warning-100 text-warning-800 border-warning-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
} as const

const ROLE_LABELS = {
  admin: "Administrador",
  gestor: "Gestor",
  funcionario: "Funcionário",
  quiosque: "Quiosque",
} as const

const KEYBOARD_SHORTCUTS = [
  { label: "Dashboard", shortcut: "Alt + D" },
  { label: "Perfil", shortcut: "Alt + P" },
  { label: "Alternar tema", shortcut: "Alt + T" },
  { label: "Atalhos", shortcut: "Alt + K" },
] as const

// Memoized components
const LoadingSkeleton = () => (
  <header className="sticky top-0 z-50 flex h-16 md:h-20 items-center justify-between gap-4 border-b border-itaguai-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 shadow-sm">
    <div></div>
    <div></div>
  </header>
)

const KeyboardShortcutsPanel = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null

  return (
    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-itaguai-lg border border-itaguai-100 z-50 animate-scale-in">
      <div className="p-4 border-b border-itaguai-100">
        <h3 className="font-semibold text-sm text-itaguai-900">Atalhos de Teclado</h3>
      </div>
      <div className="p-2">
        <ul className="space-y-1">
          {KEYBOARD_SHORTCUTS.map(({ label, shortcut }) => (
            <li
              key={label}
              className="flex justify-between items-center p-3 text-sm hover:bg-itaguai-50 rounded-lg transition-colors duration-200"
            >
              <span className="text-itaguai-700 font-medium">{label}</span>
              <kbd className="px-2 py-1 bg-itaguai-100 rounded-md text-itaguai-600 font-mono text-xs font-semibold">
                {shortcut}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [liberado, setLiberado] = useState(false)
  const [notifications] = useState(3)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { isMobile, isTablet, isDesktop } = useBreakpoint()

  // Memoized utility functions
  const getInitials = useCallback((name: string) => {
    if (!name) return "US"
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }, [])

  const getRoleColor = useCallback((role: string) => {
    return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || ROLE_COLORS.default
  }, [])

  const getRoleLabel = useCallback((role: string) => {
    return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role
  }, [])

  const getFirstName = useCallback((fullName: string) => {
    if (!fullName) return "Usuário"
    return fullName.trim().split(" ")[0]
  }, [])

  // Memoized event handlers
  const handleProfileClick = useCallback(() => {
    router.push("/profile")
  }, [router])

  const handleSettingsClick = useCallback(() => {
    router.push("/settings")
  }, [router])

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  const toggleKeyboardShortcuts = useCallback(() => {
    setShowKeyboardShortcuts((prev) => !prev)
  }, [])

  const handleModalSuccess = useCallback(() => {
    setLiberado(true)
    setModalOpen(false)
  }, [])

  // Memoized keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (!e.altKey) return

      switch (e.key) {
        case "k":
          e.preventDefault()
          setShowKeyboardShortcuts((prev) => !prev)
          break
        case "d":
          e.preventDefault()
          router.push("/dashboard")
          break
        case "p":
          e.preventDefault()
          router.push("/profile")
          break
        case "t":
          e.preventDefault()
          setTheme(theme === "dark" ? "light" : "dark")
          break
      }
    },
    [theme, setTheme, router],
  )

  // Memoized click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowKeyboardShortcuts(false)
    }
  }, [])

  // Optimized effects
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  // Memoized computed values
  const userInitials = useMemo(() => getInitials(user?.nome || ""), [getInitials, user?.nome])
  const userFirstName = useMemo(() => getFirstName(user?.nome || ""), [getFirstName, user?.nome])
  const userRoleColor = useMemo(() => getRoleColor(user?.papel || ""), [getRoleColor, user?.papel])
  const userRoleLabel = useMemo(() => getRoleLabel(user?.papel || ""), [getRoleLabel, user?.papel])
  const isKioskUser = useMemo(() => user?.papel === "quiosque", [user?.papel])

  // Early return for loading state
  if (!mounted || !user) {
    return <LoadingSkeleton />
  }

  return (
    <header
      className="sticky top-0 z-50 flex h-16 md:h-20 items-center justify-end gap-4 border-b border-itaguai-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 px-4 md:px-6 shadow-sm transition-all duration-200"
      role="banner"
      aria-label="Cabeçalho do sistema"
    >
      {/* Right side - Actions and user menu */}
      <div className="flex items-center gap-2">
        {/* Mobile menu for non-kiosk users */}
        {!isKioskUser && (
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-itaguai-50 transition-colors duration-200 rounded-xl"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu className="h-5 w-5 text-itaguai-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80 border-itaguai-200">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Keyboard shortcuts button - tablet and up only */}
        {!isMobile && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleKeyboardShortcuts}
              className="h-10 w-10 hover:bg-itaguai-50 transition-colors duration-200 rounded-xl"
              aria-label="Atalhos de teclado"
            >
              <Keyboard className="h-5 w-5 text-itaguai-600" />
            </Button>

            <KeyboardShortcutsPanel isVisible={showKeyboardShortcuts} />
          </div>
        )}

        {/* Notifications (only for non-kiosk users) */}
        {!isKioskUser && (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 hover:bg-itaguai-50 transition-colors duration-200 rounded-xl"
            aria-label={notifications > 0 ? `${notifications} notificações não lidas` : "Notificações"}
          >
            <Bell className="h-5 w-5 text-itaguai-600" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse bg-error-500 hover:bg-error-600"
              >
                {notifications > 9 ? "9+" : notifications}
              </Badge>
            )}
          </Button>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleThemeToggle}
          className="h-10 w-10 hover:bg-itaguai-50 transition-colors duration-200 rounded-xl"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-warning-500" />
          ) : (
            <Moon className="h-5 w-5 text-itaguai-600" />
          )}
        </Button>

        {/* User menu */}
        {!isKioskUser || liberado ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-auto p-2 hover:bg-itaguai-50 transition-colors duration-200 rounded-xl group"
                aria-label="Menu do usuário"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9 md:h-10 md:w-10 ring-2 ring-itaguai-200 shadow-md">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                      <AvatarFallback className="bg-gradient-itaguai text-white font-semibold text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success-500 border-2 border-white rounded-full" />
                  </div>

                  {/* User info - only on tablet and up */}
                  {!isMobile && (
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-semibold text-itaguai-900">{userFirstName}</span>
                      <Badge variant="outline" className={cn("text-xs font-medium h-5", userRoleColor)}>
                        {isKioskUser && <Shield className="h-3 w-3 mr-1" />}
                        <span className="text-xs">{userRoleLabel}</span>
                      </Badge>
                    </div>
                  )}

                  <ChevronDown className="h-4 w-4 text-itaguai-500 group-hover:text-itaguai-700 transition-colors duration-200" />
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-72 p-0 shadow-itaguai-lg border-itaguai-200 bg-white rounded-xl"
              sideOffset={8}
            >
              {/* User Profile Section */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-start gap-4 p-4 pb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-itaguai-200">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                    <AvatarFallback className="bg-gradient-itaguai text-white font-bold text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-itaguai-900 leading-tight">{user?.nome}</h4>
                    <p className="text-xs text-itaguai-600 font-medium leading-relaxed truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <Badge variant="outline" className={cn("text-xs font-medium px-2 py-1", userRoleColor)}>
                    {isKioskUser && <Shield className="h-3 w-3 mr-1.5" />}
                    {userRoleLabel}
                  </Badge>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-0 bg-itaguai-100" />

              {/* Menu Items */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={handleProfileClick}
                  className="px-4 py-3 cursor-pointer hover:bg-itaguai-50 transition-colors duration-200 focus:bg-itaguai-50 focus:text-itaguai-900 rounded-none"
                >
                  <User className="mr-3 h-4 w-4 text-itaguai-600" />
                  <span className="font-medium text-sm text-itaguai-900">Meu Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSettingsClick}
                  className="px-4 py-3 cursor-pointer hover:bg-itaguai-50 transition-colors duration-200 focus:bg-itaguai-50 focus:text-itaguai-900 rounded-none"
                >
                  <Settings className="mr-3 h-4 w-4 text-itaguai-600" />
                  <span className="font-medium text-sm text-itaguai-900">Configurações</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-0 bg-itaguai-100" />

              {/* Logout */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={logout}
                  className="px-4 py-3 cursor-pointer text-error-600 hover:bg-error-50 hover:text-error-700 transition-colors duration-200 focus:bg-error-50 focus:text-error-700 rounded-none"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium text-sm">Sair do Sistema</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setModalOpen(true)}
            className="relative h-auto p-2 hover:bg-warning-50 transition-colors duration-200 rounded-xl group"
            aria-label="Acessar modo administrador"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-9 w-9 md:h-10 md:w-10 ring-2 ring-warning-200 shadow-md">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                  <AvatarFallback className="bg-gradient-to-br from-warning-500 to-warning-600 text-white font-semibold text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1">
                  <Shield className="h-4 w-4 text-warning-600" />
                </div>
              </div>

              {/* User info - only on tablet and up */}
              {!isMobile && (
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-itaguai-900">{userFirstName}</span>
                  <Badge
                    variant="outline"
                    className="text-xs font-medium h-5 bg-warning-100 text-warning-800 border-warning-200"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    <span className="text-xs">Restrito</span>
                  </Badge>
                </div>
              )}
            </div>
          </Button>
        )}

        {/* Password modal for kiosk mode */}
        <ModalSenhaAdmin open={modalOpen} onOpenChange={setModalOpen} onSuccess={handleModalSuccess} />
      </div>
    </header>
  )
}
