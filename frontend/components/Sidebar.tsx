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
	Home,
	LayoutDashboard,
	Users,
	UserCog,
	FileText,
	Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const { user } = useAuth();

	const isAdmin = user?.papel === "admin";
	const isGestor = user?.papel === "gestor";
	const isQuiosque = pathname.startsWith("/dashboard/quiosque");

	const routes = [
		// Só mostra "Secretaria" se NÃO for gestor
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
		// Apenas para usuários com papel "quiosque"
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

	// Rota de secretarias para administradores
	// if (isAdmin) {
	// 	routes.splice(1, 0, {
	// 		label: "Secretarias",
	// 		icon: FileText,
	// 		href: "/dashboard/secretarias",
	// 		active: pathname.startsWith("/dashboard/secretarias"),
	// 	});
	// }

	// // Rota de usuários apenas para administradores
	// if (isAdmin) {
	// 	routes.push({
	// 		label: "Usuários",
	// 		icon: UserCog,
	// 		href: "/dashboard/usuarios",
	// 		active: pathname.startsWith("/dashboard/usuarios"),
	// 	});
	// }

	return (
		<div
			className={cn(
				"flex flex-col h-full border-r bg-background transition-all duration-300",
				isQuiosque ? "w-0 min-w-0 overflow-hidden p-0 border-none" : "w-64",
				className,
			)}
		>
			{!isQuiosque && (
				<>
					<div className="py-4 px-3 flex items-center border-b h-16">
						<Link
							href={isGestor ? "/dashboard/unidades" : "/dashboard"}
							className="flex items-center gap-2 font-semibold"
						>
							<Home className="h-5 w-5" />
							<span>Biometria Saúde</span>
						</Link>
					</div>
					<ScrollArea className="flex-1 py-2">
						<nav className="grid gap-1 px-2">
							{routes.map((route) => (
								<Link
									key={route.label}
									href={route.href}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
										route.active
											? "bg-accent text-accent-foreground"
											: "text-muted-foreground",
									)}
								>
									<route.icon className="h-5 w-5" />
									{route.label}
								</Link>
							))}
						</nav>
					</ScrollArea>
					<div className="mt-auto p-4 border-t">
						<p className="text-xs text-muted-foreground">
							© 2025 Sistema de Biometria
						</p>
					</div>
				</>
			)}
		</div>
	);
}
