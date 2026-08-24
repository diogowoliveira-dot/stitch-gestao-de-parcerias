"use client";

import { useState } from "react";
import SheetMotivos from "./SheetMotivos";
import { Campo, Chip, Icon } from "./ui";
import { useVisitas } from "@/lib/visitas-context";
import { MOTIVO_OUTRO } from "@/lib/visitas-types";

/**
 * Escolha do motivo da visita — usada no check-in, no agendamento e na edição.
 * Trabalha com uma string só: ou um dos motivos da lista, ou o texto livre
 * digitado em "Outro".
 */
export default function SeletorMotivo({
  valor,
  onChange,
  label = "Motivo da visita",
}: {
  valor: string;
  onChange: (motivo: string) => void;
  label?: string;
}) {
  const { motivos } = useVisitas();
  const [outro, setOutro] = useState(
    () => valor.length > 0 && !motivos.includes(valor)
  );
  const [gerenciar, setGerenciar] = useState(false);

  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
        {label} <span className="text-[#ec1313]">*</span>
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {motivos.map((m) => (
          <Chip
            key={m}
            label={m}
            ativo={!outro && valor === m}
            onClick={() => {
              setOutro(false);
              onChange(m);
            }}
          />
        ))}

        <Chip
          label={MOTIVO_OUTRO}
          ativo={outro}
          onClick={() => {
            setOutro(true);
            onChange("");
          }}
        />

        <button
          type="button"
          onClick={() => setGerenciar(true)}
          className="px-3 py-2 rounded-lg text-xs font-semibold border border-dashed border-[#2e2e2e] text-[#7a7a7a] hover:text-white hover:border-[#3a3a3a] transition flex items-center gap-1.5"
        >
          <Icon name="tune" size={14} />
          Editar motivos
        </button>
      </div>

      {outro && (
        <div className="mb-4">
          <Campo
            label="Qual o motivo?"
            valor={valor}
            onChange={onChange}
            placeholder="Descreva o motivo da visita"
            obrigatorio
          />
        </div>
      )}

      {gerenciar && <SheetMotivos onFechar={() => setGerenciar(false)} />}
    </>
  );
}
