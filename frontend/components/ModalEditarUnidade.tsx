"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Building2, MapPin, Camera, Upload, X, Check, AlertCircle, Loader2, Save, FileImage } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import Image from "next/image"

const API_URL = process.env.NEXT_PUBLIC_API_URL

interface ModalEditarUnidadeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unidade: {
    id: string
    nome: string
    localizacao: string
    foto?: string
  }
  onSuccess: () => void
}

export default function ModalEditarUnidade({ open, onOpenChange, unidade, onSuccess }: ModalEditarUnidadeProps) {
  const [nome, setNome] = useState(unidade.nome)
  const [localizacao, setLocalizacao] = useState(unidade.localizacao)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    nome?: string
    localizacao?: string
    foto?: string
  }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validação em tempo real
  useEffect(() => {
    const errors: typeof validationErrors = {}

    if (nome && nome.length < 3) {
      errors.nome = "Nome deve ter pelo menos 3 caracteres"
    }
    if (nome && nome.length > 50) {
      errors.nome = "Nome deve ter no máximo 50 caracteres"
    }

    if (localizacao && localizacao.length < 5) {
      errors.localizacao = "Localização deve ter pelo menos 5 caracteres"
    }
    if (localizacao && localizacao.length > 100) {
      errors.localizacao = "Localização deve ter no máximo 100 caracteres"
    }

    if (fotoFile && fotoFile.size > 5 * 1024 * 1024) {
      errors.foto = "Arquivo deve ter no máximo 5MB"
    }

    setValidationErrors(errors)
  }, [nome, localizacao, fotoFile])

  useEffect(() => {
    if (open) {
      setNome(unidade.nome)
      setLocalizacao(unidade.localizacao)
      setFotoFile(null)
      setPreviewUrl(unidade.foto ? `${API_URL}/uploads/${unidade.foto}?t=${Date.now()}` : null)
      setError("")
      setSuccess(false)
      setUploadProgress(0)
      setValidationErrors({})
    }
  }, [open, unidade])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Arquivo deve ter no máximo 5MB")
      return
    }

    setFotoFile(file)
    setError("")

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeImage = () => {
    setFotoFile(null)
    setPreviewUrl(unidade.foto ? `${API_URL}/uploads/${unidade.foto}?t=${Date.now()}` : null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const isFormValid = () => {
    return nome.trim().length >= 3 && localizacao.trim().length >= 5 && Object.keys(validationErrors).length === 0
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

    try {
      const formData = new FormData()
      formData.append("nome", nome.trim())
      formData.append("localizacao", localizacao.trim())
      if (fotoFile) {
        formData.append("foto", fotoFile)
      }

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

      await api.put(`/unid/unidade/${unidade.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)

      // Aguardar um pouco para mostrar o sucesso
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error("Erro ao atualizar unidade:", error)
      setError("Erro ao atualizar unidade. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 shadow-sm">
              <Building2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Editar Unidade</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Atualize os dados da unidade {unidade.nome}.
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Unidade Atualizada!</h3>
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

            {/* Dados da Unidade */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
                Dados da Unidade
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {/* Nome da Unidade */}
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Nome da Unidade
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Centro de Saúde Central"
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
                    <span>Mínimo 3 caracteres</span>
                    <span className={nome.length > 50 ? "text-red-500 dark:text-red-400" : ""}>{nome.length}/50</span>
                  </div>
                </div>

                {/* Localização */}
                <div className="space-y-2">
                  <Label htmlFor="localizacao" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Localização
                  </Label>
                  <Input
                    id="localizacao"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                    required
                    className="pl-4 h-12 border-gray-300 dark:border-gray-600 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-200 dark:focus:ring-gray-600"
                  />
                  {validationErrors.localizacao && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.localizacao}
                    </p>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Mínimo 5 caracteres</span>
                    <span className={localizacao.length > 100 ? "text-red-500 dark:text-red-400" : ""}>
                      {localizacao.length}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Foto da Unidade */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                Foto da Unidade
              </Label>

              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview da unidade"
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    {fotoFile && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute bottom-2 left-2 text-white">
                      <p className="text-sm font-medium">{fotoFile ? fotoFile.name : "Imagem atual"}</p>
                      {fotoFile && <p className="text-xs opacity-75">{(fotoFile.size / 1024 / 1024).toFixed(2)} MB</p>}
                    </div>
                  </div>

                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
                      isDragOver
                        ? "border-gray-500 bg-gray-50 dark:bg-gray-800 scale-105"
                        : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Clique ou arraste para alterar a imagem
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG, PNG, GIF (máx. 5MB)</p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isDragOver
                      ? "border-gray-500 bg-gray-50 dark:bg-gray-800 scale-105"
                      : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        Arraste uma imagem aqui ou clique para selecionar
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-600"
                    >
                      <FileImage className="w-3 h-3 mr-1" />
                      Opcional
                    </Badge>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {validationErrors.foto && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.foto}
                </p>
              )}
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
