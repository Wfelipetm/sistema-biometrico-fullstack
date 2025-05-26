"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type ModalSenhaAdminProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
};

export default function ModalSenhaAdmin({
	open,
	onOpenChange,
	onSuccess,
}: ModalSenhaAdminProps) {
	const [senha, setSenha] = useState("");
	const [loading, setLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSenha(value);

		if (value === "123123") {
			setLoading(true);
			setTimeout(() => {
				setSenha("");
				setLoading(false);
				onOpenChange(false);
				onSuccess();
			}, 200); // Pequeno delay para UX
		} else if (value.length >= 6) {
			toast.error("Senha incorreta!");
			setSenha("");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="w-full"
				style={{ minHeight: "unset", height: "auto" }}
			>
				<DialogHeader>
					<DialogTitle> </DialogTitle>
					<DialogDescription>
						Digite a senha de administrador para sair do modo Quiosque.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="senha">Senha</Label>
						<Input
							id="senha"
							type="password"
							value={senha}
							onChange={handleChange}
							required
							autoFocus
							autoComplete="new-password"
							disabled={loading}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
