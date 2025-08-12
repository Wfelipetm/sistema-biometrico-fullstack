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
import { UnidadeSearch } from "@/components/unidade-search";
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
	const isUnidadeFormValid = !!selectedUnidadeId && !!mes && !!ano;
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
		<div className="space-y-3 p-2 sm:p-4 md:p-6 max-w-full overflow-hidden responsive-container aoc-24p1u-fix">
			{/* Header */}
			<div className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-4 sm:p-6 overflow-fix">
				<h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-blue-900 responsive-text">
					Relatórios
				</h1>
				<p className="text-sm sm:text-base text-blue-700 mt-1 responsive-text">
					Gere relatórios de ponto dos funcionários em formato PDF
				</p>
			</div>

			<Tabs defaultValue="funcionario" className="w-full overflow-fix">
				<TabsList className="grid w-full bg-white/0 gap-2 sm:gap-4 md:gap-10 grid-cols-2 mb-7 responsive-grid">
					<TabsTrigger
						value="funcionario"
						className="text-xs sm:text-sm md:text-base text-blue-900 bg-white shadow-lg backdrop-blur-md data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-4 py-2 sm:py-3 responsive-button"
					>
						<span className="hidden sm:inline">Relatório por Funcionário</span>
					</TabsTrigger>
					<TabsTrigger
						value="unidade"
						disabled={!user?.secretaria_id && !user?.unidade_id}
						title={!user?.secretaria_id && !user?.unidade_id ? "Disponível apenas para usuários com secretaria ou unidade" : ""}
						className="text-xs sm:text-sm md:text-base text-blue-900 bg-white shadow-lg backdrop-blur-md data-[state=active]:bg-blue-600 data-[state=active]:text-white px-2 sm:px-4 py-2 sm:py-3 responsive-button"
					>
						<span className="hidden sm:inline">Relatório da Unidade</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="funcionario" className="mt-4 overflow-fix">
					{/* Main Card - Funcionário */}
					<Card className="shadow-xl rounded-xl backdrop-blur-md overflow-fix">
						<CardHeader className="p-4 sm:p-6">
							<CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl md:text-2xl responsive-text">
								<FileDown className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
								Relatório de Ponto
							</CardTitle>
							<CardDescription className="text-blue-700 text-sm sm:text-base responsive-text">
								Selecione um funcionário e o período para gerar o relatório em PDF
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4 sm:space-y-6 min-h-[100px] p-4 sm:p-6 overflow-fix">
							{/* Form Funcionário - layout responsivo */}
							<div className="flex flex-col gap-4 w-full">
								{/* Layout responsivo: vertical em sm, horizontal em md/lg */}
								<div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
									{/* Funcionário */}
									<div className="w-full md:flex-1 lg:flex-[2]">
										<FuncionarioSearch
											selectedFuncionario={selectedFuncionario}
											onSelect={handleSelectFuncionario}
											recentFuncionarios={recentFuncionarios}
											loading={loadingFuncionarios}
											error={errorFuncionarios}
											inputWidthClass="w-full"
											containerClass="w-full overflow-fix"
										/>
									</div>
									
									{/* Mês */}
									<div className="w-full md:w-32 lg:w-40">
										<div className="grid gap-2">
											<Label 
												htmlFor="mes" 
												className="text-blue-900 font-medium text-sm md:text-base"
											>
												Mês
											</Label>
											<Select value={mes} onValueChange={setMes}>
												<SelectTrigger className="border-blue-300 text-blue-900 placeholder:text-blue-700 transition-all duration-200 hover:border-blue-400 h-10 text-sm md:text-base w-full">
													<SelectValue
														placeholder="Selecione o mês"
														className="text-blue-900 placeholder:text-blue-700"
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[200px] overflow-y-auto">
													{[
														{ value: "1", label: "Janeiro" },
														{ value: "2", label: "Fevereiro" },
														{ value: "3", label: "Março" },
														{ value: "4", label: "Abril" },
														{ value: "5", label: "Maio" },
														{ value: "6", label: "Junho" },
														{ value: "7", label: "Julho" },
														{ value: "8", label: "Agosto" },
														{ value: "9", label: "Setembro" },
														{ value: "10", label: "Outubro" },
														{ value: "11", label: "Novembro" },
														{ value: "12", label: "Dezembro" },
													].map((mesItem) => (
														<SelectItem
															key={mesItem.value}
															value={mesItem.value}
															className="text-blue-900 data-[state=checked]:bg-blue-100 hover:bg-blue-50 cursor-pointer transition-colors duration-150 py-2 text-sm md:text-base"
														>
															{mesItem.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Ano */}
									<div className="w-full md:w-24 lg:w-28">
										<div className="grid gap-2">
											<Label 
												htmlFor="ano" 
												className="text-blue-900 font-medium text-sm md:text-base"
											>
												Ano
											</Label>
											<Select value={ano} onValueChange={setAno}>
												<SelectTrigger className="border-blue-300 text-blue-900 placeholder:text-blue-700 transition-all duration-200 hover:border-blue-400 h-10 text-sm md:text-base w-full">
													<SelectValue
														placeholder="Ano"
														className="text-blue-900 placeholder:text-blue-700"
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[200px] overflow-y-auto">
													{Array.from({ length: 5 }, (_, i) => {
														const year = new Date().getFullYear() - 2 + i;
														return { value: year.toString(), label: year.toString() };
													}).map((anoItem) => (
														<SelectItem
															key={anoItem.value}
															value={anoItem.value}
															className="text-blue-900 data-[state=checked]:bg-blue-100 hover:bg-blue-50 cursor-pointer transition-colors duration-150 py-2 text-sm md:text-base"
														>
															{anoItem.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Botão */}
									<Button
										onClick={handleGerarRelatorio}
										disabled={!isFormValid || loadingPDF}
										className="w-full md:w-auto md:min-w-[180px] lg:min-w-[200px] text-white bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-blue-900 dark:hover:bg-gray-200 h-10 text-sm md:text-base responsive-button"
										size="default"
									>
										{loadingPDF ? (
											<>
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												<span className="hidden lg:inline">Gerando...</span>
												<span className="lg:hidden">...</span>
											</>
										) : (
											<>
												<Download className="mr-2 h-4 w-4" />
												<span className="hidden lg:inline text-overflow-fix">Gerar PDF do Funcionário</span>
												<span className="lg:hidden">Gerar PDF</span>
											</>
										)}
									</Button>
								</div>
							</div>

							{/* Error Display */}
							{hasError && (
								<Alert variant="destructive" className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
									<AlertDescription className="text-blue-700 text-sm sm:text-base">
										{errorFuncionarios || errorPDF}
									</AlertDescription>
								</Alert>
							)}

							{/* Recentes Cards - responsivo */}
							{recentFuncionarios.length > 0 && (
								<div className="flex flex-col gap-2 sm:gap-3">
									<h3 className="text-sm sm:text-base font-medium text-blue-900">
										Funcionários consultados recentemente:
									</h3>
									{recentFuncionarios.map((func) => (
										<Card key={func.id} className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
											<CardContent className="p-3 sm:p-4 md:p-6">
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
													<div className="flex-1 min-w-0">
														<p className="font-medium text-blue-900 text-sm sm:text-base truncate">
															{func.nome}
														</p>
														<p className="text-xs sm:text-sm text-blue-700">
															Consultado em: {formatarData(func.dataConsulta)}
														</p>
														<p className="text-xs sm:text-sm text-blue-700">
															{selectedFuncionario?.id === func.id
																? `Período: ${mes.padStart(2, "0")}/${ano}`
																: "Funcionário recente"}
														</p>
													</div>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleLimparFuncionario(func.id)}
														className="bg-blue-600 border-blue-200 text-white dark:text-blue-900 dark:bg-white dark:border-white hover:bg-blue-100 dark:hover:bg-gray-200 w-full sm:w-auto text-xs sm:text-sm"
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

				<TabsContent value="unidade" className="mt-4">
					{/* Main Card - Unidade */}
					<Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
						<CardHeader className="p-4 sm:p-6">
							<CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl md:text-2xl">
								<Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" />
								Relatório da Unidade
							</CardTitle>
							<CardDescription className="text-blue-700 text-sm sm:text-base">
								Gere um relatório consolidado de todos os funcionários da sua unidade
							</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4 sm:space-y-6 min-h-[100px] p-4 sm:p-6">
							{/* Form - responsivo */}
							<div className="flex flex-col gap-4 w-full">
								{/* Layout responsivo: vertical em sm, horizontal em md/lg */}
								<div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
									{/* Unidade */}
									<div className="w-full md:flex-1 lg:flex-[2]">
										<Label className="text-sm md:text-base font-medium text-blue-900 mb-2 block">
											Unidade
										</Label>
										{loadingUnidades ? (
											<div className="flex h-10 w-full items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm md:text-base">
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
												Carregando unidades...
											</div>
										) : unidades.length > 0 ? (
											<Select 
												value={selectedUnidadeId?.toString() || ""} 
												onValueChange={(value) => setSelectedUnidadeId(Number(value) || null)}
											>
												<SelectTrigger className="w-full border-blue-300 text-blue-900 placeholder:text-blue-700 h-10 text-sm md:text-base transition-all duration-200 hover:border-blue-400">
													<SelectValue 
														placeholder="Selecione uma unidade"
														className="text-blue-900 placeholder:text-blue-700"
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[200px] overflow-y-auto">
													{unidades.map((unidade) => (
														<SelectItem
															key={unidade.id}
															value={unidade.id.toString()}
															className="text-blue-900 data-[state=checked]:bg-blue-100 hover:bg-blue-50 cursor-pointer py-2 text-sm md:text-base transition-colors duration-150"
														>
															{unidade.nome}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : user?.unidade_id ? (
											<div className="flex h-10 w-full items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm md:text-base">
												<span>{unidadeNome || "Sua Unidade"}</span>
											</div>
										) : (
											<div className="flex h-10 w-full items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm md:text-base text-gray-400">
												Nenhuma unidade encontrada
											</div>
										)}
									</div>
									
									{/* Mês */}
									<div className="w-full md:w-32 lg:w-40">
										<div className="grid gap-2">
											<Label 
												htmlFor="mes-unidade" 
												className="text-blue-900 font-medium text-sm md:text-base"
											>
												Mês
											</Label>
											<Select value={mes} onValueChange={setMes}>
												<SelectTrigger className="border-blue-300 text-blue-900 placeholder:text-blue-700 transition-all duration-200 hover:border-blue-400 h-10 text-sm md:text-base w-full">
													<SelectValue
														placeholder="Selecione o mês"
														className="text-blue-900 placeholder:text-blue-700"
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[200px] overflow-y-auto">
													{[
														{ value: "1", label: "Janeiro" },
														{ value: "2", label: "Fevereiro" },
														{ value: "3", label: "Março" },
														{ value: "4", label: "Abril" },
														{ value: "5", label: "Maio" },
														{ value: "6", label: "Junho" },
														{ value: "7", label: "Julho" },
														{ value: "8", label: "Agosto" },
														{ value: "9", label: "Setembro" },
														{ value: "10", label: "Outubro" },
														{ value: "11", label: "Novembro" },
														{ value: "12", label: "Dezembro" },
													].map((mesItem) => (
														<SelectItem
															key={mesItem.value}
															value={mesItem.value}
															className="text-blue-900 data-[state=checked]:bg-blue-100 hover:bg-blue-50 cursor-pointer transition-colors duration-150 py-2 text-sm md:text-base"
														>
															{mesItem.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Ano */}
									<div className="w-full md:w-24 lg:w-28">
										<div className="grid gap-2">
											<Label 
												htmlFor="ano-unidade" 
												className="text-blue-900 font-medium text-sm md:text-base"
											>
												Ano
											</Label>
											<Select value={ano} onValueChange={setAno}>
												<SelectTrigger className="border-blue-300 text-blue-900 placeholder:text-blue-700 transition-all duration-200 hover:border-blue-400 h-10 text-sm md:text-base w-full">
													<SelectValue
														placeholder="Ano"
														className="text-blue-900 placeholder:text-blue-700"
													/>
												</SelectTrigger>
												<SelectContent className="max-h-[200px] overflow-y-auto">
													{Array.from({ length: 5 }, (_, i) => {
														const year = new Date().getFullYear() - 2 + i;
														return { value: year.toString(), label: year.toString() };
													}).map((anoItem) => (
														<SelectItem
															key={anoItem.value}
															value={anoItem.value}
															className="text-blue-900 data-[state=checked]:bg-blue-100 hover:bg-blue-50 cursor-pointer transition-colors duration-150 py-2 text-sm md:text-base"
														>
															{anoItem.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>

									{/* Botão */}
									<Button
										onClick={handleGerarRelatorioPorUnidade}
										disabled={!isUnidadeFormValid || loadingUnidadePDF}
										className="w-full md:w-auto md:min-w-[180px] lg:min-w-[200px] text-white bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-blue-900 dark:hover:bg-gray-200 h-10 text-sm md:text-base responsive-button"
										size="default"
									>
										{loadingUnidadePDF ? (
											<>
												<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
												<span className="hidden lg:inline">Gerando...</span>
												<span className="lg:hidden">...</span>
											</>
										) : (
											<>
												<Download className="mr-2 h-4 w-4" />
												<span className="hidden lg:inline text-overflow-fix">Gerar PDF da Unidade</span>
												<span className="lg:hidden">Gerar PDF</span>
											</>
										)}
									</Button>
								</div>
							</div>
							
							{/* Aviso sobre secretaria */}
							{!user?.secretaria_id && (
								<p className="text-xs sm:text-sm text-amber-600 bg-amber-50 p-2 sm:p-3 rounded-lg">
									Você não está vinculado a nenhuma secretaria. Contate o administrador.
								</p>
							)}
							
							{/* Espaço reservado para manter altura consistente */}
							
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
