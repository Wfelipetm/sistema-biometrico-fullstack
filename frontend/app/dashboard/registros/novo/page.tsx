"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Funcionario = {
  id: string
  nome: string
}

type Unidade = {
  id: string
  nome: string
}

export default function NovoRegistroPage() {
  const [funcionarioId, setFuncionarioId] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const [horaEntrada, setHoraEntrada] = useState("")
  const [horaSaida, setHoraSaida] = useState("")
  const [idBiometrico, setIdBiometrico] = useState("")
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [funcionariosRes, unidadesRes] = await Promise.all([
          api.get("/funci/funcionarios"),
          api.get("/unid/unidades"),
        ])
        setFuncionarios(funcionariosRes.data)
        setUnidades(unidadesRes.data)
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        setError("Não foi possível carregar os dados necessários.")
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.post("/reg/registros-ponto", {
        funcionario_id: funcionarioId,
        unidade_id: unidadeId,
        hora_entrada: horaEntrada,
        hora_saida: horaSaida,
        id_biometrico: idBiometrico,
      })

      router.push("/dashboard/registros")
    } catch (err) {
      console.error("Erro ao cadastrar registro:", err)
      setError("Erro ao cadastrar registro. Verifique os dados e tente novamente.")
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
        <h1 className="text-3xl font-bold tracking-tight">Novo Registro</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Registro de Ponto</CardTitle>
          <CardDescription>Preencha os dados para cadastrar um novo registro de ponto</CardDescription>
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
              <Label htmlFor="funcionario">Funcionário</Label>
              <Select value={funcionarioId} onValueChange={setFuncionarioId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((funcionario) => (
                    <SelectItem key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select value={unidadeId} onValueChange={setUnidadeId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="horaEntrada">Hora de Entrada</Label>
              <Input
                id="horaEntrada"
                type="time"
                value={horaEntrada}
                onChange={(e) => setHoraEntrada(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="horaSaida">Hora de Saída</Label>
              <Input
                id="horaSaida"
                type="time"
                value={horaSaida}
                onChange={(e) => setHoraSaida(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="idBiometrico">ID Biométrico</Label>
              <Input
                id="idBiometrico"
                value={idBiometrico}
                onChange={(e) => setIdBiometrico(e.target.value)}
                required
              />
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
