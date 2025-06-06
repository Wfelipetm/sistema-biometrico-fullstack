"use client";

import {
	type JSXElementConstructor,
	type Key,
	type ReactElement,
	type ReactNode,
	type ReactPortal,
	useEffect,
	useState,
} from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Building2,
	Users,
	Clock,
	CalendarClock,
	BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { withAuth } from "@/components/com-autenticacao-dashboard";
const API_URL = process.env.NEXT_PUBLIC_API_URL;




type Unidade = {
	id: string;
	nome: string;
};

type funcionariosRecentes = {
	id: string;
	nome: string;
};

type Registro = {
	id: string;
	data_hora: string;
};

interface RegistrosHojePorSecretaria {
	secretaria_id: string;
	total_registros_hoje: number;
	nome: string;
}

interface RegistroMesTodo {
	secretaria_id: string;
	secretaria_nome: string;
	total_registros: number;
}

interface RegistroDiario {
	data: string;
	registrototal: string;
}

interface FuncionarioSecretaria {
	secretaria_id: number;
	total_funcionarios: string;
}

type SecretariaStats = {
	unidades: Unidade[];
	funcionarios?: FuncionarioSecretaria;
	registrosHoje?: RegistrosHojePorSecretaria;
	registrosMes?: RegistroMesTodo;
	registrosDiarios: RegistroDiario[];
	funcionariosRecentes: funcionariosRecentes[];
};

interface CustomPayload {
	dataCompleta: string;
	total: number;
}

// Função para obter o nome do mês a partir da data
const obterNomeMes = (data: string) => {
	const meses = [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	];
	const partes = data.split("/");
	if (partes.length === 3) {
		const mes = Number.parseInt(partes[1], 10) - 1;
		return meses[mes];
	}
	return "";
};

// Função para formatar números grandes
const formatarNumero = (numero: number) => {
	return new Intl.NumberFormat("pt-BR").format(numero);
};

// Componente de tooltip personalizado
const TooltipPersonalizado = ({
	active,
	payload,
}: TooltipProps<number, string>) => {
	if (active && payload && payload.length) {
		const { dataCompleta, total } = payload[0].payload as CustomPayload;

		return (
			<div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
				<p className="text-sm font-medium text-gray-600">{dataCompleta}</p>
				<p className="text-lg font-bold text-primary mt-1">
					{formatarNumero(total)} registros
				</p>
			</div>
		);
	}

	return null;
};

