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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type ModalCadastroUnidadeProps = {
	dialogTitle?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export default function ModalCadastroUnidade({
	dialogTitle = "Nova Unidade",
	open,
	onOpenChange,
	onSuccess,
}: ModalCadastroUnidadeProps) {
	const [nome, setNome] = useState("");
	const [localizacao, setLocalizacao] = useState("");
	const [foto, setFoto] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const { user } = useAuth();
	const secretariaId = user?.secretaria_id;

	const resetForm = () => {
		setNome("");
		setLocalizacao("");
		setFoto(null);
		setError("");
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		if (!foto) {
			setError("Selecione uma imagem.");
			setLoading(false);
			return;
		}

		if (!secretariaId) {
			setError("Secretaria do usuário não encontrada.");
			setLoading(false);
			return;
		}

		try {
			const formData = new FormData();
			formData.append("nome", nome);
			formData.append("localizacao", localizacao);
			formData.append("foto", foto);
			formData.append("secretaria_id", String(secretariaId));

			await api.post("/unid/unidade", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			resetForm();
			onOpenChange(false);
			router.refresh();
			onSuccess?.();
		} catch (err) {
			console.error("Erro ao cadastrar unidade:", err);
			if (open) {
				setError(
					"Erro ao cadastrar unidade. Verifique os dados e tente novamente.",
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>
						Preencha os dados para cadastrar uma nova unidade.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="grid gap-2">
						<Label htmlFor="nome">Nome da Unidade</Label>
						<Input
							id="nome"
							value={nome}
							onChange={(e) => setNome(e.target.value)}
							required
							autoFocus
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="localizacao">Localização</Label>
						<Input
							id="localizacao"
							value={localizacao}
							onChange={(e) => setLocalizacao(e.target.value)}
							required
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="foto">Foto da Unidade</Label>
						<Input
							id="foto"
							type="file"
							accept="image/*"
							onChange={(e) => setFoto(e.target.files?.[0] || null)}
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
							className="border-gray-300 text-black dark:text-white dark:border-white hover:bg-gray-100 dark:hover:bg-gray-700"
						>
							Cancelar
						</Button>

						<Button
							type="submit"
							disabled={loading}
							className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-gray-200"
						>
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</div>

				</form>
			</DialogContent>
		</Dialog>
	);
}
