"use client";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";

const AnalyticsTab = lazy(() => import("@/components/analytics/AnalyticsTab"));

interface PhaseDetail {
  id: string;
  name: string;
  count: number;
}

interface StageData {
  key: string;
  label: string;
  color: string;
  count: number;
  phases: PhaseDetail[];
}

interface Assignee {
  name: string;
  count: number;
}

interface Movement {
  id: string;
  title: string;
  current_phase: { id: string; name: string };
  assignees: { name: string }[];
  updated_at: string;
  created_at: string;
}

interface ConversionRates {
  leadToContact: string;
  contactToNegotiation: string;
  negotiationToClose: string;
  overallConversion: string;
}

interface PipefyData {
  pipeName: string;
  totalCards: number;
  stageData: StageData[];
  conversionRates: ConversionRates;
  topAssignees: Assignee[];
  phaseDetails: PhaseDetail[];
  todayMovements: Movement[];
  timestamp: string;
}

function KPICard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color }}
        >
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          {label}
        </span>
      </div>
      <p className="text-3xl font-extrabold" style={{ color }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-slate-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function ConversionMetric({
  from,
  to,
  rate,
  color,
}: {
  from: string;
  to: string;
  rate: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 truncate">{from}</span>
          <span
            className="material-symbols-outlined text-slate-600"
            style={{ fontSize: 16 }}
          >
            arrow_forward
          </span>
          <span className="text-white font-medium truncate">{to}</span>
        </div>
      </div>
      <span className="text-lg font-bold" style={{ color }}>
        {rate}%
      </span>
    </div>
  );
}

export default function CRMDashboard() {
  const [activeTab, setActiveTab] = useState<"funil" | "analytics">("funil");
  const [data, setData] = useState<PipefyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/pipefy");
      if (!res.ok) throw new Error("Falha ao carregar dados");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendReport = async () => {
    try {
      setSendingReport(true);
      const res = await fetch("/api/pipefy/email-report", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao gerar relatório");
      setReportSent(true);
      setTimeout(() => setReportSent(false), 5000);
    } catch {
      setError("Falha ao enviar relatório");
    } finally {
      setSendingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#ec1313]/10 border border-[#ec1313]/20 flex items-center justify-center animate-pulse">
          <span
            className="material-symbols-outlined text-[#ec1313]"
            style={{ fontSize: 24 }}
          >
            monitoring
          </span>
        </div>
        <p className="text-slate-500 text-sm">Carregando dados do Pipefy...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-red-400"
            style={{ fontSize: 24 }}
          >
            error
          </span>
        </div>
        <p className="text-red-400 text-sm text-center">{error}</p>
        <button
          onClick={fetchData}
          className="px-6 py-2 bg-[#ec1313] rounded-xl text-white text-sm font-bold"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxStageCount = Math.max(...data.stageData.map((s) => s.count), 1);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between px-5 py-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ec1313]/10 border border-[#ec1313]/20 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[#ec1313]"
                style={{ fontSize: 20 }}
              >
                monitoring
              </span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">CRM Dashboard</h1>
              <p className="text-[11px] text-slate-500">
                {data.pipeName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={sendReport}
              disabled={sendingReport}
              className={`p-2 rounded-lg transition-all ${
                reportSent
                  ? "text-green-400 bg-green-500/10"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              }`}
              title="Enviar relatório por email"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                {reportSent ? "check_circle" : sendingReport ? "hourglass_empty" : "mail"}
              </span>
            </button>
            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="Atualizar dados"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                refresh
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="sticky top-[57px] z-40 bg-black/90 backdrop-blur-xl border-b border-white/[0.06] px-5 py-2">
        <div className="max-w-2xl mx-auto flex gap-1 bg-[#121212] rounded-xl p-1">
          <button
            onClick={() => setActiveTab("funil")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "funil" ? "bg-[#ec1313] text-white" : "text-slate-500 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_alt</span>
            Funil
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "analytics" ? "bg-[#ec1313] text-white" : "text-slate-500 hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>analytics</span>
            Analytics
          </button>
        </div>
      </div>

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <main className="max-w-2xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-slate-500 text-sm">Carregando analytics...</div>
            </div>
          }>
            <AnalyticsTab />
          </Suspense>
        </main>
      )}

      {/* Funil Tab */}
      {activeTab === "funil" && (
      <main className="max-w-2xl mx-auto px-5 py-6 pb-20 space-y-6">
        {/* Status bar */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        {reportSent && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm text-center">
            Relatório gerado com sucesso!
          </div>
        )}

        {/* Last update */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
          <span className="text-[10px] text-slate-600 uppercase tracking-widest">
            Atualizado:{" "}
            {new Date(data.timestamp).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            icon="database"
            label="Total Cards"
            value={data.totalCards.toLocaleString("pt-BR")}
            color="#ffffff"
            subtitle="no funil"
          />
          <KPICard
            icon="trending_up"
            label="Movimentos Hoje"
            value={data.todayMovements.length}
            color="#ec1313"
            subtitle="atualizações"
          />
          <KPICard
            icon="target"
            label="Taxa Conversão"
            value={`${data.conversionRates.overallConversion}%`}
            color="#10b981"
            subtitle="lead → fechamento"
          />
          <KPICard
            icon="groups"
            label="Fases Ativas"
            value={data.phaseDetails.filter((p) => p.count > 0).length}
            color="#6366f1"
            subtitle={`de ${data.phaseDetails.length} fases`}
          />
        </div>

        {/* Funnel */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-[#ec1313]"
              style={{ fontSize: 20 }}
            >
              filter_alt
            </span>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Funil de Vendas
            </h2>
          </div>

          <div className="space-y-2">
            {data.stageData.map((stage) => {
              const widthPercent = Math.max(
                (stage.count / maxStageCount) * 100,
                8
              );
              const isExpanded = expandedStage === stage.key;

              return (
                <div key={stage.key}>
                  <button
                    onClick={() =>
                      setExpandedStage(isExpanded ? null : stage.key)
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 font-medium">
                        {stage.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: stage.color }}
                        >
                          {stage.count}
                        </span>
                        <span
                          className="material-symbols-outlined text-slate-600 transition-transform"
                          style={{
                            fontSize: 16,
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          expand_more
                        </span>
                      </div>
                    </div>
                    <div className="h-8 bg-white/[0.03] rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: `${stage.color}20`,
                          borderLeft: `3px solid ${stage.color}`,
                        }}
                      >
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: stage.color }}
                        >
                          {((stage.count / data.totalCards) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && stage.phases.length > 0 && (
                    <div className="mt-2 ml-3 space-y-1 pb-2">
                      {stage.phases.map((phase) => (
                        <div
                          key={phase.id}
                          className="flex items-center justify-between py-2 px-3 bg-white/[0.02] rounded-lg"
                        >
                          <span className="text-xs text-slate-400 truncate mr-2">
                            {phase.name}
                          </span>
                          <span className="text-xs font-bold text-white whitespace-nowrap">
                            {phase.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-[#10b981]"
              style={{ fontSize: 20 }}
            >
              conversion_path
            </span>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Taxas de Conversão
            </h2>
          </div>
          <ConversionMetric
            from="Lead"
            to="Contato"
            rate={data.conversionRates.leadToContact}
            color="#8b5cf6"
          />
          <ConversionMetric
            from="Contato"
            to="Negociação"
            rate={data.conversionRates.contactToNegotiation}
            color="#3b82f6"
          />
          <ConversionMetric
            from="Negociação"
            to="Fechamento"
            rate={data.conversionRates.negotiationToClose}
            color="#10b981"
          />
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-slate-400">Conversão Geral</span>
            <span className="text-xl font-extrabold text-[#ec1313]">
              {data.conversionRates.overallConversion}%
            </span>
          </div>
        </div>

        {/* Top Assignees */}
        {data.topAssignees.length > 0 && (
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined text-[#f59e0b]"
                style={{ fontSize: 20 }}
              >
                leaderboard
              </span>
              <h2 className="text-sm font-bold uppercase tracking-widest">
                Ranking de Responsáveis
              </h2>
            </div>
            <div className="space-y-2">
              {data.topAssignees.map((assignee, index) => {
                const maxCount = data.topAssignees[0].count;
                const barWidth = (assignee.count / maxCount) * 100;
                return (
                  <div key={assignee.name} className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold w-5 text-right ${
                        index === 0
                          ? "text-[#f59e0b]"
                          : index === 1
                          ? "text-slate-300"
                          : index === 2
                          ? "text-amber-700"
                          : "text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300 truncate">
                          {assignee.name}
                        </span>
                        <span className="text-xs font-bold text-white ml-2">
                          {assignee.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor:
                              index === 0
                                ? "#f59e0b"
                                : index === 1
                                ? "#94a3b8"
                                : index === 2
                                ? "#b45309"
                                : "#374151",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase Details */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-[#6366f1]"
              style={{ fontSize: 20 }}
            >
              view_list
            </span>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Todas as Fases
            </h2>
          </div>
          <div className="space-y-1">
            {data.phaseDetails
              .filter((p) => p.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((phase) => (
                <div
                  key={phase.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-xs text-slate-400 truncate mr-3">
                    {phase.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-white">
                      {phase.count}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      ({((phase.count / data.totalCards) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Today's Movements */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-[#ec1313]"
              style={{ fontSize: 20 }}
            >
              swap_horiz
            </span>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Movimentações de Hoje
            </h2>
            <span className="ml-auto text-xs font-bold text-[#ec1313] bg-[#ec1313]/10 px-2 py-0.5 rounded-full">
              {data.todayMovements.length}
            </span>
          </div>

          {data.todayMovements.length === 0 ? (
            <div className="text-center py-8">
              <span
                className="material-symbols-outlined text-slate-700"
                style={{ fontSize: 32 }}
              >
                hourglass_empty
              </span>
              <p className="text-xs text-slate-600 mt-2">
                Nenhuma movimentação registrada hoje
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.todayMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="p-3 bg-white/[0.02] rounded-xl border-l-2 border-[#ec1313]"
                >
                  <p className="text-sm font-medium text-white mb-1.5 truncate">
                    {movement.title}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 12 }}
                      >
                        location_on
                      </span>
                      {movement.current_phase.name}
                    </span>
                    {movement.assignees.length > 0 && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 12 }}
                        >
                          person
                        </span>
                        {movement.assignees.map((a) => a.name).join(", ")}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-600 flex items-center gap-1">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 12 }}
                      >
                        schedule
                      </span>
                      {new Date(movement.updated_at).toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-[10px] text-slate-700 uppercase tracking-widest">
            CRM Dashboard DWV &middot; Pipefy Analytics
          </p>
        </div>
      </main>
      )}
    </div>
  );
}
