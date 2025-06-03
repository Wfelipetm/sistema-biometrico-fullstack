"use client"

import { useEffect, useRef } from "react"
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

export default function Header() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [liberado, setLiberado] = useState(false)
  const [notifications, setNotifications] = useState(3) // Simulated notifications
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger shortcuts when not typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Alt+K to show keyboard shortcuts
      if (e.altKey && e.key === "k") {
        setShowKeyboardShortcuts((prev) => !prev)
      }

      // Alt+D to go to dashboard
      if (e.altKey && e.key === "d") {
        router.push("/dashboard")
      }

      // Alt+P to go to profile
      if (e.altKey && e.key === "p") {
        router.push("/profile")
      }

      // Alt+T to toggle theme
      if (e.altKey && e.key === "t") {
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [theme, setTheme, router])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowKeyboardShortcuts(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user) {
    return (
      <header className="sticky top-0 z-50 flex h-20 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <div className="flex flex-1 justify-center">
          <div className="h-12 w-48 bg-muted animate-pulse rounded-lg" />
        </div>
      </header>
    )
  }

  const getInitials = (name: string) => {
    if (!name) return "US"
    return name
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "gestor":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "funcionario":
        return "bg-green-100 text-green-800 border-green-200"
      case "quiosque":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "gestor":
        return "Gestor"
      case "funcionario":
        return "Funcionário"
      case "quiosque":
        return "Quiosque"
      default:
        return role
    }
  }

  const getFirstName = (fullName: string) => {
    if (!fullName) return "Usuário"
    return fullName.trim().split(" ")[0]
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  return (
    <header
      className="sticky top-0 z-50 flex h-20 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 transition-all duration-200"
      role="banner"
      aria-label="Cabeçalho do sistema"
    >
      {/* Left side - Mobile menu for non-kiosk users */}
      {user.papel !== "quiosque" && (
        <div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-accent/50 transition-colors"
                aria-label="Abrir menu de navegação"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Center - Logo */}
      <div className="flex flex-1 justify-center">
        <div className="relative group">
          <Image
            src={theme === "light" ? logoLight : logoDark}
            alt="Logo Prefeitura Itaguaí - Sistema Biométrico"
            style={{ height: 60, width: "auto", maxWidth: 400 }}
            className="object-contain transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>

      {/* Right side - Actions and user menu */}
      <div className="flex items-center gap-2">
        {/* Keyboard shortcuts button */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
            className="hover:bg-accent/50 transition-colors hidden sm:flex"
            aria-label="Atalhos de teclado"
          >
            <Keyboard className="h-5 w-5 text-slate-600" />
          </Button>

          {showKeyboardShortcuts && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-slate-200 z-50">
              <div className="p-3 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-900">Atalhos de Teclado</h3>
              </div>
              <div className="p-2">
                <ul className="space-y-1">
                  <li className="flex justify-between items-center p-2 text-xs hover:bg-slate-50 rounded-md">
                    <span className="text-slate-700">Dashboard</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">Alt + D</kbd>
                  </li>
                  <li className="flex justify-between items-center p-2 text-xs hover:bg-slate-50 rounded-md">
                    <span className="text-slate-700">Perfil</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">Alt + P</kbd>
                  </li>
                  <li className="flex justify-between items-center p-2 text-xs hover:bg-slate-50 rounded-md">
                    <span className="text-slate-700">Alternar tema</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">Alt + T</kbd>
                  </li>
                  <li className="flex justify-between items-center p-2 text-xs hover:bg-slate-50 rounded-md">
                    <span className="text-slate-700">Atalhos</span>
                    <kbd className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs">Alt + K</kbd>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Notifications (only for non-kiosk users) */}
        {user.papel !== "quiosque" && (
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-accent/50 transition-colors"
            aria-label={notifications > 0 ? `${notifications} notificações não lidas` : "Notificações"}
          >
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
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
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-accent/50 transition-colors"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </Button>

        {/* User menu */}
        {user.papel !== "quiosque" || liberado ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-auto p-2 hover:bg-accent/50 transition-colors group"
                aria-label="Menu do usuário"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9 ring-2 ring-background shadow-md">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {getInitials(user?.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
                  </div>

                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-foreground">{getFirstName(user?.nome)}</span>
                    <Badge variant="outline" className={cn("text-xs font-medium h-5", getRoleColor(user?.papel))}>
                      {user?.papel === "quiosque" && <Shield className="h-3 w-3 mr-1" />}
                      {getRoleLabel(user?.papel)}
                    </Badge>
                  </div>

                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-0 shadow-lg border-0 bg-white" sideOffset={8}>
              {/* User Profile Section */}
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-start gap-4 p-4 pb-3">
                  <Avatar className="h-12 w-12 ring-2 ring-slate-200">
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">
                      {getInitials(user?.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1 min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-slate-900 leading-tight">{user?.nome}</h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <Badge variant="outline" className={cn("text-xs font-medium px-2 py-1", getRoleColor(user?.papel))}>
                    {user?.papel === "quiosque" && <Shield className="h-3 w-3 mr-1.5" />}
                    {getRoleLabel(user?.papel)}
                  </Badge>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-0" />

              {/* Menu Items */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={handleProfileClick}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors focus:bg-slate-50 focus:text-slate-900"
                >
                  <User className="mr-3 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-sm text-slate-900">Meu Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleSettingsClick}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors focus:bg-slate-50 focus:text-slate-900"
                >
                  <Settings className="mr-3 h-4 w-4 text-slate-600" />
                  <span className="font-medium text-sm text-slate-900">Configurações</span>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="my-0" />

              {/* Logout */}
              <div className="py-1">
                <DropdownMenuItem
                  onClick={logout}
                  className="px-4 py-3 cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:bg-red-50 focus:text-red-700"
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
            className="relative h-auto p-2 hover:bg-accent/50 transition-colors group"
            aria-label="Acessar modo administrador"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-9 w-9 ring-2 ring-background shadow-md">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.nome} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold">
                    {getInitials(user?.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-foreground">{getFirstName(user?.nome)}</span>
                <Badge
                  variant="outline"
                  className="text-xs font-medium h-5 bg-purple-100 text-purple-800 border-purple-200"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  Restrito
                </Badge>
              </div>
            </div>
          </Button>
        )}

        {/* Password modal for kiosk mode */}
        <ModalSenhaAdmin
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={() => {
            setLiberado(true)
            setModalOpen(false)
          }}
        />
      </div>
    </header>
  )
}
