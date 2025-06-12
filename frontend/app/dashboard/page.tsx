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
	created_at: string;
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
			funcionariosRecentes: `${API_URL}/secre/${user.secretaria_id}/ultimos-funcionarios`, // <-- aqui!
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

						// Trate 404 para cada endpoint esperado
						if (!res.ok) {
							if (key === "funcionarios" && res.status === 404) {
								setStats((prev) => ({
									...prev,
									funcionarios: { secretaria_id: user.secretaria_id ?? 0, total_funcionarios: "0" },
								}));
								continue;
							}
							if (key === "funcionariosRecentes" && res.status === 404) {
								setStats((prev) => ({
									...prev,
									funcionariosRecentes: [],
								}));
								continue;
							}
							if (key === "registrosHoje" && res.status === 404) {
								setStats((prev) => ({
									...prev,
									registrosHoje: { secretaria_id: String(user.secretaria_id), total_registros_hoje: 0, nome: "" },
								}));
								continue;
							}
							if (key === "registrosMes" && res.status === 404) {
								setStats((prev) => ({
									...prev,
									registrosMes: { secretaria_id: String(user.secretaria_id), secretaria_nome: "", total_registros: 0 },
								}));
								continue;
							}
							if (key === "registrosDiarios" && res.status === 404) {
								setStats((prev) => ({
									...prev,
									registrosDiarios: [],
								}));
								continue;
							}
							if (key === "unidades" && res.status === 404) {
								setStats((prev) => ({
									...prev,
									unidades: [],
								}));
								continue;
							}
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
							// erro ao parsear JSON ignorado
						}
					}
				}
			} catch (err) {
				// erro inesperado ignorado
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

	// Função para corrigir acentuação de nomes de secretarias mais comuns
	function corrigeAcentosSecretaria(nome: string) {
		if (!nome) return "";
		return nome
			.replace(/\bsecretaria\b/gi, "Secretaria")
			.replace(/\beducacao\b/gi, "Educação")
			.replace(/\bsaude\b/gi, "Saúde")
			.replace(/\badministracao\b/gi, "Administração")
			.replace(/\bassistencia\b/gi, "Assistência")
			.replace(/\bgestao\b/gi, "Gestão")
			.replace(/\bseguranca\b/gi, "Segurança")
			.replace(/\bmeio ambiente\b/gi, "Meio Ambiente")
			.replace(/\bfinancas\b/gi, "Finanças")
			.replace(/\bfazenda\b/gi, "Fazenda")
			.replace(/\bciencia\b/gi, "Ciência")
			.replace(/\btecnologia\b/gi, "Tecnologia")
			.replace(/\bcultura\b/gi, "Cultura")
			.replace(/\besporte\b/gi, "Esporte")
			.replace(/\blazer\b/gi, "Lazer")
			.replace(/\bplanejamento\b/gi, "Planejamento")
			.replace(/\burbanismo\b/gi, "Urbanismo")
			.replace(/\bdesenvolvimento\b/gi, "Desenvolvimento")
			.replace(/\bsocial\b/gi, "Social")
			.replace(/\bobras\b/gi, "Obras")
			.replace(/\btransporte\b/gi, "Transporte")
			.replace(/\bhigiene\b/gi, "Higiene");
	}

	return (
		<div className="space-y-6">
			<div className="shadow-lg rounded-xl bg-white/80 backdrop-blur-md p-6">
				<h1 className="text-3xl font-bold tracking-tight text-blue-900">Secretaria</h1>
				<p className="text-blue-700">
					Aqui está um resumo da{" "}
					<span className="lowercase">
						<b>{corrigeAcentosSecretaria(secretariaNome?.toLowerCase() || "sua secretaria")}</b>
					</span>.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="transition-shadow hover:shadow-lg hover:border-yellow-300 hover:bg-yellow-50 ring-2 ring-yellow-100 border-yellow-200 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-yellow-800">Unidades</CardTitle>
						<Building2 className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-yellow-800">{stats.unidades.length}</div>
						<p className="text-xs text-yellow-700">
							Total de unidades na secretaria
						</p>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 ring-2 ring-blue-100 border-blue-200 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-blue-900">Funcionários</CardTitle>
						<Users className="h-4 w-4 text-blue-700" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-900">
							{stats.funcionarios?.total_funcionarios ?? 0}
						</div>
						<p className="text-xs text-blue-700">
							Total de funcionários na secretaria
						</p>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-lg hover:border-green-300 hover:bg-green-50 ring-2 ring-green-100 border-green-200 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-green-900">Registros Hoje</CardTitle>
						<Clock className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-900">
							{stats.registrosHoje?.total_registros_hoje ?? 0}
						</div>
						<p className="text-xs text-green-700">
							Registros de ponto realizados hoje
						</p>
					</CardContent>
				</Card>

				<Card className="transition-shadow hover:shadow-lg hover:border-red-300 hover:bg-red-50 ring-2 ring-red-100 border-red-200 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-red-900">Registros no Mês</CardTitle>
						<CalendarClock className="h-4 w-4 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-900">
							{stats.registrosMes?.total_registros ?? 0}
						</div>
						<p className="text-xs text-red-700">
							Total de registros no mês atual
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="col-span-1 ring-2 ring-blue-100 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
					<CardHeader>
						<CardTitle className="text-blue-900">Unidades da Secretaria</CardTitle>
						<CardDescription className="text-blue-700">
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
											<span className="font-medium text-blue-900">{unidade.nome}</span>
										</li>
									))}
									{stats.unidades.length > 5 && (
										<li className="text-sm text-blue-700 text-center pt-2">
											+ {stats.unidades.length - 5} outras unidades
										</li>
									)}
								</ul>
							) : (
								<p className="text-sm text-blue-700">
									Nenhuma unidade encontrada
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-1 ring-2 ring-blue-100 shadow-lg rounded-xl bg-white/80 backdrop-blur-md">
					<CardHeader>
						<CardTitle className="text-blue-900">Funcionários Recentes</CardTitle>
						<CardDescription className="text-blue-700">Últimos funcionários cadastrados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.funcionariosRecentes.length > 0 ? (
								<ul className="space-y-2">
									{stats.funcionariosRecentes
										.slice(0, 5)
										.map((funcionario) => (
											<li
												key={funcionario.id}
												className="flex items-center justify-between border-b pb-2"
											>
												<span className="font-medium text-blue-900">{funcionario.nome}</span>
												<span className="text-xs text-blue-700">
													{(() => {
														const [dia, mes, ano] = funcionario.created_at.split("/");
														return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
													})()}
												</span>
											</li>
										))}
									{stats.funcionariosRecentes.length > 5 && (
										<li className="text-sm text-blue-700 text-center pt-2">
											+ {stats.funcionariosRecentes.length - 5} outros
											funcionários
										</li>
									)}
								</ul>
							) : (
								<p className="text-sm text-blue-700">
									Nenhum funcionário encontrado
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="col-span-2 mt-4 ring-2 ring-blue-100 shadow-xl rounded-xl bg-white/80 backdrop-blur-md">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="text-xl text-blue-900">
							Registros de Ponto Diários
						</CardTitle>
						<CardDescription className="text-blue-700">
							Monitoramento de presenças por dia em {mesAtual}
						</CardDescription>
					</div>
					<BarChart3 className="h-5 w-5 text-blue-400" />
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
											stroke="#c7d2fe"
										/>
										<XAxis
											dataKey="dia"
											axisLine={false}
											tickLine={false}
											tick={{
												fill: "#1e3a8a",
												fontSize: 12,
											}}
											padding={{ left: 10, right: 10 }}
										/>
										<YAxis
											axisLine={false}
											tickLine={false}
											tick={{
												fill: "#1e3a8a",
												fontSize: 12,
											}}
											width={40}
										/>
										<Tooltip content={<TooltipPersonalizado />} />
										<Area
											type="monotone"
											dataKey="total"
											stroke="#1e3a8a"
											strokeWidth={2}
											fillOpacity={1}
											fill="url(#colorTotal)"
											activeDot={{
												r: 6,
												strokeWidth: 0,
												fill: "#1e3a8a",
											}}
										/>
									</AreaChart>
								</ResponsiveContainer>
							) : (
								<div className="flex items-center justify-center h-full">
									<p className="text-blue-700">
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
