"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { COMISSAO_POR_INDICACAO } from "@/lib/mock-data";

export default function DashboardPage() {
  const router = useRouter();
  const { isAdmin, vendedor, user } = useAuth();
  const { getStatsGeral, getStatsVendedor, vendedores, parceiros, indicacoes, getParceirosDoVendedor, getIndicacoesDoVendedor } = useData();

  const stats = isAdmin ? getStatsGeral() : vendedor ? getStatsVendedor(vendedor.id) : null;

  // Recent indicações for the current user
  const recentIndicacoes = isAdmin
    ? indicacoes.slice().sort((a, b) => b.dataIndicacao.localeCompare(a.dataIndicacao)).slice(0, 5)
    : vendedor
    ? getIndicacoesDoVendedor(vendedor.id).sort((a, b) => b.dataIndicacao.localeCompare(a.dataIndicacao)).slice(0, 5)
    : [];

  // Get parceiro name by ID
  const getParceiroNome = (parceiroId: string) =>
    parceiros.find((p) => p.id === parceiroId)?.nome || "—";

  // Vendedor ranking (admin only)
  const vendedorRanking = isAdmin
    ? vendedores
        .filter((v) => v.status === "ativo")
        .map((v) => {
          const s = getStatsVendedor(v.id);
          return { ...v, ...s };
        })
        .sort((a, b) => b.fechadas - a.fechadas)
    : [];

  if (!stats) return null;

  return (
    <AppShell
      title={isAdmin ? "Painel Administrativo" : `Olá, ${user?.nome?.split(" ")[0]}`}
      subtitle={isAdmin ? "Visão geral do sistema" : "Seu painel de vendedor"}
      icon={isAdmin ? "admin_panel_settings" : "dashboard"}
    >
      {/* KPI Cards */}
      <section className="px-5 pt-6 grid grid-cols-2 gap-3">
        <div className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#ec1313]" style={{ fontSize: 18 }}>handshake</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Parceiros</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalParceiros}</p>
        </div>
        <div className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-amber-400" style={{ fontSize: 18 }}>assignment</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Indicações</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalIndicacoes}</p>
        </div>
        <div className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 18 }}>check_circle</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Fechadas</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats.fechadas}</p>
        </div>
        <div className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 18 }}>payments</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Comissões</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            R$ {stats.comissaoTotal.toLocaleString("pt-BR")}
          </p>
        </div>
      </section>

      {/* Status breakdown */}
      <section className="px-5 pt-4">
        <div className="bg-[#121212] rounded-xl p-5 border border-white/[0.06]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Status das Indicações
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/indicacoes?status=em_negociacao")}
              className="flex-1 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 text-center hover:border-amber-500/30 transition-all"
            >
              <p className="text-2xl font-bold text-amber-400">{stats.emNegociacao}</p>
              <p className="text-[10px] text-amber-400/70 font-semibold mt-1">Em Negociação</p>
            </button>
            <button
              onClick={() => router.push("/indicacoes?status=fechada")}
              className="flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-center hover:border-emerald-500/30 transition-all"
            >
              <p className="text-2xl font-bold text-emerald-400">{stats.fechadas}</p>
              <p className="text-[10px] text-emerald-400/70 font-semibold mt-1">Fechadas</p>
            </button>
            <button
              onClick={() => router.push("/indicacoes?status=recusada")}
              className="flex-1 bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-center hover:border-red-500/30 transition-all"
            >
              <p className="text-2xl font-bold text-red-400">{stats.recusadas}</p>
              <p className="text-[10px] text-red-400/70 font-semibold mt-1">Recusadas</p>
            </button>
          </div>
        </div>
      </section>

      {/* Comissão info */}
      <section className="px-5 pt-4">
        <div className="bg-gradient-to-r from-[#ec1313]/10 to-transparent border border-[#ec1313]/10 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#ec1313]/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#ec1313]" style={{ fontSize: 20 }}>monetization_on</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white">R$ {COMISSAO_POR_INDICACAO.toLocaleString("pt-BR")} por indicação</p>
            <p className="text-[11px] text-slate-400">Valor pago aos parceiros por cada nova indicação</p>
          </div>
        </div>
      </section>

      {/* Admin: Vendedor ranking */}
      {isAdmin && (
        <section className="px-5 pt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ranking de Vendedores
            </h3>
            <button
              onClick={() => router.push("/vendedores")}
              className="text-[11px] text-[#ec1313] font-semibold"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-2">
            {vendedorRanking.map((v, idx) => (
              <div
                key={v.id}
                className="bg-[#121212] rounded-xl p-4 border border-white/[0.06] flex items-center gap-4"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx === 0 ? "bg-[#ec1313] text-white" : "bg-white/5 text-slate-400"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{v.nome}</p>
                  <p className="text-[11px] text-slate-500">
                    {v.totalParceiros} parceiros · {v.totalIndicacoes} indicações
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{v.fechadas}</p>
                  <p className="text-[10px] text-slate-500">fechadas</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="px-5 pt-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/parceiros/novo")}
            className="bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
            <span className="text-xs font-bold">Novo Parceiro</span>
          </button>
          <button
            onClick={() => router.push("/indicacoes")}
            className="bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-white rounded-xl p-4 flex items-center gap-3 transition-all"
          >
            <span className="material-symbols-outlined text-amber-400" style={{ fontSize: 20 }}>list_alt</span>
            <span className="text-xs font-bold">Ver Indicações</span>
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => router.push("/vendedores")}
                className="bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-white rounded-xl p-4 flex items-center gap-3 transition-all"
              >
                <span className="material-symbols-outlined text-blue-400" style={{ fontSize: 20 }}>badge</span>
                <span className="text-xs font-bold">Vendedores</span>
              </button>
              <button
                onClick={() => router.push("/portabilidade")}
                className="bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-white rounded-xl p-4 flex items-center gap-3 transition-all"
              >
                <span className="material-symbols-outlined text-purple-400" style={{ fontSize: 20 }}>swap_horiz</span>
                <span className="text-xs font-bold">Transferir</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Recent indicações */}
      <section className="px-5 pt-6 pb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Indicações Recentes
          </h3>
          <button
            onClick={() => router.push("/indicacoes")}
            className="text-[11px] text-[#ec1313] font-semibold"
          >
            Ver todas
          </button>
        </div>
        <div className="space-y-2">
          {recentIndicacoes.map((ind) => (
            <div
              key={ind.id}
              className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{ind.empresaIndicada}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Indicado por {getParceiroNome(ind.parceiroId)}
                  </p>
                </div>
                <StatusBadge status={ind.status} />
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.04]">
                <span className="text-[11px] text-slate-600">{ind.dataIndicacao}</span>
                {ind.status === "fechada" && (
                  <span className="text-[11px] font-bold text-emerald-400">
                    R$ {ind.valorComissao.toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
