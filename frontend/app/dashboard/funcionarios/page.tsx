"use client";

import { useState, useEffect } from "react";
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
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Plus,
	Search,
	Edit,
	Trash2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ModalEditarFuncionario from "@/components/modal-editar-funcionario";
import CadastroFuncionarioModal from "@/components/CadastroFuncionarioModal";

type Funcionario = {
	id: string;
	nome: string;
	cpf: string;
	cargo: string;
	unidade_nome?: string;
	matricula?: number;
	data_admissao?: string;
	secretaria_id?: number;
};

export default function FuncionariosPage() {
	const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [showCadastroModal, setShowCadastroModal] = useState(false);
	const [showEditarModal, setShowEditarModal] = useState(false);
	const [funcionarioSelecionado, setFuncionarioSelecionado] =
		useState<Funcionario | null>(null);
	const itemsPerPage = 10;
	const router = useRouter();
	const { user } = useAuth();

	const fetchFuncionarios = async () => {
		setLoading(true);
		try {
			if (!user) {
				setLoading(false);
				return;
			}

			let url = "";

			if (user.papel === "gestor" && user.unidade_id) {
				url = `http://biometrico.itaguai.rj.gov.br:3001/unid/${user.unidade_id}/funcionarios`;
			} else if (user.secretaria_id) {
				url = `http://biometrico.itaguai.rj.gov.br:3001/secre/${user.secretaria_id}/funcionarios`;
			} else {
				setLoading(false);
				return;
			}

			const response = await fetch(url);
			if (!response.ok) throw new Error("Falha ao buscar funcionários");

			let data: Funcionario[] = await response.json();

			if (user.papel === "gestor" && user.unidade_id) {
				const unidadeResp = await api.get(`/unid/unidade/${user.unidade_id}`);
				const unidadeNome = unidadeResp.data?.nome || "";
				data = data.map((func) => ({
					...func,
					unidade_nome: unidadeNome,
				}));
			}

			setFuncionarios(data);
		} catch (error) {
			console.error("Erro ao buscar funcionários:", error);
		} finally {
			setLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		fetchFuncionarios();
	}, [user]);

	const handleDelete = async (id: string) => {
		if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
			try {
				await api.delete(`/funci/funcionario/${id}`);
				setFuncionarios(funcionarios.filter((func) => func.id !== id));
			} catch (error) {
				console.error("Erro ao excluir funcionário:", error);
			}
		}
	};

	const abrirModalEditar = (funcionario: Funcionario) => {
		setFuncionarioSelecionado(funcionario);
		setShowEditarModal(true);
	};

	const fecharModalEditar = () => {
		setShowEditarModal(false);
		setFuncionarioSelecionado(null);
	};

	const handleAtualizarSucesso = () => {
		// Recarrega a lista após editar
		fetchFuncionarios();
	};

	const filteredFuncionarios = funcionarios.filter(
		(funcionario) =>
			funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
			funcionario.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const totalPages = Math.ceil(filteredFuncionarios.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentFuncionarios = filteredFuncionarios.slice(startIndex, endIndex);

	const changePage = (page: number) => {
		if (page < 1 || page > totalPages) return;
		setCurrentPage(page);
	};

	const generatePaginationButtons = () => {
		const buttons = [];
		const maxVisibleButtons = 5;

		if (totalPages <= maxVisibleButtons) {
			for (let i = 1; i <= totalPages; i++) {
				buttons.push(i);
			}
		} else {
			let startPage = Math.max(
				1,
				currentPage - Math.floor(maxVisibleButtons / 2),
			);
			let endPage = startPage + maxVisibleButtons - 1;

			if (endPage > totalPages) {
				endPage = totalPages;
				startPage = Math.max(1, endPage - maxVisibleButtons + 1);
			}

			for (let i = startPage; i <= endPage; i++) {
				buttons.push(i);
			}
		}

		return buttons;
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
					<p className="text-muted-foreground">
						Gerencie os funcionários da {user?.secretaria_nome || "secretaria"}
					</p>
				</div>
				<Button
				className="text-white dark:bg-white dark:text-black"
				onClick={() => setShowCadastroModal(true)}>
					<Plus className="mr-2 h-4 w-4 " /> Novo Funcionário
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Funcionários</CardTitle>
					<CardDescription>
						Total de {funcionarios.length} funcionários cadastrados
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex items-center gap-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar funcionário..."
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="max-w-sm"
						/>
					</div>

					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Avatar</TableHead>
										<TableHead>Nome</TableHead>
										<TableHead>CPF</TableHead>
										<TableHead>Cargo</TableHead>
										<TableHead>Unidade</TableHead>
										<TableHead>Matrícula</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{currentFuncionarios.length > 0 ? (
										currentFuncionarios.map((funcionario) => {
											const nomes = funcionario.nome.trim().split(" ");
											const nome = nomes[0] || "";
											const sobrenome =
												nomes.length > 1 ? nomes.slice(1).join(" ") : "";

											return (
												<TableRow key={funcionario.id}>
													<TableCell>
														<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
															{`${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase()}
														</div>
													</TableCell>
													<TableCell className="font-medium">
														{nome} {sobrenome}
													</TableCell>

													<TableCell>{funcionario.cpf || "-"}</TableCell>
													<TableCell>{funcionario.cargo}</TableCell>
													<TableCell>
														{funcionario.unidade_nome || "-"}
													</TableCell>

													<TableCell>{funcionario.matricula || "-"}</TableCell>

													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																variant="ghost"
																size="icon"
																onClick={() => abrirModalEditar(funcionario)}
															>
																<Edit className="h-4 w-4" />
																<span className="sr-only">Editar</span>
															</Button>
															<Button
																variant="ghost"
																size="icon"
																onClick={() => handleDelete(funcionario.id)}
															>
																<Trash2 className="h-4 w-4" />
																<span className="sr-only">Excluir</span>
															</Button>
														</div>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell
												colSpan={7}
												className="text-center font-medium text-muted-foreground"
											>
												Nenhum funcionário encontrado.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
				<CardFooter>
					<div className="flex items-center justify-between">
						<Button
							variant="outline"
							size="sm"
							onClick={() => changePage(currentPage - 1)}
							disabled={currentPage === 1}
						>
							<ChevronLeft className="mr-2 h-4 w-4" /> Anterior
						</Button>

						<div className="flex gap-2">
							{generatePaginationButtons().map((pageNumber) => (
								<Button
									key={pageNumber}
									variant={pageNumber === currentPage ? "default" : "outline"}
									size="sm"
									onClick={() => changePage(pageNumber)}
								>
									{pageNumber}
								</Button>
							))}
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={() => changePage(currentPage + 1)}
							disabled={currentPage === totalPages}
						>
							Próximo <ChevronRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</CardFooter>
			</Card>

			{/* Modal Editar Funcionário */}
			{funcionarioSelecionado && (
				<ModalEditarFuncionario
					open={showEditarModal}
					onOpenChange={setShowEditarModal}
					funcionario={{
						id: funcionarioSelecionado.id,
						nome: funcionarioSelecionado.nome,
						cpf: funcionarioSelecionado.cpf,
						cargo: funcionarioSelecionado.cargo,
						data_admissao: funcionarioSelecionado.data_admissao || "",
						unidade_id: "", // ajuste aqui se tiver unidade_id
						matricula: funcionarioSelecionado.matricula
							? funcionarioSelecionado.matricula.toString()
							: "",
						tipo_escala: "", // ajuste se tiver
						telefone: "", // ajuste se tiver
					}}
					onSuccess={() => {
						fecharModalEditar();
						handleAtualizarSucesso();
					}}
				/>
			)}
			{showCadastroModal && (
				<CadastroFuncionarioModal
					open={showCadastroModal}
					onOpenChange={setShowCadastroModal}
				/>
			)}
		</div>
	);
}
