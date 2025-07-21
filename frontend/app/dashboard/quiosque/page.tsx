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


const API_LEITOR = process.env.NEXT_PUBLIC_LEITOR_URL;
const SOCKET_URL = API_LEITOR; 



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

}


export default function KioskPage() {
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const router = useRouter();
	const [showBiometriaModal, setShowBiometriaModal] = useState(false);
	const { user } = useAuth();



// WebSocket: conecta uma única vez e mantém conexão estável

console.log("[RENDER] ModalBiometria está", showBiometriaModal ? "ABERTO" : "FECHADO");
const socketRef = useRef<any>(null);

// Função para conectar o socket
const connectSocket = () => {
	if (!SOCKET_URL) return;
	// Se já existe um socket, desconecta antes de criar outro
	if (socketRef.current) {
		socketRef.current.disconnect();
	}
	const socket = io(SOCKET_URL, { transports: ["websocket"] });
	socketRef.current = socket;
	socket.on("connect", () => {
		console.log("[SOCKET] Conectado ao WebSocket biométrico");
	});
	socket.on("disconnect", () => {
		console.log("[SOCKET] Desconectado do WebSocket biométrico");
	});
	socket.on("biometria_detectada", (data) => {
		// Só processa se não estiver processando outro registro
		if (!showBiometriaModal && !loading) {
			console.log("[SOCKET] Evento recebido: biometria_detectada", data);
			handleNovoRegistro(data);
		} else {
			console.log("[SOCKET] Evento ignorado: já processando biometria");
		}
	});
};

// Conecta o socket no primeiro render
useEffect(() => {
	connectSocket();
	return () => {
		if (socketRef.current) {
			socketRef.current.disconnect();
		}
	};
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Sempre que o modal fechar, reconecta o socket e envia ack para o backend
useEffect(() => {
	if (!showBiometriaModal) {
		// Envia confirmação para o backend liberar próxima leitura
		if (socketRef.current && socketRef.current.connected) {
			socketRef.current.emit("biometria_processada");
			console.log("[SOCKET] Evento 'biometria_processada' enviado para o backend");
		}
		// Pequeno delay para garantir que o backend esteja pronto
		setTimeout(() => {
			connectSocket();
		}, 500);
	}
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [showBiometriaModal]);

const handleNovoRegistro = async (data?: any) => {
	setShowBiometriaModal(true);
	setLoading(true);

	// Se quiser, pode usar os dados recebidos aqui
	console.log("Dados recebidos do backend:", data);

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
	console.log("Payload enviado:", payload);

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

		console.log("Resposta do backend:", response.status, data);

		if (!response.ok) {
			setShowBiometriaModal(false);
			setLoading(false);
			const mensagemErro = (data.message || "Não foi possível registrar o ponto. Por favor, tente novamente ou procure o RH.");
			if (response.status === 500) {
				console.error("Erro 500 do backend:", mensagemErro);
				toast.error(
					"Erro interno",
					mensagemErro
				);
			} else if (response.status === 403) {
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
		setLoading(false);
		toast.success(data.message || "Registro de ponto realizado com sucesso!");
		router.refresh();
	} catch (error) {
		setShowBiometriaModal(false);
		setLoading(false);
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

	useEffect(() => {
		console.log("ModalBiometria está", showBiometriaModal ? "ABERTO" : "FECHADO");
	}, [showBiometriaModal]);

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
