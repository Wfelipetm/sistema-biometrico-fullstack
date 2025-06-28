"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import logoDark from '../public/images/regua-logo-itaguai_dark3.png';
import logoLight from '../public/images/regua-logo-itaguai_light3.png';
import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
    logoMarginLeft?: string;
    className?: string;
}

export default function Header({ logoMarginLeft, className }: HeaderProps) {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

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
						marginLeft: logoMarginLeft ?? undefined,
					}}
					className="object-contain"
					priority
				/>
			</div>
		</header>
	);
}
