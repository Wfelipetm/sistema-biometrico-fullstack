"use client"

import { toast as sonnerToast, Toaster } from "sonner"
import { CheckCircle, AlertCircle, Info, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Configuração customizada do toast
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.custom(
      (t) => (
        <div className="bg-green-50 border border-green-200 rounded-xl shadow-2xl p-6 min-w-[600px] max-w-[900px] mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-green-900">{message}</p>
              {description && <p className="text-lg text-green-800 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-blue-500 hover:text-blue-700" />
            </button>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: "top-center",
      },
    )
  },

  error: (message: string, description?: string) => {
    sonnerToast.custom(
      (t) => (
        <div className="bg-red-50 border border-red-200 rounded-xl shadow-2xl p-6 min-w-[600px] max-w-[900px] mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-red-900">{message}</p>
              {description && <p className="text-lg text-red-800 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-blue-500 hover:text-blue-700" />
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
      },
    )
  },

  info: (message: string, description?: string) => {
    sonnerToast.custom(
      (t) => (
        <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-2xl p-6 min-w-[600px] max-w-[900px] mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-blue-900">{message}</p>
              {description && <p className="text-lg text-blue-800 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-blue-500 hover:text-blue-700" />
            </button>
          </div>
        </div>
      ),
      {
        duration: 4000,
        position: "top-center",
      },
    )
  },

  confirm: (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string
      cancelText?: string
      variant?: "danger" | "default"
    },
  ) => {
    const { confirmText = "Confirmar", cancelText = "Cancelar", variant = "default" } = options || {}

    sonnerToast.custom(
      (t) => (
        <div className={`rounded-xl shadow-2xl p-7 min-w-[600px] max-w-[900px] mx-auto ${
          variant === "danger"
            ? "bg-red-50 border border-red-200"
            : "bg-blue-50 border border-blue-100"
        }`}>
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                variant === "danger" ? "bg-red-100" : "bg-blue-100"
              }`}
            >
              {variant === "danger" ? (
                <Trash2 className="w-6 h-6 text-red-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-2xl font-bold ${variant === "danger" ? "text-red-900" : "text-blue-900"}`}>{title}</h3>
              <p className={`text-lg mt-1 ${variant === "danger" ? "text-red-800" : "text-blue-800"}`}>{description}</p>
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-blue-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-blue-500 hover:text-blue-700" />
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => sonnerToast.dismiss(t)}
              className="px-6 h-11 text-lg border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              {cancelText}
            </Button>
            <Button
              size="lg"
              onClick={async () => {
                sonnerToast.dismiss(t)
                await onConfirm()
              }}
              className="px-6 h-11 text-lg bg-blue-500 hover:bg-blue-600 text-white"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      ),
      {
        duration: Number.POSITIVE_INFINITY,
        position: "top-center",
      },
    )
  },
}

// Componente Toaster customizado
export function CustomToaster() {
  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors={false}
      closeButton={false}
      toastOptions={{
        style: {
          background: "transparent",
          border: "none",
          boxShadow: "none",
          padding: 0,
        },
        className: "custom-toast",
      }}
      offset="20px"
    />
  )
}