"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import ModalCadastroUnidade from "@/components/ModalCadastroUnidade"
import ModalEditarUnidade from "@/components/ModalEditarUnidade"
import { toast } from "@/components/ui/toast-custom"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Unidade = {
  id: string
  nome: string
  localizacao: string
  created_at: string
  updated_at: string
  foto: string
}

export default function UnidadesPage() {
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [unidadeParaEditar, setUnidadeParaEditar] = useState<Unidade | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const itemsPerPage = 5
  const router = useRouter()
  const { user } = useAuth()

  const fetchUnidades = useCallback(async () => {
    setLoading(true)
    try {
      if (user?.papel === "gestor" && user.unidade_id) {
        // Busca apenas a unidade do gestor
        const { data } = await api.get(`/unid/unidade/${user.unidade_id}`)
        setUnidades(data ? [data] : [])
      } else if (user?.secretaria_id) {
        // Admin ou secretaria: busca todas as unidades da secretaria
        const { data } = await api.get(`/secre/${user.secretaria_id}/unidades`)
        setUnidades(data)
      } else {
        setUnidades([])
      }
    } catch (error) {
      console.error("Erro ao buscar unidades:", error)
      setUnidades([])
      toast.error("Erro ao carregar unidades", "Não foi possível carregar a lista de unidades.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUnidades()
  }, [fetchUnidades])

  const handleDelete = async (id: string, nome: string) => {
    toast.confirm(
      "Excluir Unidade",
      `Tem certeza que deseja excluir a unidade "${nome}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await api.delete(`/unid/unidade/${id}`)
          setUnidades((prev) => prev.filter((unidade) => unidade.id !== id))
          toast.success("Unidade excluída!", "A unidade foi removida com sucesso.")
        } catch (error) {
          console.error("Erro ao excluir unidade:", error)
          toast.error("Erro ao excluir", "Não foi possível excluir a unidade. Tente novamente.")
        }
      },
      {
        confirmText: "Excluir",
        cancelText: "Cancelar",
        variant: "danger",
      },
    )
  }

  const handleModalSuccess = () => {
    setIsModalOpen(false)
    fetchUnidades()
    toast.success("Unidade criada!", "A nova unidade foi cadastrada com sucesso.")
  }

  const handleEditSuccess = () => {
    fetchUnidades()
    toast.success("Unidade atualizada!", "As alterações foram salvas com sucesso.")
  }

  const filteredUnidades = unidades.filter(
    (unidade) =>
      unidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.localizacao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredUnidades.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUnidades = filteredUnidades.slice(startIndex, endIndex)

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const generatePaginationButtons = () => {
    const buttons = []
    const maxVisible = 5

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) buttons.push(i)
    return buttons
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">Unidades</h1>
          <p className="text-blue-700">Gerencie as unidades da {user?.secretaria_nome || "secretaria"}</p>
        </div>
        {user?.papel !== "gestor" && (
          <Button onClick={() => setIsModalOpen(true)} className="text-white bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-black">
            <Plus className="mr-2 h-4 w-4" /> Nova Unidade
          </Button>
        )}
      </div>

      <ModalCadastroUnidade open={isModalOpen} onOpenChange={setIsModalOpen} onSuccess={handleModalSuccess} />

      {unidadeParaEditar && (
        <ModalEditarUnidade
          open={isEditModalOpen}
          unidade={unidadeParaEditar}
          onOpenChange={(open) => {
            setIsEditModalOpen(open)
            if (!open) setUnidadeParaEditar(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      <Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-blue-900">Lista de Unidades</CardTitle>
          <CardDescription className="text-blue-700">Total de {unidades.length} unidades cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          {user?.papel !== "gestor" && (
            <div className="mb-4 flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-blue-700" />
                </span>
                <Input
                  placeholder="Buscar unidade..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10 text-blue-900 placeholder:text-blue-700"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-blue-700">Imagem</TableHead>
                    <TableHead className="text-blue-700">Informações</TableHead>
                    {user?.papel !== "gestor" && <TableHead className="text-right text-blue-700">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUnidades.length > 0 ? (
                    currentUnidades.map((unidade) => (
                      <TableRow
                        key={unidade.id}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => router.push(`/dashboard/unidades/${unidade.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            router.push(`/dashboard/unidades/${unidade.id}`)
                          }
                        }}
                      >
                        <TableCell className="w-64">
                          <img
                            src={
                              unidade.foto
                                ? `${API_URL}/uploads/${unidade.foto}?t=${Date.now()}`
                                : "/placeholder-image.png"
                            }
                            alt={unidade.nome}
                            className="w-60 h-32 rounded-md object-cover border shadow"
                          />
                        </TableCell>
                        <TableCell className="flex flex-col justify-center gap-1 text-base">
                          <span className="font-semibold text-blue-900">{unidade.nome}</span>
                          <span className="text-blue-700">{unidade.localizacao}</span>
                        </TableCell>
                        {user?.papel !== "gestor" && (
                          <TableCell className="text-right">
                            <div
                              className="flex justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setUnidadeParaEditar(unidade)
                                  setIsEditModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 text-blue-700" />
                                <span className="sr-only">Editar</span>
                              </Button>
                               {user?.papel === "master" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(unidade.id, unidade.nome)}
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
                      <TableCell colSpan={user?.papel !== "gestor" ? 3 : 2} className="h-24 text-center text-blue-700">
                        Nenhuma unidade encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {!loading && filteredUnidades.length > 0 && (
          <CardFooter className="flex justify-between items-center border-t px-6 py-4">
            <div className="text-sm text-blue-700">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredUnidades.length)} de {filteredUnidades.length} unidades
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="border-blue-200 text-blue-900 dark:text-blue-100 dark:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {generatePaginationButtons().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => changePage(page)}
                  className={`w-8 h-8 p-0 ${
                    currentPage === page
                      ? "bg-blue-700 text-white dark:bg-white dark:text-blue-900"
                      : "border-blue-200 text-blue-900 dark:text-blue-100 dark:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900"
                  }`}
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="border-blue-200 text-blue-900 dark:text-blue-100 dark:border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
