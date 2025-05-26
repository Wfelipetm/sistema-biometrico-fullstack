"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { registrarLog } from "@/utils/logger"; // ajuste o caminho conforme sua estrutura
import type { AxiosError } from "axios";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [checkedAuth, setCheckedAuth] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		setEmail("");
		setPassword("");
		setError("");
		setLoading(false);

		// Checa o token no cookie
		const hasTokenCookie = document.cookie
			.split(";")
			.some((c) => c.trim().startsWith("token="));
		if (hasTokenCookie && pathname === "/login") {
			// Lê o papel do usuário do cookie "user"
			const userCookie = document.cookie
				.split(";")
				.find((c) => c.trim().startsWith("user="));
			let papel = "";
			if (userCookie) {
				try {
					const user = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
					papel = user.papel;
				} catch {}
			}
			if (papel === "gestor") {
				window.location.href = "/dashboard/unidades";
			} else {
				window.location.href = "/dashboard";
			}
			return;
		}

		setCheckedAuth(true);
	}, [pathname]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await api.post("/auth/login", {
				email,
				senha: password,
			});

			// Log de login com sucesso
			await registrarLog({
				usuario_id: response.data.usuario?.id ?? null,
				acao: "Login efetuado com sucesso",
				rota: "/auth/login",
				metodo_http: "POST",
				status_code: 200,
				dados: { email },
				sistema: "web",
				modulo: "Login",
				ip: null,
				user_agent: navigator.userAgent,
			});

			localStorage.setItem("token", response.data.token);
			localStorage.setItem("user", JSON.stringify(response.data.usuario));
			api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
			document.cookie = `token=${response.data.token}; path=/;`;
			document.cookie = `user=${encodeURIComponent(
				JSON.stringify(response.data.usuario),
			)}; path=/;`;

			setTimeout(() => {
				const papel = response.data.usuario?.papel;
				if (papel === "gestor") {
					window.location.href = "/dashboard/unidades";
				} else {
					window.location.href = "/dashboard";
				}
			}, 100);
		} catch (err: unknown) {
			const error = err as AxiosError<{ message?: string }>;

			await registrarLog({
				usuario_id: null,
				acao: "Falha no login",
				rota: "/auth/login",
				metodo_http: "POST",
				status_code: error.response?.status ?? null,
				dados: { email },
				sistema: "web",
				modulo: "Login",
				ip: null,
				user_agent: navigator.userAgent,
			});

			setError("Falha no login. Verifique suas credenciais.");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleVisitanteClick = () => {
		window.location.href = "/dashboard";
	};

	if (!checkedAuth) {
		return null;
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
			<div className="w-full max-w-sm space-y-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
						Sistema de Biometria
					</h1>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Faça login para acessar o sistema
					</p>
				</div>

				<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
					<form onSubmit={handleSubmit} className="space-y-5">
						{error && (
							<Alert variant="destructive" className="py-2">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="seu@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="h-10"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Senha</Label>
								<Link
									href="/recuperar-senha"
									className="text-xs text-primary hover:underline"
								>
									Esqueceu?
								</Link>
							</div>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="h-10"
							/>
						</div>

						<Button type="submit" className="w-full h-10" disabled={loading}>
							{loading ? "Entrando..." : "Entrar"}
						</Button>

						<div className="text-center text-sm">
							<span className="text-gray-500 dark:text-gray-400">
								Não tem uma conta?{" "}
							</span>
							<Link
								href="/cadastro"
								className="text-primary font-medium hover:underline"
							>
								Cadastre-se
							</Link>
						</div>
					</form>
				</div>

				<div className="text-center">
					<Button
						variant="ghost"
						onClick={handleVisitanteClick}
						className="text-xs"
					>
						Acessar como visitante
					</Button>
				</div>

				<div className="text-center text-xs text-gray-500 dark:text-gray-400">
					© 2025 Sistema de Biometria
				</div>
			</div>
		</div>
	);
}
