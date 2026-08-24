"use client";

import { Badge, ContadorVisitas, Icon } from "./ui";
import {
  duracao,
  fmtData,
  fmtHora,
  tempoRelativo,
  type Visita,
} from "@/lib/visitas-types";

export default function ItemVisita({
  visita,
  nomeImobiliaria,
  visitasImobiliaria,
  onEditar,
}: {
  visita: Visita;
  /** Exibido no feed, onde o card aparece fora do contexto da imobiliária */
  nomeImobiliaria?: string;
  visitasImobiliaria?: number;
  /** Quando informado, mostra o botão de corrigir motivo/observações */
  onEditar?: () => void;
}) {
  const aberta = !visita.checkOut;

  return (
    <div className="rounded-xl border border-[#1f1f1f] bg-[#111] p-3">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          {nomeImobiliaria && (
            <p className="text-[11px] text-[#7a7a7a] font-semibold truncate flex items-center gap-1.5">
              {nomeImobiliaria}
              {visitasImobiliaria !== undefined && (
                <ContadorVisitas n={visitasImobiliaria} tamanho="sm" />
              )}
            </p>
          )}
          <span className="text-sm font-bold text-white">{visita.motivo}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {aberta ? (
            <Badge cor="#3b82f6" pulsando>
              Em andamento
            </Badge>
          ) : (
            <span className="text-[11px] text-[#7a7a7a] font-semibold">
              {duracao(visita.checkIn, visita.checkOut!)}
            </span>
          )}
          {onEditar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditar();
              }}
              aria-label="Editar motivo da visita"
              className="w-7 h-7 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#8a8a8a] hover:text-white flex items-center justify-center transition"
            >
              <Icon name="edit" size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#9a9a9a]">
        <span className="flex items-center gap-1">
          <Icon name="event" size={13} />
          {fmtData(visita.checkIn)}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="login" size={13} />
          {fmtHora(visita.checkIn)}
        </span>
        {visita.checkOut && (
          <span className="flex items-center gap-1">
            <Icon name="logout" size={13} />
            {fmtHora(visita.checkOut)}
          </span>
        )}
        <span className="text-[#5a5a5a]">{tempoRelativo(visita.checkIn)}</span>
        {visita.distanciaCheckIn !== null && (
          <span className="flex items-center gap-1 text-[#5a5a5a]">
            <Icon name="gps_fixed" size={13} />
            {visita.distanciaCheckIn} m do pin
          </span>
        )}
      </div>

      {visita.observacao && (
        <p className="text-[13px] text-[#b8b8b8] mt-2 leading-relaxed border-t border-[#1c1c1c] pt-2">
          {visita.observacao}
        </p>
      )}
    </div>
  );
}
