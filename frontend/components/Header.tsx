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
import logoDark from "../public/images/regua-logo-itaguai_dark3.png"
import logoLight from "../public/images/regua-logo-itaguai_light3.png"
import Image from "next/image"
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
  admin: "bg-red-100 text-red-800 border-red-200",
  gestor: "bg-blue-100 text-blue-800 border-blue-200",
  funcionario: "bg-green-100 text-green-800 border-green-200",
  quiosque: "bg-purple-100 text-purple-800 border-purple-200",
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
  <header className="sticky top-0 z-50 flex h-14 sm:h-16 md:h-20 items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 md:px-6">
    <div className="flex flex-1 justify-center">
      <div className="h-8 sm:h-10 md:h-12 w-32 sm:w-40 md:w-48 bg-muted animate-pulse rounded-lg" />
    </div>
  </header>
)

const KeyboardShortcutsPanel = ({ isVisible }: { isVisible: boolean }) => {
  if (!isVisible) return null

  return (
    <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-md shadow-lg border border-slate-200 z-50">
      <div className="p-2 sm:p-3 border-b border-slate-200">
        <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Atalhos de Teclado</h3>
      </div>
      <div className="p-1 sm:p-2">
        <ul className="space-y-0.5 sm:space-y-1">
          {KEYBOARD_SHORTCUTS.map(({ label, shortcut }) => (
            <li
              key={label}
              className="flex justify-between items-center p-1.5 sm:p-2 text-xs hover:bg-slate-50 rounded-md"
            >
              <span className="text-slate-700">{label}</span>
              <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">
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
  const [notifications] = useState(3) // Simulated notifications - removed setter for performance
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
      // Only trigger shortcuts when not typing in an input field
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
  const logoSrc = useMemo(() => (theme === "light" ? logoLight : logoDark), [theme])

  // Memoized logo dimensions based on screen size
  const logoSize = useMemo(() => {
    if (isMobile) return { height: 40, maxWidth: 200 }
    if (isTablet) return { height: 50, maxWidth: 300 }
    return { height: 60, maxWidth: 400 }
  }, [isMobile, isTablet])

  // Early return for loading state
  if (!mounted || !user) {
    return <LoadingSkeleton />
  }

  return (
    <header
      className="sticky top-0 z-50 flex h-14 sm:h-16 md:h-20 items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 md:px-6 transition-all duration-200"
      role="banner"
      aria-label="Cabeçalho do sistema"
    >
      {/* Left side - Mobile menu for non-kiosk users - Hidden on mobile */}
      {!isKioskUser && !isMobile && (
        <div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-accent/50 transition-colors"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="h-4 sm:h-5 w-4 sm:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 sm:w-80">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Center - Logo */}
      <div className="flex flex-1 justify-center">
        <div className="relative group">
          <Image
            src={logoSrc || "/placeholder.svg"}
            alt="Logo Prefeitura Itaguaí - Sistema Biométrico"
            style={{
              height: logoSize.height,
              width: "auto",
              maxWidth: logoSize.maxWidth,
            }}
            className="object-contain transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>

      {/* Right side - Actions and user menu */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Keyboard shortcuts button - tablet and up only */}
        {!isMobile && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleKeyboardShortcuts}
              className="hover:bg-accent/50 transition-colors hidden sm:flex h-8 w-8 sm:h-9 sm:w-9"
              aria-label="Atalhos de teclado"
            >
              <Keyboard className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
            </Button>

            <KeyboardShortcutsPanel isVisible={showKeyboardShortcuts} />
          </div>
        )}

        {/* Notifications (only for non-kiosk users) - hidden on small mobile */}
        {!isKioskUser && !isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent/50 transition-colors h-8 w-8 sm:h-9 sm:w-9"
            aria-label={notifications > 0 ? `${notifications} notificações não lidas` : "Notificações"}
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-xs animate-pulse"
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
          className="hover:bg-accent/50 transition-colors h-8 w-8 sm:h-9 sm:w-9"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
          ) : (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
          )}
        </Button>

        {/* User menu */}
        {!isKioskUser || liberado ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-auto p-1 sm:p-2 hover:bg-accent/50 transition-colors group"
                aria-label="Menu do usuário"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="relative">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 ring-2 ring-background shadow-md">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs sm:text-sm">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 bg-emerald-500 border-2 border-background rounded-full" />
                  </div>

                  {/* User info - only on tablet and up */}
                  {!isMobile && (
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs sm:text-sm font-semibold text-foreground">{userFirstName}</span>
                      <Badge variant="outline" className={cn("text-xs font-medium h-4 sm:h-5", userRoleColor)}>
                        {isKioskUser && <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />}
                        <span className="text-[10px] sm:text-xs">{userRoleLabel}</span>
                      </Badge>
                    </div>
                  )}

                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 sm:w-64 md:w-72 p-0 shadow-lg border-0 bg-white"
              sideOffset={8}
            >
              {/* User Profile Section */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 pb-2 sm:pb-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-slate-200">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-xs sm:text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 leading-tight">{user?.nome}</h4>
                    <p className="text-[10px] sm:text-xs text-slate-600 font-medium leading-relaxed truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="px-3 sm:px-4 pb-2 sm:pb-3">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1", userRoleColor)}
                  >
                    {isKioskUser && <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 sm:mr-1.5" />}
                    {userRoleLabel}
                  </Badge>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-0" />

              {/* Menu Items */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={handleProfileClick}
                  className="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-slate-50 transition-colors focus:bg-slate-50 focus:text-slate-900"
                >
                  <User className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
                  <span className="font-medium text-xs sm:text-sm text-slate-900">Meu Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSettingsClick}
                  className="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-slate-50 transition-colors focus:bg-slate-50 focus:text-slate-900"
                >
                  <Settings className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
                  <span className="font-medium text-xs sm:text-sm text-slate-900">Configurações</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-0" />

              {/* Logout */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={logout}
                  className="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:bg-red-50 focus:text-red-700"
                >
                  <LogOut className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="font-medium text-xs sm:text-sm">Sair do Sistema</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setModalOpen(true)}
            className="relative h-auto p-1 sm:p-2 hover:bg-accent/50 transition-colors group"
            aria-label="Acessar modo administrador"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 ring-2 ring-background shadow-md">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-xs sm:text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
              </div>

              {/* User info - only on tablet and up */}
              {!isMobile && (
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{userFirstName}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] sm:text-xs font-medium h-4 sm:h-5 bg-purple-100 text-purple-800 border-purple-200"
                  >
                    <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="text-[10px] sm:text-xs">Restrito</span>
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
