"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { differenceInDays } from "date-fns";
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Funcionario = {
	id: number;
	nome: string;
};

type FeriasItem = {
	id: number;
	nome_funcionario: string;
	status_ferias: string;
	nome_unidade: string;
	unidade_id: number;
	data_inicio: string;
	data_fim: string;
};

type CadastrarFeriasModalProps = {
	funcionarios: Funcionario[];
	unidadeId: number;
	onClose?: () => void;
	open?: boolean;
};

export default function CadastrarFeriasModal({
	funcionarios,
	unidadeId,
	onClose,
	open: propOpen,
}: CadastrarFeriasModalProps) {
	const [open, setOpen] = useState(propOpen ?? false);
	const [funcionarioId, setFuncionarioId] = useState("");
	const [dataInicio, setDataInicio] = useState("");
	const [dataFim, setDataFim] = useState("");
	const [isSalvando, setIsSalvando] = useState(false);
	const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<
		Funcionario[]
	>([]);
	const [feriasCadastradas, setFeriasCadastradas] = useState<FeriasItem[]>([]);
	const [loadingAprovar, setLoadingAprovar] = useState<number | null>(null);

	const carregarFerias = useCallback(async () => {
		try {
			const response = await axios.get<{ dados: FeriasItem[] }>(
				`${API_URL}/ferias/ferias-por-unidade/${unidadeId}`,
			);

			const dadosFerias = response.data.dados ?? [];

			setFeriasCadastradas(dadosFerias);

			const nomesComFerias = new Set(
				dadosFerias.map((item) => item.nome_funcionario.trim().toLowerCase()),
			);

			const disponiveis = funcionarios.filter(
				(f) => !nomesComFerias.has(f.nome.trim().toLowerCase()),
			);

			setFuncionariosDisponiveis(disponiveis);
		} catch (err) {
			console.error("Erro ao buscar férias:", err);
			setFuncionariosDisponiveis(funcionarios);
		}
	}, [funcionarios, unidadeId]);

	useEffect(() => {
		if (open) {
			carregarFerias();
		}
	}, [open, carregarFerias]);

	const cadastrarFerias = async () => {
		if (!funcionarioId || !dataInicio || !dataFim) {
			alert("Por favor, preencha todos os campos!");
			return;
		}

		if (new Date(dataFim) < new Date(dataInicio)) {
			alert("A data de fim não pode ser anterior à data de início.");
			return;
		}

		const dias_ferias =
			differenceInDays(new Date(dataFim), new Date(dataInicio)) + 1;

		setIsSalvando(true);
		try {
			await axios.post("http://biometrico.itaguai.rj.gov.br:3001/ferias", {
				funcionario_id: Number(funcionarioId),
				unidade_id: unidadeId,
				data_inicio: dataInicio,
				data_fim: dataFim,
				dias_ferias,
				status: "solicitada",
			});

			alert("Férias cadastradas com sucesso!");
			setFuncionarioId("");
			setDataInicio("");
			setDataFim("");
			carregarFerias();
		} catch (err) {
			console.error("Erro ao cadastrar férias:", err);
			alert("Erro ao cadastrar férias. Tente novamente.");
		} finally {
			setIsSalvando(false);
		}
	};

	const aprovarFerias = async (idFerias: number) => {
		setLoadingAprovar(idFerias);
		try {
			await axios.put(
				`http://biometrico.itaguai.rj.gov.br:3001/ferias/atualizar-ferias/${idFerias}/aprovar`,
			);
			alert("Férias aprovadas com sucesso!");

			setFeriasCadastradas((prev) =>
				prev.map((f) =>
					f.id === idFerias ? { ...f, status_ferias: "aprovada" } : f,
				),
			);
		} catch (error) {
			console.error("Erro ao aprovar férias:", error);
			alert("Erro ao aprovar férias. Tente novamente.");
		} finally {
			setLoadingAprovar(null);
		}
	};

	const excluirFerias = async (idFerias: number) => {
		const confirmar = confirm(
			"Tem certeza que deseja excluir esta solicitação de férias?",
		);
		if (!confirmar) return;

		try {
			await axios.delete(
				`http://biometrico.itaguai.rj.gov.br:3001/ferias/${idFerias}`,
			);
			alert("Férias excluídas com sucesso!");
			setFeriasCadastradas((prev) => prev.filter((f) => f.id !== idFerias));
		} catch (error) {
			console.error("Erro ao excluir férias:", error);
			alert("Erro ao excluir férias. Tente novamente.");
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				setOpen(o);
				if (!o && onClose) onClose();
			}}
		>
			<DialogTrigger asChild>
				<Button className="bg-green-600 hover:bg-green-700 text-white">
					Cadastrar Férias
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle>Nova Solicitação de Férias</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{/* Formulário */}
					<div className="space-y-4">
						<div>
							<Label htmlFor="funcionario-select">Funcionário</Label>
							<select
								id="funcionario-select"
								value={funcionarioId}
								onChange={(e) => setFuncionarioId(e.target.value)}
								className="w-full p-2 border border-gray-300 rounded text-black dark:text-white dark:bg-gray-800 dark:border-white focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={isSalvando}
							>
								<option value="">Selecione um funcionário</option>
								{funcionariosDisponiveis.map((f) => (
									<option key={f.id} value={f.id}>
										{f.nome}
									</option>
								))}
							</select>

						</div>

						<div>
							<Label htmlFor="data-inicio">Data Início</Label>
							<Input
								id="data-inicio"
								type="date"
								value={dataInicio}
								onChange={(e) => setDataInicio(e.target.value)}
								disabled={isSalvando}
							/>
						</div>

						<div>
							<Label htmlFor="data-fim">Data Fim</Label>
							<Input
								id="data-fim"
								type="date"
								value={dataFim}
								onChange={(e) => setDataFim(e.target.value)}
								disabled={isSalvando}
							/>
						</div>

						<Button
							onClick={cadastrarFerias}
							className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-gray-200"
							disabled={isSalvando}
						>
							{isSalvando ? "Salvando..." : "Salvar"}
						</Button>

					</div>

					{/* Lista de Férias Cadastradas */}
					{feriasCadastradas.length > 0 && (
						<div>
							<h3 className="font-semibold text-lg mb-3">Férias cadastradas</h3>
							<ul className="max-h-60 overflow-y-auto space-y-3">
								{feriasCadastradas.map((f) => (
									<li
										key={f.id}
										className="flex items-center justify-between border rounded p-3"
									>
										<div>
											<p className="font-medium">{f.nome_funcionario}</p>
											<p className="text-sm text-gray-600">
												Status:{" "}
												<span
													className={
														f.status_ferias === "aprovada"
															? "text-green-600 font-semibold"
															: "text-yellow-600 font-semibold"
													}
												>
													{f.status_ferias}
												</span>
											</p>
											<p className="text-xs text-gray-500">
												{f.data_inicio} até {f.data_fim}
											</p>
										</div>
										<div className="flex gap-2">
											{f.status_ferias !== "aprovada" && (
												<Button
													size="sm"
													className="bg-green-600 hover:bg-green-700 text-white"
													disabled={loadingAprovar === f.id}
													onClick={() => aprovarFerias(f.id)}
												>
													{loadingAprovar === f.id ? "Aprovando..." : "Aprovar"}
												</Button>
											)}
											<Button
												size="sm"
												variant="destructive"
												onClick={() => excluirFerias(f.id)}
											>
												Excluir
											</Button>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
