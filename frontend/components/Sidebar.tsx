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
    Fingerprint,
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
                "bg-gradient-to-t from-blue-50 via-white to-white",
                isQuiosque
                    ? "w-0 min-w-0 overflow-hidden p-0 border-none"
                    : isOpen
                    ? "w-64"
                    : "w-14",
                className,
            )}
            style={{ minWidth: isOpen ? 256 : 56 }}
        >
            {/* Sidebar fechado */}
            {!isOpen && (
                <div className="flex flex-col h-full w-full">
                    {/* Fingerprint colado no topo e clicável */}
                    <div className="flex justify-center pt-4 pb-2">
                        <button
                            className="bg-transparent border-none outline-none focus:outline-none"
                            onClick={() => setIsOpen(true)}
                            aria-label="Abrir menu"
                            type="button"
                        >
                            <Fingerprint className="w-9 h-9 text-blue-700 mt-5 dark:text-blue-200" />
                        </button>
                    </div>
                    {/* Espaço flexível para centralizar o Menu */}
                    <div className="flex-1 flex items-center justify-center">
                        <button
                            className="p-0 bg-transparent border-none outline-none focus:outline-none"
                            onClick={() => setIsOpen(true)}
                            aria-label="Abrir menu"
                            type="button"
                        >
                            <Menu className="w-10 h-10 text-blue-700 dark:text-blue-200" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar aberto */}
            {!isQuiosque && isOpen && (
                <>
                    {/* Logo */}
                    <div className="py-4 flex justify-center items-center border-b h-24">
                        <button
                            type="button"
                            className="flex items-center gap-1 font-semibold focus:outline-none"
                            onClick={() => setIsOpen(false)}
                            aria-label="Fechar menu"
                            tabIndex={0}
                            style={{ background: "none", border: "none", padding: 0, margin: 0 }}
                        >
                            <div className="flex flex-1 justify-center">
                                <Image
                                    src={theme === "light" ? logoLight : logoDark}
                                    alt="Logo Prefeitura Itaguaí"
                                    style={{
                                        height: 100,
                                        width: 280,
                                        marginTop: -10,
                                        marginLeft: 80,
                                        filter: "brightness(0) saturate(100%) invert(11%) sepia(98%) saturate(7499%) hue-rotate(210deg) brightness(90%) contrast(110%)"
                                        // Filtro ajustado para aproximar do azul-900 do Tailwind
                                    }}
                                    className="object-contain cursor-pointer"
                                    priority
                                />
                            </div>
                        </button>
                    </div>
                    {/* Menu */}
                    <ScrollArea className="flex-1 py-2 mt-4">
                        <nav className="grid gap-1 px-2">
                            {routes.map((route) => (
                                <Link
                                    key={route.label}
                                    href={route.href}
                                    className={cn(
                                        "flex items-center mt-3 gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
                    {/* Rodapé */}
                    <div className="mt-auto p-4 border-t border-blue-100">
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-blue-700 dark:text-blue-200">
                                © 2025 Sistema de Biometria. Desenvolvido por SMCTIC.
                            </span>
                            <span className="text-[10px] text-blue-400 mt-1">
                                Versão 1.0.0
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
