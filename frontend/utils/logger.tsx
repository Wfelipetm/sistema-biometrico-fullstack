// utils/logger.tsx

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
		await fetch("http://biometrico.itaguai.rj.gov.br:3001/log/logs", {
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
