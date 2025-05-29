const API_URL = process.env.NEXT_PUBLIC_API_URL;
export interface LogData {
	usuario_id?: number | null;
	acao: string;
	rota?: string | null;
	metodo_http?: string | null;
	status_code?: number | null;
	dados?: Record<string, unknown> | null;
	ip?: string | null;
	user_agent?: string | null;
	sistema?: string | null;
	modulo?: string | null;
}

export async function registrarLog(logData: LogData): Promise<void> {
	try {
				await fetch(`${API_URL}/log/logs`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(logData),
		});
	} catch (error) {
		console.error("Erro ao registrar log:", error);
	}
}
