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
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

type Secretaria = {
	id: string;
	nome: string;
	sigla: string;
	created_at?: string;
	updated_at?: string;
};
const API_URL = process.env.NEXT_PUBLIC_API_URL;



export default function SecretariasPage() {
	const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const router = useRouter();

	useEffect(() => {
		const fetchSecretarias = async () => {
			try {
				// Usando a URL correta para buscar secretarias
				const response = await fetch(
					`${API_URL}/secre`,
				);
				if (!response.ok) {
					throw new Error("Falha ao buscar secretarias");
				}
				const data = await response.json();
				setSecretarias(data);
			} catch (error) {
				console.error("Erro ao buscar secretarias:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSecretarias();
	}, []);

	const handleDelete = async (id: string) => {
		if (window.confirm("Tem certeza que deseja excluir esta secretaria?")) {
			try {
				await api.delete(`/secre/${id}`);
				setSecretarias(
					secretarias.filter((secretaria) => secretaria.id !== id),
				);
			} catch (error) {
				console.error("Erro ao excluir secretaria:", error);
			}
		}
	};

	const filteredSecretarias = secretarias.filter(
		(secretaria) =>
			secretaria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
			secretaria.sigla.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Secretarias</h1>
					<p className="text-muted-foreground">
						Gerencie as secretarias cadastradas no sistema
					</p>
				</div>
				<Button onClick={() => router.push("/dashboard/secretarias/nova")}>
					<Plus className="mr-2 h-4 w-4" /> Nova Secretaria
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Secretarias</CardTitle>
					<CardDescription>
						Total de {secretarias.length} secretarias cadastradas
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex items-center gap-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar secretaria..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
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
										<TableHead>Nome</TableHead>
										<TableHead>Sigla</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredSecretarias.length > 0 ? (
										filteredSecretarias.map((secretaria) => (
											<TableRow key={secretaria.id}>
												<TableCell className="font-medium">
													{secretaria.nome}
												</TableCell>
												<TableCell>{secretaria.sigla}</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																router.push(
																	`/dashboard/secretarias/editar/${secretaria.id}`,
																)
															}
														>
															<Edit className="h-4 w-4" />
															<span className="sr-only">Editar</span>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDelete(secretaria.id)}
														>
															<Trash2 className="h-4 w-4" />
															<span className="sr-only">Excluir</span>
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell colSpan={3} className="h-24 text-center">
												Nenhuma secretaria encontrada.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
