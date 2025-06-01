"use client"

import { toast as sonnerToast, Toaster } from "sonner"
import { CheckCircle, AlertCircle, Info, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Configuração customizada do toast
export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.custom(
      (t) => (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] mx-auto">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{message}</p>
              {description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
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
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] mx-auto">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{message}</p>
              {description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
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
        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] mx-auto">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{message}</p>
              {description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => sonnerToast.dismiss(t)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-5 min-w-[360px] max-w-[480px] mx-auto">
          <div className="flex items-start gap-3 mb-4">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                variant === "danger" ? "bg-red-100 dark:bg-red-900/30" : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              {variant === "danger" ? (
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sonnerToast.dismiss(t)}
              className="px-4 h-9 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {cancelText}
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                sonnerToast.dismiss(t)
                await onConfirm()
              }}
              className={`px-4 h-9 ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 dark:text-gray-800 text-white"
              }`}
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
