"use client";

import { useState, useEffect } from "react";
import { FileDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	useFuncionarios,
	type Funcionario as FuncionarioBase,
} from "@/hooks/use-funcionarios";

type Funcionario = FuncionarioBase & { unidade_id?: number };
import { useRelatorioPDF } from "@/hooks/use-relatorio-pdf";
import { FuncionarioSearch } from "@/components/funcionario-search";
import { PeriodoSelector } from "@/components/periodo-selector";
import { useAuth } from "@/contexts/AuthContext"; // IMPORTANTE

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

	const { user } = useAuth(); // PEGANDO USUÁRIO LOGADO

	// Carrega do localStorage ao montar
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) setRecentFuncionarios(JSON.parse(stored));
	}, []);

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
		<div className="space-y-6">
			{/* Header */}
			<div className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-6">
				<h1 className="text-3xl font-bold tracking-tight text-blue-900">
					Relatórios
				</h1>
				<p className="text-blue-700">
					Gere relatórios de ponto dos funcionários em formato PDF
				</p>
			</div>

			{/* Main Card */}
			<Card className="shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-blue-900">
						<FileDown className="h-5 w-5 text-blue-700" />
						Relatório de Ponto
					</CardTitle>
					<CardDescription className="text-blue-700">
						Selecione um funcionário e o período para gerar o relatório em PDF
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Form */}
					<div className="grid gap-5 items-center md:grid-cols-4">
						<FuncionarioSearch
							selectedFuncionario={selectedFuncionario}
							onSelect={handleSelectFuncionario}
							recentFuncionarios={recentFuncionarios}
							loading={loadingFuncionarios}
							error={errorFuncionarios}
						/>

						<PeriodoSelector
							mes={mes}
							ano={ano}
							onMesChange={setMes}
							onAnoChange={setAno}
						/>

						<div className="flex justify-center md:justify-end mt-5 ">
							<Button
								onClick={handleGerarRelatorio}
								disabled={!isFormValid || loadingPDF}
								className="w-80 text-white bg-blue-500 hover:bg-blue-700 dark:bg-white dark:text-blue-900 dark:hover:bg-gray-200"
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
								<Card key={func.id} className="bg-muted/50 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
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
		</div>
	);
}
