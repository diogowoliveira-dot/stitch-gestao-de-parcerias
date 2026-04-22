"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DiagShell from "@/components/diagnostico/DiagShell";
import { useDiagAuth, useDiagData } from "@/lib/diagnostico-context";

// Presets de período
const PRESETS = [
  { label: "7 dias",  days: 7  },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "Ano",     days: 365 },
  { label: "Tudo",    days: 0  },
];

function toDateInput(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function RelatorioPage() {
  const router = useRouter();
  const { users, isMaster } = useDiagAuth();
  const { diagnosticos } = useDiagData();

  const hoje = new Date();
  const [dataInicio, setDataInicio] = useState(toDateInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
  const [dataFim,    setDataFim]    = useState(toDateInput(hoje));
  const [presetAtivo, setPresetAtivo] = useState<number | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Acesso restrito
  if (!isMaster) {
    return (
      <DiagShell showBack title="Relatório de Atividade" subtitle="Acesso restrito" icon="bar_chart">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-slate-700 mb-3 block" style={{ fontSize: 48 }}>lock</span>
          <p className="text-sm text-slate-500">Apenas usuários master podem acessar este relatório</p>
        </div>
      </DiagShell>
    );
  }

  const applyPreset = (days: number, idx: number) => {
    setPresetAtivo(idx);
    if (days === 0) {
      setDataInicio("2000-01-01");
      setDataFim(toDateInput(hoje));
    } else {
      const from = new Date(hoje);
      from.setDate(from.getDate() - days);
      setDataInicio(toDateInput(from));
      setDataFim(toDateInput(hoje));
    }
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { filtrados, totalReais, totalSim, totalCompletos, totalRascunhos, statsPerUser, maxCount } = useMemo(() => {
    const inicio = new Date(dataInicio + "T00:00:00");
    const fim    = new Date(dataFim    + "T23:59:59");

    const filtrados = diagnosticos.filter((d) => {
      const dt = new Date(d.dataCriacao);
      return dt >= inicio && dt <= fim;
    });

    const totalReais     = filtrados.filter((d) => !d.isSimulacao).length;
    const totalSim       = filtrados.filter((d) =>  d.isSimulacao).length;
    const totalCompletos = filtrados.filter((d) => d.status === "completo").length;
    const totalRascunhos = filtrados.filter((d) => d.status === "rascunho").length;

    const statsPerUser = users.map((u) => {
      const mine = filtrados.filter((d) => d.criadoPor === u.id);
      const reais     = mine.filter((d) => !d.isSimulacao);
      const sims      = mine.filter((d) =>  d.isSimulacao);
      const completos = mine.filter((d) => d.status === "completo");
      const rascunhos = mine.filter((d) => d.status === "rascunho");
      const ultimo    = mine.length
        ? mine.reduce((a, b) => new Date(a.dataCriacao) > new Date(b.dataCriacao) ? a : b)
        : null;
      return { user: u, total: mine.length, reais, sims, completos, rascunhos, ultimo, allDiags: mine };
    }).sort((a, b) => b.total - a.total);

    const maxCount = Math.max(...statsPerUser.map((s) => s.total), 1);

    return { filtrados, totalReais, totalSim, totalCompletos, totalRascunhos, statsPerUser, maxCount };
  }, [diagnosticos, users, dataInicio, dataFim]);

  const roleColor = (role: string) => {
    if (role === "master") return { bg: "rgba(236,19,19,0.1)", color: "#ec1313", border: "rgba(236,19,19,0.2)" };
    if (role === "admin")  return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "rgba(245,158,11,0.2)" };
    return { bg: "rgba(99,102,241,0.1)", color: "#6366f1", border: "rgba(99,102,241,0.2)" };
  };
  const roleLabel = (role: string) => role === "master" ? "Master" : role === "admin" ? "Admin" : "Consultor";

  return (
    <DiagShell showBack title="Relatório de Atividade" subtitle={`${filtrados.length} diagnósticos no período`} icon="bar_chart">

      {/* Filtros de data */}
      <div className="rounded-2xl p-5 mb-6 bg-[#121212] border border-white/[0.06]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Filtrar por período</p>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.days, i)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={presetAtivo === i
                ? { background: "rgba(236,19,19,0.15)", color: "#ec1313", border: "1px solid rgba(236,19,19,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPresetAtivo(null); }}
              className="px-3 py-2 rounded-xl text-sm text-white outline-none bg-white/[0.04] border border-white/[0.08] focus:border-white/[0.2] [color-scheme:dark]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold">Até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPresetAtivo(null); }}
              className="px-3 py-2 rounded-xl text-sm text-white outline-none bg-white/[0.04] border border-white/[0.08] focus:border-white/[0.2] [color-scheme:dark]"
            />
          </div>
          <button
            onClick={() => applyPreset(0, PRESETS.length - 1)}
            className="text-xs text-slate-500 hover:text-white transition-colors underline underline-offset-2"
          >
            Limpar filtro
          </button>
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: "assignment",   label: "Total no período",  value: filtrados.length,  color: "#ec1313"  },
          { icon: "verified",     label: "Diagnósticos reais",value: totalReais,         color: "#10b981"  },
          { icon: "check_circle", label: "Completos",         value: totalCompletos,     color: "#6366f1"  },
          { icon: "edit_note",    label: "Rascunhos",         value: totalRascunhos,     color: "#f59e0b"  },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#121212] rounded-2xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: kpi.color }}>{kpi.icon}</span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{kpi.label}</span>
            </div>
            <p className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela de usuários */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#ec1313" }}>group</span>
          Produção por Consultor
        </h2>

        {statsPerUser.map(({ user: u, total, reais, sims, completos, rascunhos, ultimo, allDiags }) => {
          const rc = roleColor(u.role);
          const pct = total === 0 ? 0 : Math.round((total / maxCount) * 100);
          const isExpanded = expandedUser === u.id;

          return (
            <div key={u.id} className="rounded-2xl bg-[#121212] border border-white/[0.06] overflow-hidden transition-all">
              {/* Header do card */}
              <div
                className="p-4 cursor-pointer select-none"
                onClick={() => setExpandedUser(isExpanded ? null : u.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color }}
                  >
                    {u.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white truncate">{u.nome}</p>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
                      >
                        {roleLabel(u.role)}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${u.status === "ativo" ? "text-emerald-400" : "text-red-400"}`}
                        style={{ background: u.status === "ativo" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }}>
                        {u.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                  </div>

                  {/* Total + chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-extrabold" style={{ color: total > 0 ? "#ec1313" : "#475569" }}>{total}</p>
                      <p className="text-[9px] text-slate-600 uppercase tracking-wider">diagnósticos</p>
                    </div>
                    <span
                      className="material-symbols-outlined text-slate-600 transition-transform"
                      style={{ fontSize: 18, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    >
                      chevron_right
                    </span>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: total > 0
                        ? "linear-gradient(90deg, #ec1313, #b00000)"
                        : "transparent",
                    }}
                  />
                </div>

                {/* Mini stats */}
                {total > 0 && (
                  <div className="flex gap-4 mt-2.5">
                    <span className="text-[10px] text-slate-500">
                      <span className="text-emerald-400 font-bold">{reais.length}</span> reais
                    </span>
                    <span className="text-[10px] text-slate-500">
                      <span className="text-purple-400 font-bold">{sims.length}</span> simulações
                    </span>
                    <span className="text-[10px] text-slate-500">
                      <span className="text-emerald-400 font-bold">{completos.length}</span> completos
                    </span>
                    <span className="text-[10px] text-slate-500">
                      <span className="text-amber-400 font-bold">{rascunhos.length}</span> rascunhos
                    </span>
                    {ultimo && (
                      <span className="text-[10px] text-slate-600 ml-auto">
                        Último: {new Date(ultimo.dataCriacao).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Lista expandida de diagnósticos */}
              {isExpanded && allDiags.length > 0 && (
                <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Diagnósticos no período</p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {[...allDiags]
                      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
                      .map((d) => (
                        <div
                          key={d.id}
                          onClick={() => window.location.href = `/diagnostico/form/index.html?ver=${d.id}`}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="material-symbols-outlined shrink-0"
                              style={{ fontSize: 14, color: d.isSimulacao ? "#8b5cf6" : "#10b981" }}
                            >
                              {d.isSimulacao ? "science" : "verified"}
                            </span>
                            <p className="text-xs text-white truncate">{d.empresa.nome}</p>
                            <span className="text-[9px] text-slate-600 shrink-0">{d.empresa.cidade}/{d.empresa.estado}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{
                                background: d.status === "completo" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                                color: d.status === "completo" ? "#10b981" : "#f59e0b",
                              }}
                            >
                              {d.status === "completo" ? "Completo" : "Rascunho"}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              {new Date(d.dataCriacao).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="material-symbols-outlined text-slate-700" style={{ fontSize: 14 }}>open_in_new</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {isExpanded && allDiags.length === 0 && (
                <div className="border-t border-white/[0.06] px-4 py-5 text-center">
                  <p className="text-xs text-slate-600">Nenhum diagnóstico neste período</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DiagShell>
  );
}