function DashboardPage() {
	const { user } = useAuth();
	const [stats, setStats] = useState<SecretariaStats>({
		unidades: [],
		funcionarios: undefined,
		funcionariosRecentes: [],
		registrosHoje: undefined,
		registrosMes: undefined,
		registrosDiarios: [],
	});
	const [loading, setLoading] = useState(true);
	const [secretariaNome, setSecretariaNome] = useState<string>("");
	const [mesAtual, setMesAtual] = useState<string>("");

	useEffect(() => {
		if (!user?.secretaria_id || !user?.unidade_id) return;

		const urls = {
			unidades: `${API_URL}/secre/${user.secretaria_id}/unidades`,
			funcionarios: `${API_URL}/secre/${user.secretaria_id}/total-funcionarios`,
			funcionariosRecentes: `${API_URL}/unid/${user.unidade_id}/funcionarios`,
			registrosHoje: `${API_URL}/secre/reg-hoje-por-secre/${user.secretaria_id}`,
			registrosMes: `${API_URL}/secre/${user.secretaria_id}/registros-mensais`,
			registrosDiarios: `${API_URL}/secre/grafico-reg-secre-mes-todo/${user.secretaria_id}`,
		};
		const fetchAll = async () => {
	setLoading(true);

	try {
		const requests = Object.values(urls).map((url) => fetch(url));
		const results = await Promise.allSettled(requests);

		for (let i = 0; i < results.length; i++) {
			const key = Object.keys(urls)[i];
			const result = results[i];

			if (result.status === "fulfilled") {
				const res = result.value;

				if (!res.ok) {
					console.warn(`[${key}] Erro HTTP: ${res.status} ${res.statusText}`);
					continue;
				}

				try {
					const data = await res.json();
					if (!data) continue;

					switch (key) {
						case "unidades":
							setStats((prev) => ({ ...prev, unidades: data }));
							break;
						case "funcionarios":
							setStats((prev) => ({ ...prev, funcionarios: data }));
							break;
						case "funcionariosRecentes":
							setStats((prev) => ({
								...prev,
								funcionariosRecentes: data,
							}));
							break;
						case "registrosHoje":
							setSecretariaNome(data.nome || "");
							setStats((prev) => ({ ...prev, registrosHoje: data }));
							break;
						case "registrosMes":
							setStats((prev) => ({ ...prev, registrosMes: data }));
							break;
						case "registrosDiarios":
							setStats((prev) => ({ ...prev, registrosDiarios: data }));
							if (data.length > 0) {
								setMesAtual(obterNomeMes(data[0].data));
							}
							break;
					}
				} catch (err) {
					console.error(`[${key}] Erro ao parsear JSON:`, err);
				}
			} else {
				console.warn(`[${key}] Falha na requisição:`, result.reason);
			}
		}
	} catch (err) {
		console.error("Erro inesperado ao buscar dados:", err);
	} finally {
		setLoading(false);
	}
};


		fetchAll();
	}, [user?.secretaria_id, user?.unidade_id]);

	// Preparar dados para o gráfico
	const dadosGrafico = stats.registrosDiarios
		.map((item) => ({
			dia: item.data.split("/")[0],
			dataCompleta: item.data,
			total: Number.parseInt(item.registrototal, 10),
		}))
		.sort((a, b) => Number.parseInt(a.dia, 10) - Number.parseInt(b.dia, 10)); // Ordenar por dia

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Secretaria</h1>
				<p className="text-muted-foreground">
					Bem-vindo, {user?.nome}! Aqui está um resumo da{" "}
					{secretariaNome || "sua secretaria"}.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Unidades</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.unidades.length}</div>
						<p className="text-xs text-muted-foreground">
							Total de unidades na secretaria
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Funcionários</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.funcionarios?.total_funcionarios ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Total de funcionários na secretaria
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Registros Hoje
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.registrosHoje?.total_registros_hoje ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Registros de ponto realizados hoje
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Registros no Mês
						</CardTitle>
						<CalendarClock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{stats.registrosMes?.total_registros ?? 0}
						</div>
						<p className="text-xs text-muted-foreground">
							Total de registros no mês atual
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Unidades da Secretaria</CardTitle>
						<CardDescription>
							Unidades vinculadas à sua secretaria
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.unidades.length > 0 ? (
								<ul className="space-y-2">
									{stats.unidades.slice(0, 5).map((unidade) => (
										<li
											key={unidade.id}
											className="flex items-center justify-between border-b pb-2"
										>
											<span className="font-medium">{unidade.nome}</span>
										</li>
									))}
									{stats.unidades.length > 5 && (
										<li className="text-sm text-muted-foreground text-center pt-2">
											+ {stats.unidades.length - 5} outras unidades
										</li>
									)}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									Nenhuma unidade encontrada
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-1">
					<CardHeader>
						<CardTitle>Funcionários Recentes</CardTitle>
						<CardDescription>Últimos funcionários cadastrados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.funcionariosRecentes.length > 0 ? (
								<ul className="space-y-2">
									{stats.funcionariosRecentes
										.slice(0, 5)
										.map((funcionario: funcionariosRecentes) => (
											<li
												key={funcionario.id}
												className="flex items-center justify-between border-b pb-2"
											>
												<span className="font-medium">{funcionario.nome}</span>
											</li>
										))}
									{stats.funcionariosRecentes.length > 5 && (
										<li className="text-sm text-muted-foreground text-center pt-2">
											+ {stats.funcionariosRecentes.length - 5} outros
											funcionários
										</li>
									)}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									Nenhum funcionário encontrado
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="col-span-2 mt-4">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-xl">
							Registros de Ponto Diários
						</CardTitle>
						<CardDescription>
							Monitoramento de presenças por dia em {mesAtual}
						</CardDescription>
					</div>
					<BarChart3 className="h-5 w-5 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<div className="h-[400px]">
							{dadosGrafico && dadosGrafico.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart
										data={dadosGrafico}
										margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
									>
										<defs>
											<linearGradient
												id="colorTotal"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="5%"
													stopColor="hsl(var(--primary))"
													stopOpacity={0.8}
												/>
												<stop
													offset="95%"
													stopColor="hsl(var(--primary))"
													stopOpacity={0.1}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="hsl(var(--muted))"
										/>
										<XAxis
											dataKey="dia"
											axisLine={false}
											tickLine={false}
											tick={{
												fill: "hsl(var(--muted-foreground))",
												fontSize: 12,
											}}
											padding={{ left: 10, right: 10 }}
										/>
										<YAxis
											axisLine={false}
											tickLine={false}
											tick={{
												fill: "hsl(var(--muted-foreground))",
												fontSize: 12,
											}}
											width={40}
										/>
										<Tooltip content={<TooltipPersonalizado />} />
										<Area
											type="monotone"
											dataKey="total"
											stroke="hsl(var(--primary))"
											strokeWidth={2}
											fillOpacity={1}
											fill="url(#colorTotal)"
											activeDot={{
												r: 6,
												strokeWidth: 0,
												fill: "hsl(var(--primary))",
											}}
										/>
									</AreaChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-full">
									<p className="text-muted-foreground">
										Nenhum dado disponível para o período
									</p>
								</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
export default withAuth(DashboardPage, ["admin"]); // exemplo com papéis permitidos
