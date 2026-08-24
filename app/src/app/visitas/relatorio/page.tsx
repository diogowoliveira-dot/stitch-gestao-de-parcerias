"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavInferior from "@/components/visitas/NavInferior";
import { ContadorVisitas, Icon } from "@/components/visitas/ui";
import { useVisitas } from "@/lib/visitas-context";
import {
  chaveDia,
  fimDoDia,
  fmtData,
  formatarDuracaoMs,
  inicioDoDia,
  inicioDoMes,
  somarDias,
  statusPorUltimaVisita,
  STATUS_INFO,
  type StatusVisita,
} from "@/lib/visitas-types";

type Preset = "7d" | "30d" | "mes" | "mes_passado" | "tudo" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "mes", label: "Mês atual" },
  { id: "mes_passado", label: "Mês passado" },
  { id: "tudo", label: "Tudo" },
];

function intervaloDoPreset(p: Preset): { de: Date; ate: Date } {
  const hoje = new Date();
  switch (p) {
    case "7d":
      return { de: inicioDoDia(somarDias(hoje, -6)), ate: fimDoDia(hoje) };
    case "30d":
      return { de: inicioDoDia(somarDias(hoje, -29)), ate: fimDoDia(hoje) };
    case "mes":
      return { de: inicioDoMes(hoje), ate: fimDoDia(hoje) };
    case "mes_passado": {
      const ini = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      return { de: inicioDoDia(ini), ate: fimDoDia(new Date(hoje.getFullYear(), hoje.getMonth(), 0)) };
    }
    default:
      return { de: new Date(2000, 0, 1), ate: fimDoDia(hoje) };
  }
}

