"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User, Shield, Fingerprint } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0057A6]"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      {/* CSS crítico inline para evitar FOUC e CLS */}
      <style jsx global>{`
        /* Prevenir Layout Shift */
        .login-container {
          width: 100%;
          max-width: 24rem; /* 384px */
          margin: 0 auto;
          height: auto;
          min-height: 32rem; /* 512px */
        }
        
        .login-card {
          width: 100%;
          height: auto;
          min-height: 30rem; /* 480px */
          display: flex;
          flex-direction: column;
        }
        
        /* Reservar espaço para mensagens de erro */
        .error-container {
          min-height: 3rem; /* 48px */
        }
        
        /* Garantir que os inputs tenham altura fixa */
        .input-container {
          height: 3rem; /* 48px */
          position: relative;
        }
        
        /* Evitar que o ícone cause layout shift */
        .icon-container {
          position: absolute;
          width: 1.25rem; /* 20px */
          height: 1.25rem; /* 20px */
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      {/* Main Content com dimensões fixas */}
      <div className="login-container">
        <div className="login-card bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-3">
          {/* Header com altura fixa */}
          <div className="text-center" style={{ height: "140px" }}>
            <div
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0057A6] to-[#003d73] rounded-2xl mb-4"
              style={{ width: "64px", height: "64px" }}
            >
              <Fingerprint className="w-8 h-8 text-white" style={{ width: "32px", height: "32px" }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sistema Biométrico</h1>
            <p className="text-gray-600">Acesse sua conta institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Container com altura fixa para mensagens de erro */}
            <div className="error-container">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Email com altura fixa */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                E-mail institucional
              </Label>
              <div className="input-container">
                <div className="icon-container left-3 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="seu.nome@itaguai.rj.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0057A6] focus:border-[#0057A6]"
                  style={{ height: "48px", paddingLeft: "40px" }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password com altura fixa */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                Senha
              </Label>
              <div className="input-container">
                <div className="icon-container left-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0057A6] focus:border-[#0057A6]"
                  style={{ height: "48px", paddingLeft: "40px", paddingRight: "48px" }}
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  style={{ right: "12px", top: "50%", transform: "translateY(-50%)" }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Options com altura fixa */}
            <div className="flex items-center justify-between" style={{ height: "32px" }}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="text-sm text-gray-700 cursor-pointer">
                  Lembrar-me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-[#0057A6] hover:text-[#003d73] focus:outline-none focus:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Submit Button com altura fixa */}
            <div style={{ height: "48px" }}>
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full h-12 bg-[#0057A6] hover:bg-[#003d73] text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-[#0057A6] focus:ring-offset-2 disabled:opacity-50"
                style={{ height: "48px" }}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>

          {/* Security Indicator com altura fixa */}
          <div className="text-center pt-4" style={{ height: "32px" }}>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Conexão segura</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
