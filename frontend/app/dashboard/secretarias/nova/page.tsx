"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NovaSecretariaPage() {
  const [nome, setNome] = useState("")
  const [sigla, setSigla] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.post("/secre", {
        nome,
        sigla,
      })

      router.push("/dashboard/secretarias")
    } catch (err) {
      console.error("Erro ao cadastrar secretaria:", err)
      setError("Erro ao cadastrar secretaria. Verifique os dados e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nova Secretaria</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Secretaria</CardTitle>
          <CardDescription>Preencha os dados para cadastrar uma nova secretaria</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da Secretaria</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sigla">Sigla</Label>
              <Input id="sigla" value={sigla} onChange={(e) => setSigla(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
