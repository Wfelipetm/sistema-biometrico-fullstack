"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setCookie, destroyCookie, parseCookies } from "nookies";
const API_URL = process.env.NEXT_PUBLIC_API_URL;




type User = {
	id: number;
	nome: string;
	email: string;
	papel: string;
	secretaria_id: number | null;
	secretaria_nome?: string;
	unidade_id: number | null;
};

type AuthContextType = {
	user: User | null;
	token: string | null;
	login: (email: string, password: string) => Promise<void>;
	logout: () => void;
	isAuthenticated: boolean;
	isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const { token: storedToken, user: storedUser } = parseCookies();

		if (storedToken && storedUser) {
			const parsedUser = JSON.parse(storedUser);
			setToken(storedToken);
			setUser(parsedUser);
			api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
		} else {
			setToken(null);
			setUser(null);
		}

		setIsLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		try {
			const response = await api.post("/auth/login", {
				email,
				senha: password,
			});

			const { token, usuario } = response.data;

			if (usuario.secretaria_id) {
				try {
					const secretariaRes = await fetch(`${API_URL}/secre/${usuario.secretaria_id}`);
					if (secretariaRes.ok) {
						const secretariaData = await secretariaRes.json();
						usuario.secretaria_nome = secretariaData.nome;
					}
				} catch (error) {
					console.error("Erro ao buscar secretaria:", error);
				}
			}

			if (usuario.unidade_id === undefined || usuario.unidade_id === null) {
				usuario.unidade_id = null;
			}

			setToken(token);
			setUser(usuario);
			setCookie(undefined, "token", token, {
				maxAge: 60 * 60 * 24 * 30, // 30 days
				path: "/",
			});
			setCookie(undefined, "user", JSON.stringify(usuario), {
				maxAge: 60 * 60 * 24 * 30, // 30 days
				path: "/",
			});
			api.defaults.headers.common.Authorization = `Bearer ${token}`;

			// 👉 Redireciona para a home
			router.push("/");
		} catch (error) {
			console.error("Erro no login:", error);
			throw error;
		}
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		destroyCookie(undefined, "token");
		destroyCookie(undefined, "user");
		api.defaults.headers.common.Authorization = undefined;
		window.location.href = "/login";
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				login,
				logout,
				isAuthenticated: !!user,
				isLoading,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth deve ser usado dentro de um AuthProvider");
	}
	return context;
}
