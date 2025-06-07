"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, User, Calendar, Clock, LogIn, LogOut, Check, Loader2, Save } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { registrarLog } from "@/utils/logger"

type Funcionario = {
  id: string
  nome: string
}

type ModalCadastroManualProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function ModalCadastroManual({ open, onOpenChange, onSuccess }: ModalCadastroManualProps) {
  const { user } = useAuth()
  const unidadeId = user?.unidade_id || ""

  const [funcionarioId, setFuncionarioId] = useState("")
  const [funcionarioInput, setFuncionarioInput] = useState("")
  const [horaEntrada, setHoraEntrada] = useState("00:00")
  const [horaSaida, setHoraSaida] = useState("00:00")
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
  const fetchFuncionarios = async () => {
    try {
      if (!user?.id) return
      const { data: lista } = await api.get(`/secre/${user.secretaria_id}/funcionarios`)
      setFuncionarios(lista)
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err)
      setError("Erro ao carregar funcionários.")
    }
  }

  if (open && user?.id) {
    fetchFuncionarios()
  }
}, [open, user?.id])

  useEffect(() => {
    // Fechar dropdown ao clicar fora
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredFuncionarios = funcionarios.filter((f) => f.nome.toLowerCase().includes(funcionarioInput.toLowerCase()))

  const resetForm = () => {
    setFuncionarioId("")
    setFuncionarioInput("")
    setHoraEntrada("00:00")
    setHoraSaida("00:00")
    setData(new Date().toISOString().slice(0, 10))
    setError("")
    setSuccess(false)
    setUploadProgress(0)
    setShowDropdown(false)
  }

  const isFormValid = () => {
    return funcionarioId && data && horaEntrada && horaSaida
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setUploadProgress(0)

    if (!isFormValid()) {
      setError("Por favor, preencha todos os campos obrigatórios.")
      setLoading(false)
      return
    }

    const body = {
      funcionario_id: funcionarioId,
      unidade_id: unidadeId,
      hora_entrada: horaEntrada,
      hora_saida: horaSaida,
      data,
      id_biometrico: "registro-manual",
    }

    console.log("[BODY ENVIADO PARA O SERVIDOR]", body)

    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 15
        })
      }, 200)

      await api.post("/reg/registros-ponto", body)

      clearInterval(progressInterval)
      setUploadProgress(100)

      // REGISTRO DE LOG
      const logData = {
        usuario_id: user?.id ?? null,
        acao: `Registro manual de ponto para funcionário ID ${funcionarioId}`,
        rota: "/reg/registros-ponto",
        metodo_http: "POST",
        status_code: 201,
        dados: body,
        sistema: "web",
        modulo: "Registro Manual",
        ip: null,
        user_agent: navigator.userAgent,
      }

      console.log("Log de ação manual:", logData)
      await registrarLog(logData)

      setSuccess(true)

      // Aguardar um pouco para mostrar o sucesso
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onSuccess?.()
        router.refresh()
      }, 1500)
    } catch (err: unknown) {
      console.error("[ERRO] Falha ao cadastrar registro manual:", err)

      // LOG DE ERRO
      const logErro = {
        usuario_id: user?.id ?? null,
        acao: "Falha no registro manual de ponto",
        rota: "/reg/registros-ponto",
        metodo_http: "POST",
        status_code: (err as any)?.response?.status ?? 500,
        dados: body,
        sistema: "web",
        modulo: "Registro Manual",
        ip: null,
        user_agent: navigator.userAgent,
      }

      console.log("Log de erro manual:", logErro)
      await registrarLog(logErro)

      setError("Erro ao cadastrar o registro. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleFuncionarioSelect = (f: Funcionario) => {
    setFuncionarioId(f.id)
    setFuncionarioInput(f.nome)
    setShowDropdown(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-blue-50" ref={containerRef}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 shadow-sm">
              <Clock className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-blue-900">Registro Manual de Ponto</DialogTitle>
              <DialogDescription className="text-blue-700">
                Preencha os dados para registrar ponto manualmente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Check className="w-8 h-8 text-blue-700" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900">Registro Salvo!</h3>
              <p className="text-blue-700">O ponto foi registrado com sucesso.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 animate-in slide-in-from-top-2 duration-300"
              >
                <AlertCircle className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Seleção de Funcionário */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-100 pb-2">
                Funcionário
              </h3>

              <div className="space-y-2 relative">
                <Label htmlFor="funcionarioInput" className="text-sm font-medium flex items-center gap-2 text-blue-900">
                  <User className="w-4 h-4 text-blue-700" />
                  Selecionar Funcionário
                </Label>
                <Input
                  id="funcionarioInput"
                  value={funcionarioInput}
                  onChange={(e) => {
                    setFuncionarioInput(e.target.value)
                    setFuncionarioId("")
                    setShowDropdown(true)
                  }}
                  placeholder="Digite o nome do funcionário"
                  autoComplete="off"
                  required
                  className="pl-4 h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900 placeholder:text-blue-700"
                />

                {showDropdown && filteredFuncionarios.length > 0 && (
                  <ul className="absolute z-50 bg-white border border-blue-100 max-h-60 overflow-auto w-full rounded-lg mt-1 shadow-xl">
                    {filteredFuncionarios.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 text-blue-900 hover:bg-blue-50 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                          onClick={() => handleFuncionarioSelect(f)}
                        >
                          {f.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showDropdown && funcionarioInput && filteredFuncionarios.length === 0 && (
                  <div className="absolute z-50 bg-white border border-blue-100 w-full rounded-lg mt-1 shadow-xl p-4 text-center text-blue-700">
                    Nenhum funcionário encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Data e Horários */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-100 pb-2">
                Data e Horários
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-sm font-medium flex items-center gap-2 text-blue-900">
                    <Calendar className="w-4 h-4 text-blue-700" />
                    Data
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                    className="h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900"
                  />
                </div>

                {/* Hora de Entrada */}
                <div className="space-y-2">
                  <Label htmlFor="horaEntrada" className="text-sm font-medium flex items-center gap-2 text-blue-900">
                    <LogIn className="w-4 h-4 text-blue-700" />
                    Entrada
                  </Label>
                  <Input
                    id="horaEntrada"
                    type="time"
                    value={horaEntrada}
                    onChange={(e) => setHoraEntrada(e.target.value)}
                    required
                    className="h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900"
                  />
                </div>

                {/* Hora de Saída */}
                <div className="space-y-2">
                  <Label htmlFor="horaSaida" className="text-sm font-medium flex items-center gap-2 text-blue-900">
                    <LogOut className="w-4 h-4 text-blue-700" />
                    Saída
                  </Label>
                  <Input
                    id="horaSaida"
                    type="time"
                    value={horaSaida}
                    onChange={(e) => setHoraSaida(e.target.value)}
                    required
                    className="h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* Progress Bar durante upload */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Salvando registro...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-6 border-t border-blue-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
                disabled={loading}
                className="px-6 h-11 border-blue-300 text-blue-700 hover:bg-blue-50 transition-all duration-200"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading || !isFormValid()}
                className={`px-8 h-11 font-medium transition-all duration-300 ${
                  loading
                    ? "bg-blue-200 cursor-not-allowed text-blue-700"
                    : isFormValid()
                      ? "bg-blue-700 hover:bg-blue-900 text-white"
                      : "bg-blue-100 cursor-not-allowed text-blue-400"
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
                    <span>Salvar Registro</span>
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
