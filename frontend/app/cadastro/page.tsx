"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AxiosError } from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Secretaria = {
	id: number;
	nome: string;
	sigla: string;
};

type Unidade = {
	id: number;
	nome: string;
};

type ErrorResponse = {
	message?: string;
	error?: string;
};

export default function CadastroPage() {
	const [nome, setNome] = useState("");
	const [email, setEmail] = useState("");
	const [senha, setSenha] = useState("");
	const [confirmSenha, setConfirmSenha] = useState("");
	const [secretariaId, setSecretariaId] = useState<number | null>(null);
	const [unidadeId, setUnidadeId] = useState<number | null>(null);
	const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
	const [unidades, setUnidades] = useState<Unidade[]>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// Buscar secretarias
		const fetchSecretarias = async () => {
			try {
				const response = await fetch(
					`${API_URL}/secre`,
				);
				if (!response.ok) throw new Error("Falha ao buscar secretarias");
				const data = await response.json();
				setSecretarias(data);
			} catch (error) {
				console.error("Erro ao buscar secretarias:", error);
				setError("Não foi possível carregar as secretarias.");
			}
		};

		fetchSecretarias();
	}, []);

	useEffect(() => {
		// Sempre que a secretaria mudar, buscar as unidades relacionadas e resetar unidade selecionada
		if (secretariaId === null) {
			setUnidades([]);
			setUnidadeId(null);
			return;
		}

		const fetchUnidades = async () => {
			try {
				const response = await fetch(
					`${API_URL}/secre/${secretariaId}/unidades`,
				);
				if (!response.ok) throw new Error("Falha ao buscar unidades");
				const data = await response.json();
				setUnidades(data);
				setUnidadeId(null); // resetar seleção da unidade quando a secretaria mudar
			} catch (error) {
				console.error("Erro ao buscar unidades:", error);
				setError("Não foi possível carregar as unidades.");
			}
		};

		fetchUnidades();
	}, [secretariaId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		if (senha !== confirmSenha) {
			setError("As senhas não coincidem");
			setLoading(false);
			return;
		}

		if (!secretariaId || Number.isNaN(secretariaId)) {
			setError("Selecione uma secretaria válida");
			setLoading(false);
			return;
		}

		if (!unidadeId || Number.isNaN(unidadeId)) {
			setError("Selecione uma unidade válida");
			setLoading(false);
			return;
		}

		const payload = {
			nome,
			email,
			senha,
			secretaria_id: secretariaId,
			unidade_id: unidadeId,
			papel: "quiosque",
		};

		console.log("Dados enviados:", payload);

		try {
			await api.post("/auth/cadastro", payload);
			setSuccess(true);
			setTimeout(() => {
				router.push("/login");
			}, 2000);
		} catch (err) {
			const axiosError = err as AxiosError<ErrorResponse>;
			const data = axiosError.response?.data;
			const errorMsg =
				data?.message ||
				data?.error ||
				"Falha no cadastro. Verifique os dados.";

			setError(errorMsg);
			console.error("Erro completo:", data);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="w-full max-w-sm space-y-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Sistema de Biometria
					</h1>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Crie sua conta para acessar o sistema
					</p>
				</div>

				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
					{success ? (
						<Alert className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
							<AlertDescription>
								Cadastro realizado com sucesso! Redirecionando para o login...
							</AlertDescription>
						</Alert>
					) : (
						<form onSubmit={handleSubmit} className="space-y-5">
							{error && (
								<Alert variant="destructive" className="py-2">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<div className="space-y-2">
								<Label htmlFor="nome">Nome</Label>
								<Input
									id="nome"
									type="text"
									value={nome}
									onChange={(e) => setNome(e.target.value)}
									required
									className="h-10"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="h-10"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="secretaria">Secretaria</Label>
								<Select
									value={secretariaId !== null ? String(secretariaId) : ""}
									onValueChange={(val) => setSecretariaId(Number(val))}
								>
									<SelectTrigger className="h-10">
										<SelectValue placeholder="Selecione sua secretaria" />
									</SelectTrigger>
									<SelectContent>
										{secretarias.map((secretaria) => (
											<SelectItem
												key={secretaria.id}
												value={String(secretaria.id)}
											>
												{secretaria.nome} ({secretaria.sigla})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="unidade">Unidade</Label>
								<Select
									value={unidadeId !== null ? String(unidadeId) : ""}
									onValueChange={(val) => setUnidadeId(Number(val))}
									disabled={unidades.length === 0}
								>
									<SelectTrigger className="h-10">
										<SelectValue
											placeholder={
												unidades.length === 0
													? "Selecione a secretaria primeiro"
													: "Selecione sua unidade"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{unidades.map((unidade) => (
											<SelectItem key={unidade.id} value={String(unidade.id)}>
												{unidade.nome}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="senha">Senha</Label>
								<Input
									id="senha"
									type="password"
									value={senha}
									onChange={(e) => setSenha(e.target.value)}
									required
									className="h-10"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmSenha">Confirmar Senha</Label>
								<Input
									id="confirmSenha"
									type="password"
									value={confirmSenha}
									onChange={(e) => setConfirmSenha(e.target.value)}
									required
									className="h-10"
								/>
							</div>

							<Button type="submit" className="w-full h-10" disabled={loading}>
								{loading ? "Processando..." : "Cadastrar"}
							</Button>

							<div className="text-center text-sm">
								<span className="text-gray-500 dark:text-gray-400">
									Já tem uma conta?{" "}
								</span>
								<Link
									href="/login"
									className="text-primary font-medium hover:underline"
								>
									Faça login
								</Link>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
