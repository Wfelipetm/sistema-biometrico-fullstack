"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Clock, Calendar, LogIn, LogOut, Check, Loader2, Save } from "lucide-react"
import axios from "axios"
import { format } from "date-fns"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface ModalEditarRegistroPontoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registro: any
  onAtualizado: (data: any) => void
}

function padHora(hora: string) {
  // Garante formato HH:mm com zero à esquerda
  if (!hora) return "00:00"
  const [h, m] = hora.split(":")
  return `${h?.padStart(2, "0") || "00"}:${m?.padStart(2, "0") || "00"}`
}

export default function ModalEditarRegistroPonto({
  open,
  onOpenChange,
  registro,
  onAtualizado,
}: ModalEditarRegistroPontoProps) {
  const [horaEntrada, setHoraEntrada] = useState("00:00")
  const [horaSaida, setHoraSaida] = useState("00:00")
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<{
    horaEntrada?: string
    horaSaida?: string
  }>({})

  // Validação em tempo real
  useEffect(() => {
    const errors: typeof validationErrors = {}

    if (horaEntrada && !/^\d{2}:\d{2}$/.test(horaEntrada)) {
      errors.horaEntrada = "Formato de hora inválido"
    }

    if (horaSaida && !/^\d{2}:\d{2}$/.test(horaSaida)) {
      errors.horaSaida = "Formato de hora inválido"
    }

    // Só valida se ambos estiverem preenchidos e diferentes de "00:00"
    if (
      horaEntrada && horaSaida &&
      horaEntrada !== "00:00" && horaSaida !== "00:00" &&
      horaEntrada >= horaSaida
    ) {
      errors.horaSaida = "Hora de saída deve ser posterior à entrada"
    }

    setValidationErrors(errors)
  }, [horaEntrada, horaSaida])

  useEffect(() => {
    if (open && registro) {
      setHoraEntrada(padHora(registro?.hora_entrada ?? "00:00"))
      setHoraSaida(padHora(registro?.hora_saida ?? "00:00"))
      setError("")
      setSuccess(false)
      setUploadProgress(0)
      setValidationErrors({})
    }
  }, [open, registro])

  // Permite salvar se não houver erros de validação
  const isFormValid = () => {
    return Object.keys(validationErrors).length === 0
  }

  // Ajuste a função hasChanges para detectar alteração em apenas um campo
  const hasChanges = () => {
    return (
      (horaEntrada !== padHora(registro?.hora_entrada ?? "00:00") && horaEntrada !== "00:00") ||
      (horaSaida !== padHora(registro?.hora_saida ?? "00:00") && horaSaida !== "00:00")
    )
  }

  const handleSubmit = async () => {
    if (!registro) {
      setError("Registro não definido!")
      return
    }

    if (!isFormValid()) {
      setError("Por favor, corrija os erros antes de continuar.")
      return
    }

    if (!hasChanges()) {
      setError("Nenhuma alteração detectada.")
      return
    }

    setLoading(true)
    setError("")
    setUploadProgress(0)

    try {
      // Envie apenas os campos alterados
      const payload: any = {}
      if (horaEntrada !== padHora(registro?.hora_entrada ?? "00:00") && horaEntrada !== "00:00") {
        payload.hora_entrada = horaEntrada
      }
      if (horaSaida !== padHora(registro?.hora_saida ?? "00:00") && horaSaida !== "00:00") {
        payload.hora_saida = horaSaida
      }

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

      const url = `${API_URL}/reg/registros-ponto/${registro.id}`
      const response = await axios.put(url, payload)

      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)

      // Aguardar um pouco para mostrar o sucesso
      setTimeout(() => {
        if (onAtualizado) onAtualizado(response.data)
        onOpenChange(false)
      }, 1500)
    } catch (error: any) {
      console.error("Erro ao atualizar registro de ponto:", error)
      setError("Erro ao atualizar registro de ponto. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

 // Formata a data para dd/MM/yyyy sem problemas de timezone
  const dataFormatada = registro?.data_hora
    ? registro.data_hora.slice(0, 10).split("-").reverse().join("/")
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-blue-50">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 shadow-sm">
              <Clock className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-blue-900">Editar Registro de Ponto</DialogTitle>
              <DialogDescription className="text-blue-700">
                Atualize os horários de entrada e saída do funcionário{" "}
                <span className="font-semibold text-blue-900">{registro?.funcionario_nome || ""}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-blue-700" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900">Registro Atualizado!</h3>
              <p className="text-blue-700">Os horários foram atualizados com sucesso.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <Alert
                variant="destructive"
                className="border-blue-200 bg-blue-100 animate-in slide-in-from-top-2 duration-300"
              >
                <AlertCircle className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Informações do Registro */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">
                Informações do Registro
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="text-sm font-medium flex items-center gap-2 text-blue-800">
                    <Calendar className="w-4 h-4 text-blue-700" />
                    Data do Registro
                  </Label>
                  <Input
                    type="text"
                    id="data"
                    value={dataFormatada}
                    disabled
                    readOnly
                    className="pl-4 h-12 bg-blue-100 border-blue-300 cursor-not-allowed text-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Horários */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2">
                Horários
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Hora de Entrada */}
                <div className="space-y-2">
                  <Label htmlFor="horaEntrada" className="text-sm font-medium flex items-center gap-2 text-blue-800">
                    <LogIn className="w-4 h-4 text-blue-700" />
                    Hora de Entrada
                  </Label>
                  <Input
                    type="time"
                    id="horaEntrada"
                    value={horaEntrada}
                    onChange={(e) => setHoraEntrada(padHora(e.target.value))}
                    disabled={!registro || loading}
                    className="h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900 bg-blue-100 placeholder:text-blue-400"
                  />
                  {validationErrors.horaEntrada && (
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.horaEntrada}
                    </p>
                  )}
                </div>

                {/* Hora de Saída */}
                <div className="space-y-2">
                  <Label htmlFor="horaSaida" className="text-sm font-medium flex items-center gap-2 text-blue-800">
                    <LogOut className="w-4 h-4 text-blue-700" />
                    Hora de Saída
                  </Label>
                  <Input
                    type="time"
                    id="horaSaida"
                    value={horaSaida}
                    onChange={(e) => setHoraSaida(padHora(e.target.value))}
                    disabled={!registro || loading}
                    className="h-12 border-blue-300 focus:border-blue-500 focus:ring-blue-200 text-blue-900 bg-blue-100 placeholder:text-blue-400"
                  />
                  {validationErrors.horaSaida && (
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.horaSaida}
                    </p>
                  )}
                </div>
              </div>

              {/* Informação adicional */}
              <div className="bg-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Clock className="w-4 h-4" />
                  <span>
                    {horaEntrada && horaSaida && horaEntrada < horaSaida
                      ? `Jornada: ${(() => {
                          const [hE, mE] = horaEntrada.split(":").map(Number)
                          const [hS, mS] = horaSaida.split(":").map(Number)
                          const totalMinutos = hS * 60 + mS - (hE * 60 + mE)
                          const horas = Math.floor(totalMinutos / 60)
                          const minutos = totalMinutos % 60
                          return `${horas}h${minutos > 0 ? ` ${minutos}min` : ""}`
                        })()}`
                      : "Defina os horários para calcular a jornada"}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar durante upload */}
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Atualizando registro...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-blue-200" />
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-6 border-t border-blue-200">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-6 h-11 border-blue-300 text-blue-700 hover:bg-blue-100 transition-all duration-200"
              >
                Cancelar
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={loading || !isFormValid()}
                className={`px-8 h-11 font-medium transition-all duration-300 ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : isFormValid()
                      ? "bg-blue-800 hover:bg-blue-900 text-white"
                      : "bg-blue-300 cursor-not-allowed text-blue-500"
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
