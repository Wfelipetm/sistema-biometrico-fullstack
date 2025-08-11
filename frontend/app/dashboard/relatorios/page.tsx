"use client";

import { useState, useEffect } from "react";
import { FileDown, Download, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	useFuncionarios,
	type Funcionario as FuncionarioBase,
} from "@/hooks/use-funcionarios";

type Funcionario = FuncionarioBase & { unidade_id?: number };
import { useRelatorioPDF } from "@/hooks/use-relatorio-pdf";
import { useRelatorioPDFtodos } from "@/hooks/use-relatorio-pdf-todos-new";
import { FuncionarioSearch } from "@/components/funcionario-search";
import { PeriodoSelector } from "@/components/periodo-selector";
import { useAuth } from "@/contexts/AuthContext"; // IMPORTANTE
import { api } from "@/lib/api";
import { toast } from "sonner";

const STORAGE_KEY = "recentFuncionarios";

// Tipo para armazenar funcionário + data
type FuncionarioRecente = Funcionario & { dataConsulta: string };

export default function RelatoriosPage() {
	const [selectedFuncionario, setSelectedFuncionario] =
		useState<Funcionario | null>(null);
	const [recentFuncionarios, setRecentFuncionarios] = useState<
		FuncionarioRecente[]
	>([]);
	const [mes, setMes] = useState((new Date().getMonth() + 1).toString());
	const [ano, setAno] = useState(new Date().getFullYear().toString());
	const [loadingUnidadePDF, setLoadingUnidadePDF] = useState(false);
	const [loadingTodosPDF, setLoadingTodosPDF] = useState(false);
	const [unidadeNome, setUnidadeNome] = useState<string>("");
	const [unidades, setUnidades] = useState<Array<{ id: number, nome: string }>>([]);
	const [selectedUnidadeId, setSelectedUnidadeId] = useState<number | null>(null);
	const [loadingUnidades, setLoadingUnidades] = useState(false);

	const {
		funcionarios,
		loading: loadingFuncionarios,
		error: errorFuncionarios,
	} = useFuncionarios();
	const {
		gerarRelatorioPDF,
		loading: loadingPDF,
		error: errorPDF,
	} = useRelatorioPDF();

	const {
		gerarRelatorioPDF: gerarRelatorioPDFtodos,
		loading: loadingPDFtodos,
		error: errorPDFtodos,
	} = useRelatorioPDFtodos();

	const { user } = useAuth(); // PEGANDO USUÁRIO LOGADO

	// Carrega do localStorage ao montar
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) setRecentFuncionarios(JSON.parse(stored));
	}, []);

	// Carrega o nome da unidade se o usuário for gestor
	useEffect(() => {
		if (user?.unidade_id) {
			const fetchUnidadeNome = async () => {
				try {
					const response = await api.get(`unid/unidades`);
					if (response.data && response.data.nome) {
						setUnidadeNome(response.data.nome);
						// Define a unidade do usuário como selecionada por padrão
						setSelectedUnidadeId(user.unidade_id);
					}
				} catch (error) {
					console.error("Erro ao buscar nome da unidade:", error);
				}
			};

			fetchUnidadeNome();
		}
	}, [user]);

	// Carrega todas as unidades da secretaria do usuário
	useEffect(() => {
		if (user?.secretaria_id) {
			const fetchUnidades = async () => {
				try {
					setLoadingUnidades(true);
					const response = await api.get(`/secre/${user.secretaria_id}/unidades`);
					if (response.data && Array.isArray(response.data)) {
						setUnidades(response.data);
					}
				} catch (error) {
					console.error("Erro ao buscar unidades da secretaria:", error);
					toast.error("Erro ao carregar unidades da secretaria");
				} finally {
					setLoadingUnidades(false);
				}
			};

			fetchUnidades();
		}
	}, [user]);

	// Atualiza o histórico ao selecionar
	const handleSelectFuncionario = (funcionario: Funcionario | null) => {
		setSelectedFuncionario(funcionario);
		if (funcionario) {
			setRecentFuncionarios((prev) => {
				const filtered = prev.filter((f) => f.id !== funcionario.id);
				const novo: FuncionarioRecente = {
					...funcionario,
					dataConsulta: new Date().toISOString(),
				};
				const updated = [novo, ...filtered].slice(0, 5);
				localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
				return updated;
			});
		}
	};

	// Limpa um funcionário do histórico
	const handleLimparFuncionario = (funcionarioId: string) => {
		setRecentFuncionarios((prev) => {
			const updated = prev.filter((f) => f.id !== funcionarioId);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
			return updated;
		});
		if (selectedFuncionario?.id === funcionarioId) {
			setSelectedFuncionario(null);
		}
	};

	const handleGerarRelatorio = async () => {
		if (!selectedFuncionario) return;
		await gerarRelatorioPDF(selectedFuncionario.id, mes, ano);
	};




	const handleGerarRelatorioPorUnidade = async () => {
		const unidadeId = String(selectedUnidadeId || user?.unidade_id);
		console.log('[COMPONENTE] Iniciando handleGerarRelatorioPorUnidade', { unidadeId, mes, ano });
		if (!unidadeId) {
			toast.error("Selecione uma unidade para gerar o relatório");
			console.warn('[COMPONENTE] Unidade não selecionada');
			return;
		}
		setLoadingUnidadePDF(true);
		try {
			// Antes de gerar o PDF, buscar os dados da unidade para debug
			const response = await api.get(`/unid/${unidadeId}/funcionarios`);
			console.log('[COMPONENTE] Funcionários da unidade para PDF:', response.data);
			if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
				toast.warning("Nenhum funcionário encontrado na unidade selecionada");
				console.warn('[COMPONENTE] Nenhum funcionário encontrado na unidade', unidadeId);
				return;
			}
			await gerarRelatorioPDFtodos(unidadeId, mes, ano);
			console.log('[COMPONENTE] PDF da unidade gerado com sucesso', unidadeId);
		} catch (error) {
			console.error("Erro ao gerar relatório da unidade:", error);
			toast.error("Erro ao gerar relatório da unidade");
		} finally {
			setLoadingUnidadePDF(false);
			console.log('[COMPONENTE] Finalizou handleGerarRelatorioPorUnidade', { unidadeId, mes, ano });
		}
	};

	const isFormValid = selectedFuncionario && mes && ano;
	const hasError = errorFuncionarios || errorPDF;

	// Remove os recentes da lista de pesquisa e filtra para gestor
	const recentesIds = recentFuncionarios.map((f) => f.id);
	const funcionariosParaPesquisa = funcionarios.filter((f) => {
		if (user?.papel === "gestor" && user.unidade_id) {
			return !recentesIds.includes(f.id) && f.unidade_id === user.unidade_id;
		}
		return !recentesIds.includes(f.id);
	});

	// Função para formatar a data
	function formatarData(dataISO: string) {
		const data = new Date(dataISO);
		return data.toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	return (
		<div className="space-y-3">
			{/* Header */}
			<div className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-6">
				<h1 className="text-3xl font-bold tracking-tight text-blue-900">
					Relatórios
				</h1>
				<p className="text-blue-700">
					Gere relatórios de ponto dos funcionários em formato PDF
				</p>
			</div>

			<Tabs defaultValue="funcionario">
				<TabsList className="grid w-full bg-white/0 gap-20 px-10 grid-cols-2">
					<TabsTrigger
						value="funcionario"
						className="text-blue-900 bg-white shadow-lg backdrop-blur-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
					>
						Relatório por Funcionário
					</TabsTrigger>
					<TabsTrigger
						value="unidade"
						disabled={!user?.secretaria_id && !user?.unidade_id}
						title={!user?.secretaria_id && !user?.unidade_id ? "Disponível apenas para usuários com secretaria ou unidade" : ""}
						className="text-blue-900 bg-white shadow-lg backdrop-blur-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
					>
						Relatório da Unidade
					</TabsTrigger>
				</TabsList>

				<TabsContent value="funcionario">
					{/* Main Card - Funcionário */}
					<Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-blue-900">
								<FileDown className="h-5 w-5 text-blue-700" />
								Relatório de Ponto
							</CardTitle>
							<CardDescription className="text-blue-700 ">
								Selecione um funcionário e o período para gerar o relatório em PDF
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-6">
							{/* Form Funcionário - layout igual ao de unidade */}
							<div className="flex flex-col md:flex-row gap-2 items-end w-full">
								<div className="w-full md:w-96">
									<FuncionarioSearch
										selectedFuncionario={selectedFuncionario}
										onSelect={handleSelectFuncionario}
										recentFuncionarios={recentFuncionarios}
										loading={loadingFuncionarios}
										error={errorFuncionarios}
									/>
								</div>
								<PeriodoSelector
									mes={mes}
									ano={ano}
									onMesChange={setMes}
									onAnoChange={setAno}
									inputWidthClass="w-full md:w-56 lg:w-96"
								/>
								<Button
									onClick={handleGerarRelatorio}
									disabled={!isFormValid || loadingPDF}
									className="w-full md:w-96 text-white bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-blue-900 dark:hover:bg-gray-200"
									size="default"
								>
									{loadingPDF ? (
										<>
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
											Gerando...
										</>
									) : (
										<>
											<Download className="mr-2 h-4 w-4" />
											Gerar PDF
										</>
									)}
								</Button>
							</div>

							{/* Error Display */}
							{hasError && (
								<Alert variant="destructive" className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
									<AlertDescription className="text-blue-700">
										{errorFuncionarios || errorPDF}
									</AlertDescription>
								</Alert>
							)}

							{/* Recentes Cards - vertical */}
							{recentFuncionarios.length > 0 && (
								<div className="flex flex-col gap-2">
									{recentFuncionarios.map((func) => (
										<Card key={func.id} className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
											<CardContent className="pt-6">
												<div className="flex items-center justify-between">
													<div>
														<p className="font-medium text-blue-900">{func.nome}</p>
														<p className="text-xs text-blue-700">
															Consultado em: {formatarData(func.dataConsulta)}
														</p>
														<p className="text-sm text-blue-700">
															{selectedFuncionario?.id === func.id
																? `Período: ${mes.padStart(2, "0")}/${ano}`
																: "Funcionário recente"}
														</p>
													</div>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleLimparFuncionario(func.id)}
														className="bg-blue-600 border-blue-200 text-white dark:text-blue-900 dark:bg-white dark:border-white hover:bg-blue-100 dark:hover:bg-gray-200"
													>
														Limpar
													</Button>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="unidade">
					{/* Main Card - Unidade */}
					<Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-blue-900">
								<Building2 className="h-5 w-5 text-blue-700" />
								Relatório da Unidade
							</CardTitle>
							<CardDescription className="text-blue-700">
								Gere um relatório consolidado de todos os funcionários da sua unidade
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-6">
							{/* Form - todos alinhados */}
							<div className="flex flex-col md:flex-row gap-2 items-end w-full">
								{/* Unidade */}
								<div className="flex flex-col gap-2 w-full md:w-auto">
									<Label className="text-sm font-medium text-blue-900">Unidade</Label>
									{loadingUnidades ? (
										<div className="flex h-10 w-full md:w-96 items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm">
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
											Carregando unidades...
										</div>
									) : unidades.length > 0 ? (
										<Select 
											value={selectedUnidadeId?.toString() || ""} 
											onValueChange={(value) => setSelectedUnidadeId(Number(value) || null)}
										>
											<SelectTrigger className="w-full md:w-96 border-blue-300 text-blue-900 placeholder:text-blue-700">
												<SelectValue 
													placeholder="Selecione uma unidade"
													className="text-blue-900 placeholder:text-blue-700"
												/>
											</SelectTrigger>
											<SelectContent>
												{unidades.map((unidade) => (
													<SelectItem
														key={unidade.id}
														value={unidade.id.toString()}
														className="text-blue-900 data-[state=checked]:bg-blue-100"
													>
														{unidade.nome}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : user?.unidade_id ? (
										<div className="flex h-10 w-full md:w-96 items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm">
											<span>{unidadeNome || "Sua Unidade"}</span>
										</div>
									) : (
										<div className="flex h-10 w-full md:w-96 items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-gray-400">
											Nenhuma unidade encontrada
										</div>
									)}
								</div>
								{/* Período (Mês e Ano) */}
								<PeriodoSelector
									mes={mes}
									ano={ano}
									onMesChange={setMes}
									onAnoChange={setAno}
									inputWidthClass="w-full h-10 md:w-56 lg:w-72"
								/>
								{/* Botão */}
								<Button
									onClick={handleGerarRelatorioPorUnidade}
									disabled={(!selectedUnidadeId && !user?.unidade_id) || loadingUnidadePDF}
									className="w-full md:w-80 text-white bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-blue-900 dark:hover:bg-gray-200"
									size="default"
								>
									{loadingUnidadePDF ? (
										<>
											<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
											Gerando...
										</>
									) : (
										<>
											<Download className="mr-2 h-4 w-4" />
											Gerar PDF da Unidade
										</>
									)}
								</Button>
							</div>
							{/* Aviso sobre secretaria */}
							{!user?.secretaria_id && (
								<p className="text-xs text-amber-600">
									Você não está vinculado a nenhuma secretaria. Contate o administrador.
								</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
