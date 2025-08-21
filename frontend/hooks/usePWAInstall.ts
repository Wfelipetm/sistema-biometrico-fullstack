import { useEffect, useState } from "react";

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // evita o prompt automático do navegador
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log("User choice:", choiceResult);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const dismiss = () => setIsInstallable(false);

  return { isInstallable, promptInstall, dismiss };
}
