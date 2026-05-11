"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DiagShell from "@/components/diagnostico/DiagShell";
import { useDiagAuth, useDiagData } from "@/lib/diagnostico-context";

export default function DiagDashboard() {
  const router = useRouter();
  const { users, isAdmin, isMaster, user } = useDiagAuth();
  const { diagnosticos, deleteDiagnostico } = useDiagData();
  const [search, setSearch] = useState("");
  // ID do embaixador vinculado ao usuário atual (para consultores)
  const [myEmbaixadorId, setMyEmbaixadorId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || isAdmin) return; // admin já tem botão da lista completa
    const controller = new AbortController()
    fetch('/api/diagnostico/embaixadores', { signal: controller.signal })
      .then(r => r.ok ? r.json() : [])
      .then((data: Array<{ id: string; userId: string | null }>) => {
        const mine = data.find(e => e.userId === user.id);
        if (mine) setMyEmbaixadorId(mine.id);
      })
      .catch(err => { if (err.name !== 'AbortError') console.warn('embaixador fetch failed', err) });
    return () => controller.abort()
  }, [user?.id, isAdmin]);

  const handleDelete = async (e: React.MouseEvent, id: string, nome: string) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja apagar o diagnóstico de "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDiagnostico(id, user?.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao apagar";
      alert(msg);
    }
  };

  const totalDiagnosticos = diagnosticos.length;
  const completos = diagnosticos.filter((d) => d.status === "completo").length;
  const rascunhos = diagnosticos.filter((d) => d.status === "rascunho").length;
  const totalUsuarios = users.filter((u) => u.status === "ativo").length;

  return (
    <DiagShell title="Diagnóstico Comercial" subtitle="Painel de Controle" icon="space_dashboard">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: "assignment", label: "Diagnósticos", value: totalDiagnosticos, color: "#ec1313" },
          { icon: "check_circle", label: "Completos", value: completos, color: "#ec1313" },
          { icon: "edit_note", label: "Rascunhos", value: rascunhos, color: "#f59e0b" },
          { icon: "group", label: "Usuários Ativos", value: totalUsuarios, color: "#8b5cf6" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: kpi.color }}>{kpi.icon}</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{kpi.label}</span>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => window.location.href = "/diagnostico/form/index.html"}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #ec1313 0%, #d41111 100%)", boxShadow: "0 4px 16px rgba(236, 19, 19, 0.3)" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          Novo Diagnóstico
        </button>
        <button
          onClick={() => window.location.href = "/diagnostico/form/index.html?simulacao=true"}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 transition-all hover:bg-white/5 border border-white/[0.06]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>science</span>
          Simulação (dados não reais)
        </button>
        <button
          onClick={() => window.location.href = "/diagnostico/form/index.html?tutorial=true"}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 transition-all hover:bg-white/5 border border-white/[0.06]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>help</span>
          Tutorial
        </button>
        {isMaster && (
          <button
            onClick={() => router.push("/diagnostico/relatorio")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 transition-all hover:bg-white/5 border border-white/[0.06]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>bar_chart</span>
            Relatório de Atividade
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => router.push("/diagnostico/embaixadores")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 transition-all hover:bg-white/5 border border-white/[0.06]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>map</span>
            Embaixadores
          </button>
        )}
        {!isAdmin && myEmbaixadorId && (
          <button
            onClick={() => router.push(`/diagnostico/embaixadores/${myEmbaixadorId}`)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-400 transition-all hover:bg-white/5 border border-white/[0.06]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>leaderboard</span>
            Meu Painel
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500" style={{ fontSize: 20 }}>search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar construtora, cidade, estado ou consultor..."
          className="w-full pl-11 pr-10 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all bg-[#121212] border border-white/[0.06] focus:border-white/[0.2]"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      {/* Diagnósticos List — duas colunas */}
      {(() => {
        const q = search.toLowerCase().trim();
        const match = (d: typeof diagnosticos[0]) => {
          if (!q) return true;
          const criador = users.find((u) => u.id === d.criadoPor)?.nome ?? "";
          return (
            d.empresa.nome.toLowerCase().includes(q) ||
            (d.empresa.cidade ?? "").toLowerCase().includes(q) ||
            (d.empresa.estado ?? "").toLowerCase().includes(q) ||
            criador.toLowerCase().includes(q)
          );
        };
        const reais = diagnosticos.filter((d) => !d.isSimulacao && match(d));
        const simulacoes = diagnosticos.filter((d) => d.isSimulacao && match(d));

        const renderCard = (diag: typeof diagnosticos[0]) => {
          const criador = users.find((u) => u.id === diag.criadoPor);
          const versao = diag.versao ?? 1;
          const isLatest = diag.isLatestVersion !== false;
          return (
            <div
              key={diag.id}
              className={`rounded-2xl p-4 bg-[#121212] border transition-all cursor-pointer group ${
                isLatest
                  ? "border-white/[0.06] hover:border-white/[0.15]"
                  : "border-white/[0.03] opacity-55 hover:opacity-75 hover:border-white/[0.10]"
              }`}
              onClick={() => window.location.href = `/diagnostico/form/index.html?ver=${diag.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <h3 className="text-sm font-bold text-white truncate">{diag.empresa.nome}</h3>
                    {/* Version badge */}
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                      style={{
                        background: isLatest ? "rgba(236, 19, 19, 0.15)" : "rgba(100, 116, 139, 0.15)",
                        color: isLatest ? "#ec1313" : "#64748b",
                        border: `1px solid ${isLatest ? "rgba(236, 19, 19, 0.25)" : "rgba(100, 116, 139, 0.2)"}`,
                      }}
                    >
                      V{versao}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: diag.status === "completo" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: diag.status === "completo" ? "#10b981" : "#f59e0b",
                        border: `1px solid ${diag.status === "completo" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                      }}
                    >
                      {diag.status === "completo" ? "Completo" : "Rascunho"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {diag.empresa.cidade}/{diag.empresa.estado} &middot; {diag.cargos.filter((c) => c.existe).length} cargos &middot; {diag.problemasIdentificados.length} problemas
                  </p>
                  <p className="text-[10px] mt-1 text-slate-600">
                    {criador?.nome || "—"} &middot; {new Date(diag.dataCriacao).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {/* Nova Versão — admin/master, somente na versão mais recente e completa */}
                  {isAdmin && isLatest && diag.status === "completo" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/diagnostico/novo?versaoDe=${diag.id}`); }}
                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                      title="Criar nova versão deste diagnóstico"
                    >
                      <span className="material-symbols-outlined text-slate-500 hover:text-emerald-400" style={{ fontSize: 16 }}>add_circle</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.location.href = `/diagnostico/form/index.html?editar=${diag.id}`; }}
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-slate-500 hover:text-blue-400" style={{ fontSize: 16 }}>edit</span>
                    </button>
                  )}
                  {(diag.isSimulacao || isMaster) && (
                    <button
                      onClick={(e) => handleDelete(e, diag.id, diag.empresa.nome)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Apagar"
                    >
                      <span className="material-symbols-outlined text-slate-500 hover:text-red-400" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  )}
                  <span className="material-symbols-outlined text-slate-700" style={{ fontSize: 18 }}>chevron_right</span>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Coluna Reais */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#10b981" }}>verified</span>
                Diagnósticos Reais ({reais.length}{q ? ` de ${diagnosticos.filter(d => !d.isSimulacao).length}` : ""})
              </h2>
              {reais.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-[#121212] border border-white/[0.06]">
                  <span className="material-symbols-outlined text-slate-700 mb-2 block" style={{ fontSize: 36 }}>{q ? "search_off" : "assignment"}</span>
                  <p className="text-xs text-slate-500">{q ? `Nenhum resultado para "${search}"` : "Nenhum diagnóstico real ainda"}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {reais.map(renderCard)}
                </div>
              )}
            </div>

            {/* Coluna Simulações */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#8b5cf6" }}>science</span>
                Simulações ({simulacoes.length}{q ? ` de ${diagnosticos.filter(d => d.isSimulacao).length}` : ""})
              </h2>
              {simulacoes.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-[#121212] border border-white/[0.06]">
                  <span className="material-symbols-outlined text-slate-700 mb-2 block" style={{ fontSize: 36 }}>{q ? "search_off" : "science"}</span>
                  <p className="text-xs text-slate-500">{q ? `Nenhum resultado para "${search}"` : "Nenhuma simulação ainda"}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {simulacoes.map(renderCard)}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </DiagShell>
  );
}
