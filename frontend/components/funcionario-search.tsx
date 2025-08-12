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
    inputWidthClass?: string;
    containerClass?: string;
    responsive?: boolean;
}

export function FuncionarioSearch({
    selectedFuncionario,
    onSelect,
    recentFuncionarios = [],
    loading: loadingProp,
    error: errorProp,
    inputWidthClass = "w-full",
    containerClass = "",
    responsive = true,
}: FuncionarioSearchProps) {
    const [open, setOpen] = useState(false);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        const fetchFuncionarios = async () => {
            if (!user) return;
            try {
                setLoading(true);
                let response;
                if (user.papel === "gestor" && user.unidade_id) {
                    // Busca funcionários da unidade específica para gestor
                    response = await api.get(`/funci/unidade/${user.unidade_id}/funcionarios`);
                } else if (user.secretaria_id) {
                    // Busca padrão por secretaria
                    response = await api.get(`/secre/${user.secretaria_id}/funcionarios`);
                } else {
                    setFuncionarios([]);
                    setError("Usuário sem secretaria ou unidade vinculada.");
                    return;
                }
                setFuncionarios(response.data);
                setError(null);
            } catch (err) {
                setError("Não foi possível carregar os funcionários.");
            } finally {
                setLoading(false);
            }
        };
        fetchFuncionarios();
    }, [user?.secretaria_id, user?.unidade_id, user?.papel]);

    return (
        <>
            <div className={`grid gap-2 w-full ${containerClass} ${responsive ? 'sm:gap-3 md:gap-2' : ''}`}>
                <Label 
                    htmlFor="funcionario" 
                    className={`text-blue-900 font-medium ${responsive ? 'text-sm sm:text-base md:text-lg' : 'text-base'}`}
                >
                    Funcionário
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className={`${inputWidthClass} border border-blue-300 rounded px-3 py-2 text-left text-blue-900 placeholder:text-blue-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:border-blue-400 ${
                                responsive 
                                    ? 'h-10 sm:h-12 md:h-10 text-sm sm:text-base md:text-lg sm:py-3 md:py-2' 
                                    : 'h-10 text-base'
                            }`}
                            disabled={loading || loadingProp}
                        >
                            <span className="truncate block">
                                {selectedFuncionario?.nome || "Selecione um funcionário..."}
                            </span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent 
                        className={`p-0 shadow-lg border-blue-200 ${
                            responsive 
                                ? 'w-full min-w-[280px] sm:w-[380px] md:w-[447px] max-w-[95vw]' 
                                : 'w-[447px]'
                        }`}
                        side="bottom"
                        align="start"
                        sideOffset={4}
                    >
                        <Command className="w-full">
                            <CommandInput
                                placeholder="Buscar funcionário..."
                                className={`border-blue-300 focus:border-blue-500 focus:ring-blue-500 text-blue-900 placeholder:text-blue-700 px-3 ${
                                    responsive 
                                        ? 'text-sm sm:text-base h-10 sm:h-12 md:h-10' 
                                        : 'text-base h-10'
                                }`}
                                onValueChange={(value) => {
                                    // Filtra apenas funcionários da unidade do gestor logado
                                    if (user?.papel === "gestor" && user.unidade_id) {
                                        setFuncionarios((prev) =>
                                            prev.filter(
                                                (func) =>
                                                    func.unidade_id === user.unidade_id &&
                                                    func.nome.toLowerCase().includes(value.toLowerCase())
                                            )
                                        );
                                    } else {
                                        setFuncionarios((prev) =>
                                            prev.filter((func) =>
                                                func.nome.toLowerCase().includes(value.toLowerCase())
                                            )
                                        );
                                    }
                                }}
                            />
                            <CommandList className={`overflow-y-auto ${
                                responsive 
                                    ? 'max-h-[200px] sm:max-h-[250px] md:max-h-[300px]' 
                                    : 'max-h-[300px]'
                            }`}>
                                <CommandGroup heading="Todos" className="text-blue-800 font-medium">
                                    {funcionarios.map((funcionario) => (
                                        <CommandItem
                                            key={funcionario.id}
                                            value={funcionario.nome}
                                            onSelect={() => {
                                                onSelect(funcionario);
                                                setOpen(false);
                                            }}
                                            className={`text-blue-900 data-[selected=true]:bg-blue-100 hover:bg-blue-50 cursor-pointer px-3 transition-colors duration-150 ${
                                                responsive 
                                                    ? 'py-2 sm:py-3 md:py-2 text-sm sm:text-base md:text-lg' 
                                                    : 'py-2 text-base'
                                            }`}
                                        >
                                            <span className="truncate">
                                                {funcionario.nome}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandEmpty className={`text-blue-700 text-center ${
                                    responsive 
                                        ? 'py-4 sm:py-6 md:py-4 text-sm sm:text-base' 
                                        : 'py-4 text-base'
                                }`}>
                                    Nenhum funcionário encontrado.
                                </CommandEmpty>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            {(error || errorProp) && (
                <div className={`${responsive ? 'mt-1 sm:mt-2' : 'mt-1'}`}>
                    <p className={`text-destructive break-words ${
                        responsive ? 'text-sm sm:text-base' : 'text-sm'
                    }`}>
                        {error || errorProp}
                    </p>
                </div>
            )}
        </>
    );
}