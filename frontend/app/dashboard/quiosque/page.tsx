"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, RefreshCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ModalSenhaAdmin from "@/components/modal-senha-quiosque";

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

export default function KioskPage() {
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const router = useRouter();

	const handleNovoRegistro = async () => {
		setLoading(true);

		const payload = {
			funcionario_id: 1, // Substitua pelo id correto do funcionário
			unidade_id: 1, // Substitua pelo id correto da unidade
			data_hora: new Date().toISOString(),
		};

		try {
			const response = await fetch("https://127.0.0.1:5000/register_ponto", {
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
				const mensagemErro = data.message || "Erro ao registrar ponto.";
				toast.error(mensagemErro);
				return;
			}

			toast.success(data.message || "Registro de ponto realizado com sucesso!");
			router.refresh();
		} catch (error) {
			console.error(
				"Erro ao registrar ponto:",
				error instanceof Error ? error.message : error,
			);
			toast.error(
				error instanceof Error
					? error.message
					: "Erro inesperado ao registrar ponto.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleExitKiosk = () => {
		setModalOpen(true);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 bg-background relative">
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
				className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted/70 transition"
				aria-label="Sair do modo Kiosk"
				style={{ opacity: 0.5 }}
			>
				<X className="w-8 h-8 text-background" />
			</button>

			<Relogio />
			<h1 className="text-3xl font-bold text-center">Bata seu ponto</h1>
			<Fingerprint className="w-32 h-32 text-primary animate-pulse" />
			<Button
				type="button"
				size="lg"
				className="text-lg flex items-center gap-2 px-8 py-6"
				onClick={handleNovoRegistro}
				disabled={loading}
			>
				<RefreshCcw className={`w-6 h-6 ${loading ? "animate-spin" : ""}`} />
				{loading ? "Registrando..." : "Registrar Ponto"}
			</Button>
		</div>
	);
}
