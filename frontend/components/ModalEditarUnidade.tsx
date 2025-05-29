"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface ModalEditarUnidadeProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	unidade: {
		id: string;
		nome: string;
		localizacao: string;
		foto?: string;
	};
	onSuccess: () => void;
}

export default function ModalEditarUnidade({
	open,
	onOpenChange,
	unidade,
	onSuccess,
}: ModalEditarUnidadeProps) {
	const [nome, setNome] = useState(unidade.nome);
	const [localizacao, setLocalizacao] = useState(unidade.localizacao);
	const [fotoFile, setFotoFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (open) {
			setNome(unidade.nome);
			setLocalizacao(unidade.localizacao);
			setFotoFile(null);
			setPreviewUrl(unidade.foto ? `/uploads/${unidade.foto}` : null);
		}
	}, [open, unidade]);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("nome", nome);
			formData.append("localizacao", localizacao);
			if (fotoFile) {
				formData.append("foto", fotoFile);
			}

			await api.put(`/unid/unidade/${unidade.id}`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			console.log(api);
			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Erro ao atualizar unidade:", error);
			alert("Erro ao atualizar unidade");
		} finally {
			setLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFotoFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Unidade</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						placeholder="Nome da unidade"
						value={nome}
						onChange={(e) => setNome(e.target.value)}
					/>
					<Input
						placeholder="Localização"
						value={localizacao}
						onChange={(e) => setLocalizacao(e.target.value)}
					/>

					<div>
						{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
						<label
							className="block w-full cursor-pointer text-sm font-medium text-blue-600 hover:underline"
							onClick={() => document.getElementById("fotoInput")?.click()}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									document.getElementById("fotoInput")?.click();
								}
							}}
						>
							Trocar imagem da unidade
						</label>
						<Input
							id="fotoInput"
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFileChange}
						/>
						<img
							src={
								unidade.foto
									? `http://biometrico.itaguai.rj.gov.br:3001/uploads/${unidade.foto}?t=${Date.now()}`
									: "/placeholder-image.png"
							}
							alt={unidade.nome}
							className="w-full h-48 rounded-md object-cover border shadow"
						/>
					</div>

					<div className="flex justify-end">
						<Button
							onClick={handleSubmit}
							disabled={loading}
							className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors duration-200 ease-in-out"
						>
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</div>

				</div>
			</DialogContent>
		</Dialog>
	);
}
