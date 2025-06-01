"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, User, Lock, Building, MapPin, Eye, EyeOff, Loader2, UserPlus, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AxiosError } from "axios"
import Image from "next/image"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Secretaria = {
  id: number
  nome: string
  sigla: string
}

type Unidade = {
  id: number
  nome: string
}

type ErrorResponse = {
  message?: string
  error?: string
}

export default function CadastroPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmSenha, setConfirmSenha] = useState("")
  const [secretariaId, setSecretariaId] = useState<number | null>(null)
  const [unidadeId, setUnidadeId] = useState<number | null>(null)
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Estados de foco para animações
  const [nomeFocused, setNomeFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [senhaFocused, setSenhaFocused] = useState(false)
  const [confirmSenhaFocused, setConfirmSenhaFocused] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Buscar secretarias
    const fetchSecretarias = async () => {
      try {
        const response = await fetch(`${API_URL}/secre`)
        if (!response.ok) throw new Error("Falha ao buscar secretarias")
        const data = await response.json()
        setSecretarias(data)
      } catch (error) {
        console.error("Erro ao buscar secretarias:", error)
        setError("Não foi possível carregar as secretarias.")
      }
    }

    fetchSecretarias()
  }, [])

  useEffect(() => {
    // Sempre que a secretaria mudar, buscar as unidades relacionadas e resetar unidade selecionada
    if (secretariaId === null) {
      setUnidades([])
      setUnidadeId(null)
      return
    }

    const fetchUnidades = async () => {
      try {
        const response = await fetch(`${API_URL}/secre/${secretariaId}/unidades`)
        if (!response.ok) throw new Error("Falha ao buscar unidades")
        const data = await response.json()
        setUnidades(data)
        setUnidadeId(null) // resetar seleção da unidade quando a secretaria mudar
      } catch (error) {
        console.error("Erro ao buscar unidades:", error)
        setError("Não foi possível carregar as unidades.")
      }
    }

    fetchUnidades()
  }, [secretariaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (senha !== confirmSenha) {
      setError("As senhas não coincidem")
      setLoading(false)
      return
    }

    if (!secretariaId || Number.isNaN(secretariaId)) {
      setError("Selecione uma secretaria válida")
      setLoading(false)
      return
    }

    if (!unidadeId || Number.isNaN(unidadeId)) {
      setError("Selecione uma unidade válida")
      setLoading(false)
      return
    }

    const payload = {
      nome,
      email,
      senha,
      secretaria_id: secretariaId,
      unidade_id: unidadeId,
      papel: "quiosque",
    }

    console.log("Dados enviados:", payload)

    try {
      await api.post("/auth/cadastro", payload)
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      const axiosError = err as AxiosError<ErrorResponse>
      const data = axiosError.response?.data
      const errorMsg = data?.message || data?.error || "Falha no cadastro. Verifique os dados."

      setError(errorMsg)
      console.error("Erro completo:", data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>

      <div className="relative w-full max-w-lg">
        {/* Main Registration Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-gray-500/10 dark:shadow-gray-500/5 p-6 space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-3">
           

            <div className="space-y-1">
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

          {/* Form Section */}
          {success ? (
            <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800 animate-in slide-in-from-top-2 duration-300">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">Cadastro realizado com sucesso! Redirecionando...</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 animate-in slide-in-from-top-2 duration-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Dados Pessoais */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                  Dados Pessoais
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {/* Nome Field */}
                  <div className="space-y-1">
                    <Label htmlFor="nome" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Nome Completo
                    </Label>
                    <div className="relative">
                      <User
                        className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                          nomeFocused || nome ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                        }`}
                      />
                      <Input
                        id="nome"
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        onFocus={() => setNomeFocused(true)}
                        onBlur={() => setNomeFocused(false)}
                        required
                        className="pl-9 h-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </Label>
                    <div className="relative">
                      <User
                        className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
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
                        className="pl-9 h-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                  Localização
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {/* Secretaria Field */}
                  <div className="space-y-1">
                    <Label htmlFor="secretaria" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Secretaria
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Select
                        value={secretariaId !== null ? String(secretariaId) : ""}
                        onValueChange={(val) => setSecretariaId(Number(val))}
                      >
                        <SelectTrigger className="pl-9 h-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white text-sm">
                          <SelectValue placeholder="Selecione a secretaria" />
                        </SelectTrigger>
                        <SelectContent>
                          {secretarias.map((secretaria) => (
                            <SelectItem key={secretaria.id} value={String(secretaria.id)}>
                              {secretaria.sigla} - {secretaria.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Unidade Field */}
                  <div className="space-y-1">
                    <Label htmlFor="unidade" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Unidade
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                      <Select
                        value={unidadeId !== null ? String(unidadeId) : ""}
                        onValueChange={(val) => setUnidadeId(Number(val))}
                        disabled={unidades.length === 0}
                      >
                        <SelectTrigger className="pl-9 h-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white disabled:opacity-50 text-sm">
                          <SelectValue
                            placeholder={
                              unidades.length === 0 ? "Selecione a secretaria primeiro" : "Selecione a unidade"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map((unidade) => (
                            <SelectItem key={unidade.id} value={String(unidade.id)}>
                              {unidade.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 pb-1">
                  Segurança
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Senha Field */}
                  <div className="space-y-1">
                    <Label htmlFor="senha" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Senha
                    </Label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                          senhaFocused || senha ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                        }`}
                      />
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        onFocus={() => setSenhaFocused(true)}
                        onBlur={() => setSenhaFocused(false)}
                        required
                        className="pl-9 pr-9 h-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-all duration-200"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha Field */}
                  <div className="space-y-1">
                    <Label htmlFor="confirmSenha" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Confirmar
                    </Label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
                          confirmSenhaFocused || confirmSenha ? "text-gray-700 dark:text-gray-300" : "text-gray-400"
                        }`}
                      />
                      <Input
                        id="confirmSenha"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme"
                        value={confirmSenha}
                        onChange={(e) => setConfirmSenha(e.target.value)}
                        onFocus={() => setConfirmSenhaFocused(true)}
                        onBlur={() => setConfirmSenhaFocused(false)}
                        required
                        className="pl-9 pr-9 h-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-all duration-200"
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={loading || !nome || !email || !senha || !confirmSenha || !secretariaId || !unidadeId}
                className={`
                w-full h-11 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6
                ${
                  loading
                    ? "bg-gray-500 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none"
                }
              `}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span className="text-sm">Criando conta...</span>
                  </div>
                ) : (
                  "Criar Conta"
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center text-xs pt-2">
                <span className="text-gray-500 dark:text-gray-400">Já tem uma conta? </span>
                <Link
                  href="/login"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-medium transition-colors duration-200"
                >
                  Faça login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} Sistema de Biometria</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Desenvolvido por <span className="font-medium text-gray-600 dark:text-gray-400">SMCTIC</span>
          </p>
        </div>
      </div>
    </div>
  )
}
