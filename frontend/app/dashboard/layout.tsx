"use client";

import type React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();

	return (
		<div className="flex h-screen bg-blue-50 bg-opacity-50">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				{/* Só mostra o Header se NÃO estiver na página do quiosque */}
				{pathname !== "/dashboard/quiosque" && <Header />}
				<main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
			</div>
			<Toaster />
		</div>
	);
}
