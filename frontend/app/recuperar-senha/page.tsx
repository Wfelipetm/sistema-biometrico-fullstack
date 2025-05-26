"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Simulando envio de email de recuperação
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(true)
    } catch (err) {
      setError("Falha ao enviar email de recuperação. Tente novamente.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Biometria</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Recuperação de senha</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {success ? (
            <Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
              <AlertDescription>Email enviado com sucesso! Verifique sua caixa de entrada.</AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>

              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? "Enviando..." : "Enviar instruções"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lembrou sua senha? </span>
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Voltar para login
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="text-xs">
            Acessar como visitante
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">© 2025 Sistema de Biometria</div>
      </div>
    </div>
  )
}
