"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots" | "pulse"
  message?: string
  progress?: number
  className?: string
}

export function LoadingIndicator({
  size = "md",
  variant = "spinner",
  message,
  progress,
  className,
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const renderSpinner = () => (
    <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size])} aria-hidden="true" role="presentation" />
  )

  const renderDots = () => (
    <div className="flex space-x-1" aria-hidden="true" role="presentation">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-blue-600 rounded-full animate-pulse",
            size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3",
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1.4s",
          }}
        />
      ))}
    </div>
  )

  const renderPulse = () => (
    <div
      className={cn("bg-blue-600 rounded-full animate-pulse", sizeClasses[size], "opacity-75")}
      aria-hidden="true"
      role="presentation"
    />
  )

  const renderVariant = () => {
    switch (variant) {
      case "dots":
        return renderDots()
      case "pulse":
        return renderPulse()
      default:
        return renderSpinner()
    }
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center space-y-3", className)}
      role="status"
      aria-live="polite"
      aria-label={message || "Carregando conteúdo"}
    >
      {renderVariant()}
      {message && (
        <p className="text-sm font-medium text-slate-700 text-center" aria-live="polite">
          {message}
        </p>
      )}
      {typeof progress === "number" && (
        <div className="w-full max-w-xs space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Progresso</span>
            <span aria-live="polite">{progress}%</span>
          </div>
          <div
            className="w-full bg-slate-200 rounded-full h-1.5"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso do carregamento: ${progress}%`}
          >
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
