"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
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
// Garante que SOCKET_URL seja sempre ws:// ou wss://
let SOCKET_URL = process.env.NEXT_PUBLIC_LEITOR_WS_URL;
if (!SOCKET_URL && API_LEITOR) {
  if (API_LEITOR.startsWith('https://')) {
	SOCKET_URL = API_LEITOR.replace('https://', 'wss://');
  } else if (API_LEITOR.startsWith('http://')) {
	SOCKET_URL = API_LEITOR.replace('http://', 'ws://');
  } else {
	SOCKET_URL = API_LEITOR;
  }
}



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


	// WebSocket: conecta e escuta evento biometria_detectada
	useEffect(() => {
		if (!SOCKET_URL) return;
		const socket = io(SOCKET_URL, { transports: ["websocket"] });
		socket.on("connect", () => {
			//console.log("Conectado ao WebSocket biométrico");
		});
		socket.on("biometria_detectada", () => {
			handleNovoRegistro();
		});
		return () => {
			socket.disconnect();
		};
	}, []);

	const handleNovoRegistro = async () => {
		setShowBiometriaModal(true);
		setLoading(true);

		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (!user?.unidade_id) {
			setShowBiometriaModal(false);
			setLoading(false);
			toast.error(
				"Usuário sem unidade",
				"Você não possui uma unidade vinculada. Procure o administrador para configurar sua unidade."
			);
			return;
		}

		console.log(`🏥 Registro de ponto para unidade do usuário: ${user.secretaria_nome} (Unidade ID: ${user.unidade_id})`);

		const payload = {
			unidade_id: user.unidade_id,
			data: new Date().toISOString().split('T')[0],
			hora_entrada: new Date().toTimeString().split(' ')[0],
		};

		try {
			const response = await fetch(`${API_LEITOR}/register_ponto_biometric`, {
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
				if (response.status === 403) {
					toast.error(
						"Acesso negado",
						`${mensagemErro} Você só pode registrar ponto na sua unidade de trabalho.`
					);
				} else if (response.status === 401) {
					toast.error(
						"Digital não identificada",
						"Sua impressão digital não foi reconhecida. Tente novamente ou procure o RH para recadastrar sua biometria."
					);
				} else if (mensagemErro.toLowerCase().includes("registro de entrada não encontrado")) {
					toast.error(
						"Entrada não encontrada",
						"Você não possui entrada pendente. Procure o RH para regularizar seu ponto."
					);
				} else if (mensagemErro.includes("aguardar pelo menos 5 minutos")) {
					toast.error(
						"Aguarde um momento",
						mensagemErro
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
				{/* Botão removido: registro é feito automaticamente via WebSocket */}
				<ModalBiometria open={showBiometriaModal} />
			</div>
		</>
	);
}
