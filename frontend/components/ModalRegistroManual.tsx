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
import {
  AlertCircle,
  User,
  Calendar,
  Clock,
  LogIn,
  LogOut,
  Check,
  Loader2,
  Save,
  AlertTriangle,
  HelpCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { registrarLog } from "@/utils/logger"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Funcionario = {
  id: string
  nome: string
  tipo_escala?: string
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
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null)
  const [horaEntrada, setHoraEntrada] = useState("00:00")
  const [horaSaida, setHoraSaida] = useState("00:00")
  const [dataEntrada, setDataEntrada] = useState(() => new Date().toISOString().slice(0, 10))
  const [dataSaida, setDataSaida] = useState(() => new Date().toISOString().slice(0, 10))
  const [tipoRegistro, setTipoRegistro] = useState<"entrada" | "saida" | "completo">("completo")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  // Determina se o funcionário tem escala especial (12x36, 24x72)
  const isEscalaEspecial =
    funcionarioSelecionado?.tipo_escala && ["12x36", "24x72"].includes(funcionarioSelecionado.tipo_escala)

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

  // Quando um funcionário é selecionado, verifica se tem escala especial
  useEffect(() => {
    if (funcionarioSelecionado?.tipo_escala && ["12x36", "24x72"].includes(funcionarioSelecionado.tipo_escala)) {
      // Para escalas especiais, o padrão é registrar entrada
      setTipoRegistro("entrada")
    } else {
      // Para escalas normais, mantém o registro completo
      setTipoRegistro("completo")
    }
  }, [funcionarioSelecionado])

  const filteredFuncionarios = funcionarios.filter((f) => f.nome.toLowerCase().includes(funcionarioInput.toLowerCase()))

  const resetForm = () => {
    setFuncionarioId("")
    setFuncionarioInput("")
    setFuncionarioSelecionado(null)
    setHoraEntrada("00:00")
    setHoraSaida("00:00")
    setDataEntrada(new Date().toISOString().slice(0, 10))
    setDataSaida(new Date().toISOString().slice(0, 10))
    setTipoRegistro("completo")
    setError("")
    setSuccess(false)
    setUploadProgress(0)
    setShowDropdown(false)
  }

  const isFormValid = () => {
    if (!funcionarioId) return false

    if (isEscalaEspecial) {
      // Para escalas especiais, validação depende do tipo de registro
      if (tipoRegistro === "entrada") {
        return !!dataEntrada && !!horaEntrada
      } else if (tipoRegistro === "saida") {
        return !!dataSaida && !!horaSaida
      }
      return false // Não permite registro completo para escalas especiais
    } else {
      // Para escalas normais
      return !!dataEntrada && !!horaEntrada && !!horaSaida
    }
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

    let body: any = {
      funcionario_id: funcionarioId,
      unidade_id: unidadeId,
      id_biometrico: "registro-manual",
    }

    // Monta o body de acordo com o tipo de registro
    if (isEscalaEspecial) {
      if (tipoRegistro === "entrada") {
        body = {
          ...body,
          data_entrada: dataEntrada,
          hora_entrada: horaEntrada,
        }
      } else if (tipoRegistro === "saida") {
        body = {
          ...body,
          data_saida: dataSaida,
          hora_saida: horaSaida,
        }
      }
    } else {
      // Para escalas normais
      body = {
        ...body,
        data_entrada: dataEntrada,
        data_saida: dataSaida || dataEntrada, // Se não informou data de saída, usa a mesma da entrada
        hora_entrada: horaEntrada,
        hora_saida: horaSaida,
      }
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
        acao: `Registro manual de ponto (${tipoRegistro}) para funcionário ID ${funcionarioId}`,
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

      // Tenta extrair mensagem de erro da API
      const errorMessage =
        (err as any)?.response?.data?.error ||
        (err as any)?.response?.data?.message ||
        "Erro ao cadastrar o registro. Verifique os dados e tente novamente."

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFuncionarioSelect = (f: Funcionario) => {
    setFuncionarioId(f.id)
    setFuncionarioInput(f.nome)
    setFuncionarioSelecionado(f)
    setShowDropdown(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" ref={containerRef}>
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm">
              <Clock className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Registro Manual de Ponto</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Preencha os dados para registrar ponto manualmente.
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Registro Salvo!</h3>
              <p className="text-gray-600 dark:text-gray-400">O ponto foi registrado com sucesso.</p>
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

            {/* Seleção de Funcionário */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Funcionário
              </h3>

              <div className="space-y-2 relative">
                <Label htmlFor="funcionarioInput" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Selecionar Funcionário
                </Label>
                <Input
                  id="funcionarioInput"
                  value={funcionarioInput}
                  onChange={(e) => {
                    setFuncionarioInput(e.target.value)
                    setFuncionarioId("") // limpa seleção ao digitar
                    setFuncionarioSelecionado(null)
                    setShowDropdown(true)
                  }}
                  placeholder="Digite o nome do funcionário"
                  autoComplete="off"
                  required
                  className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                />

                {showDropdown && filteredFuncionarios.length > 0 && (
                  <ul className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto w-full rounded-lg mt-1 shadow-xl">
                    {filteredFuncionarios.map((f) => (
                      <li key={f.id}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
                          onClick={() => handleFuncionarioSelect(f)}
                        >
                          <div className="flex justify-between items-center">
                            <span>{f.nome}</span>
                            {f.tipo_escala && (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  ["12x36", "24x72"].includes(f.tipo_escala)
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {f.tipo_escala}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showDropdown && funcionarioInput && filteredFuncionarios.length === 0 && (
                  <div className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full rounded-lg mt-1 shadow-xl p-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum funcionário encontrado
                  </div>
                )}
              </div>

              {/* Exibe informação sobre escala especial */}
              {funcionarioSelecionado && isEscalaEspecial && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    Este funcionário possui escala especial ({funcionarioSelecionado.tipo_escala}). Registre entrada e
                    saída separadamente.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Tipo de Registro para Escalas Especiais */}
            {funcionarioSelecionado && isEscalaEspecial && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                  Tipo de Registro
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-500 dark:text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Para escalas especiais, registre entrada e saída separadamente.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>

                <Tabs
                  value={tipoRegistro}
                  onValueChange={(v) => setTipoRegistro(v as "entrada" | "saida" | "completo")}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="entrada" className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      <span>Entrada</span>
                    </TabsTrigger>
                    <TabsTrigger value="saida" className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>Saída</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Data e Horários */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Data e Horários
              </h3>

              {/* Para escalas especiais */}
              {funcionarioSelecionado && isEscalaEspecial ? (
                <div>
                  {tipoRegistro === "entrada" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Data de Entrada */}
                      <div className="space-y-2">
                        <Label htmlFor="dataEntrada" className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          Data de Entrada
                        </Label>
                        <Input
                          id="dataEntrada"
                          type="date"
                          value={dataEntrada}
                          onChange={(e) => setDataEntrada(e.target.value)}
                          required
                          className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                        />
                      </div>

                      {/* Hora de Entrada */}
                      <div className="space-y-2">
                        <Label htmlFor="horaEntrada" className="text-sm font-medium flex items-center gap-2">
                          <LogIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          Hora de Entrada
                        </Label>
                        <Input
                          id="horaEntrada"
                          type="time"
                          value={horaEntrada}
                          onChange={(e) => setHoraEntrada(e.target.value)}
                          required
                          className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Data de Saída */}
                      <div className="space-y-2">
                        <Label htmlFor="dataSaida" className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          Data de Saída
                        </Label>
                        <Input
                          id="dataSaida"
                          type="date"
                          value={dataSaida}
                          onChange={(e) => setDataSaida(e.target.value)}
                          required
                          className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                        />
                      </div>

                      {/* Hora de Saída */}
                      <div className="space-y-2">
                        <Label htmlFor="horaSaida" className="text-sm font-medium flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          Hora de Saída
                        </Label>
                        <Input
                          id="horaSaida"
                          type="time"
                          value={horaSaida}
                          onChange={(e) => setHoraSaida(e.target.value)}
                          required
                          className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Para escalas normais */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="dataEntrada" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Data
                    </Label>
                    <Input
                      id="dataEntrada"
                      type="date"
                      value={dataEntrada}
                      onChange={(e) => setDataEntrada(e.target.value)}
                      required
                      className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                    />
                  </div>

                  {/* Hora de Entrada */}
                  <div className="space-y-2">
                    <Label htmlFor="horaEntrada" className="text-sm font-medium flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Entrada
                    </Label>
                    <Input
                      id="horaEntrada"
                      type="time"
                      value={horaEntrada}
                      onChange={(e) => setHoraEntrada(e.target.value)}
                      required
                      className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                    />
                  </div>

                  {/* Hora de Saída */}
                  <div className="space-y-2">
                    <Label htmlFor="horaSaida" className="text-sm font-medium flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Saída
                    </Label>
                    <Input
                      id="horaSaida"
                      type="time"
                      value={horaSaida}
                      onChange={(e) => setHoraSaida(e.target.value)}
                      required
                      className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar durante upload */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Salvando registro...</span>
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
                onClick={() => {
                  resetForm()
                  onOpenChange(false)
                }}
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
