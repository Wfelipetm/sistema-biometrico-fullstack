"use client";

import * as React from "react";
import {
	ThemeProvider as NextThemesProvider,
	type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	// Oculta o conteúdo até que o tema correto seja aplicado
	if (!mounted) {
		return <div style={{ visibility: "hidden" }}>{children}</div>;
	}

	return (
		<NextThemesProvider
			defaultTheme="system"
			attribute="class"
			enableSystem
			{...props}
		>
			{children}
		</NextThemesProvider>
	);
}
