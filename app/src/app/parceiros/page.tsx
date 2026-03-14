"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { PartnerType } from "@/lib/mock-data";

export default function ParceirosPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><p className="text-sm text-slate-500">Carregando...</p></div>}>
      <ParceirosPage />
    </Suspense>
  );
}

function ParceirosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, vendedor } = useAuth();
  const { parceiros, vendedores, getIndicacoesDoParceiro } = useData();

  const vendedorFilter = searchParams.get("vendedor");
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<PartnerType | "todos">("todos");

  // Filter parceiros based on role
  let filtered = isAdmin
    ? vendedorFilter
      ? parceiros.filter((p) => p.vendedorId === vendedorFilter)
      : parceiros
    : vendedor
    ? parceiros.filter((p) => p.vendedorId === vendedor.id)
    : [];

  // Apply search
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.empresa.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Apply type filter
  if (tipoFilter !== "todos") {
    filtered = filtered.filter((p) => p.tipo === tipoFilter);
  }

  const getVendedorNome = (vendedorId: string) =>
    vendedores.find((v) => v.id === vendedorId)?.nome || "—";

  const tipoOptions: { value: PartnerType | "todos"; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "cliente", label: "Clientes" },
    { value: "corretor", label: "Corretores" },
    { value: "consultor", label: "Consultores" },
  ];

  return (
    <AppShell
      title="Parceiros"
      subtitle={
        isAdmin && vendedorFilter
          ? `Carteira de ${getVendedorNome(vendedorFilter)}`
          : isAdmin
          ? "Todos os parceiros"
          : "Sua carteira de parceiros"
      }
      icon="handshake"
      showBack={!!vendedorFilter}
    >
      {/* Search */}
      <section className="px-5 pt-5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
          />
        </div>
      </section>

      {/* Type filter tabs */}
      <section className="px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          {tipoOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTipoFilter(opt.value)}
              className={`px-4 h-9 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tipoFilter === opt.value
                  ? "bg-[#ec1313] text-white"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.08] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Add button */}
      <section className="px-5 pt-4">
        <button
          onClick={() => router.push("/parceiros/novo")}
          className="w-full h-12 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          NOVO PARCEIRO
        </button>
      </section>

      {/* Count */}
      <section className="px-5 pt-4">
        <p className="text-[11px] text-slate-600 uppercase font-bold tracking-wider">
          {filtered.length} parceiro{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
        </p>
      </section>

      {/* List */}
      <section className="px-5 pt-3 pb-8 space-y-3">
        {filtered.map((p) => {
          const indicacoes = getIndicacoesDoParceiro(p.id);
          const fechadas = indicacoes.filter((i) => i.status === "fechada").length;
          return (
            <button
              key={p.id}
              onClick={() => router.push(`/parceiros/${p.id}`)}
              className="w-full bg-[#121212] rounded-xl p-5 border border-white/[0.06] hover:border-white/10 transition-all text-left"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold truncate">{p.nome}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.empresa}</p>
                </div>
                <StatusBadge status={p.tipo} />
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 14 }}>assignment</span>
                  <span className="text-xs text-slate-400">{indicacoes.length} indicações</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: 14 }}>check_circle</span>
                  <span className="text-xs text-emerald-400">{fechadas} fechadas</span>
                </div>
                {isAdmin && (
                  <span className="text-[10px] text-slate-600 ml-auto">
                    {getVendedorNome(p.vendedorId)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>person_off</span>
            <p className="mt-2 text-sm">Nenhum parceiro encontrado</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
