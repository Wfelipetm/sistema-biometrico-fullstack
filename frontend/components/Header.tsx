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
import logoDark from '../public/images/regua-logo-itaguai_dark3.png';
import logoLight from '../public/images/regua-logo-itaguai_light3.png';
import Image from "next/image";
import NotificationDropdown from "./Notificações";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
    logoMarginLeft?: string;
    className?: string;
    // ...outros props...
}

export default function Header({ logoMarginLeft, className }: HeaderProps) {
	const { user, logout } = useAuth();
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [liberado, setLiberado] = useState(false);
	const pathname = usePathname(); // Adicione esta linha

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
		<header className={cn("sticky top-0 z-10 flex h-24 items-center gap-4 border-b px-4 md:px-6 bg-gradient-to-l from-blue-50 via-white to-white", className)}>
			{/* Centro: logo */}
			<div className="flex flex-1 justify-center">
				<Image
					src={theme === "light" ? logoLight : logoDark}
					alt="Logo Prefeitura Itaguaí"
					style={{
						height: 80,
						width: 600,
						filter:
							"brightness(0) saturate(100%) invert(11%) sepia(98%) saturate(7499%) hue-rotate(210deg) brightness(90%) contrast(110%)",
						marginLeft: logoMarginLeft ?? undefined, // Só aplica se vier da prop
					}}
					className="object-contain"
					priority
				/>
			</div>

			{/* Direita: botões e avatar */}
			<div className="flex items-center gap-2">
				{/* <Button
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
				</Button> */}
				{/* <NotificationDropdown /> */}

				{user.papel !== "quiosque" || liberado ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button type="button" className="relative h-12 w-12 rounded-full">
								<Avatar className="h-12 w-12">
									<AvatarFallback>{getInitials(user?.nome)}</AvatarFallback>
								</Avatar>
							</button>
						</DropdownMenuTrigger>

						<DropdownMenuContent
							align="end"
							className="bg-blue-50 text-blue-900"
						>
							<DropdownMenuLabel className="text-blue-900">Minha Conta</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{/* <DropdownMenuItem>
								<User className="mr-2 h-4 w-4" />
								<span>Perfil</span>
							</DropdownMenuItem> */}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={logout}
								className="text-blue-900 hover:bg-blue-100"
							>
								<LogOut className="mr-2 h-4 w-4 text-blue-900" />
								<span>Sair</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				) : (
					<button
						type="button"
						className="relative h-12 w-12 rounded-full"
						onClick={() => setModalOpen(true)}
					>
						<Avatar className="h-12 w-12">
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