export default function PaginaRelatorio() {
  const router = useRouter();
  const {
    imobiliarias,
    visitas,
    carregado,
    visitaAberta,
    ultimaVisitaDe,
    totalVisitasDe,
    imobiliariaPorId,
    agendamentosNoIntervalo,
  } = useVisitas();

  const [preset, setPreset] = useState<Preset>("30d");
  const [de, setDe] = useState(() => chaveDia(intervaloDoPreset("30d").de));
  const [ate, setAte] = useState(() => chaveDia(new Date()));

  function aplicarPreset(p: Preset) {
    setPreset(p);
    if (p === "custom") return;
    const i = intervaloDoPreset(p);
    setDe(chaveDia(i.de));
    setAte(chaveDia(i.ate));
  }

  const inicio = useMemo(() => inicioDoDia(new Date(`${de}T12:00:00`)), [de]);
  const fim = useMemo(() => fimDoDia(new Date(`${ate}T12:00:00`)), [ate]);
  const diasNoPeriodo = Math.max(
    1,
    Math.round((fim.getTime() - inicio.getTime()) / 86400000)
  );

  // ——— Visitas do período ———
  const doPeriodo = useMemo(
    () =>
      visitas
        .filter((v) => {
          const t = new Date(v.checkIn).getTime();
          return t >= inicio.getTime() && t <= fim.getTime();
        })
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    [visitas, inicio, fim]
  );

  const fechadas = doPeriodo.filter((v) => v.checkOut);
  const msTotal = fechadas.reduce(
    (s, v) =>
      s + (new Date(v.checkOut!).getTime() - new Date(v.checkIn).getTime()),
    0
  );
  const msMedio = fechadas.length ? msTotal / fechadas.length : 0;

  const imobsVisitadas = new Set(doPeriodo.map((v) => v.imobiliariaId)).size;
  const semCheckout = doPeriodo.filter((v) => !v.checkOut).length;

  // ——— Por motivo ———
  const porMotivo = useMemo(() => {
    const m = new Map<string, { n: number; ms: number; fechadas: number }>();
    doPeriodo.forEach((v) => {
      const atual = m.get(v.motivo) ?? { n: 0, ms: 0, fechadas: 0 };
      atual.n++;
      if (v.checkOut) {
        atual.ms += new Date(v.checkOut).getTime() - new Date(v.checkIn).getTime();
        atual.fechadas++;
      }
      m.set(v.motivo, atual);
    });
    return [...m.entries()]
      .map(([motivo, d]) => ({
        motivo,
        n: d.n,
        pct: doPeriodo.length ? (d.n / doPeriodo.length) * 100 : 0,
        medio: d.fechadas ? d.ms / d.fechadas : 0,
      }))
      .sort((a, b) => b.n - a.n);
  }, [doPeriodo]);

  // ——— Carteira por status (situação atual, não do período) ———
  const porStatus = useMemo(() => {
    const c: Record<StatusVisita, number> = {
      ativa: 0,
      recente: 0,
      atencao: 0,
      fria: 0,
      nunca: 0,
    };
    imobiliarias.forEach((i) => {
      const u = ultimaVisitaDe(i.id);
      const s = statusPorUltimaVisita(
        u?.checkIn ?? null,
        visitaAberta?.imobiliariaId === i.id
      );
      c[s]++;
    });
    return c;
  }, [imobiliarias, ultimaVisitaDe, visitaAberta]);

  // ——— Ranking do período ———
  const ranking = useMemo(() => {
    const m = new Map<string, { n: number; ms: number }>();
    doPeriodo.forEach((v) => {
      const a = m.get(v.imobiliariaId) ?? { n: 0, ms: 0 };
      a.n++;
      if (v.checkOut)
        a.ms += new Date(v.checkOut).getTime() - new Date(v.checkIn).getTime();
      m.set(v.imobiliariaId, a);
    });
    return [...m.entries()]
      .map(([id, d]) => ({ id, nome: imobiliariaPorId(id)?.nome ?? "—", ...d }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
  }, [doPeriodo, imobiliariaPorId]);

  // ——— Evolução por dia ———
  const porDia = useMemo(() => {
    const m = new Map<string, number>();
    doPeriodo.forEach((v) => {
      const k = chaveDia(v.checkIn);
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    // no máximo 30 colunas para não virar sopa
    const total = Math.min(diasNoPeriodo, 30);
    return Array.from({ length: total }, (_, idx) => {
      const d = somarDias(fim, -(total - 1 - idx));
      return { dia: d, n: m.get(chaveDia(d)) ?? 0 };
    });
  }, [doPeriodo, diasNoPeriodo, fim]);

  const maxDia = Math.max(1, ...porDia.map((d) => d.n));

  // ——— Agenda do período ———
  const agendadas = useMemo(
    () => agendamentosNoIntervalo(inicio, fim),
    [agendamentosNoIntervalo, inicio, fim]
  );
  const realizadas = agendadas.filter((a) => a.status === "realizada").length;
  const canceladas = agendadas.filter((a) => a.status === "cancelada").length;
  const cumprimento = agendadas.length
    ? Math.round((realizadas / agendadas.length) * 100)
    : null;

  const agendaHoje = useMemo(
    () =>
      agendamentosNoIntervalo(inicioDoDia(new Date()), fimDoDia(new Date())).filter(
        (a) => a.status === "programada"
      ),
    [agendamentosNoIntervalo]
  );

  return (
    <div className="min-h-dvh bg-black pb-24">
      {/* ——— Cabeçalho ——— */}
      <header className="sticky top-0 z-[900] bg-[#0a0a0a]/97 backdrop-blur-md border-b border-[#1c1c1c]">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ec1313] flex items-center justify-center shrink-0">
            <Icon name="insights" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold leading-tight">Relatório de visitas</h1>
            <p className="text-[11px] text-[#7a7a7a] leading-tight">
              {fmtData(inicio.toISOString())} a {fmtData(fim.toISOString())} ·{" "}
              {diasNoPeriodo} {diasNoPeriodo === 1 ? "dia" : "dias"}
            </p>
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto custom-scrollbar">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => aplicarPreset(p.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                preset === p.id
                  ? "bg-[#ec1313] border-[#ec1313] text-white"
                  : "bg-[#141414] border-[#262626] text-[#9a9a9a] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a7a] mb-1 block">
              Início
            </span>
            <input
              type="date"
              value={de}
              max={ate}
              onChange={(e) => {
                setDe(e.target.value);
                setPreset("custom");
              }}
              className="w-full bg-[#141414] border border-[#262626] rounded-lg px-2.5 py-2 text-[13px] text-white outline-none focus:border-[#ec1313]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a7a] mb-1 block">
              Fim
            </span>
            <input
              type="date"
              value={ate}
              min={de}
              onChange={(e) => {
                setAte(e.target.value);
                setPreset("custom");
              }}
              className="w-full bg-[#141414] border border-[#262626] rounded-lg px-2.5 py-2 text-[13px] text-white outline-none focus:border-[#ec1313]"
            />
          </label>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {!carregado ? null : (
          <>
            {/* ——— KPIs ——— */}
            <div className="grid grid-cols-2 gap-2">
              <Kpi
                icone="how_to_reg"
                label="Visitas realizadas"
                valor={String(doPeriodo.length)}
                nota={`${(doPeriodo.length / diasNoPeriodo).toFixed(1)} por dia`}
                cor="#ec1313"
              />
              <Kpi
                icone="apartment"
                label="Imobiliárias visitadas"
                valor={String(imobsVisitadas)}
                nota={`de ${imobiliarias.length} na carteira`}
                cor="#3b82f6"
              />
              <Kpi
                icone="timer"
                label="Tempo em visita"
                valor={formatarDuracaoMs(msTotal)}
                nota={`${fechadas.length} com check-out`}
                cor="#00c29f"
              />
              <Kpi
                icone="avg_time"
                label="Duração média"
                valor={msMedio ? formatarDuracaoMs(msMedio) : "—"}
                nota={semCheckout > 0 ? `${semCheckout} sem check-out` : "todas fechadas"}
                cor="#ffc300"
              />
            </div>

            {/* ——— Evolução ——— */}
            <Bloco titulo="Visitas por dia" icone="bar_chart">
              {doPeriodo.length === 0 ? (
                <Vazio texto="Nenhuma visita neste período." />
              ) : (
                <>
                  <div className="flex items-end gap-[3px] h-24">
                    {porDia.map((d) => (
                      <div
                        key={d.dia.toISOString()}
                        className="flex-1 min-w-0 flex flex-col justify-end h-full group"
                        title={`${fmtData(d.dia.toISOString())}: ${d.n} ${d.n === 1 ? "visita" : "visitas"}`}
                      >
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${(d.n / maxDia) * 100}%`,
                            minHeight: d.n > 0 ? 3 : 1,
                            background: d.n > 0 ? "#ec1313" : "#1f1f1f",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-[#6a6a6a] mt-1.5">
                    <span>{fmtData(porDia[0].dia.toISOString())}</span>
                    <span>pico: {maxDia}/dia</span>
                    <span>{fmtData(porDia[porDia.length - 1].dia.toISOString())}</span>
                  </div>
                </>
              )}
            </Bloco>

            {/* ——— Motivos ——— */}
            <Bloco titulo="Motivos das visitas" icone="flag">
              {porMotivo.length === 0 ? (
                <Vazio texto="Nenhuma visita neste período." />
              ) : (
                <div className="space-y-2.5">
                  {porMotivo.map((m) => (
                    <div key={m.motivo}>
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-[13px] font-semibold truncate">
                          {m.motivo}
                        </span>
                        <span className="text-[11px] text-[#8a8a8a] shrink-0 tabular-nums">
                          {m.n} · {m.pct.toFixed(0)}%
                          {m.medio > 0 && ` · ${formatarDuracaoMs(m.medio)} méd.`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ec1313]"
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Bloco>

            {/* ——— Situação da carteira ——— */}
            <Bloco
              titulo="Situação da carteira"
              icone="donut_small"
              nota={`${imobiliarias.length} imobiliárias · situação de hoje`}
            >
              <div className="space-y-2.5">
                {(["recente", "atencao", "fria", "nunca"] as const).map((s) => {
                  const n = porStatus[s] + (s === "recente" ? porStatus.ativa : 0);
                  const pct = imobiliarias.length
                    ? (n / imobiliarias.length) * 100
                    : 0;
                  return (
                    <div key={s}>
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-[13px] font-semibold flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: STATUS_INFO[s].cor }}
                          />
                          {STATUS_INFO[s].label}
                          <span className="text-[11px] font-normal text-[#6a6a6a]">
                            {STATUS_INFO[s].descricao}
                          </span>
                        </span>
                        <span className="text-[11px] text-[#8a8a8a] shrink-0 tabular-nums">
                          {n} · {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: STATUS_INFO[s].cor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Bloco>

            {/* ——— Agenda ——— */}
            <Bloco titulo="Agenda no período" icone="event_available">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-[#3b82f6]">{agendadas.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#7a7a7a]">
                    Programadas
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#00c29f]">{realizadas}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#7a7a7a]">
                    Realizadas
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#6b7280]">{canceladas}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#7a7a7a]">
                    Canceladas
                  </p>
                </div>
              </div>
              {cumprimento !== null && (
                <p className="text-[12px] text-[#8a8a8a] text-center mt-3 pt-3 border-t border-[#1c1c1c]">
                  Cumprimento da agenda:{" "}
                  <strong
                    className={
                      cumprimento >= 70
                        ? "text-[#00c29f]"
                        : cumprimento >= 40
                          ? "text-[#ffc300]"
                          : "text-[#ef4444]"
                    }
                  >
                    {cumprimento}%
                  </strong>
                </p>
              )}
            </Bloco>

            {/* ——— Ranking ——— */}
            <Bloco titulo="Mais visitadas no período" icone="leaderboard">
              {ranking.length === 0 ? (
                <Vazio texto="Nenhuma visita neste período." />
              ) : (
                <div className="space-y-1.5">
                  {ranking.map((r, i) => (
                    <button
                      key={r.id}
                      onClick={() => router.push(`/visitas?focus=${r.id}`)}
                      className="w-full flex items-center gap-3 rounded-lg border border-[#1a1a1a] bg-[#0f0f0f] hover:border-[#333] p-2.5 transition text-left"
                    >
                      <span className="w-5 text-[11px] font-bold text-[#6a6a6a] tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 text-[13px] font-semibold truncate">
                        {r.nome}
                      </span>
                      <span className="text-[11px] text-[#7a7a7a] shrink-0 tabular-nums">
                        {r.ms > 0 && `${formatarDuracaoMs(r.ms)} · `}
                        {r.n} no período
                      </span>
                      <ContadorVisitas n={totalVisitasDe(r.id)} tamanho="sm" />
                    </button>
                  ))}
                </div>
              )}
            </Bloco>

            {/* ——— Nunca visitadas ——— */}
            {porStatus.nunca > 0 && (
              <Bloco titulo="Ainda sem nenhuma visita" icone="pending_actions">
                <div className="flex flex-wrap gap-1.5">
                  {imobiliarias
                    .filter((i) => !ultimaVisitaDe(i.id))
                    .map((i) => (
                      <button
                        key={i.id}
                        onClick={() => router.push(`/visitas?focus=${i.id}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-[11px] font-semibold text-[#b0b0b0] hover:text-white hover:border-[#3a3a3a] transition flex items-center gap-1.5"
                      >
                        {i.nome}
                        <ContadorVisitas n={0} tamanho="sm" />
                      </button>
                    ))}
                </div>
              </Bloco>
            )}

            <p className="text-[11px] text-[#5a5a5a] text-center pt-1 pb-2">
              O tempo considera só visitas com check-out.
              {semCheckout > 0 &&
                ` ${semCheckout} ${semCheckout === 1 ? "visita ficou" : "visitas ficaram"} sem check-out no período.`}
            </p>
          </>
        )}
      </main>

      <NavInferior badgeAgenda={agendaHoje.length} />
    </div>
  );
}

// ==========================================================
function Kpi({
  icone,
  label,
  valor,
  nota,
  cor,
}: {
  icone: string;
  label: string;
  valor: string;
  nota: string;
  cor: string;
}) {
  return (
    <div className="rounded-xl border border-[#1c1c1c] bg-[#0d0d0d] p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={icone} size={14} style={{ color: cor }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a8a] leading-tight">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none">{valor}</p>
      <p className="text-[11px] text-[#6a6a6a] mt-1.5">{nota}</p>
    </div>
  );
}

function Bloco({
  titulo,
  icone,
  nota,
  children,
}: {
  titulo: string;
  icone: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#1c1c1c] bg-[#0d0d0d] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon name={icone} size={16} className="text-[#7a7a7a]" />
        <h2 className="text-[13px] font-bold flex-1">{titulo}</h2>
        {nota && <span className="text-[10px] text-[#6a6a6a]">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="text-[13px] text-[#6a6a6a] py-2 text-center">{texto}</p>;
}
