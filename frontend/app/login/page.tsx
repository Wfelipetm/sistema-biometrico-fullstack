"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User, Shield, Fingerprint, Building2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { registrarLog } from "@/utils/logger"
import type { AxiosError } from "axios"
import Image from "next/image"

import NeuralNetworkBackground from "@/components/neural-network-background"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const emailRef = useRef<HTMLInputElement>(null)
  const isEmailValid = email.includes("@itaguai.rj.gov.br") && email.includes(".")
  const isPasswordValid = password.length >= 6
  const isFormValid = isEmailValid && isPasswordValid

  useEffect(() => {
    setEmail("")
    setPassword("")
    setError("")
    setLoading(false)

    // Checa o token no cookie
    const hasTokenCookie = document.cookie.split(";").some((c) => c.trim().startsWith("token="))
    if (hasTokenCookie && pathname === "/login") {
      // Lê o papel do usuário do cookie "user"
      const userCookie = document.cookie.split(";").find((c) => c.trim().startsWith("user="))
      let papel = ""
      if (userCookie) {
        try {
          const user = JSON.parse(decodeURIComponent(userCookie.split("=")[1]))
          papel = user.papel
        } catch { }
      }
      if (papel === "gestor") {
        window.location.href = "/dashboard/unidades"
      } else {
        window.location.href = "/dashboard"
      }
      return
    }

    setCheckedAuth(true)
  }, [pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await api.post("/auth/login", {
        email,
        senha: password,
      })

      // Log de login com sucesso
      await registrarLog({
        usuario_id: response.data.usuario?.id ?? null,
        acao: "Login efetuado com sucesso",
        rota: "/auth/login",
        metodo_http: "POST",
        status_code: 200,
        dados: { email },
        sistema: "web",
        modulo: "Login",
        ip: null,
        user_agent: navigator.userAgent,
      })

      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.usuario))
      api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`
      document.cookie = `token=${response.data.token}; path=/;`
      document.cookie = `user=${encodeURIComponent(JSON.stringify(response.data.usuario))}; path=/;`

      setTimeout(() => {
        const papel = response.data.usuario?.papel
        if (papel === "gestor") {
          window.location.href = "/dashboard/unidades"
        } else {
          window.location.href = "/dashboard"
        }
      }, 100)
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>

      await registrarLog({
        usuario_id: null,
        acao: "Falha no login",
        rota: "/auth/login",
        metodo_http: "POST",
        status_code: error.response?.status ?? null,
        dados: { email },
        sistema: "web",
        modulo: "Login",
        ip: null,
        user_agent: navigator.userAgent,
      })

      setError("Credenciais inválidas. Verifique seu email e senha.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-itaguai rounded-2xl shadow-itaguai relative">
              <Fingerprint className="w-10 h-10 text-white drop-shadow-sm" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-itaguai-900 tracking-tight">Sistema Biométrico</h1>
              <div className="space-y-1">
                <p className="text-itaguai-700 font-medium">Prefeitura de Itaguaí</p>
                <p className="text-sm text-itaguai-600">Acesse sua conta institucional</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mensagem de erro */}
            {error && (
              <Alert variant="destructive" className="border-error-200 bg-error-50 animate-scale-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium text-error-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
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
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="pl-12 h-14 text-base border-itaguai-200 rounded-xl focus:ring-2 focus:ring-itaguai-500 focus:border-itaguai-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              
              <div className="relative">
                <Label htmlFor="password" className="text-sm font-semibold text-itaguai-900">
                  Senha
                </Label>
                <div className="absolute mt-4 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-itaguai-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  className="pl-12 pr-14 h-14 text-base border-itaguai-200 rounded-xl focus:ring-2 focus:ring-itaguai-500 focus:border-itaguai-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-itaguai-400 hover:text-itaguai-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-itaguai-500 rounded-lg"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 mt-7" /> : <Eye className="h-5 w-5 mt-7" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
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

            {/* Register Link */}
            {/* <div className="text-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Não tem uma conta? </span>
                  <Link
                    href="/cadastro"
                    className="text-blue-600 dark:text-gray-400 hover:text-blue-800 dark:hover:text-gray-300 font-medium transition-colors duration-200"
                  >
                    Cadastre-se
                  </Link>
                </div> */}
          </form>
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

        {/* Footer */}
      </div>
    </div>

  )
}
