"use client";

import { useState } from "react";
import SeletorMotivo from "./SeletorMotivo";
import { Botao, Campo, Icon, Sheet } from "./ui";
import { useVisitas } from "@/lib/visitas-context";
import { fmtDataHora, fmtHora } from "@/lib/visitas-types";

/** Corrige o motivo e as observações de uma visita já registrada. */
export default function SheetEditarVisita({
  visitaId,
  onFechar,
  onSalvo,
}: {
  visitaId: string;
  onFechar: () => void;
  onSalvo?: () => void;
}) {
  const { visitas, imobiliariaPorId, updateVisita } = useVisitas();
  const visita = visitas.find((v) => v.id === visitaId);

  const [motivo, setMotivo] = useState(visita?.motivo ?? "");
  const [obs, setObs] = useState(visita?.observacao ?? "");

  if (!visita) return null;
  const imob = imobiliariaPorId(visita.imobiliariaId);

  return (
    <Sheet
      aberto
      onFechar={onFechar}
      titulo="Editar visita"
      subtitulo={imob?.nome}
      rodape={
        <div className="grid grid-cols-2 gap-2">
          <Botao variante="secundario" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao
            variante="primario"
            icone="save"
            disabled={!motivo.trim()}
            onClick={() => {
              updateVisita(visitaId, {
                motivo: motivo.trim(),
                observacao: obs.trim(),
              });
              onSalvo?.();
              onFechar();
            }}
          >
            Salvar
          </Botao>
        </div>
      }
    >
      {/* Horários são do sistema e não se editam */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-3 mb-4 space-y-1">
        <p className="text-[12px] text-[#9a9a9a] flex items-center gap-2">
          <Icon name="login" size={14} /> Entrada: {fmtDataHora(visita.checkIn)}
        </p>
        <p className="text-[12px] text-[#9a9a9a] flex items-center gap-2">
          <Icon name="logout" size={14} />
          {visita.checkOut
            ? `Saída: ${fmtHora(visita.checkOut)}`
            : "Visita ainda em andamento"}
        </p>
        <p className="text-[11px] text-[#6a6a6a] pt-1">
          Data, horários e coordenadas vêm do sistema e não são editáveis — são a
          evidência da visita.
        </p>
      </div>

      <SeletorMotivo valor={motivo} onChange={setMotivo} />

      <Campo
        label="Observações"
        valor={obs}
        onChange={setObs}
        placeholder="O que foi tratado nesta visita?"
        multiline
      />
    </Sheet>
  );
}
