"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
const API_URL = process.env.NEXT_PUBLIC_API_URL;



type Secretaria = {
	id: string;
	nome: string;
	sigla: string;
};

export default function NovoUsuarioPage() {
	const [nome, setNome] = useState("");
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [confirmSenha, setConfirmSenha] = useState("");
	const [papel, setPapel] = useState("gestor");
	const [secretariaId, setSecretariaId] = useState("");
	const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
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
				setError("Não foi possível carregar as secretarias.");
			}
		};

		fetchSecretarias();
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (senha !== confirmSenha) {
			setError("As senhas não coincidem");
			return;
		}

		setLoading(true);

		try {
			await api.post("/auth/cadastro", {
				nome,
				email,
				senha,
				papel,
				secretaria_id: secretariaId,
			});

			router.push("/dashboard/usuarios");
		} catch (err) {
			console.error("Erro ao cadastrar usuário:", err);
			setError(
				"Erro ao cadastrar usuário. Verifique os dados e tente novamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Cadastro de Usuário</CardTitle>
					<CardDescription>
						Preencha os dados para cadastrar um novo usuário
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="grid gap-2">
							<Label htmlFor="nome">Nome Completo</Label>
							<Input
								id="nome"
								value={nome}
								onChange={(e) => setNome(e.target.value)}
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="senha">Senha</Label>
							<Input
								id="senha"
								type="password"
								value={senha}
								onChange={(e) => setSenha(e.target.value)}
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="confirmSenha">Confirmar Senha</Label>
							<Input
								id="confirmSenha"
								type="password"
								value={confirmSenha}
								onChange={(e) => setConfirmSenha(e.target.value)}
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="papel">Papel</Label>
							<Select value={papel} onValueChange={setPapel} required>
								<SelectTrigger>
									<SelectValue placeholder="Selecione um papel" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">Administrador</SelectItem>
									<SelectItem value="gestor">Gestor</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="secretaria">Secretaria</Label>
							<Select
								value={secretariaId}
								onValueChange={setSecretariaId}
								required
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione uma secretaria" />
								</SelectTrigger>
								<SelectContent>
									{secretarias.map((secretaria) => (
										<SelectItem key={secretaria.id} value={secretaria.id}>
											{secretaria.nome} ({secretaria.sigla})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button
							variant="outline"
							type="button"
							onClick={() => router.back()}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
