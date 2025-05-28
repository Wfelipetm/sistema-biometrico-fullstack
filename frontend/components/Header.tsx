"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Moon, Sun, User, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import ModalSenhaAdmin from "@/components/modal-senha-quiosque";
import logoDark from '../public/images/regua-logo-itaguai_dark.png';
import logoLight from '../public/images/regua-logo-itaguai_light.png';
import Image from "next/image";

export default function Header() {
	const { user, logout } = useAuth();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [liberado, setLiberado] = useState(false); // Controla se já passou pela senha

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted || !user) {
		return null;
	}

	const getInitials = (name: string) => {
		if (!name) return "US";
		return name
			.trim()
			.split(" ")
			.filter(Boolean)
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);
	};

	return (
		<header className="sticky top-0 z-10 flex h-24 items-center border-b bg-background px-4 md:px-6">
			{/* Esquerda: menu */}
			<div className="flex items-center md:hidden">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline" size="icon" className="md:hidden">
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle Menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="p-0">
						<Sidebar />
					</SheetContent>
				</Sheet>
			</div>

			{/* Centro: logo */}
			<div className="flex flex-1 justify-center">
				<Image
					src={theme === "light" ? logoLight : logoDark}
					alt="Logo Prefeitura Itaguaí"
					width={550}
					height={40}
					className="object-contain"
					priority
				/>
			</div>

			{/* Direita: botões e avatar */}
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
				>
					{theme === "dark" ? (
						<Sun className="h-5 w-5" />
					) : (
						<Moon className="h-5 w-5" />
					)}
					<span className="sr-only">Alternar tema</span>
				</Button>

				{user.papel !== "quiosque" || liberado ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button type="button" className="relative h-8 w-8 rounded-full">
								<Avatar className="h-8 w-8">
									<AvatarFallback>{getInitials(user?.nome)}</AvatarFallback>
								</Avatar>
							</button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<User className="mr-2 h-4 w-4" />
								<span>Perfil</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={logout}>
								<LogOut className="mr-2 h-4 w-4" />
								<span>Sair</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<button
						type="button"
						className="relative h-8 w-8 rounded-full"
						onClick={() => setModalOpen(true)}
					>
						<Avatar className="h-8 w-8">
							<AvatarFallback>{getInitials(user?.nome)}</AvatarFallback>
						</Avatar>
					</button>
				)}

				{/* Modal de senha para liberar acesso */}
				<ModalSenhaAdmin
					open={modalOpen}
					onOpenChange={setModalOpen}
					onSuccess={() => {
						setLiberado(true);
						setModalOpen(false);
					}}
				/>
			</div>
		</header>

	);
}
