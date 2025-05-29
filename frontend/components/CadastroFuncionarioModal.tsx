"use client";

import { useState, useEffect } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

type Unidade = {
	id: string;
	nome: string;
	secretaria_id: string;
};

type ModalCadastroFuncionariosProps = {
	dialogTitle?: string;
	onSuccess?: () => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const ESCALAS = [
	{ value: "8h", label: "8h" },
	{ value: "12h", label: "12h" },
	{ value: "16h", label: "16h" },
	{ value: "24h", label: "24h" },
	{ value: "12x36", label: "12x36" },
	{ value: "24x72", label: "24x72" },
	{ value: "32h", label: "32h" },
	{ value: "20h", label: "20h" },
];

export default function ModalCadastroFuncionarios({
	dialogTitle = "Novo Funcionário",
	onSuccess,
	open,
	onOpenChange,
}: ModalCadastroFuncionariosProps) {
	const [nome, setNome] = useState("");
	const [cpf, setCpf] = useState("");
	const [cargo, setCargo] = useState("");
	const [matricula, setMatricula] = useState("");
	const [tipoEscala, setTipoEscala] = useState("");
	const [telefone, setTelefone] = useState("");
	const [email, setEmail] = useState("");
	const [unidadeId, setUnidadeId] = useState("");
	const [dataAdmissao, setDataAdmissao] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [unidades, setUnidades] = useState<Unidade[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const { user } = useAuth();

	useEffect(() => {
		if (!user) return;
		const fetchUnidades = async () => {
			try {
				const response = await api.get(`/secre/${user.secretaria_id}/unidades`);
				setUnidades(response.data);

				// Se for gestor, já seta a unidadeId automaticamente ao abrir o modal
				if (user.papel === "gestor" && user.unidade_id) {
					const unidadeGestor = response.data.find(
						(u: Unidade) => String(u.id) === String(user.unidade_id),
					);
					if (unidadeGestor) setUnidadeId(unidadeGestor.id);
				}
			} catch (error) {
				console.error("Erro ao buscar unidades:", error);
				setError("Não foi possível carregar as unidades.");
			}
		};
		fetchUnidades();
	}, [user]);

	const resetForm = () => {
		setNome("");
		setCpf("");
		setCargo("");
		setMatricula("");
		setTipoEscala("");
		setTelefone("");
		setEmail("");
		setUnidadeId("");
		setDataAdmissao(new Date().toISOString().slice(0, 10));
		setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		const payload = {
			userName: nome,
			cpf,
			cargo,
			matricula: matricula ? Number(matricula) : undefined,
			unidade_id: Number(unidadeId),
			tipo_escala: tipoEscala,
			telefone,
			email,
			data_admissao: dataAdmissao,
		};

		try {
			const response = await fetch("https://127.0.0.1:5000/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				mode: "cors",
			});

			if (!response.ok) {
				const errorBody = await response.text();
				setError(
					`Erro no backend Python. Status: ${response.status}, mensagem: ${errorBody}`,
				);
				return;
			}

			await response.json();
			resetForm();
			onOpenChange(false);
			router.refresh();
			onSuccess?.();
		} catch (err: unknown) {
			if (open) {
				if (isErrorWithMessage(err)) {
					if (err.message === "Failed to fetch") {
						setError(
							"Cadastro cancelado. Verifique sua conexão ou tente mais tarde.",
						);
					} else {
						console.error("Erro ao cadastrar funcionário:", err.message);
						setError(
							"Erro ao cadastrar funcionário. Verifique os dados e tente novamente.",
						);
					}
				} else {
					setError(
						"Erro desconhecido ao cadastrar funcionário. Tente novamente.",
					);
				}
			}
		} finally {
			setLoading(false);
		}
	};

	function isErrorWithMessage(error: unknown): error is { message: string } {
		return (
			typeof error === "object" &&
			error !== null &&
			"message" in error &&
			typeof (error as { message?: unknown }).message === "string"
		);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				onOpenChange(isOpen);
				if (!isOpen) setError("");
			}}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>
						Preencha os dados abaixo para cadastrar um novo funcionário.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<LabelInput label="CPF" value={cpf} onChange={setCpf} required />
					<LabelInput
						label="Cargo"
						value={cargo}
						onChange={setCargo}
						required
					/>
					<LabelInput
						label="Matrícula"
						value={matricula}
						onChange={setMatricula}
					/>
					<LabelInput
						label="Telefone"
						value={telefone}
						onChange={setTelefone}
					/>

					{/* Escala como dropdown */}
					<div className="grid gap-2">
						<Label className="text-black dark:text-white">Tipo de Escala</Label>
						<Select value={tipoEscala} onValueChange={setTipoEscala} required>
							<SelectTrigger className="text-black dark:text-white dark:border dark:border-white placeholder-gray-500 dark:placeholder-white">
								<SelectValue placeholder="Selecione a escala" />
							</SelectTrigger>
							<SelectContent className="bg-white dark:bg-gray-900 text-black dark:text-white border dark:border-white">
								{ESCALAS.map((escala) => (
									<SelectItem
										key={escala.value}
										value={escala.value}
										className="hover:bg-gray-100 dark:hover:bg-white/10"
									>
										{escala.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>


					{/* Unidade como dropdown */}
					<div className="grid gap-2">
						<Label className="text-black dark:text-white">Unidade</Label>
						<Select value={unidadeId} onValueChange={setUnidadeId} required>
							<SelectTrigger className="text-black dark:text-white dark:border dark:border-white placeholder-gray-500 dark:placeholder-white">
								<SelectValue placeholder="Selecione uma unidade" />
							</SelectTrigger>
							<SelectContent className="bg-white text-black dark:bg-gray-900 dark:text-white dark:border dark:border-white">
								{user?.papel === "gestor" && user.unidade_id
									? unidades
										.filter((unidade) => String(unidade.id) === String(user.unidade_id))
										.map((unidade) => (
											<SelectItem
												key={unidade.id}
												value={unidade.id}
												className="hover:bg-gray-100 dark:hover:bg-white/10"
											>
												{unidade.nome}
											</SelectItem>
										))
									: unidades.map((unidade) => (
										<SelectItem
											key={unidade.id}
											value={String(unidade.id)} // <-- Garanta que seja string
											className="hover:bg-gray-100 dark:hover:bg-white/10"
										>
											{unidade.nome}
										</SelectItem>

									))}
							</SelectContent>
						</Select>
					</div>

					<div className="grid gap-2">
						<Label>Data de Admissão</Label>
						<Input
							type="date"
							value={dataAdmissao}
							onChange={(e) => setDataAdmissao(e.target.value)}
							required
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							type="button"
							onClick={() => onOpenChange(false)}
							disabled={loading}
							className="border-gray-300 text-black dark:text-white dark:border-white"
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={loading}
							className="bg-blue-600 text-white dark:bg-white dark:text-black"
						>
							{loading ? "Cadastrando..." : "Cadastrar"}
						</Button>
					</div>

				</form>
			</DialogContent>
		</Dialog>
	);
}

function LabelInput({
	label,
	value,
	onChange,
	required = false,
}: {
	label: string;
	value: string;
	onChange: (val: string) => void;
	required?: boolean;
}) {
	return (
		<div className="grid gap-2">
			<Label>{label}</Label>
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
			/>
		</div>
	);
}
