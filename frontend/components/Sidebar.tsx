"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Building2,
	CalendarClock,
	ClipboardList,
	LayoutDashboard,
	Users,
	Monitor,
	Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useTheme } from "next-themes";
import logoDark from '../public/images/logo_biometrico_dark4.png';
import logoLight from '../public/images/logo_biometrico_light4.png';
import Image from "next/image";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export default function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const { theme } = useTheme();
	const { user } = useAuth();
	const isGestor = user?.papel === "gestor";
	const isQuiosque = pathname.startsWith("/dashboard/quiosque");
	const [isOpen, setIsOpen] = useState(true);

	const routes = [
		
		...(!isGestor
			? [
				{
					label: "Secretaria",
					icon: LayoutDashboard,
					href: "/dashboard",
					active: pathname === "/dashboard",
				},
			]
			: []),
		{
			label: "Unidade",
			icon: Building2,
			href: "/dashboard/unidades",
			active: pathname.startsWith("/dashboard/unidades"),
		},
		{
			label: "Funcionários",
			icon: Users,
			href: "/dashboard/funcionarios",
			active: pathname.startsWith("/dashboard/funcionarios"),
		},
		{
			label: "Registros de Ponto",
			icon: ClipboardList,
			href: "/dashboard/registros",
			active: pathname.startsWith("/dashboard/registros"),
		},
		{
			label: "Relatórios",
			icon: CalendarClock,
			href: "/dashboard/relatorios",
			active: pathname.startsWith("/dashboard/relatorios"),
		},
		...(user?.papel === "quiosque"
			? [
				{
					label: "Modo Quiosque",
					icon: Monitor,
					href: "/dashboard/quiosque",
					active: pathname.startsWith("/dashboard/quiosque"),
				},
			]
			: []),
	];

	return (
		<div
			className={cn(
				"flex flex-col h-full border-r transition-all duration-300",
				"bg-gradient-to-t from-blue-50 via-white to-white", // Azul MUITO claro para branco de baixo pra cima
				isQuiosque
					? "w-0 min-w-0 overflow-hidden p-0 border-none"
					: isOpen
					? "w-64"
					: "w-14",
				className,
			)}
			style={{ minWidth: isOpen ? 256 : 56 }}
		>
			{/* Botão hamburguer só aparece quando o sidebar está fechado */}
			{!isOpen && (
				<button
					className="mt-4 mb-2 ml-2 p-0 bg-transparent border-none outline-none focus:outline-none"
					onClick={() => setIsOpen(true)}
					aria-label="Abrir menu"
					type="button"
				>
					<Menu className="w-7 h-7 text-gray-700 dark:text-gray-200" />
				</button>
			)}

			{!isQuiosque && isOpen && (
				<>
					<div className="py-4 justify-center flex items-center border-b h-24">
						<Link
							href={isGestor ? "/dashboard/unidades" : "/dashboard"}
							className="flex items-center gap-1 font-semibold"
							onClick={() => setIsOpen(false)} // Fecha o sidebar ao clicar na imagem
						>
							<div className="flex flex-1 justify-center">
								<Image
									src={theme === "light" ? logoLight : logoDark}
									alt="Logo Prefeitura Itaguaí"
									style={{ height: 90, width: 450, marginLeft: 80, marginTop: -10 }}
									className="object-contain cursor-pointer"
									priority
								/>
							</div>
						</Link>
					</div>
					<ScrollArea className="flex-1 py-2">
						<nav className="grid gap-1 px-2">
							{routes.map((route) => (
								<Link
									key={route.label}
									href={route.href}
									onClick={() => setIsOpen(false)}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										route.active
											? "bg-blue-100 text-blue-900"
											: "text-blue-700 hover:bg-blue-100 hover:text-blue-900"
									)}
								>
									<route.icon className="h-5 w-5" />
									{route.label}
								</Link>
							))}
						</nav>
					</ScrollArea>
					<div className="mt-auto p-4 border-t border-blue-100">
    <p className="text-xs text-center text-blue-700 dark:text-blue-200">
        © 2025 Sistema de Biometria. Desenvolvido por SMCTIC.
    </p>
</div>
				</>
			)}
		</div>
	);
}
