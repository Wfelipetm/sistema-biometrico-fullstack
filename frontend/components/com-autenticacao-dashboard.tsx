"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jwt from "jsonwebtoken";
import type { JSX } from "react/jsx-runtime";

interface JwtPayload {
	id: string;
	papel: string;
	iat?: number;
	exp?: number;
}

export function withAuth<P extends JSX.IntrinsicAttributes>(
	Component: React.ComponentType<P>,
	papeisPermitidos: string[],
) {
	return function ProtectedPage(props: P) {
		const router = useRouter();
		const [autorizado, setAutorizado] = useState(false);
		const [loading, setLoading] = useState(true);

		useEffect(() => {
			if (typeof window === "undefined") return;

			const token = localStorage.getItem("token");

			if (!token) {
				// Token não existe: limpa tudo e manda pro login
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				router.replace("/login");
				return;
			}

			try {
				const decoded = jwt.decode(token) as JwtPayload;

				if (!decoded) {
					// Token inválido: limpa e manda pro login
					localStorage.removeItem("token");
					localStorage.removeItem("user");
					router.replace("/login");
					return;
				}

				if (!papeisPermitidos.includes(decoded.papel)) {
					// Token válido, mas papel não permitido: manda pro não autorizado
					router.replace("/dashboard/unidades");
					return;
				}

				setAutorizado(true);
			} catch {
				// Erro genérico, limpa tudo e manda pro login
				localStorage.removeItem("token");
				localStorage.removeItem("user");
				router.replace("/login");
			} finally {
				setLoading(false);
			}
		}, [router, papeisPermitidos]);

		if (loading) {
			return <div>Carregando...</div>;
		}

		if (!autorizado) {
			return null;
		}

		return <Component {...props} />;
	};
}
