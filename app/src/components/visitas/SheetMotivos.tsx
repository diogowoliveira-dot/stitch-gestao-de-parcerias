"use client";

import { useMemo, useState } from "react";
import { Botao, Icon, Sheet } from "./ui";
import { useVisitas } from "@/lib/visitas-context";
import { MOTIVOS_PADRAO } from "@/lib/visitas-types";

/**
 * Edição da lista de motivos de visita.
 * Renomear leva o novo nome para o histórico e a agenda, senão o relatório
 * passaria a contar o mesmo motivo duas vezes.
 */
export default function SheetMotivos({ onFechar }: { onFechar: () => void }) {
  const { motivos, setMotivos, renomearMotivo, visitas, agendamentos } =
    useVisitas();

  const [novo, setNovo] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");

  // quantas visitas/agendamentos usam cada motivo
  const uso = useMemo(() => {
    const m = new Map<string, number>();
    visitas.forEach((v) => m.set(v.motivo, (m.get(v.motivo) ?? 0) + 1));
    agendamentos.forEach((a) => m.set(a.motivo, (m.get(a.motivo) ?? 0) + 1));
    return m;
  }, [visitas, agendamentos]);

  function adicionar() {
    const v = novo.trim();
    if (!v) return;
    if (motivos.some((m) => m.toLowerCase() === v.toLowerCase())) {
      setErro("Esse motivo já está na lista.");
      return;
    }
    setErro("");
    setMotivos([...motivos, v]);
    setNovo("");
  }

  function salvarEdicao(antigo: string) {
    const v = texto.trim();
    if (!v) return setEditando(null);
    if (
      v !== antigo &&
      motivos.some((m) => m.toLowerCase() === v.toLowerCase())
    ) {
      setErro("Já existe um motivo com esse nome.");
      return;
    }
    setErro("");
    renomearMotivo(antigo, v);
    setEditando(null);
  }

  return (
    <Sheet
      aberto
      onFechar={onFechar}
      titulo="Motivos de visita"
      subtitulo="Aparecem no check-in e no agendamento"
      rodape={
        <div className="flex flex-col gap-2">
          {erro && <p className="text-[12px] text-[#fca5a5] text-center">{erro}</p>}
          <Botao full variante="primario" icone="check" onClick={onFechar}>
            Concluir
          </Botao>
          <Botao
            variante="fantasma"
            icone="restart_alt"
            onClick={() => {
              setMotivos([...MOTIVOS_PADRAO]);
              setErro("");
            }}
          >
            Restaurar lista padrão
          </Botao>
        </div>
      }
    >
      {/* novo motivo */}
      <div className="flex gap-2 mb-4">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionar()}
          placeholder="Incluir um motivo"
          className="flex-1 min-w-0 bg-[#141414] border border-[#262626] rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-[#ec1313] placeholder:text-[#5a5a5a]"
        />
        <button
          onClick={adicionar}
          disabled={!novo.trim()}
          aria-label="Incluir motivo"
          className="shrink-0 w-12 rounded-xl bg-[#ec1313] hover:bg-[#d40000] text-white flex items-center justify-center transition disabled:opacity-40"
        >
          <Icon name="add" size={20} />
        </button>
      </div>

      <div className="space-y-2">
        {motivos.map((m) => {
          const usos = uso.get(m) ?? 0;
          const emEdicao = editando === m;

          return (
            <div
              key={m}
              className="rounded-xl border border-[#1f1f1f] bg-[#111] p-2.5 flex items-center gap-2"
            >
              {emEdicao ? (
                <>
                  <input
                    autoFocus
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") salvarEdicao(m);
                      if (e.key === "Escape") setEditando(null);
                    }}
                    className="flex-1 min-w-0 bg-[#0d0d0d] border border-[#2e2e2e] rounded-lg px-2.5 py-2 text-[13px] text-white outline-none focus:border-[#ec1313]"
                  />
                  <button
                    onClick={() => salvarEdicao(m)}
                    aria-label="Salvar"
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#00c29f] text-black flex items-center justify-center"
                  >
                    <Icon name="check" size={16} />
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    aria-label="Cancelar"
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#9a9a9a] flex items-center justify-center"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate">{m}</p>
                    <p className="text-[11px] text-[#6a6a6a]">
                      {usos === 0
                        ? "não usado ainda"
                        : `${usos} ${usos === 1 ? "registro" : "registros"}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditando(m);
                      setTexto(m);
                      setErro("");
                    }}
                    aria-label={`Renomear ${m}`}
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[#9a9a9a] hover:text-white flex items-center justify-center"
                  >
                    <Icon name="edit" size={15} />
                  </button>
                  <button
                    onClick={() => setMotivos(motivos.filter((x) => x !== m))}
                    aria-label={`Remover ${m}`}
                    className="shrink-0 w-8 h-8 rounded-lg bg-transparent border border-[#3a1a1a] text-[#ef4444] hover:bg-[#2a0d0d] flex items-center justify-center"
                  >
                    <Icon name="delete" size={15} />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {motivos.length === 0 && (
          <p className="text-[13px] text-[#7a7a7a] text-center py-4">
            Nenhum motivo na lista — só a opção &ldquo;Outro&rdquo; vai aparecer.
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[#222] bg-[#111] p-3 flex items-start gap-2.5">
        <Icon name="info" size={16} className="text-[#6a6a6a] mt-0.5 shrink-0" />
        <p className="text-[12px] text-[#8a8a8a] leading-relaxed">
          Renomear atualiza também as visitas e agendamentos já registrados, para o
          relatório não separar o mesmo motivo em dois. Remover não apaga o histórico:
          as visitas antigas mantêm o motivo que tinham.{" "}
          <strong className="text-[#b0b0b0]">Outro</strong> está sempre disponível.
        </p>
      </div>
    </Sheet>
  );
}
