"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast-custom";
import ModalSenhaAdmin from "@/components/modal-senha-quiosque";
import { ModalBiometria } from "@/components/ModalBiometria";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

const API_LEITOR = process.env.NEXT_PUBLIC_LEITOR_URL 



function Relogio() {
	const [hora, setHora] = useState(() =>
		new Date().toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}),
	);

	useEffect(() => {
		const interval = setInterval(() => {
			setHora(
				new Date().toLocaleTimeString("pt-BR", {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				}),
			);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="text-6xl font-mono font-bold text-primary tracking-widest select-none">
			{hora}
		</div>
	);
}

interface HeaderProps {
	logoMarginLeft?: string;
	className?: string;
	// ...
}

export default function KioskPage() {
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const router = useRouter();
	const [showBiometriaModal, setShowBiometriaModal] = useState(false);
	const { user } = useAuth();

	const handleNovoRegistro = async () => {
		setShowBiometriaModal(true);
		setLoading(true);

		await new Promise((resolve) => setTimeout(resolve, 1000));

		const payload = {
			funcionario_id: 1,
			unidade_id: 1,
			data_hora: new Date().toISOString(),
		};

		try {
			const response = await fetch(`${API_LEITOR}/register_ponto`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				mode: "cors",
			});

			const contentType = response.headers.get("Content-Type");

			let data: { message?: string } = {};
			if (contentType?.includes("application/json")) {
				data = await response.json();
			} else {
				const text = await response.text();
				throw new Error(text || "Erro desconhecido");
			}

			if (!response.ok) {
				setShowBiometriaModal(false);
				const mensagemErro = (data.message || "Não foi possível registrar o ponto. Por favor, tente novamente ou procure o RH.");
				if (mensagemErro.toLowerCase().includes("registro de entrada não encontrado")) {
					toast.error(
						"Entrada não encontrada",
						"Você não possui entrada pendente. Procure o RH para regularizar seu ponto."
					);
				} else {
					toast.error(
						"Falha no registro",
						mensagemErro
					);
				}
				return;
			}

			setShowBiometriaModal(false);
			toast.success(data.message || "Registro de ponto realizado com sucesso!");
			router.refresh();
		} catch (error) {
			setShowBiometriaModal(false);

			if (error instanceof TypeError && error.message === "Failed to fetch") {
				toast.error(
					"Servidor indisponível",
					"O sistema de ponto está temporariamente fora do ar. Por favor, tente novamente em alguns minutos ou procure o RH."
				);
			} else {
				console.error("Erro ao registrar ponto:", error instanceof Error ? error.message : error);
				toast.error(
					"Erro inesperado",
					"Não foi possível registrar seu ponto devido a uma falha no sistema. Tente novamente mais tarde ou procure o RH."
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const handleExitKiosk = () => {
		if (!user?.email) {
			toast.error(
				"Usuário não carregado",
				"Não foi possível identificar o usuário. Faça login novamente para continuar."
			);
			return;
		}
		setModalOpen(true);
	};

	return (
		<>
			<Header
				logoMarginLeft="-10px"
				className="absolute top-0 left-0 right-0 z-20"
			/>
			
			<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-blue-100 shadow-2xl">
				{/* Modal de senha de administrador */}
				<ModalSenhaAdmin
					open={modalOpen}
					onOpenChange={setModalOpen}
					onSuccess={() => router.push("/dashboard/unidades")}
				/>

				{/* Botão X no canto superior direito */}
				<button
					type="button"
					onClick={handleExitKiosk}
					className="absolute top-4 right-4 z-30 p-2 rounded-full hover:bg-muted/70 transition"
					aria-label="Sair do modo Kiosk"
					style={{ opacity: 0.5 }}
					disabled={!user?.email}
				>
					<X className="w-8 h-8 text-background" />
				</button>

				<Relogio />
				<h1 className="text-3xl font-bold text-center">Bata seu ponto</h1>
				<Fingerprint className="w-48 h-48 text-primary animate-pulse" />
				<Button
					type="button"
					size="lg"
					className="text-lg flex items-center gap-4 px-8 py-6"
					onClick={handleNovoRegistro}
					disabled={loading}
				>
					<RefreshCcw className={`w-6 h-6 ${loading ? "animate-spin" : ""}`} />
					{loading ? "Registrando..." : "Registrar Ponto"}
				</Button>
				<ModalBiometria open={showBiometriaModal} />
			</div>
		</>
	);
}
