"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Fingerprint } from "lucide-react"
import { format, isSameDay, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "@/components/ui/toast-custom"
import RegistroManualModal from "@/components/ModalRegistroManual"
import ModalEditarRegistroPonto from "@/components/modal-editar-registro"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ModalBiometria } from "@/components/ModalBiometria"

const API_URL = process.env.NEXT_PUBLIC_API_URL
const API_LEITOR = process.env.NEXT_PUBLIC_LEITOR_URL 

type Registro = {
  id: number
  funcionario_id: number
  unidade_id: number
  tipo_escala?: string
  data_hora: string
  hora_entrada: string | null
  hora_saida: string | null
  id_biometrico: string
  created_at: string
  updated_at: string
  horas_normais: string
  hora_extra: string | null
  hora_desconto: string
  total_trabalhado: string | null
  hora_saida_ajustada: string | null
  funcionario_nome: string
  unidade_nome: string
}

type Unidade = { id: string;};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroFuncionario, setFiltroFuncionario] = useState("")
  const [filtroUnidade, setFiltroUnidade] = useState("")
  const [filtroEscala, setFiltroEscala] = useState("")
  const hoje = new Date();
const pad = (n: number) => n.toString().padStart(2, "0");
const hojeStr = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
const [filtroData, setFiltroData] = useState(hojeStr);
  const router = useRouter()
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [showManualModal, setShowManualModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [registroParaEditar, setRegistroParaEditar] = useState<Registro | null>(null)
  const [showBiometriaModal, setShowBiometriaModal] = useState(false)
  const [page, setPage] = useState(1);
const [limit, setLimit] = useState(2000);

const fetchRegistros = useCallback(async () => {
  if (!user?.secretaria_id) return;
  setLoading(true);
  try {
    // Busca as unidades da secretaria (mantido)
    const unidadesResponse = await fetch(`${API_URL}/secre/${user.secretaria_id}/unidades`);
    if (!unidadesResponse.ok) {
      throw new Error("Falha ao buscar unidades");
    }
    const unidades = await unidadesResponse.json();

    let registrosResponses = [];

    if (user.papel === "gestor" && user.unidade_id) {
      // Gestor: busca apenas da unidade dele
      const res = await api.get(`/unid/${user.unidade_id}/registros?page=${page}&limit=${limit}`);
      registrosResponses = [res];
    } else {
      // Admin: busca todos da secretaria
      const res = await api.get(`/secre/${user.secretaria_id}/registros?page=${page}&limit=${limit}`);
      registrosResponses = [res];
    }

    let todosRegistros = registrosResponses.flatMap((res) => res.data);

    setRegistros(todosRegistros);
    // Se o back-end retornar total, salve aqui: setTotal(res.data.total)
  } catch (error) {
    console.error("Erro ao buscar registros:", error);
    toast.error("Erro ao carregar registros", "Não foi possível carregar a lista de registros de ponto.");
  } finally {
    setLoading(false);
  }
}, [user?.secretaria_id, user?.papel, user?.unidade_id, page, limit]);

  useEffect(() => {
    fetchRegistros()
  }, [fetchRegistros])

  const handleEscolhaRegistro = () => {
    if (user?.papel === "gestor") {
      setShowBiometriaModal(true)
      handleNovoRegistro()
      return
    }

    toast.confirm(
      "Novo Registro de Ponto",
      "Como você deseja registrar o ponto?",
      async () => {
        setShowBiometriaModal(true)
        await handleNovoRegistro()
      },
      {
        confirmText: "Biometria",
        cancelText: "Manual",
        variant: "default",
      },
    )

    setTimeout(() => {
      const cancelButton = document.querySelector("[data-sonner-toast] button:first-child")
      if (cancelButton) {
        cancelButton.addEventListener("click", () => {
          setShowManualModal(true)
        })
      }
    }, 100)
  }

  const handleNovoRegistro = async () => {
  setLoading(true)

  // Pequeno delay para o usuário ler a orientação biométrica
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const payload = {
    funcionario_id: 1, // substitua conforme necessário
    unidade_id: 1,
    data_hora: new Date().toISOString(),
  }

  try {
    const response = await fetch(`${API_LEITOR}/register_ponto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
    })

    const contentType = response.headers.get("Content-Type")

    let data: { message?: string; error?: string } = {}
    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      const text = await response.text()
      throw new Error(text || "Erro desconhecido")
    }

    if (!response.ok) {
      setShowBiometriaModal(false)
      const mensagemErro = data.message || data.error || "Erro de comunicação."
      if (mensagemErro.includes("Registro de entrada não encontrado")) {
        toast.error(
          "Entrada não encontrada",
          "Você não possui entrada pendente. Procure o RH para regularizar seu ponto."
        )
      } else {
        toast.error("Falha no registro", mensagemErro)
      }
      return
    }

    setShowBiometriaModal(false)
    toast.success("Ponto registrado!", data.message || "Registro de ponto realizado com sucesso!")
    await fetchRegistros()
    router.refresh()
  } catch (error: any) {
    setShowBiometriaModal(false)
    // Erro de conexão (servidor fora do ar, rede, etc)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      toast.error(
        "Servidor indisponível",
        "O sistema de ponto está temporariamente fora do ar. Por favor, tente novamente em alguns minutos ou procure o RH."
      )
    } else {
      console.error("Erro ao registrar ponto:", error instanceof Error ? error.message : error)
      toast.error(
        "Erro inesperado",
        "Não foi possível registrar seu ponto devido a uma falha no sistema. Tente novamente mais tarde ou procure o RH."
      )
    }
  } finally {
    setLoading(false)
  }
}

const handleDelete = async (id: number, funcionarioNome: string) => {
  const dataRegistro = registros.find((r) => r.id === id)?.data_hora
  const dataFormatada = dataRegistro ? formatDate(dataRegistro) : ""

  toast.confirm(
    "Excluir Registro de Ponto",
    `Tem certeza que deseja excluir o registro de "${funcionarioNome}" do dia ${dataFormatada}? Esta ação não pode ser desfeita.`,
    async () => {
      try {
        // Use a variável de ambiente API_URL com fetch
        const response = await fetch(`${API_URL}/reg/registros-ponto/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Erro ao excluir registro");

        setRegistros((old) => old.filter((registro) => registro.id !== id));
        toast.success("Registro excluído!", "O registro de ponto foi removido com sucesso.");
        await fetchRegistros();
      } catch (error) {
        console.error("Erro ao excluir registro:", error);
        toast.error("Erro ao excluir", "Não foi possível excluir o registro. Tente novamente.");
      }
    },
    {
      confirmText: "Excluir",
      cancelText: "Cancelar",
      variant: "danger",
    },
  );
};

  // Função para abrir o modal de edição
  const handleEditarRegistro = (registro: Registro) => {
    setRegistroParaEditar(registro)
    setShowEditarModal(true)
  }

  const handleManualSuccess = () => {
    setShowManualModal(false)
    fetchRegistros()
    toast.success("Registro manual criado!", "O ponto foi registrado manualmente com sucesso.")
  }

  const handleEditSuccess = () => {
    setShowEditarModal(false)
    setRegistroParaEditar(null)
    fetchRegistros()
    toast.success("Registro atualizado!", "As alterações no registro foram salvas com sucesso.")
  }

  // Função para atualizar a lista de registros após edição
  const funcionarios = Array.from(new Set(registros.map((r) => r.funcionario_nome))).filter(Boolean)
  const unidades = Array.from(new Set(registros.map((r) => r.unidade_nome))).filter(Boolean)

  const filteredRegistros = registros.filter((registro) => {
    const funcionarioOk = (registro.funcionario_nome?.toLowerCase() || "").includes(filtroFuncionario.toLowerCase())
    const unidadeOk = (registro.unidade_nome?.toLowerCase() || "").includes(filtroUnidade.toLowerCase())
    const escalaOk = (registro.tipo_escala?.toLowerCase() || "").includes(filtroEscala.toLowerCase())
    const searchOk =
      (registro.funcionario_nome?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (registro.unidade_nome?.toLowerCase() || "").includes(searchTerm.toLowerCase())

    let dataOk = true
    if (filtroData) {
      try {
        // Pegue só a parte da data (yyyy-MM-dd) para ambos
        const filtroDateStr = filtroData
        const registroDateStr = registro.data_hora.slice(0, 10)
        dataOk = filtroDateStr === registroDateStr
      } catch {
        dataOk = true
      }
    }

    return funcionarioOk && unidadeOk && escalaOk && searchOk && dataOk
  })

  const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage)
  const pageLimit = 5
  const startPage = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1
  const endPage = Math.min(startPage + pageLimit - 1, totalPages)
  const registrosOrdenados = [...filteredRegistros].sort(
    (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime(),
  )

  const pagedRegistros = registrosOrdenados.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const formatDate = (dateString: string) => {
    try {
      // Pega só os primeiros 10 caracteres que correspondem a "yyyy-MM-dd"
      const datePart = dateString.slice(0, 10) // Ex: "2025-06-03"
      const [year, month, day] = datePart.split("-")
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  function formatInterval(interval: any) {
    if (!interval) return "-"
    // Se vier string (ex: "23:00:00"), retorna direto
    if (typeof interval === "string") return interval
    // Se vier objeto { days, hours, minutes, seconds }
    const d = interval.days ?? 0
    const h = interval.hours ?? 0
    const m = interval.minutes ?? 0
    const s = interval.seconds ?? 0
    const totalHours = d * 24 + h
    return `${totalHours.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">Registros de Ponto</h1>
          <p className="text-blue-700">
            Gerencie os registros de ponto da {user?.secretaria_nome || "secretaria"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="text-white  bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-black" onClick={handleEscolhaRegistro}>
            <Plus className="mr-2 h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-blue-900">Lista de Registros</CardTitle>
          <CardDescription className="text-blue-700">
            Total de {filteredRegistros.length} registros de ponto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex items-center gap-2">
              <Input
                placeholder="Filtrar por funcionário"
                value={filtroFuncionario}
                onChange={(e) => {
                  setFiltroFuncionario(e.target.value)
                  setCurrentPage(1)
                }}
                className="max-w-xs pl-8 text-blue-900 placeholder:text-blue-700"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-700 pointer-events-none" />
            </div>
            {user?.papel !== "gestor" && (
              <div className="relative flex items-center gap-2">
                <Input
                  placeholder="Filtrar por unidade"
                  value={filtroUnidade}
                  onChange={(e) => {
                    setFiltroUnidade(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="max-w-xs pl-8 text-blue-900 placeholder:text-blue-700"
                />
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-700 pointer-events-none" />
              </div>
            )}
            <div className="relative flex items-center gap-2">
              <Input
                placeholder="Filtrar por escala"
                value={filtroEscala}
                onChange={(e) => {
                  setFiltroEscala(e.target.value)
                  setCurrentPage(1)
                }}
                className="max-w-xs pl-8 text-blue-900 placeholder:text-blue-700"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-700 pointer-events-none" />
            </div>
            <div className="relative flex items-center gap-2">
              <Input
                type="date"
                placeholder="Filtrar por data"
                value={filtroData}
                onChange={(e) => {
                  setFiltroData(e.target.value)
                  setCurrentPage(1)
                }}
                className="max-w-xs pl-8 text-blue-900 placeholder:text-blue-700"
              />
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-700 pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-blue-700 font-bold">Funcionário</TableHead>
                      <TableHead className="text-blue-700 font-bold">Unidade</TableHead>
                      <TableHead className="text-blue-700 font-bold">Escala</TableHead>
                      <TableHead className="text-blue-700 font-bold">Data</TableHead>
                      <TableHead className="text-blue-700 font-bold">Entrada</TableHead>
                      <TableHead className="text-blue-700 font-bold">Saída</TableHead>
                      <TableHead className="text-blue-700 font-bold">Hora Extra</TableHead>
                      <TableHead className="text-blue-700 font-bold">Hora Desconto</TableHead>
                      {user?.papel !== "gestor" && (
                        <TableHead className="text-right text-blue-700 font-bold">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRegistros.length > 0 ? (
                      pagedRegistros.map((registro) => (
                        <TableRow
        key={registro.id}
        className="hover:bg-blue-50 transition-colors"
      >
        <TableCell className="font-medium text-blue-900">{registro.funcionario_nome}</TableCell>
        <TableCell className="text-blue-700">{registro.unidade_nome}</TableCell>
        <TableCell className="text-blue-700">{registro.tipo_escala || "-"}</TableCell>
        <TableCell className="text-blue-700">{formatDate(registro.data_hora)}</TableCell>
        <TableCell className="text-blue-700">{registro.hora_entrada || "-"}</TableCell>
        <TableCell className="text-blue-700">{registro.hora_saida || "-"}</TableCell>
        <TableCell className="text-blue-700">{formatInterval(registro.hora_extra)}</TableCell>
        <TableCell className="text-blue-700">{formatInterval(registro.hora_desconto)}</TableCell>
        {user?.papel !== "gestor" && (
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEditarRegistro(registro)}>
                <Edit className="h-4 w-4 text-blue-700" />
                <span className="sr-only">Editar</span>
              </Button>
               {user?.papel === "master" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(registro.id, registro.funcionario_nome)}
                >
                  <Trash2 className="h-4 w-4 text-blue-700" />
                  <span className="sr-only">Excluir</span>
                </Button>
                )}
            </div>
          </TableCell>
        )}
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={user?.papel !== "gestor" ? 9 : 8} className="h-24 text-center text-blue-700">
        Nenhum registro encontrado.
      </TableCell>
    </TableRow>
  )}
</TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="mt-4 border-blue-200 text-blue-900 dark:text-blue-100 dark:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    const pageNumber = currentPage <= totalPages - 4 ? currentPage + index : totalPages - 4 + index

                    if (pageNumber > totalPages) return null

                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`${
                          pageNumber === currentPage
                            ? "bg-blue-700 text-white dark:bg-white dark:text-blue-900"
                            : "border-blue-200 text-blue-900 dark:text-blue-100 dark:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900"
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="border-blue-200 text-blue-900 dark:text-blue-100 dark:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
     <ModalEditarRegistroPonto
        open={showEditarModal}
        onOpenChange={setShowEditarModal}
        registro={registroParaEditar}
        onAtualizado={handleEditSuccess}
      />   
        
      <RegistroManualModal open={showManualModal} onOpenChange={setShowManualModal} onSuccess={handleManualSuccess} />
      <ModalBiometria open={showBiometriaModal} />
    </div>
  )
}