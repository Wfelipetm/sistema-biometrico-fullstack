"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Plus,
	Search,
	Edit,
	Trash2,
	FileDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RegistroManualModal from "@/components/ModalRegistroManual";
import ModalEditarRegistroPonto from "@/components/modal-editar-registro";
const API_URL = process.env.NEXT_PUBLIC_API_URL;




type Registro = {
	id: number;
	funcionario_id: number;
	unidade_id: number;
	data_hora: string;
	hora_entrada: string | null;
	hora_saida: string | null;
	id_biometrico: string;
	created_at: string;
	updated_at: string;
	horas_normais: string;
	hora_extra: string | null;
	hora_desconto: string;
	total_trabalhado: string | null;
	hora_saida_ajustada: string | null;
	funcionario_nome: string;
	unidade_nome: string;
};

export default function RegistrosPage() {
	const [registros, setRegistros] = useState<Registro[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filtroFuncionario, setFiltroFuncionario] = useState("");
	const [filtroUnidade, setFiltroUnidade] = useState("");
	const [filtroData, setFiltroData] = useState(""); // <-- Novo filtro de data
	const router = useRouter();
	const { user } = useAuth();
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const [showManualModal, setShowManualModal] = useState(false);
	const [showEditarModal, setShowEditarModal] = useState(false);
    const [registroParaEditar, setRegistroParaEditar] = useState<Registro | null>(null);




	const fetchRegistros = useCallback(async () => {
		if (!user?.secretaria_id) return;
		setLoading(true);
		try {
			const unidadesResponse = await fetch(
				`${API_URL}/secre/${user.secretaria_id}/unidades`,
			);

			if (!unidadesResponse.ok) {
				throw new Error("Falha ao buscar unidades");
			}

			const unidades = await unidadesResponse.json();

			const registrosPromises = unidades.map((unidade: { id: string }) =>
				api.get(`/unid/${unidade.id}/registros`),
			);

			const registrosResponses = await Promise.all(registrosPromises);
			let todosRegistros = registrosResponses.flatMap((res) => res.data);

			// FILTRO PARA GESTOR: só vê registros da própria unidade
			if (user.papel === "gestor" && user.unidade_id) {
				todosRegistros = todosRegistros.filter(
					(registro) => registro.unidade_id === user.unidade_id,
				);
			}

			setRegistros(todosRegistros);
		} catch (error) {
			console.error("Erro ao buscar registros:", error);
		} finally {
			setLoading(false);
		}
	}, [user?.secretaria_id, user?.papel, user?.unidade_id]);

	useEffect(() => {
		fetchRegistros();
	}, [fetchRegistros]);

	const handleEscolhaRegistro = () => {
		toast("Como deseja registrar o ponto?", {
			action: {
				label: "Biometria",
				onClick: () => handleNovoRegistro(),
			},
			cancel: {
				label: "Manual",
				onClick: () => setShowManualModal(true),
			},
		});
	};

	const handleNovoRegistro = async () => {
		setLoading(true);

		const payload = {
			funcionario_id: 1, // substitua conforme necessário
			unidade_id: 1,
			data_hora: new Date().toISOString(),
		};

		try {
			const response = await fetch("https://127.0.0.1:5000/register_ponto", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				mode: "cors",
			});

			const contentType = response.headers.get("Content-Type");

			let data: { message?: string } = {};
			if (contentType?.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				throw new Error(text || "Erro desconhecido");
			}

			if (!response.ok) {
				const mensagemErro = data.message || "Erro ao registrar ponto.";
				toast.error(mensagemErro);
				return;
			}

			toast.success(data.message || "Registro de ponto realizado com sucesso!");
			await fetchRegistros();
			router.refresh();
		} catch (error) {
			console.error(
				"Erro ao registrar ponto:",
				error instanceof Error ? error.message : error,
			);
			toast.error(
				error instanceof Error
					? error.message
					: "Erro inesperado ao registrar ponto.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: number) => {
		toast(
			"Tem certeza que deseja excluir este registro?",
			{
				description: "Essa ação é irreversível.",
				cancel: {
					label: "Cancelar",
					onClick: () => { },
				},
				action: {
					label: "Excluir",
					onClick: async () => {
						try {
							await api.delete(`/reg/registros-ponto/${id}`);
							setRegistros((old) => old.filter((registro) => registro.id !== id));
							toast.success("Registro excluído com sucesso!");
							await fetchRegistros();
						} catch (error) {
							console.error("Erro ao excluir registro:", error);
							toast.error("Erro ao excluir registro.");
						}
					},
				},
			},
		);
	};

	
   // Função para abrir o modal de edição
    const handleEditarRegistro = (registro: Registro) => {
        setRegistroParaEditar(registro);
        setShowEditarModal(true);
    };

	
	// Função para atualizar a lista de registros após edição
	const funcionarios = Array.from(
		new Set(registros.map((r) => r.funcionario_nome)),
	).filter(Boolean);
	const unidades = Array.from(
		new Set(registros.map((r) => r.unidade_nome)),
	).filter(Boolean);

	const filteredRegistros = registros.filter((registro) => {
		const funcionarioOk = (
			registro.funcionario_nome?.toLowerCase() || ""
		).includes(filtroFuncionario.toLowerCase());
		const unidadeOk = (registro.unidade_nome?.toLowerCase() || "").includes(
			filtroUnidade.toLowerCase(),
		);
		const searchOk =
			(registro.funcionario_nome?.toLowerCase() || "").includes(
				searchTerm.toLowerCase(),
			) ||
			(registro.unidade_nome?.toLowerCase() || "").includes(
				searchTerm.toLowerCase(),
			);

		let dataOk = true;
		if (filtroData) {
			try {
				const filtroDate = parseISO(filtroData);
				const registroDate = new Date(registro.data_hora);
				dataOk = isSameDay(filtroDate, registroDate);
			} catch {
				dataOk = true;
			}
		}

		return funcionarioOk && unidadeOk && searchOk && dataOk;
	});

	const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage);
	const pageLimit = 5;
	const startPage = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1;
	const endPage = Math.min(startPage + pageLimit - 1, totalPages);
	const registrosOrdenados = [...filteredRegistros].sort(
    (a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime(),
);

	const pagedRegistros = registrosOrdenados.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
		} catch {
			return dateString;
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Registros de Ponto
					</h1>
					<p className="text-muted-foreground">
						Gerencie os registros de ponto da{" "}
						{user?.secretaria_nome || "secretaria"}
					</p>
				</div>
				<div className="flex gap-2">
					{/* <Button variant="outline" onClick={() => {}}>
						<FileDown className="mr-2 h-4 w-4" /> Exportar
					</Button> */}
					<Button
					className="text-white dark:bg-white dark:text-black"
					onClick={handleEscolhaRegistro}>
						<Plus className="mr-2 h-4 w-4" /> Novo Registro
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Registros</CardTitle>
					<CardDescription>
						Total de {filteredRegistros.length} registros de ponto
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-col md:flex-row items-center gap-2">
						{/* <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar geral..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);a
                            }}
                            className="max-w-xs"
                        /> */}
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Filtrar por funcionário"
							value={filtroFuncionario}
							onChange={(e) => {
								setFiltroFuncionario(e.target.value);
								setCurrentPage(1);
							}}
							className="max-w-xs"
						/>
						{user?.papel !== "gestor" && (
							<>
								<Search className="h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Filtrar por unidade"
									value={filtroUnidade}
									onChange={(e) => {
										setFiltroUnidade(e.target.value);
										setCurrentPage(1);
									}}
									className="max-w-xs"
								/>
							</>
						)}
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
											<TableHead>Funcionário</TableHead>
											<TableHead>Unidade</TableHead>
											<TableHead>Data</TableHead>
											<TableHead>Entrada</TableHead>
											<TableHead>Saída</TableHead>
											{user?.papel !== "gestor" && (
												<TableHead className="text-right">Ações</TableHead>
											)}
										</TableRow>
									</TableHeader>
									<TableBody>
										{pagedRegistros.length > 0 ? (
											pagedRegistros.map((registro) => (
												<TableRow key={registro.id}>
													<TableCell className="font-medium">
														{registro.funcionario_nome}
													</TableCell>
													<TableCell>{registro.unidade_nome}</TableCell>
													<TableCell>
														{formatDate(registro.data_hora)}
													</TableCell>
													<TableCell>{registro.hora_entrada || "-"}</TableCell>
													<TableCell>{registro.hora_saida || "-"}</TableCell>
													{user?.papel !== "gestor" && (
														<TableCell className="text-right">
															<div className="flex justify-end gap-2">
																<Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditarRegistro(registro)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Editar</span>
                                                    </Button>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleDelete(registro.id)}
																>
																	<Trash2 className="h-4 w-4" />
																	<span className="sr-only">Excluir</span>
																</Button>
															</div>
														</TableCell>
													)}
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={user?.papel !== "gestor" ? 6 : 5}
													className="h-24 text-center"
												>
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
      className="mt-4 border-gray-300 text-black dark:text-white dark:border-white"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>

    {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
      const pageNumber =
        currentPage <= totalPages - 4
          ? currentPage + index
          : totalPages - 4 + index;

      if (pageNumber > totalPages) return null;

      return (
        <Button
          key={pageNumber}
          variant={pageNumber === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(pageNumber)}
          className={`${
            pageNumber === currentPage
              ? "bg-blue-600 text-white dark:bg-white dark:text-black"
              : "border-gray-300 text-black dark:text-white dark:border-white"
          }`}
        >
          {pageNumber}
        </Button>
      );
    })}

    <Button
      variant="outline"
      size="sm"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(currentPage + 1)}
      className="border-gray-300 text-black dark:text-white dark:border-white"
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
)}

						</>
					)}
				</CardContent>
			</Card>
			<RegistroManualModal
				open={showManualModal}
				onOpenChange={setShowManualModal}
			/>
		 {/* ...existing modals... */}
            <ModalEditarRegistroPonto
                open={showEditarModal}
                onOpenChange={(open) => {
                    setShowEditarModal(open);
                    if (!open) setRegistroParaEditar(null);
                }}
                registro={registroParaEditar}
                onAtualizado={() => {
                    setShowEditarModal(false);
                    setRegistroParaEditar(null);
                    fetchRegistros();
                }}
            />
        </div>
	);
}
