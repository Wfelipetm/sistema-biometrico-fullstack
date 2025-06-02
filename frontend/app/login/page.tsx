"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  Shield,
  Info,
  KeyRound,
  Clock,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Timer,
} from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { api } from "@/lib/api"
import { registrarLog } from "@/utils/logger"

// Hook para detectar conexão
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

// Hook para força da senha
const usePasswordStrength = (password: string) => {
  const [strength, setStrength] = useState(0)
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    if (!password) {
      setStrength(0)
      setFeedback("")
      return
    }

    let score = 0
    let feedbackText = ""

    if (password.length >= 8) score += 25
    if (/[A-Z]/.test(password)) score += 25
    if (/[0-9]/.test(password)) score += 25
    if (/[^A-Za-z0-9]/.test(password)) score += 25

    if (score <= 25) feedbackText = "Senha fraca"
    else if (score <= 50) feedbackText = "Senha regular"
    else if (score <= 75) feedbackText = "Senha boa"
    else feedbackText = "Senha forte"

    setStrength(score)
    setFeedback(feedbackText)
  }, [password])

  return { strength, feedback }
}

// Hook para timeout de sessão
const useSessionTimeout = () => {
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutos
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 300 && !showWarning) {
          // 5 minutos restantes
          setShowWarning(true)
        }
        if (prev <= 0) {
          // Logout automático
          window.location.reload()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showWarning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return { timeLeft: formatTime(timeLeft), showWarning }
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [loginProgress, setLoginProgress] = useState(0)
  const [showTooltip, setShowTooltip] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [lockoutTime, setLockoutTime] = useState(0)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [focusedField, setFocusedField] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [announcements, setAnnouncements] = useState<string[]>([])

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const isOnline = useOnlineStatus()
  const { strength: passwordStrength, feedback: passwordFeedback } = usePasswordStrength(password)
  const { timeLeft, showWarning } = useSessionTimeout()

  // Validação de email em tempo real
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isGovEmail = email.includes("@itaguai.rj.gov.br")
    setEmailValid(emailRegex.test(email) && isGovEmail)
  }, [email])

  // Validação de senha em tempo real
  useEffect(() => {
    setPasswordValid(password.length >= 6)
  }, [password])

  // Detectar Caps Lock
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"))
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  // Timer para lockout
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [lockoutTime])

  // Autofoco no campo email
  useEffect(() => {
    if (checkedAuth && emailRef.current) {
      emailRef.current.focus()
    }
  }, [checkedAuth])

  // Anúncios para screen readers
  const addAnnouncement = useCallback((message: string) => {
    setAnnouncements((prev) => [...prev, message])
    setTimeout(() => {
      setAnnouncements((prev) => prev.slice(1))
    }, 3000)
  }, [])

  useEffect(() => {
    // Reset form state
    setEmail("")
    setPassword("")
    setError("")
    setLoading(false)

    // Check for existing authentication
    const hasTokenCookie = document.cookie.split(";").some((c) => c.trim().startsWith("token="))

    if (hasTokenCookie && pathname === "/login") {
      const userCookie = document.cookie.split(";").find((c) => c.trim().startsWith("user="))
      let role = ""

      if (userCookie) {
        try {
          const user = JSON.parse(decodeURIComponent(userCookie.split("=")[1]))
          role = user.papel
        } catch (e) {
          console.error("Error parsing user cookie:", e)
        }
      }

      if (role === "gestor") {
        window.location.href = "/dashboard/unidades"
      } else {
        window.location.href = "/dashboard"
      }
      return
    }

    setCheckedAuth(true)
  }, [pathname])

  const simulateLoginProgress = useCallback(() => {
    setLoginProgress(0)
    const interval = setInterval(() => {
      setLoginProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 30
      })
    }, 200)
    return interval
  }, [])

  const getSpecificErrorMessage = (error: any) => {
    if (error.response?.status === 401) {
      return "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente."
    }
    if (error.response?.status === 429) {
      return "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
    }
    if (error.response?.status === 403) {
      return "Sua conta foi temporariamente suspensa. Entre em contato com o suporte."
    }
    if (!isOnline) {
      return "Sem conexão com a internet. Verifique sua conexão e tente novamente."
    }
    return "Erro interno do servidor. Tente novamente em alguns instantes."
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (lockoutTime > 0) {
      const message = `Muitas tentativas. Tente novamente em ${lockoutTime} segundos.`
      setError(message)
      addAnnouncement(message)
      return
    }

    if (!isOnline) {
      const message = "Sem conexão com a internet. Verifique sua conexão e tente novamente."
      setError(message)
      addAnnouncement(message)
      return
    }

    setError("")
    setLoading(true)
    addAnnouncement("Iniciando autenticação...")
    const progressInterval = simulateLoginProgress()

    try {
      const response = await api.post("/auth/login", {
        email,
        senha: password,
        lembrar: rememberMe,
      })

      await registrarLog({
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

      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.usuario))
      api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`

      const cookieOptions = rememberMe ? "; max-age=2592000" : "" // 30 dias se lembrar
      document.cookie = `token=${response.data.token}; path=/${cookieOptions}`
      document.cookie = `user=${encodeURIComponent(JSON.stringify(response.data.usuario))}; path=/${cookieOptions}`

      // Reset attempts on success
      setAttempts(0)
      setLoginProgress(100)
      addAnnouncement("Login realizado com sucesso! Redirecionando...")

      setTimeout(() => {
        const role = response.data.usuario?.papel
        if (role === "gestor") {
          window.location.href = "/dashboard/unidades"
        } else {
          window.location.href = "/dashboard"
        }
      }, 500)
    } catch (err: unknown) {
      clearInterval(progressInterval)
      setLoginProgress(0)

      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      let errorMessage = ""
      if (newAttempts >= 3) {
        setLockoutTime(30) // 30 seconds lockout
        errorMessage = "Muitas tentativas de login. Conta temporariamente bloqueada por 30 segundos."
      } else {
        errorMessage = getSpecificErrorMessage(err)
        errorMessage += ` ${3 - newAttempts} tentativa(s) restante(s).`
      }

      setError(errorMessage)
      addAnnouncement(errorMessage)

      await registrarLog({
        usuario_id: null,
        acao: "Falha no login",
        rota: "/auth/login",
        metodo_http: "POST",
        status_code: err.response?.status ?? null,
        dados: { email, tentativa: newAttempts },
        sistema: "web",
        modulo: "Login",
        ip: null,
        user_agent: navigator.userAgent,
      })

      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
    addAnnouncement("Redirecionando para recuperação de senha...")
    // Aqui você implementaria a lógica de recuperação de senha
    setTimeout(() => {
      alert(
        "Funcionalidade de recuperação de senha será implementada em breve. Entre em contato com o suporte: (21) 3782-9090",
      )
      setShowForgotPassword(false)
    }, 1000)
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault()
        if (emailValid && passwordValid) {
          handleSubmit(e as any)
        }
      }
      // Navegação por Tab melhorada
      if (e.key === "Tab") {
        addAnnouncement("Navegando pelos campos do formulário")
      }
    },
    [emailValid, passwordValid],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!checkedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center space-y-6" role="status" aria-live="polite">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <div className="absolute inset-0 rounded-full border-2 border-blue-200"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-gray-700">Carregando Sistema</p>
            <p className="text-sm text-gray-500">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    )
  }

  const isFormValid = emailValid && passwordValid && !lockoutTime

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col relative overflow-hidden">
      {/* Screen Reader Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        Pular para o conteúdo principal
      </a>

      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>

      {/* Session Timeout Warning */}
      {showWarning && (
        <div
          className="fixed top-4 right-4 bg-orange-100 border-l-4 border-orange-500 p-4 rounded-md shadow-lg z-40"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center">
            <Timer className="w-5 h-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-orange-800">Sessão expirando em breve</p>
              <p className="text-xs text-orange-700">Tempo restante: {timeLeft}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo e Título */}
          <header className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative group">
                {/* Logo da Prefeitura */}
                <div className="mb-4">
                  <Image
                    src="https://chat.itaguai.rj.gov.br/static/media/logo.67730401.png"
                    alt="Logotipo da Prefeitura Municipal de Itaguaí"
                    width={200}
                    height={80}
                    className="mx-auto h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Sistema de Biometria</h1>
              <p className="text-gray-600 text-lg">Acesse sua conta com segurança</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" aria-hidden="true" />
                <span>Secretaria Municipal de Ciência, Tecnologia e Inovação</span>
              </div>
            </div>
          </header>

          {/* Card de Login */}
          <section
            className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 p-8 space-y-8 transform transition-all duration-300 hover:shadow-3xl"
            aria-labelledby="login-form-title"
          >
            <h2 id="login-form-title" className="sr-only">
              Formulário de Login
            </h2>

            {/* Progress Bar */}
            {loading && (
              <div
                className="space-y-2"
                role="progressbar"
                aria-valuenow={loginProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Autenticando...</span>
                  <span>{Math.round(loginProgress)}%</span>
                </div>
                <Progress value={loginProgress} className="h-2" />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50/90 backdrop-blur-sm animate-in slide-in-from-top-2 duration-300"
                  role="alert"
                  aria-live="assertive"
                >
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription className="text-sm flex items-center justify-between">
                    <span>{error}</span>
                    {attempts > 0 && (
                      <div
                        className="flex items-center space-x-1 text-xs"
                        aria-label={`${attempts} de 3 tentativas utilizadas`}
                      >
                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                        <span>{attempts}/3</span>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {lockoutTime > 0 && (
                <Alert
                  className="border-orange-200 bg-orange-50/90 backdrop-blur-sm"
                  role="alert"
                  aria-live="assertive"
                >
                  <Clock className="h-4 w-4 text-orange-600" aria-hidden="true" />
                  <AlertDescription className="text-sm text-orange-800">
                    Conta temporariamente bloqueada. Aguarde {lockoutTime} segundos.
                  </AlertDescription>
                </Alert>
              )}

              {/* Campo Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>E-mail Institucional *</span>
                  </div>
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip("email")}
                    onMouseLeave={() => setShowTooltip("")}
                    onFocus={() => setShowTooltip("email")}
                    onBlur={() => setShowTooltip("")}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                    aria-label="Informações sobre o campo de e-mail"
                  >
                    <Info className="w-4 h-4" aria-hidden="true" />
                  </button>
                </Label>

                {showTooltip === "email" && (
                  <div
                    className="bg-gray-800 text-white text-xs rounded-lg p-2 animate-in fade-in duration-200"
                    role="tooltip"
                    id="email-tooltip"
                  >
                    Use apenas e-mails com domínio @itaguai.rj.gov.br
                  </div>
                )}

                <div className="relative group">
                  <User
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-200 ${
                      focusedField === "email" ? "text-blue-600 scale-110" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder="seu.nome@itaguai.rj.gov.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => {
                      setFocusedField("email")
                      setEmailTouched(true)
                    }}
                    onBlur={() => setFocusedField("")}
                    disabled={lockoutTime > 0}
                    required
                    autoComplete="email"
                    inputMode="email"
                    aria-describedby={
                      showTooltip === "email"
                        ? "email-tooltip"
                        : emailTouched && !emailValid && email
                          ? "email-error"
                          : undefined
                    }
                    aria-invalid={emailTouched && !emailValid && email ? "true" : "false"}
                    className={`pl-12 h-14 bg-white/70 border-2 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 text-lg ${
                      emailTouched && !emailValid && email
                        ? "border-red-400 focus:border-red-500 shake"
                        : emailTouched && emailValid
                          ? "border-green-400 focus:border-green-500"
                          : "border-gray-300 focus:border-blue-600"
                    } ${lockoutTime > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {emailTouched && emailValid && (
                    <CheckCircle2
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500"
                      aria-label="E-mail válido"
                    />
                  )}
                </div>

                {emailTouched && !emailValid && email && (
                  <div
                    className="flex items-center space-x-2 text-xs text-red-600 animate-in slide-in-from-top-1 duration-200"
                    id="email-error"
                    role="alert"
                  >
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    <span>Use um e-mail válido do domínio @itaguai.rj.gov.br</span>
                  </div>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-900 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span>Senha *</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {passwordTouched && password && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          passwordStrength <= 25
                            ? "bg-red-100 text-red-700"
                            : passwordStrength <= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : passwordStrength <= 75
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                        }`}
                        aria-label={`Força da senha: ${passwordFeedback}`}
                      >
                        {passwordFeedback}
                      </span>
                    )}
                    <KeyRound className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  </div>
                </Label>

                <div className="relative group">
                  <Lock
                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-200 ${
                      focusedField === "password" ? "text-blue-600 scale-110" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => {
                      setFocusedField("password")
                      setPasswordTouched(true)
                    }}
                    onBlur={() => setFocusedField("")}
                    disabled={lockoutTime > 0}
                    required
                    autoComplete="current-password"
                    aria-describedby={passwordTouched && !passwordValid && password ? "password-error" : undefined}
                    aria-invalid={passwordTouched && !passwordValid && password ? "true" : "false"}
                    className={`pl-12 pr-14 h-14 bg-white/70 border-2 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 text-lg ${
                      passwordTouched && !passwordValid && password
                        ? "border-red-400 focus:border-red-500 shake"
                        : passwordTouched && passwordValid
                          ? "border-green-400 focus:border-green-500"
                          : "border-gray-300 focus:border-blue-600"
                    } ${lockoutTime > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-xl transition-all duration-200 hover:bg-gray-100"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <Eye className="w-5 h-5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordTouched && password && (
                  <div className="space-y-2">
                    <div
                      className="flex space-x-1"
                      role="progressbar"
                      aria-label="Força da senha"
                      aria-valuenow={passwordStrength}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            passwordStrength >= level * 25
                              ? level <= 1
                                ? "bg-red-500"
                                : level <= 2
                                  ? "bg-yellow-500"
                                  : level <= 3
                                    ? "bg-blue-500"
                                    : "bg-green-500"
                              : "bg-gray-200"
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {capsLockOn && focusedField === "password" && (
                  <div
                    className="flex items-center space-x-2 text-xs text-orange-600 animate-in slide-in-from-top-1 duration-200"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                    <span>Caps Lock está ativado</span>
                  </div>
                )}

                {passwordTouched && !passwordValid && password && (
                  <div
                    className="flex items-center space-x-2 text-xs text-red-600 animate-in slide-in-from-top-1 duration-200"
                    id="password-error"
                    role="alert"
                  >
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    <span>A senha deve ter pelo menos 6 caracteres</span>
                  </div>
                )}
              </div>

              {/* Lembrar-me e Esqueci a senha */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="focus:ring-4 focus:ring-blue-500/20"
                    aria-describedby="remember-me-description"
                  />
                  <Label htmlFor="remember-me" className="text-sm text-gray-700 cursor-pointer select-none">
                    Lembrar-me
                  </Label>
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip("remember")}
                    onMouseLeave={() => setShowTooltip("")}
                    onFocus={() => setShowTooltip("remember")}
                    onBlur={() => setShowTooltip("")}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                    aria-label="Informações sobre lembrar login"
                  >
                    <HelpCircle className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={showForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 transition-colors duration-200 disabled:opacity-50"
                >
                  {showForgotPassword ? "Processando..." : "Esqueci minha senha"}
                </button>
              </div>

              {showTooltip === "remember" && (
                <div
                  className="bg-gray-800 text-white text-xs rounded-lg p-2 animate-in fade-in duration-200"
                  role="tooltip"
                  id="remember-me-description"
                >
                  Manterá você conectado por 30 dias neste dispositivo
                </div>
              )}

              {/* Botão de Login */}
              <Button
                type="submit"
                disabled={loading || !isFormValid || !isOnline}
                className={`w-full h-14 rounded-2xl font-semibold text-lg transition-all duration-300 transform focus:ring-4 focus:ring-blue-500/20 focus:outline-none ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : isFormValid && isOnline
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-describedby={!isFormValid ? "form-validation-message" : undefined}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="animate-spin w-6 h-6" aria-hidden="true" />
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Lock className="w-6 h-6" aria-hidden="true" />
                    <span>Acessar Sistema</span>
                  </div>
                )}
              </Button>

              {!isFormValid && (
                <div id="form-validation-message" className="sr-only">
                  Para fazer login, preencha um e-mail válido do domínio @itaguai.rj.gov.br e uma senha com pelo menos 6
                  caracteres.
                </div>
              )}
            </form>

            {/* Indicadores de Segurança */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-blue-50/80 rounded-xl p-4 border border-blue-200">
                <Shield className="w-5 h-5 text-blue-500" aria-hidden="true" />
                <span>Conexão segura e criptografada</span>
              </div>
            </div>

            {/* Informações de Acessibilidade */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Use Tab para navegar, Enter para confirmar, Espaço para marcar caixas de seleção
              </p>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `}</style>
    </div>
  )
}
