import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import PrivateRoute from "@/components/PrivateRoute";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Sistema de Biometria",
	description: "Sistema de gerenciamento de ponto biométrico para funcionários",
	generator: "codecity",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR">
			<body className={inter.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<PrivateRoute>{children}</PrivateRoute>
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
