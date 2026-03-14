"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { ReferralStatus, COMISSAO_POR_INDICACAO } from "@/lib/mock-data";

export default function IndicacoesPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><p className="text-sm text-slate-500">Carregando...</p></div>}>
      <IndicacoesPage />
    </Suspense>
  );
}

function IndicacoesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, vendedor } = useAuth();
  const { indicacoes, parceiros, vendedores, getIndicacoesDoVendedor, updateIndicacaoStatus } = useData();

  const initialStatus = searchParams.get("status") as ReferralStatus | null;
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | "todas">(initialStatus || "todas");
  const [search, setSearch] = useState("");

  // Get indicações based on role
  let allIndicacoes = isAdmin
    ? indicacoes
    : vendedor
    ? getIndicacoesDoVendedor(vendedor.id)
    : [];

  // Apply status filter
  if (statusFilter !== "todas") {
    allIndicacoes = allIndicacoes.filter((i) => i.status === statusFilter);
  }

  // Apply search
  if (search) {
    allIndicacoes = allIndicacoes.filter(
      (i) =>
        i.empresaIndicada.toLowerCase().includes(search.toLowerCase()) ||
        i.contatoNome.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Sort by date descending
  allIndicacoes = [...allIndicacoes].sort((a, b) =>
    b.dataIndicacao.localeCompare(a.dataIndicacao)
  );

  const getParceiroNome = (parceiroId: string) =>
    parceiros.find((p) => p.id === parceiroId)?.nome || "—";

  const getVendedorFromParceiro = (parceiroId: string) => {
    const p = parceiros.find((par) => par.id === parceiroId);
    if (!p) return "—";
    return vendedores.find((v) => v.id === p.vendedorId)?.nome || "—";
  };

  const statusOptions: { value: ReferralStatus | "todas"; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "em_negociacao", label: "Negociando" },
    { value: "fechada", label: "Fechadas" },
    { value: "recusada", label: "Recusadas" },
  ];

  // Stats
  const baseIndicacoes = isAdmin ? indicacoes : vendedor ? getIndicacoesDoVendedor(vendedor.id) : [];
  const totalFechadas = baseIndicacoes.filter((i) => i.status === "fechada").length;
  const totalNegociando = baseIndicacoes.filter((i) => i.status === "em_negociacao").length;
  const totalRecusadas = baseIndicacoes.filter((i) => i.status === "recusada").length;

  return (
    <AppShell title="Indicações" subtitle={isAdmin ? "Todas as indicações" : "Indicações da sua carteira"} icon="assignment">
      {/* Summary stats */}
      <section className="px-5 pt-5 grid grid-cols-3 gap-2">
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{totalNegociando}</p>
          <p className="text-[9px] text-amber-400/70 uppercase font-bold">Negociando</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{totalFechadas}</p>
          <p className="text-[9px] text-emerald-400/70 uppercase font-bold">Fechadas</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-400">{totalRecusadas}</p>
          <p className="text-[9px] text-red-400/70 uppercase font-bold">Recusadas</p>
        </div>
      </section>

      {/* Comissão total */}
      <section className="px-5 pt-3">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 18 }}>payments</span>
            <span className="text-xs text-emerald-400 font-semibold">Total em Comissões</span>
          </div>
          <span className="text-base font-bold text-emerald-400">
            R$ {(totalFechadas * COMISSAO_POR_INDICACAO).toLocaleString("pt-BR")}
          </span>
        </div>
      </section>

      {/* Search */}
      <section className="px-5 pt-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por empresa ou contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
          />
        </div>
      </section>

      {/* Status filter */}
      <section className="px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 h-9 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? "bg-[#ec1313] text-white"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.08] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Count */}
      <section className="px-5 pt-4">
        <p className="text-[11px] text-slate-600 uppercase font-bold tracking-wider">
          {allIndicacoes.length} indicaç{allIndicacoes.length !== 1 ? "ões" : "ão"} encontrada{allIndicacoes.length !== 1 ? "s" : ""}
        </p>
      </section>

      {/* List */}
      <section className="px-5 pt-3 pb-8 space-y-3">
        {allIndicacoes.map((ind) => (
          <div
            key={ind.id}
            className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{ind.empresaIndicada}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {ind.contatoNome} · {ind.contatoTelefone || ind.contatoEmail}
                </p>
              </div>
              <StatusBadge status={ind.status} />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => {
                  const p = parceiros.find((par) => par.id === ind.parceiroId);
                  if (p) router.push(`/parceiros/${p.id}`);
                }}
                className="text-[11px] text-[#ec1313] font-semibold flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>person</span>
                {getParceiroNome(ind.parceiroId)}
              </button>
              {isAdmin && (
                <span className="text-[10px] text-slate-600">
                  Vendedor: {getVendedorFromParceiro(ind.parceiroId)}
                </span>
              )}
            </div>
            {ind.observacoes && (
              <p className="text-[11px] text-slate-500 mt-2 italic">&ldquo;{ind.observacoes}&rdquo;</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
              <span className="text-[11px] text-slate-600">{ind.dataIndicacao}</span>
              {ind.status === "fechada" && (
                <span className="text-[11px] font-bold text-emerald-400">
                  R$ {ind.valorComissao.toLocaleString("pt-BR")}
                </span>
              )}
            </div>
            {/* Status change buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
              {([
                { value: "em_negociacao" as ReferralStatus, label: "Negociando" },
                { value: "fechada" as ReferralStatus, label: "Fechada" },
                { value: "recusada" as ReferralStatus, label: "Recusada" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateIndicacaoStatus(ind.id, opt.value)}
                  disabled={ind.status === opt.value}
                  className={`flex-1 h-8 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    ind.status === opt.value
                      ? "bg-white/5 text-slate-600 cursor-default"
                      : "border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        {allIndicacoes.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>inbox</span>
            <p className="mt-2 text-sm">Nenhuma indicação encontrada</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
