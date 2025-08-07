// Tipos compartilhados
export type RegistroRelatorio = {
  data: string;
  hora_entrada: string;
  hora_saida: string;
  horas_normais: string;
  horas_extras: string;
  horas_desconto: string;
  justificativa: string;
};

export type RelatorioData = {
  funcionario: {
    nome: string;
    matricula: string;
    cargo: string;
    unidade_nome: string;
    tipo_escala: string;
    mes_ano: string;
  };
  registros: RegistroRelatorio[];
  totais?: {
    total_total_trabalhado: string;
    total_horas_extras: string;
    total_horas_desconto: string;
  };
};

// Função utilitária compartilhada
export function decimalToHHMMSS(decimalStr: string): string {
  const decimal = parseFloat(decimalStr);
  if (isNaN(decimal)) return "--";

  const hours = Math.floor(decimal);
  const minutes = Math.floor((decimal - hours) * 60);
  const seconds = Math.round((((decimal - hours) * 60) - minutes) * 60);

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
