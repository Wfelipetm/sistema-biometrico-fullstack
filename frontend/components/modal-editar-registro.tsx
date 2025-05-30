import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { format } from "date-fns";
const API_URL = process.env.NEXT_PUBLIC_API_URL;



interface ModalEditarRegistroPontoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: any;
  onAtualizado: (data: any) => void;
}

function padHora(hora: string) {
  // Garante formato HH:mm com zero à esquerda
  if (!hora) return "00:00";
  const [h, m] = hora.split(":");
  return `${h?.padStart(2, "0") || "00"}:${m?.padStart(2, "0") || "00"}`;
}

export default function ModalEditarRegistroPonto({ open, onOpenChange, registro, onAtualizado }: ModalEditarRegistroPontoProps) {
  const [horaEntrada, setHoraEntrada] = useState("00:00");
  const [horaSaida, setHoraSaida] = useState("00:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHoraEntrada(padHora(registro?.hora_entrada ?? "00:00"));
    setHoraSaida(padHora(registro?.hora_saida ?? "00:00"));
  }, [registro]);

const handleSubmit = async () => {
  if (!registro) {
    console.warn("Registro não definido!");
    return;
  }

  setLoading(true);

  try {
    console.log(">>> Dados do registro recebido:");
    console.log("ID:", registro.id);
    console.log("hora_entrada:", horaEntrada);
    console.log("hora_saida:", horaSaida);

    const payload = {
      hora_entrada: horaEntrada,
      hora_saida: horaSaida,
    };

    console.log(">>> Payload que será enviado na requisição PUT:");
    console.log(JSON.stringify(payload, null, 2));

    const url = `${API_URL}/reg/registros-ponto/${registro.id}`;
    console.log(">>> URL da requisição:", url);

    const response = await axios.put(url, payload);

    console.log(">>> Resposta recebida:", response.data);

    if (onAtualizado) onAtualizado(response.data);
    onOpenChange(false);
  } catch (error: any) {
    console.error(">>> Erro ao atualizar registro:");
    console.error(error.response?.data || error.message);
    alert("Erro ao atualizar registro de ponto.");
  } finally {
    setLoading(false);
  }
};


  // Formata a data para dd/MM/yyyy
  const dataFormatada = registro?.data_hora
    ? format(new Date(registro.data_hora), "dd/MM/yyyy")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Registro de Ponto</DialogTitle>
          <DialogDescription>
            Atualize os horários de entrada e saída do funcionário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="data" className="block text-sm font-medium text-gray-700">Data</label>
            <Input
              type="text"
              id="data"
              value={dataFormatada}
              disabled
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>
          <Input
            type="time"
            placeholder="Hora de Entrada"
            value={horaEntrada}
            onChange={(e) => setHoraEntrada(padHora(e.target.value))}
            disabled={!registro}
          />
          <Input
            type="time"
            placeholder="Hora de Saída"
            value={horaSaida}
            onChange={(e) => setHoraSaida(padHora(e.target.value))}
            disabled={!registro}
          />

          <div className="flex justify-end">
            <Button
  onClick={handleSubmit}
  disabled={
    loading ||
    !registro ||
    !/^\d{2}:\d{2}$/.test(horaEntrada) ||
    !/^\d{2}:\d{2}$/.test(horaSaida)
  }
  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-gray-200"
>
  {loading ? "Salvando..." : "Salvar"}
</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}