"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function PrivateRoute({
	children,
}: { children: React.ReactNode }) {
	const { user, isLoading } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	// Permite acesso livre à página de login
	const isLoginPage = pathname === "/login" || pathname === "/cadastro";

	useEffect(() => {
		if (!isLoading && !user && !isLoginPage) {
			router.replace("/login");
		}
	}, [isLoading, user, isLoginPage, router]);

	if ((isLoading || !user) && !isLoginPage) {
		return null;
	}

	return <>{children}</>;
}
