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
import { Badge } from "@/components/ui/badge";

type Usuario = {
	id: number;
	nome: string;
	email: string;
	papel: string;
};

export default function UsuariosPage() {
	const [usuarios, setUsuarios] = useState<Usuario[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	// Usuário simulado para desenvolvimento
	const mockUser = {
		papel: "admin",
		id: 1,
	};
	const router = useRouter();

	useEffect(() => {
		const fetchUsuarios = async () => {
			try {
				const response = await api.get("/auth/usuarios");
				setUsuarios(response.data);
			} catch (error) {
				console.error("Erro ao buscar usuários:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchUsuarios();
	}, []);

	const handleDelete = async (id: number) => {
		if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
			try {
				await api.delete(`/auth/deletar/${id}`);
				setUsuarios(usuarios.filter((usuario) => usuario.id !== id));
			} catch (error) {
				console.error("Erro ao excluir usuário:", error);
			}
		}
	};

	const filteredUsuarios = usuarios.filter(
		(usuario) =>
			usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
			usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			usuario.papel.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
					<p className="text-muted-foreground">
						Gerencie os usuários do sistema
					</p>
				</div>
				<Button onClick={() => router.push("/dashboard/usuarios/novo")}>
					<Plus className="mr-2 h-4 w-4" /> Novo Usuário
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lista de Usuários</CardTitle>
					<CardDescription>
						Total de {usuarios.length} usuários cadastrados
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex items-center gap-2">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Buscar usuário..."
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
										<TableHead>Email</TableHead>
										<TableHead>Papel</TableHead>
										<TableHead className="text-right">Ações</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredUsuarios.length > 0 ? (
										filteredUsuarios.map((usuario) => (
											<TableRow key={usuario.id}>
												<TableCell className="font-medium">
													{usuario.nome}
												</TableCell>
												<TableCell>{usuario.email}</TableCell>
												<TableCell>
													<Badge
														variant={
															usuario.papel === "admin" ? "default" : "outline"
														}
													>
														{usuario.papel === "admin"
															? "Administrador"
															: "Gestor"}
													</Badge>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															variant="ghost"
															size="icon"
															onClick={() =>
																router.push(
																	`/dashboard/usuarios/editar/${usuario.id}`,
																)
															}
														>
															<Edit className="h-4 w-4" />
															<span className="sr-only">Editar</span>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => handleDelete(usuario.id)}
															disabled={usuario.id === mockUser?.id}
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
											<TableCell colSpan={4} className="h-24 text-center">
												Nenhum usuário encontrado.
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
