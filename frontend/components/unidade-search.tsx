import { useState } from "react";

export type Unidade = { id: number; nome: string };

interface UnidadeSearchProps {
    unidades: Unidade[];
    selectedUnidade: Unidade | null;
    onSelect: (unidade: Unidade | null) => void;
    loading?: boolean;
    error?: string | null;
    placeholder?: string;
}

export function UnidadeSearch({
    unidades,
    selectedUnidade,
    onSelect,
    loading,
    error,
    placeholder = "Selecione uma unidade",
}: UnidadeSearchProps) {
    const [search, setSearch] = useState("");
    const [showList, setShowList] = useState(false);

    const unidadesFiltradas = unidades.filter(u =>
        u.nome.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full relative">
            <input
                type="text"
                className="w-full h-10 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder={placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setShowList(true)}
                onBlur={() => setTimeout(() => setShowList(false), 150)}
                disabled={loading}
            />
            
            {showList && (
                <div className="absolute w-full border border-blue-100 rounded-md bg-white max-h-48 overflow-y-auto z-10">
                    {loading ? (
                        <div className="p-2 text-blue-700">Carregando...</div>
                    ) : unidadesFiltradas.length === 0 ? (
                        <div className="p-2 text-blue-400">Nenhuma unidade encontrada</div>
                    ) : (
                        unidadesFiltradas.map(unidade => (
                            <div
                                key={unidade.id}
                                className={`p-2 cursor-pointer hover:bg-blue-100 text-blue-700 ${
                                    selectedUnidade?.id === unidade.id ? "bg-blue-200 font-bold" : ""
                                }`}
                                onClick={() => {
                                    onSelect(unidade);
                                    setSearch(unidade.nome);
                                    setShowList(false);
                                }}
                            >
                                {unidade.nome}
                            </div>
                        ))
                    )}
                </div>
            )}

            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );
}
