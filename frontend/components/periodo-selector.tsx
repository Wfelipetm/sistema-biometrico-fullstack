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
				<Label htmlFor="mes">Mês</Label>
				<Select value={mes} onValueChange={onMesChange}>
					<SelectTrigger>
						<SelectValue placeholder="Selecione o mês" />
					</SelectTrigger>
					<SelectContent>
						{MESES.map((mesItem) => (
							<SelectItem key={mesItem.value} value={mesItem.value}>
								{mesItem.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="ano">Ano</Label>
				<Select value={ano} onValueChange={onAnoChange}>
					<SelectTrigger>
						<SelectValue placeholder="Selecione o ano" />
					</SelectTrigger>
					<SelectContent>
						{ANOS.map((anoItem) => (
							<SelectItem key={anoItem.value} value={anoItem.value}>
								{anoItem.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</>
	);
}
