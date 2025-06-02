"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
  Calendar,
  Check,
  Loader2,
  Save,
  MailIcon,
} from "lucide-react"
import { api } from "@/lib/api"

interface FuncionarioEditado {
  id: string
  nome: string
  cpf: string
  cargo: string
  email: string
  data_admissao: string
  unidade_id: number
  matricula: string
  tipo_escala: string
  telefone: string
}

interface ModalEditarFuncionarioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  funcionario: FuncionarioEditado
  onSuccess: () => void
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

export default function ModalEditarFuncionario({
  open,
  onOpenChange,
  funcionario,
  onSuccess,
}: ModalEditarFuncionarioProps) {
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [cargo, setCargo] = useState("")
  const [dataAdmissao, setDataAdmissao] = useState("")
  const [matricula, setMatricula] = useState("")
  const [tipoEscala, setTipoEscala] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<{
    nome?: string
    cpf?: string
    cargo?: string
    telefone?: string
    email?: string
  }>({})

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

    if (telefone && telefone.length > 0 && telefone.length < 10) {
      errors.telefone = "Telefone deve ter pelo menos 10 dígitos"
    }

    setValidationErrors(errors)
  }, [nome, cpf, cargo, telefone])

  useEffect(() => {
    if (open && funcionario?.id) {
      const fetchFuncionario = async () => {
        try {
          const { data } = await api.get(`funci/funcionario/${funcionario.id}`)
          setNome(data.nome || "")
          setCpf(data.cpf || "")
          setCargo(data.cargo || "")
          setDataAdmissao(data.data_admissao?.substring(0, 10) || "")
          setMatricula(data.matricula || "")
          setTipoEscala(data.tipo_escala || "")
          setTelefone(data.telefone || "")
          setEmail(data.email || "")
          setError("")
          setSuccess(false)
          setUploadProgress(0)
          setValidationErrors({})
        } catch (error) {
          console.error("Erro ao buscar funcionário:", error)
          setError("Erro ao carregar dados do funcionário.")
        }
      }

      fetchFuncionario()
    }
  }, [open, funcionario?.id])

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
      dataAdmissao &&
      Object.keys(validationErrors).length === 0
    )
  }

  const hasChanges = () => {
    return (
      nome !== funcionario.nome ||
      cpf !== funcionario.cpf ||
      cargo !== funcionario.cargo ||
      dataAdmissao !== funcionario.data_admissao?.substring(0, 10) ||
      matricula !== funcionario.matricula ||
      tipoEscala !== funcionario.tipo_escala ||
      telefone !== funcionario.telefone ||
      email !== funcionario.email
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    setUploadProgress(0)

    if (!isFormValid()) {
      setError("Por favor, corrija os erros antes de continuar.")
      setLoading(false)
      return
    }

    if (!hasChanges()) {
      setError("Nenhuma alteração detectada.")
      setLoading(false)
      return
    }

    try {
      const payload: Partial<FuncionarioEditado> = {}

      if (nome !== funcionario.nome) payload.nome = nome.trim()
      if (cpf !== funcionario.cpf) payload.cpf = cpf
      if (cargo !== funcionario.cargo) payload.cargo = cargo.trim()
      if (dataAdmissao !== funcionario.data_admissao?.substring(0, 10)) payload.data_admissao = dataAdmissao
      if (matricula !== funcionario.matricula) payload.matricula = matricula
      if (tipoEscala !== funcionario.tipo_escala) payload.tipo_escala = tipoEscala
      if (telefone !== funcionario.telefone) payload.telefone = telefone
      if (email !== funcionario.email) payload.email = email.trim()

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

      await api.put(`funci/funcionario/${funcionario.id}`, payload)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)

      // Aguardar um pouco para mostrar o sucesso
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error)
      setError("Erro ao atualizar funcionário. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm">
              <User className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Editar Funcionário</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Atualize os dados do funcionário {funcionario.nome}.
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Funcionário Atualizado!</h3>
              <p className="text-gray-600 dark:text-gray-400">As alterações foram salvas com sucesso.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
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
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                Email
              </Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: joao.silva@example.com"
                required
                className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.email}
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Mínimo 2 caracteres</span>
                <span className={email.length > 100 ? "text-red-500 dark:text-red-400" : ""}>{email.length}/100</span>
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

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Contato
              </h3>

              <div className="grid grid-cols-1 gap-4">
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
              </div>
            </div>

            {/* Progress Bar durante upload */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Atualizando dados...</span>
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
                onClick={handleSubmit}
                disabled={loading || !isFormValid() || !hasChanges()}
                className={`px-8 h-11 font-medium transition-all duration-300 ${loading
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : isFormValid() && hasChanges()
                      ? "bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-800 text-white"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                  }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
