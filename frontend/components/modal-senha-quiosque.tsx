"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { X, Check, Loader2 } from "lucide-react"

type ModalSenhaAdminProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function ModalSenhaAdmin({ open, onOpenChange, onSuccess }: ModalSenhaAdminProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const { user } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  // Verificação automática quando o email for digitado
  useEffect(() => {
    if (email.trim().toLowerCase() === user?.email.toLowerCase() && email.trim() !== "") {
      setIsValid(true)
      setLoading(true)

      // Pequeno delay para mostrar o feedback visual
      setTimeout(() => {
        setLoading(false)
        setEmail("")
        setIsValid(false)
        onOpenChange(false)
        onSuccess()
        toast.success("Acesso liberado!")
      }, 800)
    } else {
      setIsValid(false)
    }
  }, [email, user?.email, onOpenChange, onSuccess])

  // Reset quando o modal fechar
  useEffect(() => {
    if (!open) {
      setEmail("")
      setIsValid(false)
      setLoading(false)
    }
  }, [open])

  const getInputIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (isValid) return <Check className="h-4 w-4 text-green-500" />
    return null
  }

  const getInputBorderColor = () => {
    if (loading) return "border-blue-500 ring-blue-500/20"
    if (isValid) return "border-green-500 ring-green-500/20"
    if (email.trim() !== "" && !isValid) return "border-red-500 ring-red-500/20"
    return ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] w-full p-0 gap-0 overflow-hidden bg-blue-100 shadow-2xl shadow-blue-200/60 border border-blue-200 rounded-2xl">
        {/* Header com X para fechar */}
        <div className="relative bg-blue-100 p-8 pb-4">
          <DialogClose className="absolute right-4 top-4 rounded-full opacity-80 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            <X className="h-5 w-5 text-blue-900" />
            <span className="sr-only">Fechar</span>
          </DialogClose>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-blue-900">
              Confirmação de Identidade
            </DialogTitle>
            <DialogDescription className="text-blue-700 text-base">
              Digite seu <span className="font-semibold text-blue-900">email</span> para sair do modo quiosque
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo principal */}
        <div className="p-8 pt-4 space-y-6 bg-blue-100">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold text-blue-800">
              Email
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email..."
                value={email}
                onChange={handleChange}
                disabled={loading}
                autoFocus
                className={`pr-12 py-3 text-lg rounded-lg bg-blue-200 border-blue-300 text-blue-900 placeholder:text-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 ${getInputBorderColor()}`}
              />
              {getInputIcon() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">{getInputIcon()}</div>
              )}
            </div>
          </div>

          {/* Feedback visual */}
          {loading && (
            <div className="flex items-center gap-2 text-base text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validando acesso...</span>
            </div>
          )}

          {email.trim() !== "" && !isValid && !loading && (
            <div className="text-base text-blue-500">Continue digitando seu email...</div>
          )}
        </div>

        {/* Footer com dica */}
        {/* <div className="bg-blue-200 px-8 py-4 border-t border-blue-200">
          <p className="text-sm text-blue-00 text-center  border-blue-200">
            A confirmação será automática quando o email estiver correto.
          </p>
        </div> */}
      </DialogContent>
    </Dialog>
  )
}
