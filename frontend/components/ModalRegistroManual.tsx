"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { registrarLog } from "@/utils/logger";

type Funcionario = {
	id: string;
	nome: string;
};

type ModalCadastroManualProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export default function ModalCadastroManual({
	open,
	onOpenChange,
	onSuccess,
}: ModalCadastroManualProps) {
	const { user } = useAuth();
	const unidadeId = user?.unidade_id || "";

	const [funcionarioId, setFuncionarioId] = useState("");
	const [funcionarioInput, setFuncionarioInput] = useState("");
	const [horaEntrada, setHoraEntrada] = useState("00:00");
	const [horaSaida, setHoraSaida] = useState("00:00");
	const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);

	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchFuncionarios = async () => {
			try {
				if (!unidadeId) return;
				const { data: lista } = await api.get(
					`/unid/${unidadeId}/funcionarios`,
				);
				setFuncionarios(lista);
			} catch (err) {
				console.error("Erro ao buscar funcionários:", err);
				setError("Erro ao carregar funcionários.");
			}
		};

		if (open && unidadeId) {
			fetchFuncionarios();
		}
	}, [open, unidadeId]);

	useEffect(() => {
		// Fechar dropdown ao clicar fora
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const filteredFuncionarios = funcionarios.filter((f) =>
		f.nome.toLowerCase().includes(funcionarioInput.toLowerCase()),
	);

	const resetForm = () => {
		setFuncionarioId("");
		setFuncionarioInput("");
		setHoraEntrada("00:00");
		setHoraSaida("00:00");
		setData(new Date().toISOString().slice(0, 10));
		setError("");
		setShowDropdown(false);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const body = {
			funcionario_id: funcionarioId,
			unidade_id: unidadeId,
			hora_entrada: horaEntrada,
			hora_saida: horaSaida,
			data,
			id_biometrico: "registro-manual",
		};

		console.log("[BODY ENVIADO PARA O SERVIDOR]", body);

		try {
			await api.post("/reg/registros-ponto", body);

			// REGISTRO DE LOG
			const logData = {
				usuario_id: user?.id ?? null,
				acao: `Registro manual de ponto para funcionário ID ${funcionarioId}`,
				rota: "/reg/registros-ponto",
				metodo_http: "POST",
				status_code: 201,
				dados: body,
				sistema: "web",
				modulo: "Registro Manual",
				ip: null,
				user_agent: navigator.userAgent,
			};

			console.log("Log de ação manual:", logData);
			await registrarLog(logData);

			resetForm();
			onOpenChange(false);
			onSuccess?.();
			router.refresh();
		} catch (err: unknown) {
			console.error("[ERRO] Falha ao cadastrar registro manual:", err);

			// LOG DE ERRO
			const logErro = {
				usuario_id: user?.id ?? null,
				acao: "Falha no registro manual de ponto",
				rota: "/reg/registros-ponto",
				metodo_http: "POST",
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				status_code: (err as any)?.response?.status ?? 500,
				dados: body,
				sistema: "web",
				modulo: "Registro Manual",
				ip: null,
				user_agent: navigator.userAgent,
			};

			console.log("Log de erro manual:", logErro);
			await registrarLog(logErro);

			setError(
				"Erro ao cadastrar o registro. Verifique os dados e tente novamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleFuncionarioSelect = (f: Funcionario) => {
		setFuncionarioId(f.id);
		setFuncionarioInput(f.nome);
		setShowDropdown(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg" ref={containerRef}>
				<DialogHeader>
					<DialogTitle>Registro Manual de Ponto</DialogTitle>
					<DialogDescription>
						Preencha os dados para registrar ponto manualmente.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="grid gap-2 relative">
						<Label htmlFor="funcionarioInput">Funcionário</Label>
						<Input
							id="funcionarioInput"
							value={funcionarioInput}
							onChange={(e) => {
								setFuncionarioInput(e.target.value);
								setFuncionarioId(""); // limpa seleção ao digitar
								setShowDropdown(true);
							}}
							autoComplete="off"
							required
							className="text-black dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
						/>

						{showDropdown && filteredFuncionarios.length > 0 && (
							<ul className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 max-h-60 overflow-auto w-full rounded-md mt-1 shadow-lg">
								{filteredFuncionarios.map((f) => (
									<li key={f.id}>
										<button
											type="button"
											className="w-full text-left px-4 py-2 text-black dark:text-white hover:bg-blue-500 hover:text-white dark:hover:bg-gray-700 cursor-pointer"
											onClick={() => handleFuncionarioSelect(f)}
										>
											{f.nome}
										</button>
									</li>
								))}
							</ul>
						)}
					</div>


					<div className="grid gap-2">
						<Label htmlFor="data">Data</Label>
						<Input
							id="data"
							type="date"
							value={data}
							onChange={(e) => setData(e.target.value)}
							required
						/>
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

					<div className="flex justify-end gap-2 pt-4">
						<Button
							variant="outline"
							type="button"
							onClick={() => {
								resetForm();
								onOpenChange(false);
							}}
							disabled={loading}
							className="border-gray-300 text-black dark:text-white dark:border-white"
						>
							Cancelar
						</Button>

						<Button
							type="submit"
							disabled={loading || !funcionarioId}
							className="bg-blue-600 text-white dark:bg-white dark:text-black"
						>
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</div>

				</form>
			</DialogContent>
		</Dialog>
	);
}
