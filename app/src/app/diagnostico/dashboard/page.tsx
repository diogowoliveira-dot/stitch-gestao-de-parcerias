"use client";
import { useRouter } from "next/navigation";
import DiagShell from "@/components/diagnostico/DiagShell";
import { useDiagAuth, useDiagData } from "@/lib/diagnostico-context";

export default function DiagDashboard() {
  const router = useRouter();
  const { users, isAdmin } = useDiagAuth();
  const { diagnosticos, deleteDiagnostico } = useDiagData();

  const handleDelete = async (e: React.MouseEvent, id: string, nome: string) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja apagar o diagnóstico de "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await fetch("/api/diagnostico/diagnosticos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (deleteDiagnostico) deleteDiagnostico(id);
      else window.location.reload();
    } catch { alert("Erro ao apagar"); }
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
      </div>

      {/* Diagnósticos List */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
          Diagnósticos Realizados
        </h2>

        {diagnosticos.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-[#121212] border border-white/[0.06]">
            <span className="material-symbols-outlined text-slate-700 mb-3 block" style={{ fontSize: 48 }}>assignment</span>
            <p className="text-sm text-slate-500">Nenhum diagnóstico realizado ainda</p>
            <p className="text-xs mt-1 text-slate-500">Clique em &quot;Novo Diagnóstico&quot; para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {diagnosticos.map((diag) => {
              const criador = users.find((u) => u.id === diag.criadoPor);
              return (
                <div
                  key={diag.id}
                  className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06] transition-all hover:border-white/[0.15] cursor-pointer group"
                  onClick={() => window.location.href = `/diagnostico/form/index.html?ver=${diag.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white truncate">{diag.empresa.nome}</h3>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: diag.status === "completo" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                            color: diag.status === "completo" ? "#10b981" : "#f59e0b",
                            border: `1px solid ${diag.status === "completo" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`,
                          }}
                        >
                          {diag.status === "completo" ? "Completo" : "Rascunho"}
                        </span>
                        {diag.isSimulacao && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                            Simulação
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {diag.empresa.cidade}/{diag.empresa.estado} &middot; {diag.cargos.filter((c) => c.existe).length} cargos &middot; {diag.problemasIdentificados.length} problemas
                      </p>
                      <p className="text-[10px] mt-1 text-slate-600">
                        {criador?.nome || "—"} &middot; {new Date(diag.dataCriacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/diagnostico/form/index.html?editar=${diag.id}`; }}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-slate-500 hover:text-blue-400" style={{ fontSize: 16 }}>edit</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, diag.id, diag.empresa.nome)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Apagar"
                          >
                            <span className="material-symbols-outlined text-slate-500 hover:text-red-400" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </>
                      )}
                      <span className="material-symbols-outlined text-slate-700" style={{ fontSize: 18 }}>chevron_right</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DiagShell>
  );
}
