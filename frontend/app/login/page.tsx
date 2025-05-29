"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { registrarLog } from "@/utils/logger"; // ajuste o caminho conforme sua estrutura
import type { AxiosError } from "axios";
import Image from "next/image";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [showPassword, setShowPassword] = useState(false);
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
				} catch { }
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
		<div className="min-h-screen flex items-center justify-center bg-bg60 dark:bg-gray-900 px-4">
			<div className="w-full max-w-sm space-y-8">

				<div className=" p-6 rounded-lg shadow-sm bg-white/50  border-2 border-white py-10">
					<form onSubmit={handleSubmit} className="space-y-5">
						{error && (
							<Alert variant="destructive" className="py-2">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<Image
							width={300}
							height={300}
							alt="Logo Prefeitura Municipal de Itaguaí - Light"
							src="/images/smctic_light_mode.png"
							className="mx-auto block dark:hidden"
						/>
						<Image
							width={300}
							height={300}
							alt="Logo Prefeitura Municipal de Itaguaí - Dark"
							src="/images/smctic_dark_mode2.png"
							className="mx-auto hidden dark:block"
						/>
						<div className="text-center">
							{/* <h1 className="font-bold text-2xl text-primary30 dark:text-white">
								Biometria
							</h1> */}
							{/* <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
								Faça login para acessar o sistema
							</p> */}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								placeholder="seu@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="h-10 bg-white dark:bg-white/50 dark:border dark:border-white text-black dark:text-black placeholder-gray-500 dark:placeholder-white"
							/>


						</div>

						<div className="space-y-2 relative w-full">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Senha</Label>
								<Link
									href="/recuperar-senha"
									className="text-xs text-white underline hover:font-bold"
								>
									Esqueceu a senha?
								</Link>
							</div>
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="h-10 bg-white dark:bg-white/50 dark:border dark:border-white text-black dark:text-black placeholder-gray-500"
							/>

							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-4 top-9 -translate-y-1/2 text-gray-500 focus:outline-none"
							>
								{showPassword ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>

						<Button
							type="submit"
							size="lg"
							className={`w-full my-5 mt-20 ${loading ? "bg-green-500 text-white"
								:
								"bg-primary10 text-white dark:bg-gray-900 dark:text-white"}`}
							disabled={loading}
						>
							{loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Entrar"}
						</Button>



						{/* <div className="text-center text-sm">
							<span className="text-gray-500 dark:text-gray-400">
								Não tem uma conta?{" "}
							</span>
							<Link
								href="/cadastro"
								className="text-primary font-medium hover:underline"
							>
								Cadastre-se
							</Link>
						</div> */}
					</form>
				</div>

				{/* <div className="text-center">
					<Button
						variant="ghost"
						onClick={handleVisitanteClick}
						className="text-xs"
					>
						Acessar como visitante
					</Button>
				</div> */}

				<div className="text-center text-base text-gray-500 dark:text-white">
					© {new Date().getFullYear()} Sistema de Biometria.
					<p>
						Desenvolvido por SMCTIC.
					</p>
				</div>
			</div>
		</div>
	);
}
