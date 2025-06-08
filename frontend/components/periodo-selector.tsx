"use client";

import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface PeriodoSelectorProps {
	mes: string;
	ano: string;
	onMesChange: (mes: string) => void;
	onAnoChange: (ano: string) => void;
}

const MESES = [
	{ value: "1", label: "Janeiro" },
	{ value: "2", label: "Fevereiro" },
	{ value: "3", label: "Março" },
	{ value: "4", label: "Abril" },
	{ value: "5", label: "Maio" },
	{ value: "6", label: "Junho" },
	{ value: "7", label: "Julho" },
	{ value: "8", label: "Agosto" },
	{ value: "9", label: "Setembro" },
	{ value: "10", label: "Outubro" },
	{ value: "11", label: "Novembro" },
	{ value: "12", label: "Dezembro" },
];

const ANOS = Array.from({ length: 5 }, (_, i) => {
	const year = new Date().getFullYear() - 2 + i;
	return { value: year.toString(), label: year.toString() };
});

export function PeriodoSelector({
	mes,
	ano,
	onMesChange,
	onAnoChange,
}: PeriodoSelectorProps) {
	return (
		<>
			<div className="grid gap-2">
				<Label htmlFor="mes" className="text-blue-900">
					Mês
				</Label>
				<Select value={mes} onValueChange={onMesChange}>
					<SelectTrigger className="border-blue-300 text-blue-900 placeholder:text-blue-700">
						<SelectValue
							placeholder="Selecione o mês"
							className="text-blue-900 placeholder:text-blue-700"
						/>
					</SelectTrigger>
					<SelectContent>
						{MESES.map((mesItem) => (
							<SelectItem
								key={mesItem.value}
								value={mesItem.value}
								className="text-blue-900 data-[state=checked]:bg-blue-100"
							>
								{mesItem.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="ano" className="text-blue-900">
					Ano
				</Label>
				<Select value={ano} onValueChange={onAnoChange}>
					<SelectTrigger className="border-blue-300 text-blue-900 placeholder:text-blue-700">
						<SelectValue
							placeholder="Selecione o ano"
							className="text-blue-900 placeholder:text-blue-700"
						/>
					</SelectTrigger>
					<SelectContent>
						{ANOS.map((anoItem) => (
							<SelectItem
								key={anoItem.value}
								value={anoItem.value}
								className="text-blue-900 data-[state=checked]:bg-blue-100"
							>
								{anoItem.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	);
}
