import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fingerprint } from "lucide-react";

interface ModalBiometriaProps {
    open: boolean;
    // onOpenChange removido para impedir fechamento manual
}

export function ModalBiometria({ open }: ModalBiometriaProps) {
    return (
        <Dialog open={open} onOpenChange={() => { /* não faz nada */ }}>
            {/* Esconde o X do modal */}
            <style>{`
            button.absolute.right-4.top-4 {
                display: none !important;
            }
            `}</style>
            <DialogContent
                className="flex flex-col items-center gap-6 max-w-2xl max-w-3xl h-96 bg-blue-50"
                style={{ minHeight: "24rem" }}
                onInteractOutside={e => e.preventDefault()}
                onEscapeKeyDown={e => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl md:text-3xl font-bold text-blue-900">
                        Centralize o dedo no aparelho biométrico
                    </DialogTitle>
                </DialogHeader>
                <Fingerprint className="w-52 h-52 text-primary animate-pulse" />
                <span className="text-center text-lg md:text-xl text-muted-foreground">
                    Aguarde a leitura biométrica para registrar o ponto.
                </span>
            </DialogContent>
        </Dialog>
    );
}