"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  User,
  CreditCard,
  Briefcase,
  Hash,
  Clock,
  Phone,
  Mail,
  Building2,
  Calendar,
  Check,
  Loader2,
  Save,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

type Unidade = {
  id: string
  nome: string
  secretaria_id: string
}

type ModalCadastroFuncionariosProps = {
  dialogTitle?: string
  onSuccess?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ESCALAS = [
  { value: "8h", label: "8h" },
  { value: "12h", label: "12h" },
  { value: "16h", label: "16h" },
  { value: "24h", label: "24h" },
  { value: "12x36", label: "12x36" },
  { value: "24x72", label: "24x72" },
  { value: "32h", label: "32h" },
  { value: "20h", label: "20h" },
]

export default function ModalCadastroFuncionarios({
  dialogTitle = "Novo Funcionário",
  onSuccess,
  open,
  onOpenChange,
}: ModalCadastroFuncionariosProps) {
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [cargo, setCargo] = useState("")
  const [matricula, setMatricula] = useState("")
  const [tipoEscala, setTipoEscala] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const [dataAdmissao, setDataAdmissao] = useState(new Date().toISOString().slice(0, 10))
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    nome?: string
    cpf?: string
    cargo?: string
    email?: string
    telefone?: string
  }>({})

  const router = useRouter()
  const { user } = useAuth()

  // Validação em tempo real
  useEffect(() => {
    const errors: typeof validationErrors = {}

    if (nome && nome.length < 2) {
      errors.nome = "Nome deve ter pelo menos 2 caracteres"
    }
    if (nome && nome.length > 100) {
      errors.nome = "Nome deve ter no máximo 100 caracteres"
    }

    if (cpf && cpf.length > 0 && cpf.length !== 11) {
      errors.cpf = "CPF deve ter 11 dígitos"
    }

    if (cargo && cargo.length < 2) {
      errors.cargo = "Cargo deve ter pelo menos 2 caracteres"
    }

    if (email && email.length > 0 && !email.includes("@")) {
      errors.email = "Email deve ter um formato válido"
    }

    if (telefone && telefone.length > 0 && telefone.length < 10) {
      errors.telefone = "Telefone deve ter pelo menos 10 dígitos"
    }

    setValidationErrors(errors)
  }, [nome, cpf, cargo, email, telefone])

  useEffect(() => {
    if (!user) return
    const fetchUnidades = async () => {
      try {
        const response = await api.get(`/secre/${user.secretaria_id}/unidades`)
        setUnidades(response.data)

        // Se for gestor, já seta a unidadeId automaticamente ao abrir o modal
        if (user.papel === "gestor" && user.unidade_id) {
          const unidadeGestor = response.data.find((u: Unidade) => String(u.id) === String(user.unidade_id))
          if (unidadeGestor) setUnidadeId(unidadeGestor.id)
        }
      } catch (error) {
        console.error("Erro ao buscar unidades:", error)
        setError("Não foi possível carregar as unidades.")
      }
    }
    fetchUnidades()
  }, [user])

  const resetForm = () => {
    setNome("")
    setCpf("")
    setCargo("")
    setMatricula("")
    setTipoEscala("")
    setTelefone("")
    setEmail("")
    setUnidadeId("")
    setDataAdmissao(new Date().toISOString().slice(0, 10))
    setError("")
    setSuccess(false)
    setUploadProgress(0)
    setValidationErrors({})
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.slice(0, 11)
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.slice(0, 11)
  }

  const isFormValid = () => {
    return (
      nome.trim().length >= 2 &&
      cpf.length === 11 &&
      cargo.trim().length >= 2 &&
      tipoEscala &&
      unidadeId &&
      dataAdmissao &&
      Object.keys(validationErrors).length === 0
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setUploadProgress(0)

    if (!isFormValid()) {
      setError("Por favor, corrija os erros antes de continuar.")
      setLoading(false)
      return
    }

    const payload = {
      userName: nome.trim(),
      cpf,
      cargo: cargo.trim(),
      matricula: matricula ? Number(matricula) : undefined,
      unidade_id: Number(unidadeId),
      tipo_escala: tipoEscala,
      telefone,
      email: email.trim(),
      data_admissao: dataAdmissao,
    }
// DEPURAÇÃO
  console.log(">>> Enviando para o servidor:");
  console.log("URL:", "https://127.0.0.1:5000/register");
  console.log("Headers:", { "Content-Type": "application/json" });
  console.log("Payload:", payload);
  console.log("Payload JSON:", JSON.stringify(payload));
    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("https://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorBody = await response.text()
        setError(`Erro no backend Python. Status: ${response.status}, mensagem: ${errorBody}`)
        return
      }

      await response.json()
      setUploadProgress(100)
      setSuccess(true)

      // Aguardar um pouco para mostrar o sucesso
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        router.refresh()
        onSuccess?.()
      }, 1500)
    } catch (err: unknown) {
      if (open) {
        if (isErrorWithMessage(err)) {
          if (err.message === "Failed to fetch") {
            setError("Cadastro cancelado. Verifique sua conexão ou tente mais tarde.")
          } else {
            console.error("Erro ao cadastrar funcionário:", err.message)
            setError("Erro ao cadastrar funcionário. Verifique os dados e tente novamente.")
          }
        } else {
          setError("Erro desconhecido ao cadastrar funcionário. Tente novamente.")
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) setError("")
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm">
              <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Preencha os dados para cadastrar um novo funcionário na unidade.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Check className="w-8 h-8 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Funcionário Cadastrado!</h3>
              <p className="text-gray-600 dark:text-gray-400">O funcionário foi registrado com sucesso.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 dark:bg-red-900/20 animate-in slide-in-from-top-2 duration-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Silva Santos"
                    required
                    autoFocus
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                  {validationErrors.nome && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.nome}
                    </p>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Mínimo 2 caracteres</span>
                    <span className={nome.length > 100 ? "text-red-500 dark:text-red-400" : ""}>{nome.length}/100</span>
                  </div>
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="12345678901"
                    required
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                  {validationErrors.cpf && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.cpf}
                    </p>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Apenas números</span>
                    <span className={cpf.length !== 11 && cpf.length > 0 ? "text-red-500 dark:text-red-400" : ""}>
                      {cpf.length}/11
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados Profissionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Dados Profissionais
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cargo */}
                <div className="space-y-2">
                  <Label htmlFor="cargo" className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Cargo
                  </Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Enfermeiro"
                    required
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                  {validationErrors.cargo && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.cargo}
                    </p>
                  )}
                </div>

                {/* Matrícula */}
                <div className="space-y-2">
                  <Label htmlFor="matricula" className="text-sm font-medium flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Matrícula
                  </Label>
                  <Input
                    id="matricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Escala */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Tipo de Escala
                  </Label>
                  <Select value={tipoEscala} onValueChange={setTipoEscala} required>
                    <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600 text-gray-700 dark:text-gray-300">
                      <SelectValue placeholder="Selecione a escala" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {ESCALAS.map((escala) => (
                        <SelectItem
                          key={escala.value}
                          value={escala.value}
                          className="hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {escala.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data de Admissão */}
                <div className="space-y-2">
                  <Label htmlFor="dataAdmissao" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Data de Admissão
                  </Label>
                  <Input
                    id="dataAdmissao"
                    type="date"
                    value={dataAdmissao}
                    onChange={(e) => setDataAdmissao(e.target.value)}
                    required
                    className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Contato e Localização */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Contato e Localização
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Telefone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="11987654321"
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                  {validationErrors.telefone && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.telefone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="joao@email.com"
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Unidade */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Unidade
                </Label>
                <Select value={unidadeId} onValueChange={setUnidadeId} required>
                  <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600 text-gray-700 dark:text-gray-300">
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {user?.papel === "gestor" && user.unidade_id
                      ? unidades
                          .filter((unidade) => String(unidade.id) === String(user.unidade_id))
                          .map((unidade) => (
                            <SelectItem
                              key={unidade.id}
                              value={unidade.id}
                              className="hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              {unidade.nome}
                            </SelectItem>
                          ))
                      : unidades.map((unidade) => (
                          <SelectItem
                            key={unidade.id}
                            value={String(unidade.id)}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {unidade.nome}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress Bar durante upload */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Enviando dados...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-6 h-11 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`px-8 h-11 font-medium transition-all duration-300 ${
                  loading
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : isFormValid()
                      ? "bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-800 text-white"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Cadastrar Funcionário</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
