"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { AnalyticsData } from "@/types/pipefy";
import PeriodSelector from "./PeriodSelector";
import TimelineChart from "./TimelineChart";
import MonthlySellerTable from "./MonthlySellerTable";
import ProspectingSection from "./ProspectingSection";

/* ── helpers ── */

function getLastMonthRange(): { from: string; to: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    from: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    to: `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function getCurrentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    from: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    to: `${year}-${String(month + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  };
}

function getMonthRange(monthKey: string): { from: string; to: string } {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}

function formatPeriodLabel(preset: string, from: string, to: string): string {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  if (preset === "last-month") {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (preset === "current-month") {
    const now = new Date();
    return `${monthNames[now.getMonth()]} ${now.getFullYear()} (parcial)`;
  }
  if (preset === "all") return "Todos os dados";
  if (preset === "custom") {
    const fmtDate = (s: string) => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
    return `${fmtDate(from)} - ${fmtDate(to)}`;
  }
  // Month key like "2026-02"
  const [year, month] = preset.split("-").map(Number);
  if (year && month) return `${monthNames[month - 1]} ${year}`;
  return "Período selecionado";
}

/* ── sub-components ── */

function SectionHeader({ icon, title, color, badge }: { icon: string; title: string; color: string; badge?: string | number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>{icon}</span>
      <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
      {badge !== undefined && (
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}15` }}>{badge}</span>
      )}
    </div>
  );
}

function HBar({ label, value, maxValue, color, suffix, extra }: { label: string; value: number; maxValue: number; color: string; suffix?: string; extra?: string }) {
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 4;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-slate-400 w-32 truncate shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-500 flex items-center px-2" style={{ width: `${width}%`, backgroundColor: `${color}30`, borderLeft: `2px solid ${color}` }}>
          <span className="text-[10px] font-bold" style={{ color }}>{value}{suffix}</span>
        </div>
      </div>
      {extra && <span className="text-[10px] text-slate-600 w-14 text-right shrink-0">{extra}</span>}
    </div>
  );
}

function DonutChart({ data, size = 120 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashLen = pct * circumference;
          const currentOffset = offset;
          offset += dashLen;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={12}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={0.8}
            />
          );
        })}
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="16" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-[11px] text-slate-400">{d.label}</span>
            <span className="text-[11px] font-bold text-white ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricBox({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-4 flex-1 min-w-[100px]">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── main component ── */

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedReason, setExpandedReason] = useState<string | null>(null);

  // Period state
  const [selectedPreset, setSelectedPreset] = useState("last-month");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(getLastMonthRange());
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const activeLabel = useMemo(
    () => formatPeriodLabel(selectedPreset, dateRange.from, dateRange.to),
    [selectedPreset, dateRange]
  );

  const activeMonthKey = useMemo(() => {
    // Extract month key from dateRange if it's a single month
    if (dateRange.from && dateRange.to) {
      const fromMonth = dateRange.from.slice(0, 7);
      const toMonth = dateRange.to.slice(0, 7);
      if (fromMonth === toMonth) return fromMonth;
    }
    return undefined;
  }, [dateRange]);

  const fetchAnalytics = useCallback(async (from?: string, to?: string) => {
    try {
      setLoading(true);
      setError("");
      let url = "/api/pipefy/analytics";
      if (from && to) {
        url += `?from=${from}&to=${to}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Falha ao carregar analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with last month
  useEffect(() => {
    const range = getLastMonthRange();
    fetchAnalytics(range.from, range.to);
  }, [fetchAnalytics]);

  const handlePresetChange = useCallback((preset: string) => {
    setSelectedPreset(preset);
    let range: { from: string; to: string };

    if (preset === "last-month") {
      range = getLastMonthRange();
    } else if (preset === "current-month") {
      range = getCurrentMonthRange();
    } else if (preset === "all") {
      setDateRange({ from: "", to: "" });
      fetchAnalytics();
      return;
    } else if (preset === "custom") {
      // Don't fetch yet, wait for dates
      return;
    } else {
      // Month key like "2026-02"
      range = getMonthRange(preset);
    }

    setDateRange(range);
    fetchAnalytics(range.from, range.to);
  }, [fetchAnalytics]);

  const handleCustomChange = useCallback((from: string, to: string) => {
    setCustomFrom(from);
    setCustomTo(to);
    if (from && to && from <= to) {
      setDateRange({ from, to });
      fetchAnalytics(from, to);
    }
  }, [fetchAnalytics]);

  const handleTimelineMonthClick = useCallback((monthKey: string, from: string, to: string) => {
    setSelectedPreset(monthKey);
    setDateRange({ from, to });
    fetchAnalytics(from, to);
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="space-y-4 px-5 py-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06] animate-pulse">
            <div className="h-4 bg-white/5 rounded w-40 mb-4" />
            <div className="h-8 bg-white/5 rounded w-24 mb-3" />
            <div className="space-y-2">
              <div className="h-5 bg-white/3 rounded" />
              <div className="h-5 bg-white/3 rounded w-3/4" />
              <div className="h-5 bg-white/3 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="px-5 py-10 text-center">
        <span className="material-symbols-outlined text-red-400" style={{ fontSize: 32 }}>error</span>
        <p className="text-red-400 text-sm mt-2">{error || "Erro ao carregar dados"}</p>
        <button onClick={() => fetchAnalytics(dateRange.from, dateRange.to)} className="mt-3 px-5 py-2 bg-[#ec1313] rounded-xl text-white text-sm font-bold">Tentar novamente</button>
      </div>
    );
  }

  if (!data) return null;

  const { timeMetrics, geographic, plans, sellerPerformance, lossAnalysis, modality, leadSource, contractStatus, timeline, monthlySellerPerformance, prospecting } = data;
  const maxPhaseDays = Math.max(...(timeMetrics.phaseAverageDays.map((p) => p.avgDays) || [1]), 1);
  const maxLossPhase = Math.max(...(lossAnalysis.lossByPhase.map((p) => p.count) || [1]), 1);
  const maxReasonCount = Math.max(...(lossAnalysis.lossReasons.map((r) => r.count) || [1]), 1);
  const maxGeoTotal = Math.max(...(geographic.map((g) => g.total) || [1]), 1);
  const maxSellerClosed = Math.max(...(sellerPerformance.map((s) => s.closedCards) || [1]), 1);

  return (
    <div className="space-y-6 px-5 py-6 pb-20">
      {/* Last update + loading indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-[#ec1313] animate-pulse" : "bg-blue-500 animate-pulse-dot"}`} />
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">
          {loading ? "Atualizando..." : `Analytics: ${new Date(data.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>

      {/* Period Selector */}
      <PeriodSelector
        selectedPreset={selectedPreset}
        onPresetChange={handlePresetChange}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={handleCustomChange}
        activeLabel={activeLabel}
      />

      {/* Timeline Chart - always shows 12 months */}
      {timeline && timeline.length > 0 && (
        <TimelineChart
          data={timeline}
          activeMonthKey={activeMonthKey}
          onMonthClick={handleTimelineMonthClick}
        />
      )}

      {/* Monthly Seller Performance */}
      {monthlySellerPerformance && monthlySellerPerformance.length > 0 && (
        <MonthlySellerTable
          data={monthlySellerPerformance}
          activeMonthKey={activeMonthKey}
        />
      )}

      {/* Prospecting */}
      {prospecting && prospecting.length > 0 && (
        <ProspectingSection data={prospecting} />
      )}

      {/* 1. Tempo Médio de Conversão */}
      <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
        <SectionHeader icon="schedule" title="Tempo de Conversão" color="#3b82f6" />
        <div className="flex gap-3 mb-5">
          <MetricBox label="Tempo Médio" value={`${timeMetrics.averageConversionDays}d`} color="#3b82f6" sub="lead → fechamento" />
          <MetricBox label="Mediana" value={`${timeMetrics.medianConversionDays}d`} color="#8b5cf6" sub="metade fecha em" />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Tempo Médio por Fase (dias)</p>
        {timeMetrics.phaseAverageDays.slice(0, 10).map((p) => (
          <HBar key={p.phaseName} label={p.phaseName} value={Math.round(p.avgDays * 10) / 10} maxValue={maxPhaseDays} color={p.avgDays > timeMetrics.averageConversionDays / 3 ? "#ef4444" : "#3b82f6"} suffix="d" extra={`${p.cardCount} cards`} />
        ))}
      </div>

      {/* 2. Análise de Perdas + Ranking de Motivos */}
      <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
        <SectionHeader icon="trending_down" title="Análise de Perdas" color="#ef4444" badge={lossAnalysis.totalLost} />
        <div className="flex gap-3 mb-5">
          <MetricBox label="Ganhos" value={lossAnalysis.totalWon} color="#10b981" sub="deals fechados" />
          <MetricBox label="Perdidos" value={lossAnalysis.totalLost} color="#ef4444" sub="total perdas" />
          <MetricBox label="Win/Loss" value={lossAnalysis.winLossRatio} color="#f59e0b" sub="proporção" />
        </div>

        {/* Loss type breakdown */}
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Tipo de Perda</p>
        <DonutChart data={lossAnalysis.lossTypes.filter((t) => t.count > 0).map((t) => ({ label: t.type, value: t.count, color: t.color }))} />

        {/* Loss reasons ranking */}
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 mt-5">Ranking de Motivos</p>
        {lossAnalysis.lossReasons.slice(0, 10).map((r) => (
          <div key={r.reason}>
            <button onClick={() => setExpandedReason(expandedReason === r.reason ? null : r.reason)} className="w-full">
              <HBar label={r.reason} value={r.count} maxValue={maxReasonCount} color="#ef4444" extra={`${lossAnalysis.totalLost > 0 ? ((r.count / lossAnalysis.totalLost) * 100).toFixed(0) : 0}%`} />
            </button>
            {expandedReason === r.reason && r.companies.length > 0 && (
              <div className="ml-36 mb-2 space-y-1">
                {r.companies.map((c, i) => (
                  <p key={i} className="text-[11px] text-slate-500 truncate">• {c}</p>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Drop-off phase */}
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 mt-5">Fase de Abandono</p>
        {lossAnalysis.lossByPhase.slice(0, 8).map((p) => (
          <HBar key={p.fromPhase} label={p.fromPhase} value={p.count} maxValue={maxLossPhase} color="#f97316" />
        ))}
      </div>

      {/* 3. Performance por Vendedor */}
      <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
        <SectionHeader icon="groups" title="Performance Vendedores" color="#f59e0b" badge={sellerPerformance.length} />
        <div className="space-y-3">
          {sellerPerformance.slice(0, 10).map((seller, i) => (
            <div key={seller.name} className="p-3 bg-white/[0.02] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold w-5 text-right ${i === 0 ? "text-[#f59e0b]" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-slate-600"}`}>{i + 1}</span>
                <span className="text-sm font-medium text-white truncate flex-1">{seller.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 ml-7">
                <div>
                  <p className="text-[9px] text-slate-600 uppercase">Total</p>
                  <p className="text-xs font-bold text-white">{seller.totalCards}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase">Fechados</p>
                  <p className="text-xs font-bold text-[#10b981]">{seller.closedCards}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase">Conv.</p>
                  <p className="text-xs font-bold text-[#3b82f6]">{seller.conversionRate}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase">Tempo</p>
                  <p className="text-xs font-bold text-[#8b5cf6]">{seller.avgDealDays}d</p>
                </div>
              </div>
              <div className="ml-7 mt-2 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(seller.closedCards / maxSellerClosed) * 100}%`, backgroundColor: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#374151" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Distribuição Geográfica */}
      {geographic.length > 0 && (
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <SectionHeader icon="map" title="Distribuição Geográfica" color="#8b5cf6" badge={geographic.length} />
          {geographic.map((g) => (
            <div key={g.state} className="flex items-center gap-3 py-2">
              <span className="text-xs text-slate-400 w-28 truncate shrink-0">{g.state}</span>
              <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
                <div className="h-full rounded transition-all duration-500 flex items-center px-2" style={{ width: `${Math.max((g.total / maxGeoTotal) * 100, 8)}%`, backgroundColor: "#8b5cf620", borderLeft: "2px solid #8b5cf6" }}>
                  <span className="text-[10px] font-bold text-[#8b5cf6]">{g.total}</span>
                </div>
              </div>
              <div className="text-right shrink-0 w-20">
                <span className="text-[10px] text-[#10b981] font-bold">{g.closed}</span>
                <span className="text-[10px] text-slate-600"> ({g.conversionRate}%)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Análise de Planos */}
      {plans.length > 0 && (
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <SectionHeader icon="workspace_premium" title="Análise de Planos" color="#06b6d4" />
          <DonutChart data={plans.map((p, i) => ({ label: p.plan, value: p.closedCount, color: ["#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"][i] || "#6b7280" }))} />
          <div className="mt-4 space-y-2">
            {plans.map((p) => (
              <div key={p.plan} className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg">
                <span className="text-xs text-slate-300">{p.plan}</span>
                <div className="flex gap-4">
                  <span className="text-[10px] text-slate-500">{p.closedCount} fechados</span>
                  <span className="text-xs font-bold text-[#10b981]">R$ {p.avgAdhesion.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-white/[0.06] flex justify-between">
              <span className="text-xs text-slate-400">Receita Total Adesão</span>
              <span className="text-sm font-extrabold text-[#10b981]">R$ {plans.reduce((s, p) => s + p.totalAdhesion, 0).toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Origem dos Leads */}
      {leadSource.length > 0 && (
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <SectionHeader icon="route" title="Origem dos Leads" color="#f97316" />
          <div className="flex gap-3">
            {leadSource.map((s) => (
              <div key={s.source} className="flex-1 bg-white/[0.02] rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-2">{s.source}</p>
                <p className="text-2xl font-extrabold text-white">{s.total}</p>
                <div className="flex justify-center gap-3 mt-2">
                  <span className="text-[10px] text-[#10b981] font-bold">{s.closed} fechados</span>
                  <span className="text-[10px] text-[#3b82f6] font-bold">{s.conversionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Modalidade */}
      {modality.length > 0 && (
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <SectionHeader icon="apartment" title="Modalidade das Empresas" color="#14b8a6" />
          {modality.map((m) => (
            <div key={m.type} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02]">
              <span className="text-xs text-slate-400 truncate mr-3">{m.type}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-white">{m.total}</span>
                <span className="text-[10px] text-[#10b981]">{m.closed} fech.</span>
                <span className="text-[10px] text-slate-600">({m.conversionRate}%)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 8. Status Contratos */}
      {contractStatus.length > 0 && (
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <SectionHeader icon="description" title="Status de Contratos" color="#6366f1" />
          <div className="space-y-2">
            {contractStatus.map((s, i) => {
              const colors = ["#6366f1", "#3b82f6", "#f59e0b", "#10b981", "#ef4444"];
              return (
                <div key={s.status} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
                  <div className="w-2 h-8 rounded-full" style={{ backgroundColor: colors[i] || "#6b7280" }} />
                  <span className="text-xs text-slate-300 flex-1">{s.status}</span>
                  <span className="text-sm font-bold text-white">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4 pb-8">
        <p className="text-[10px] text-slate-700 uppercase tracking-widest">CRM Analytics DWV &middot; Dados do Pipefy</p>
      </div>
    </div>
  );
}
