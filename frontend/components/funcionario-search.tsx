import { useState, useEffect } from "react";
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
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Funcionario } from "../hooks/use-funcionarios";

interface FuncionarioSearchProps {
    selectedFuncionario: Funcionario | null;
    onSelect: (funcionario: Funcionario | null) => void;
    recentFuncionarios?: Funcionario[];
    loading?: boolean;
    error?: string | null;
}

export function FuncionarioSearch({
    selectedFuncionario,
    onSelect,
    recentFuncionarios = [],
    loading: loadingProp,
    error: errorProp,
}: FuncionarioSearchProps) {
    const [open, setOpen] = useState(false);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        const fetchFuncionarios = async () => {
            if (!user?.secretaria_id) return;
            try {
                setLoading(true);
                const response = await api.get(`/secre/${user.secretaria_id}/funcionarios`);
                setFuncionarios(response.data);
                setError(null);
            } catch (err) {
                setError("Não foi possível carregar os funcionários.");
            } finally {
                setLoading(false);
            }
        };
        fetchFuncionarios();
    }, [user?.secretaria_id]);

    return (
        <div className="grid gap-2">
            <Label htmlFor="funcionario">Funcionário</Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="w-full border rounded px-3 py-2 text-left"
                        disabled={loading || loadingProp}
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
            {(error || errorProp) && (
                <p className="text-sm text-destructive">{error || errorProp}</p>
            )}
        </div>
    );
}