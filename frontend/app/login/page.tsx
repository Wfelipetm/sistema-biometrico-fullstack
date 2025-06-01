"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, User, Eye, EyeOff, Loader2, Shield, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { registrarLog } from "@/utils/logger"
import type { AxiosError } from "axios"
import Image from "next/image"

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
        } catch {}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-blue-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image - Biometria */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/biodedo.jpeg')",
            backgroundColor: "#111827", // Fallback color
          }}
        >
          {/* Overlay para melhorar contraste */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/70 to-gray-900/80"></div>
        </div>

		{/* Content */}
		<div className="relative z-10 flex flex-col justify-center items-center w-full h-full p-12">
		  <div className="flex flex-col items-center justify-center space-y-12 text-center">
			{/* Logo da Prefeitura */}
			<Image
			  width={320}
			  height={120}
			  alt="Logo Prefeitura Municipal de Itaguaí"
			  src="/images/smctic_dark_mode2.png"
			  className="mx-auto mb-26" // Adiciona espaçamento inferior
			  priority
			  style={{ filter: "brightness(0) invert(1)" }}
			/>

			{/* Título do Sistema */}
			<div className="text-center">
			  <h1 className="text-4xl font-bold text-white mb-10">Sistema de Biometria</h1>
			 
			</div>
		  </div>
		</div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] lg:hidden"></div>

        <div className="relative w-full max-w-md space-y-8">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="lg:hidden text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <Image
                width={220}
                height={80}
                alt="Logo Prefeitura Municipal de Itaguaí"
                src="/images/smctic_light_mode.png"
                className="mx-auto block dark:hidden"
                priority
              />
              <Image
                width={220}
                height={80}
                alt="Logo Prefeitura Municipal de Itaguaí"
                src="/images/smctic_dark_mode2.png"
                className="mx-auto hidden dark:block"
                priority
                style={{ filter: "brightness(0) invert(1)" }}
              />
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-gray-500/10 dark:shadow-gray-500/5 p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bem-vindo</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Acesse sua conta para continuar</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 animate-in slide-in-from-top-2 duration-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <User
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                      emailFocused || email ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                    }`}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    className="pl-10 h-12 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </Label>
                  {/* <Link
                    href="/recuperar-senha"
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium transition-colors duration-200"
                  >
                    Esqueceu a senha?
                  </Link> */}
                </div>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                      passwordFocused || password ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                    }`}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className="pl-10 pr-12 h-12 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded transition-all duration-200"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={loading || !email || !password}
                className={`
                  w-full h-12 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                  ${
                    loading
                      ? "bg-gray-500 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                  }
                `}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  "Entrar no Sistema"
                )}
              </Button>

              {/* Register Link */}
              {/* <div className="text-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Não tem uma conta? </span>
                <Link
                  href="/cadastro"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium transition-colors duration-200"
                >
                  Cadastre-se
                </Link>
              </div> */}
            </form>
          </div>

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Sistema de Biometria
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Desenvolvido por <span className="font-medium text-gray-600 dark:text-gray-400">SMCTIC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
