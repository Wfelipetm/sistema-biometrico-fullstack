"use client";

import type React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Toaster } from "sonner";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen bg-blue-50 bg-opacity-50">
			<Sidebar />
			<div className="flex flex-col flex-1 overflow-hidden">
				<Header />
				<main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
			</div>
			<Toaster />
		</div>
	);
}
