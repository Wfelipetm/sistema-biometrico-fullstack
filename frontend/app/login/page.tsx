"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User, Shield, Fingerprint, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api"
import { registrarLog } from "@/utils/logger"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()

  // Validação simples
  const isEmailValid = email.includes("@itaguai.rj.gov.br") && email.includes(".")
  const isPasswordValid = password.length >= 6
  const isFormValid = isEmailValid && isPasswordValid

  // Verificação de autenticação
  useEffect(() => {
    const checkAuth = () => {
      const hasToken = document.cookie.includes("token=")
      if (hasToken && pathname === "/login") {
        const userCookie = document.cookie.split(";").find((c) => c.trim().startsWith("user="))
        if (userCookie) {
          try {
            const user = JSON.parse(decodeURIComponent(userCookie.split("=")[1]))
            window.location.href = user.papel === "gestor" ? "/dashboard/unidades" : "/dashboard"
            return
          } catch (e) {
            console.error("Error parsing user cookie:", e)
          }
        }
      }
      setCheckedAuth(true)
    }
    checkAuth()
  }, [pathname])

  // Foco automático
  useEffect(() => {
    if (checkedAuth && emailRef.current) {
      emailRef.current.focus()
    }
  }, [checkedAuth])

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setError("")
    setLoading(true)

    try {
      const response = await api.post("/auth/login", {
        email,
        senha: password,
        lembrar: rememberMe,
      })

      // Log de sucesso
      registrarLog({
        usuario_id: response.data.usuario?.id ?? null,
        acao: "Login efetuado com sucesso",
        rota: "/auth/login",
        metodo_http: "POST",
        status_code: 200,
        dados: { email, lembrar: rememberMe },
        sistema: "web",
        modulo: "Login",
        ip: null,
        user_agent: navigator.userAgent,
      })

      // Armazenar dados
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.usuario))
      api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`

      const cookieOptions = rememberMe ? "; max-age=2592000" : ""
      document.cookie = `token=${response.data.token}; path=/${cookieOptions}`
      document.cookie = `user=${encodeURIComponent(JSON.stringify(response.data.usuario))}; path=/${cookieOptions}`

      // Redirecionamento
      const role = response.data.usuario?.papel
      window.location.href = role === "gestor" ? "/dashboard/unidades" : "/dashboard"
    } catch (err: any) {
      let errorMessage = "Erro interno do servidor. Tente novamente."

      if (err.response?.status === 401) {
        errorMessage = "E-mail ou senha incorretos."
      } else if (err.response?.status === 429) {
        errorMessage = "Muitas tentativas. Aguarde alguns minutos."
      } else if (err.response?.status === 403) {
        errorMessage = "Conta suspensa. Entre em contato com o suporte."
      }

      setError(errorMessage)

      // Log de erro
      registrarLog({
        usuario_id: null,
        acao: "Falha no login",
        rota: "/auth/login",
        metodo_http: "POST",
        status_code: err.response?.status ?? null,
        dados: { email },
        sistema: "web",
        modulo: "Login",
        ip: null,
        user_agent: navigator.userAgent,
      })
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (!checkedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-itaguai-50 via-white to-itaguai-100">
        <div className="flex flex-col items-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-itaguai-200 border-t-itaguai-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-itaguai-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-itaguai-900">Sistema Biométrico</h2>
            <p className="text-itaguai-600 font-medium">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-itaguai-50 via-white to-itaguai-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-itaguai-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-itaguai-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-itaguai-100 to-transparent rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Container principal */}
      <div className="w-full max-w-md mx-auto relative z-10 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-itaguai-lg border border-white/20 p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            {/* Logo/Ícone */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-itaguai rounded-2xl shadow-itaguai relative">
              <Fingerprint className="w-10 h-10 text-white drop-shadow-sm" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Título e subtítulo */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-itaguai-900 tracking-tight">Sistema Biométrico</h1>
              <div className="space-y-1">
                <p className="text-itaguai-700 font-medium">Prefeitura de Itaguaí</p>
                <p className="text-sm text-itaguai-600">Acesse sua conta institucional</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensagem de erro */}
            {error && (
              <Alert variant="destructive" className="border-error-200 bg-error-50 animate-scale-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium text-error-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Campo de email */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-itaguai-900">
                E-mail institucional
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-itaguai-400" />
                </div>
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="seu.nome@itaguai.rj.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 text-base border-itaguai-200 rounded-xl focus:ring-2 focus:ring-itaguai-500 focus:border-itaguai-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campo de senha */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-semibold text-itaguai-900">
                Senha
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-itaguai-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-14 h-14 text-base border-itaguai-200 rounded-xl focus:ring-2 focus:ring-itaguai-500 focus:border-itaguai-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-itaguai-400 hover:text-itaguai-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-itaguai-500 rounded-lg"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Opções */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-itaguai-300 data-[state=checked]:bg-itaguai-600 data-[state=checked]:border-itaguai-600"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-sm font-medium text-itaguai-700 cursor-pointer select-none"
                >
                  Lembrar-me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm font-medium text-itaguai-600 hover:text-itaguai-700 focus:outline-none focus:underline transition-colors duration-200"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Botão de submit */}
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full h-14 bg-gradient-itaguai hover:shadow-itaguai text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <Shield className="w-5 h-5" />
                  <span>Entrar no Sistema</span>
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-4 pt-6 border-t border-itaguai-100">
            <div className="flex items-center justify-center space-x-2 text-sm text-itaguai-600">
              <Shield className="w-4 h-4 text-success-600" />
              <span className="font-medium">Conexão segura e criptografada</span>
            </div>

            <div className="text-xs text-itaguai-500 space-y-1">
              <p>© 2025 Prefeitura Municipal de Itaguaí</p>
              <p>Desenvolvido pela Secretaria Municipal de Ciência, Tecnologia e Inovação</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
