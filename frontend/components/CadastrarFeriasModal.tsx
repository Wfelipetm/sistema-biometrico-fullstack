"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  User,
  CalendarDays,
  Check,
  Clock,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Plus,
} from "lucide-react"
import { differenceInDays, format, addDays } from "date-fns"
import axios from "axios"
import { toast } from "@/components/ui/toast-custom"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Funcionario = {
  id: number
  nome: string
}

type FeriasItem = {
  id: number
  nome_funcionario: string
  status_ferias: string
  nome_unidade: string
  unidade_id: number
  data_inicio: string
  data_fim: string
}

type CadastrarFeriasModalProps = {
  funcionarios: Funcionario[]
  unidadeId: number
  onClose?: () => void
  open?: boolean
}

export default function CadastrarFeriasModal({
  funcionarios,
  unidadeId,
  onClose,
  open: propOpen,
}: CadastrarFeriasModalProps) {
  const [open, setOpen] = useState(propOpen ?? false)
  const [funcionarioId, setFuncionarioId] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [isSalvando, setIsSalvando] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<Funcionario[]>([])
  const [feriasCadastradas, setFeriasCadastradas] = useState<FeriasItem[]>([])
  const [loadingAprovar, setLoadingAprovar] = useState<number | null>(null)
  const [loadingExcluir, setLoadingExcluir] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<{
    funcionario?: string
    dataInicio?: string
    dataFim?: string
  }>({})

  // Validação em tempo real
  useEffect(() => {
    const errors: typeof validationErrors = {}

    if (dataInicio && dataFim && new Date(dataFim) < new Date(dataInicio)) {
      errors.dataFim = "Data de fim deve ser posterior à data de início"
    }

    if (dataInicio && new Date(dataInicio) < new Date()) {
      errors.dataInicio = "Data de início não pode ser no passado"
    }

    setValidationErrors(errors)
  }, [dataInicio, dataFim])

  // Definir datas de exemplo quando o modal abrir
  useEffect(() => {
    if (open && !dataInicio && !dataFim) {
      const hoje = new Date()
      const proximoMes = addDays(hoje, 30)
      const fimFerias = addDays(proximoMes, 14) // 15 dias de férias

      setDataInicio(format(proximoMes, "yyyy-MM-dd"))
      setDataFim(format(fimFerias, "yyyy-MM-dd"))
    }
  }, [open, dataInicio, dataFim])

  const carregarFerias = useCallback(async () => {
    try {
      const response = await axios.get<{ dados: FeriasItem[] }>(`${API_URL}/ferias/ferias-por-unidade/${unidadeId}`)

      const dadosFerias = response.data.dados ?? []
      setFeriasCadastradas(dadosFerias)

      const nomesComFerias = new Set(dadosFerias.map((item) => item.nome_funcionario.trim().toLowerCase()))

      const disponiveis = funcionarios.filter((f) => !nomesComFerias.has(f.nome.trim().toLowerCase()))

      setFuncionariosDisponiveis(disponiveis)
    } catch (err) {
      console.error("Erro ao buscar férias:", err)
      setFuncionariosDisponiveis(funcionarios)
      toast.error("Erro ao carregar férias", "Não foi possível carregar as férias cadastradas.")
    }
  }, [funcionarios, unidadeId])

  useEffect(() => {
    if (open) {
      carregarFerias()
      // Reset apenas alguns campos, mantendo as datas de exemplo
      setFuncionarioId("")
      setError("")
      setValidationErrors({})
      setUploadProgress(0)
    }
  }, [open, carregarFerias])

  const isFormValid = () => {
    return (
      funcionarioId &&
      dataInicio &&
      dataFim &&
      Object.keys(validationErrors).length === 0 &&
      new Date(dataFim) >= new Date(dataInicio)
    )
  }

  const cadastrarFerias = async () => {
    if (!isFormValid()) {
      setError("Por favor, corrija os erros antes de continuar.")
      return
    }

    const dias_ferias = differenceInDays(new Date(dataFim), new Date(dataInicio)) + 1

    setIsSalvando(true)
    setError("")
    setUploadProgress(0)

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

      await axios.post(`${API_URL}/ferias`, {
        funcionario_id: Number(funcionarioId),
        unidade_id: unidadeId,
        data_inicio: dataInicio,
        data_fim: dataFim,
        dias_ferias,
        status: "solicitada",
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.success("Férias cadastradas!", `Solicitação de ${dias_ferias} dias criada com sucesso.`)

      // Reset form
      setFuncionarioId("")
      setDataInicio("")
      setDataFim("")
      carregarFerias()
    } catch (err) {
      console.error("Erro ao cadastrar férias:", err)
      setError("Erro ao cadastrar férias. Verifique os dados e tente novamente.")
      toast.error("Erro no cadastro", "Não foi possível cadastrar as férias. Tente novamente.")
    } finally {
      setIsSalvando(false)
    }
  }

  const aprovarFerias = async (idFerias: number, nomeFuncionario: string) => {
    setLoadingAprovar(idFerias)
    try {
      await axios.put(`${API_URL}/ferias/atualizar-ferias/${idFerias}/aprovar`)

      toast.success("Férias aprovadas!", `As férias de ${nomeFuncionario} foram aprovadas.`)

      setFeriasCadastradas((prev) => prev.map((f) => (f.id === idFerias ? { ...f, status_ferias: "aprovada" } : f)))
    } catch (error) {
      console.error("Erro ao aprovar férias:", error)
      toast.error("Erro na aprovação", "Não foi possível aprovar as férias. Tente novamente.")
    } finally {
      setLoadingAprovar(null)
    }
  }

  const excluirFerias = async (idFerias: number, nomeFuncionario: string) => {
    toast.confirm(
      "Excluir Solicitação de Férias",
      `Tem certeza que deseja excluir a solicitação de férias de "${nomeFuncionario}"? Esta ação não pode ser desfeita.`,
      async () => {
        setLoadingExcluir(idFerias)
        try {
          await axios.delete(`${API_URL}/ferias/${idFerias}`)

          toast.success("Férias excluídas!", `A solicitação de ${nomeFuncionario} foi removida.`)
          setFeriasCadastradas((prev) => prev.filter((f) => f.id !== idFerias))
        } catch (error) {
          console.error("Erro ao excluir férias:", error)
          toast.error("Erro na exclusão", "Não foi possível excluir as férias. Tente novamente.")
        } finally {
          setLoadingExcluir(null)
        }
      },
      {
        confirmText: "Excluir",
        cancelText: "Cancelar",
        variant: "danger",
      },
    )
  }

  const calcularDias = () => {
    if (dataInicio && dataFim && new Date(dataFim) >= new Date(dataInicio)) {
      return differenceInDays(new Date(dataFim), new Date(dataInicio)) + 1
    }
    return 0
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o && onClose) onClose()
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-800 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Férias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm">
              <CalendarDays className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Gerenciar Férias</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Cadastre e gerencie as solicitações de férias dos funcionários.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Cadastro */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Nova Solicitação
              </h3>

              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 dark:bg-red-900/20 animate-in slide-in-from-top-2 duration-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Funcionário */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Funcionário
                </Label>
                <Select value={funcionarioId} onValueChange={setFuncionarioId} disabled={isSalvando}>
                  <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600 text-gray-700 dark:text-gray-300">
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                    {funcionariosDisponiveis.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {funcionariosDisponiveis.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Todos os funcionários já possuem férias cadastradas
                  </p>
                )}
              </div>

              {/* Data de Início */}
              <div className="space-y-2">
                <Label htmlFor="data-inicio" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Data de Início
                </Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  disabled={isSalvando}
                  className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                />
                {validationErrors.dataInicio && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.dataInicio}
                  </p>
                )}
              </div>

              {/* Data de Fim */}
              <div className="space-y-2">
                <Label htmlFor="data-fim" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  Data de Fim
                </Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  disabled={isSalvando}
                  className="h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                />
                {validationErrors.dataFim && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.dataFim}
                  </p>
                )}
              </div>

              {/* Informação de dias */}
              {calcularDias() > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      <strong>{calcularDias()} dias</strong> de férias serão solicitados
                    </span>
                  </div>
                </div>
              )}

              {/* Progress Bar durante upload */}
              {isSalvando && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Salvando solicitação...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Botão de Cadastrar - Movido para dentro do formulário */}
              <Button
                onClick={cadastrarFerias}
                disabled={isSalvando || !isFormValid()}
                className={`w-full h-12 font-medium transition-all duration-300 ${
                  isSalvando
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : isFormValid()
                      ? "bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-800 text-white"
                      : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                }`}
              >
                {isSalvando ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Cadastrar Férias</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Lista de Férias Cadastradas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Férias Cadastradas
              </h3>
              <Badge
                variant="outline"
                className="text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-600"
              >
                {feriasCadastradas.length} solicitações
              </Badge>
            </div>

            {feriasCadastradas.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {feriasCadastradas.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{f.nome_funcionario}</h4>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(f.data_inicio).toLocaleDateString("pt-BR")} até{" "}
                              {new Date(f.data_fim).toLocaleDateString("pt-BR")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={f.status_ferias === "aprovada" ? "default" : "secondary"}
                              className={`text-xs ${
                                f.status_ferias === "aprovada"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {f.status_ferias === "aprovada" ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {f.status_ferias === "aprovada" ? "Aprovada" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {f.status_ferias !== "aprovada" && (
                          <Button
                            size="sm"
                            disabled={loadingAprovar === f.id}
                            onClick={() => aprovarFerias(f.id, f.nome_funcionario)}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          >
                            {loadingAprovar === f.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingExcluir === f.id}
                          onClick={() => excluirFerias(f.id, f.nome_funcionario)}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 h-8 px-3"
                        >
                          {loadingExcluir === f.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">Nenhuma solicitação de férias</p>
                <p className="text-xs">Cadastre a primeira solicitação ao lado</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
