import { useEffect, useState } from "react";
import { MdWarningAmber } from "react-icons/md";

export default function AlertaEntradaTurno() {
  const [mostrar, setMostrar] = useState(true);

  useEffect(() => {
    const agora = new Date();
    const meiaNoite = new Date();
    meiaNoite.setHours(24, 0, 0, 0);
    const msAteMeiaNoite = meiaNoite.getTime() - agora.getTime();

    const timer = setTimeout(() => setMostrar(false), msAteMeiaNoite);

    return () => clearTimeout(timer);
  }, []);

  if (!mostrar) return null;

  return (
    <div
      className="fixed top-40 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center"
      style={{ pointerEvents: "none" }}
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-red-700 via-red-500 to-red-700 text-white font-semibold text-base md:text-lg px-6 py-3 rounded-xl shadow-2xl border-2 border-red-300 animate-bounce">
        <MdWarningAmber size={28} className="text-yellow-300 drop-shadow" />
        <span>
          Atenção: Funcionários da escala 24x72 do turno de <b>20/06</b>, registrem sua <b>entrada</b> até <b>00:00:00</b>.<br />
         
        </span>
      </div>
    </div>
  );
}