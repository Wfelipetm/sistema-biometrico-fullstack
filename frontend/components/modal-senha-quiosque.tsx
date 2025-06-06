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
      <DialogContent className="max-w-[400px] p-0 gap-0 overflow-hidden">
        {/* Header com X para fechar */}
        <div className="relative bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 pb-4">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Confirmação de Identidade
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Digite seu <span className="font-medium text-slate-800 dark:text-slate-200">email</span> para sair do modo
              quiosque
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Conteúdo principal */}
        <div className="p-6 pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                className={`pr-10 transition-all duration-200 ${getInputBorderColor()}`}
              />
              {getInputIcon() && <div className="absolute right-3 top-1/2 -translate-y-1/2">{getInputIcon()}</div>}
            </div>
          </div>

          {/* Feedback visual */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Validando acesso...</span>
            </div>
          )}

          {email.trim() !== "" && !isValid && !loading && (
            <div className="text-sm text-slate-500 dark:text-slate-400">Continue digitando seu email...</div>
          )}
        </div>

        {/* Footer com dica */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            A confirmação será automática quando o email estiver correto
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
