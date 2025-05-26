import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandInput,
	CommandList,
	CommandItem,
	CommandEmpty,
	CommandGroup,
} from "@/components/ui/command";
import type { Funcionario } from "../hooks/use-funcionarios";

interface FuncionarioSearchProps {
	funcionarios: Funcionario[];
	selectedFuncionario: Funcionario | null;
	onSelect: (funcionario: Funcionario | null) => void;
	recentFuncionarios?: Funcionario[];
	loading?: boolean;
	error?: string | null;
}

export function FuncionarioSearch({
	funcionarios,
	selectedFuncionario,
	onSelect,
	recentFuncionarios = [],
	loading,
	error,
}: FuncionarioSearchProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className="grid gap-2">
			<Label htmlFor="funcionario">Funcionário</Label>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="w-full border rounded px-3 py-2 text-left"
						disabled={loading}
					>
						{selectedFuncionario?.nome || "Selecione um funcionário..."}
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-[447px] p-0">
					<Command>
						<CommandInput placeholder="Buscar funcionário..." />
						<CommandList>
							<CommandGroup heading="Todos">
								{funcionarios.map((funcionario) => (
									<CommandItem
										key={funcionario.id}
										value={funcionario.nome}
										onSelect={() => {
											onSelect(funcionario);
											setOpen(false);
										}}
									>
										{funcionario.nome}
									</CommandItem>
								))}
							</CommandGroup>
							<CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}
