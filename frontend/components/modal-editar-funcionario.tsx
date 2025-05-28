"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface FuncionarioEditado {
	id: string;
	nome: string;
	cpf: string;
	cargo: string;
	data_admissao: string;
	unidade_id: number;
	matricula: string;
	tipo_escala: string;
	telefone: string;
}

interface ModalEditarFuncionarioProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	funcionario: FuncionarioEditado;
	onSuccess: () => void;
}

export default function ModalEditarFuncionario({
	open,
	onOpenChange,
	funcionario,
	onSuccess,
}: ModalEditarFuncionarioProps) {
	const [nome, setNome] = useState("");
	const [cpf, setCpf] = useState("");
	const [cargo, setCargo] = useState("");
	const [dataAdmissao, setDataAdmissao] = useState("");
	const [unidadeId, setUnidadeId] = useState("");
	const [matricula, setMatricula] = useState("");
	const [tipoEscala, setTipoEscala] = useState("");
	const [telefone, setTelefone] = useState("");
	const [loading, setLoading] = useState(false);
	const [nomeUnidade, setNomeUnidade] = useState("");

	useEffect(() => {
		if (open && funcionario?.id) {
			const fetchFuncionario = async () => {
				try {
					const { data } = await api.get(`funci/funcionario/${funcionario.id}`);
					setNome(data.nome || "");
					setCpf(data.cpf || "");
					setCargo(data.cargo || "");
					setDataAdmissao(data.data_admissao?.substring(0, 10) || "");
					// setUnidadeId(String(data.unidade_id || ""));
					setMatricula(data.matricula || "");
					setTipoEscala(data.tipo_escala || "");
					setTelefone(data.telefone || "");
					// setNomeUnidade(data.nome_unidade || "");
				} catch (error) {
					console.error("Erro ao buscar funcionário:", error);
				}
			};

			fetchFuncionario();
		}
	}, [open, funcionario?.id]);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const payload: Partial<FuncionarioEditado> = {};

			if (nome !== funcionario.nome) payload.nome = nome;
			if (cpf !== funcionario.cpf) payload.cpf = cpf;
			if (cargo !== funcionario.cargo) payload.cargo = cargo;
			if (dataAdmissao !== funcionario.data_admissao)
				payload.data_admissao = dataAdmissao;
			if (String(funcionario.unidade_id) !== unidadeId)
				payload.unidade_id = Number(unidadeId);
			if (matricula !== funcionario.matricula) payload.matricula = matricula;
			if (tipoEscala !== funcionario.tipo_escala)
				payload.tipo_escala = tipoEscala;
			if (telefone !== funcionario.telefone) payload.telefone = telefone;

			if (Object.keys(payload).length === 0) {
				alert("Nenhuma alteração detectada.");
				setLoading(false);
				return;
			}

			await api.put(`funci/funcionario/${funcionario.id}`, payload);

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Erro ao atualizar funcionário:", error);
			alert("Erro ao atualizar funcionário");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Funcionário</DialogTitle>
					<DialogDescription>
						Atualize os dados do funcionário abaixo
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<Input
						placeholder="Nome"
						value={nome}
						onChange={(e) => setNome(e.target.value)}
					/>
					<Input
						placeholder="CPF"
						value={cpf}
						onChange={(e) => setCpf(e.target.value)}
					/>
					<Input
						placeholder="Cargo"
						value={cargo}
						onChange={(e) => setCargo(e.target.value)}
					/>
					<Input
						placeholder="Data de admissão"
						type="date"
						value={dataAdmissao}
						onChange={(e) => setDataAdmissao(e.target.value)}
					/>
					{/* <Input
						placeholder="Nome da Unidade"
						value={nomeUnidade}
						disabled
						readOnly
					/> */}

					<Input
						placeholder="Matrícula"
						value={matricula}
						onChange={(e) => setMatricula(e.target.value)}
					/>
					<Input
						placeholder="Tipo de Escala"
						value={tipoEscala}
						onChange={(e) => setTipoEscala(e.target.value)}
					/>
					<Input
						placeholder="Telefone"
						value={telefone}
						onChange={(e) => setTelefone(e.target.value)}
					/>

					<div className="flex justify-end">
						<Button onClick={handleSubmit} disabled={loading}>
							{loading ? "Salvando..." : "Salvar"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
