"use client";

import usePWAInstall from "@/hooks/usePWAInstall";

export default function PWAInstallModal() {
  const { isInstallable, promptInstall, dismiss } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 w-64 z-50 flex flex-col items-center">
      <p className="text-gray-900 dark:text-gray-100 mb-2 text-center">
        Instale este aplicativo no seu dispositivo!
      </p>
      <div className="flex gap-2">
        <button
          onClick={promptInstall}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
