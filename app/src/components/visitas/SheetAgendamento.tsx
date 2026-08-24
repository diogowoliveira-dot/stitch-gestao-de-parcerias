"use client";

import { useMemo, useState } from "react";
import SeletorMotivo from "./SeletorMotivo";
import { Botao, Campo, Chip, Icon, NomeImobiliaria, Sheet } from "./ui";
import {
  chaveDia,
  DURACOES,
  horaDoISO,
  montarISO,
  type Agendamento,
  type Imobiliaria,
} from "@/lib/visitas-types";
import { useVisitas, type NovoAgendamento } from "@/lib/visitas-context";

/** Próxima hora cheia (ex.: 14:37 → "15:00") */
function proximaHora(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

export default function SheetAgendamento({
  imobiliarias,
  imobIdInicial,
  diaInicial,
  agendamento,
  onSalvar,
  onCancelar,
  onNovaImobiliaria,
}: {
  imobiliarias: Imobiliaria[];
  imobIdInicial?: string | null;
  diaInicial?: Date;
  /** Preenchido quando é edição */
  agendamento?: Agendamento | null;
  /** `enviarConvite` = mandar o convite de agenda ao responsável */
  onSalvar: (dados: NovoAgendamento, enviarConvite: boolean) => void;
  onCancelar: () => void;
  /** Abre o fluxo de cadastro de uma imobiliária que ainda não existe */
  onNovaImobiliaria: () => void;
}) {
  const edicao = !!agendamento;

  const [imobId, setImobId] = useState<string | null>(
    agendamento?.imobiliariaId ?? imobIdInicial ?? null
  );
  const [busca, setBusca] = useState("");
  const [dia, setDia] = useState(
    chaveDia(agendamento?.inicio ?? diaInicial ?? new Date())
  );
  const [hora, setHora] = useState(
    agendamento ? horaDoISO(agendamento.inicio) : proximaHora()
  );
  const [duracaoMin, setDuracaoMin] = useState<number>(
    agendamento?.duracaoMin ?? 60
  );
  const [motivo, setMotivo] = useState(agendamento?.motivo ?? "");
  const [obs, setObs] = useState(agendamento?.observacao ?? "");
  const [erro, setErro] = useState("");

  const { perfil, totalVisitasDe } = useVisitas();
  const [convidar, setConvidar] = useState(perfil.convidarResponsavel);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = [...imobiliarias].sort((a, b) => a.nome.localeCompare(b.nome));
    if (!q) return base;
    return base.filter(
      (i) =>
        i.nome.toLowerCase().includes(q) ||
        i.responsavel.nome.toLowerCase().includes(q) ||
        i.endereco.toLowerCase().includes(q)
    );
  }, [imobiliarias, busca]);

  const selecionada = imobiliarias.find((i) => i.id === imobId) ?? null;
  const motivoFinal = motivo.trim();

  function salvar() {
    if (!imobId) return setErro("Escolha a imobiliária da visita.");
    if (!dia || !hora) return setErro("Informe data e horário.");
    if (!motivoFinal) return setErro("Informe o motivo da visita.");
    setErro("");
    onSalvar(
      {
        imobiliariaId: imobId,
        motivo: motivoFinal,
        observacao: obs.trim(),
        inicio: montarISO(dia, hora),
        duracaoMin,
      },
      convidar && !!selecionada?.responsavel.email && !!perfil.email
    );
  }

  return (
    <Sheet
      aberto
      onFechar={onCancelar}
      titulo={edicao ? "Editar visita programada" : "Agendar visita"}
      subtitulo={
        selecionada ? (
          <NomeImobiliaria
            nome={selecionada.nome}
            visitas={totalVisitasDe(selecionada.id)}
            tamanho="sm"
          />
        ) : (
          "Escolha a imobiliária e o horário"
        )
      }
      rodape={
        <div className="flex flex-col gap-2">
          {erro && (
            <p className="text-[12px] text-[#fca5a5] text-center">{erro}</p>
          )}
          <Botao full variante="primario" icone="event_available" onClick={salvar}>
            {edicao ? "Salvar alterações" : "Agendar visita"}
          </Botao>
        </div>
      }
    >
      {/* ——— Imobiliária ——— */}
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
        Imobiliária <span className="text-[#ec1313]">*</span>
      </p>

      {selecionada ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#262626] bg-[#141414] p-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#1f1f1f] flex items-center justify-center shrink-0">
            <Icon name="apartment" size={18} className="text-[#9a9a9a]" />
          </div>
          <div className="flex-1 min-w-0">
            <NomeImobiliaria
              nome={selecionada.nome}
              visitas={totalVisitasDe(selecionada.id)}
              className="text-sm font-bold"
            />
            <p className="text-[11px] text-[#7a7a7a] truncate">
              {selecionada.responsavel.nome || selecionada.endereco || "—"}
            </p>
          </div>
          <button
            onClick={() => setImobId(null)}
            className="text-[11px] font-bold text-[#9a9a9a] hover:text-white px-2 py-1"
          >
            Trocar
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="relative mb-2">
            <Icon
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a]"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar imobiliária cadastrada"
              className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-10 pr-3 py-3 text-sm text-white outline-none focus:border-[#ec1313] placeholder:text-[#5a5a5a]"
            />
          </div>

          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1.5 mb-2">
            {filtradas.map((i) => (
              <button
                key={i.id}
                onClick={() => setImobId(i.id)}
                className="w-full text-left flex items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#111] hover:border-[#3a3a3a] p-2.5 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1c1c1c] flex items-center justify-center shrink-0">
                  <Icon name="apartment" size={16} className="text-[#8a8a8a]" />
                </div>
                <div className="flex-1 min-w-0">
                  <NomeImobiliaria
                    nome={i.nome}
                    visitas={totalVisitasDe(i.id)}
                    className="text-[13px] font-bold"
                    tamanho="sm"
                  />
                  <p className="text-[11px] text-[#7a7a7a] truncate">
                    {i.endereco || i.responsavel.nome || "—"}
                  </p>
                </div>
              </button>
            ))}
            {filtradas.length === 0 && (
              <p className="text-[13px] text-[#7a7a7a] py-3 text-center">
                Nenhuma imobiliária encontrada.
              </p>
            )}
          </div>

          <Botao full variante="secundario" icone="add_location_alt" onClick={onNovaImobiliaria}>
            Cadastrar nova imobiliária no mapa
          </Botao>
        </div>
      )}

      {/* ——— Data e horário ——— */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] flex items-center gap-1.5 mb-1.5">
            <Icon name="event" size={14} /> Data <span className="text-[#ec1313]">*</span>
          </span>
          <input
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#ec1313]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] flex items-center gap-1.5 mb-1.5">
            <Icon name="schedule" size={14} /> Hora <span className="text-[#ec1313]">*</span>
          </span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#ec1313]"
          />
        </label>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
        Duração prevista
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {DURACOES.map((d) => (
          <Chip
            key={d}
            label={
              d < 60
                ? `${d} min`
                : `${Math.floor(d / 60)}h${d % 60 ? String(d % 60).padStart(2, "0") : ""}`
            }
            ativo={duracaoMin === d}
            onClick={() => setDuracaoMin(d)}
          />
        ))}
      </div>

      {/* ——— Motivo ——— */}
      <SeletorMotivo valor={motivo} onChange={setMotivo} />

      <Campo
        label="Observações"
        valor={obs}
        onChange={setObs}
        placeholder="Pauta, material a levar, quem participa… (opcional)"
        multiline
      />

      {/* ——— Convite de agenda ——— */}
      {selecionada && (
        <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
            Convite de agenda
          </p>

          {!selecionada.responsavel.email ? (
            <p className="text-[12px] text-[#7a7a7a] leading-relaxed flex items-start gap-2">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              O cadastro de {selecionada.nome} não tem e-mail do responsável — sem ele
              não dá para mandar o convite. Dá para incluir editando a imobiliária.
            </p>
          ) : !perfil.email ? (
            <p className="text-[12px] text-[#d6c68a] leading-relaxed flex items-start gap-2">
              <Icon name="warning" size={14} className="mt-0.5 shrink-0" />
              Configure seu e-mail em <strong>Agenda → Lembretes</strong> para poder
              enviar convites — ele entra como organizador do evento.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setConvidar((v) => !v)}
              className="w-full flex items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#111] p-3 text-left transition hover:border-[#333]"
            >
              <Icon name="event_available" size={18} className="text-[#60a5fa] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold">Convidar o responsável</p>
                <p className="text-[11px] text-[#7a7a7a] truncate">
                  Entra na agenda de {selecionada.responsavel.email}
                </p>
              </div>
              <span
                className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition ${
                  convidar ? "bg-[#00c29f]" : "bg-[#2a2a2a]"
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    convidar ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
