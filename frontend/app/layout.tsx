import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import PrivateRoute from "@/components/PrivateRoute";
import PWAInstallModal from "@/components/PWAInstallModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Biometria",
  description: "Sistema de gerenciamento de ponto biométrico para funcionários",
  generator: "codecity",
  icons: {
    icon: [
      { url: "/favicon/favicon light/favicon-light-96x96.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon dark/favicon-dark-96x96.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#317EFB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* fallback caso o Metadata não resolva tudo */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#317EFB" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <PrivateRoute>
              {children}
              {/* Componente que captura beforeinstallprompt e mostra botão */}
              <PWAInstallModal />
            </PrivateRoute>
          </AuthProvider>
        </ThemeProvider>

        {/* Script para capturar evento antes do install */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                window.deferredPWAInstallPrompt = e;
                document.dispatchEvent(new Event('pwaPromptReady'));
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
