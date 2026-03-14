"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export default function VendedoresPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { vendedores, getStatsVendedor, addVendedor } = useData();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", userId: "" });

  if (!isAdmin) {
    return (
      <AppShell title="Acesso Negado" icon="block">
        <div className="px-5 pt-20 text-center">
          <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 64 }}>lock</span>
          <p className="text-slate-400 mt-4">Apenas administradores podem acessar esta página.</p>
        </div>
      </AppShell>
    );
  }

  const filtered = vendedores.filter((v) =>
    v.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email) return;
    addVendedor({
      userId: `u${Date.now()}`,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
    });
    setForm({ nome: "", email: "", telefone: "", userId: "" });
    setShowForm(false);
  };

  return (
    <AppShell title="Vendedores" subtitle="Gerenciar equipe de vendas" icon="badge">
      {/* Search */}
      <section className="px-5 pt-5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" style={{ fontSize: 20 }}>
            search
          </span>
          <input
            type="text"
            placeholder="Buscar vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
          />
        </div>
      </section>

      {/* Add button */}
      <section className="px-5 pt-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full h-12 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          NOVO VENDEDOR
        </button>
      </section>

      {/* Form */}
      {showForm && (
        <section className="px-5 pt-4">
          <form onSubmit={handleSubmit} className="bg-[#121212] rounded-xl p-5 border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-bold mb-2">Cadastrar Vendedor</h3>
            <input
              type="text"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
              required
            />
            <input
              type="tel"
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 h-12 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 h-12 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl text-sm font-bold transition-all"
              >
                Cadastrar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* List */}
      <section className="px-5 pt-4 pb-8 space-y-3">
        {filtered.map((v) => {
          const stats = getStatsVendedor(v.id);
          return (
            <div
              key={v.id}
              className="bg-[#121212] rounded-xl p-5 border border-white/[0.06] hover:border-white/10 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base font-bold">{v.nome}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{v.email}</p>
                </div>
                <StatusBadge status={v.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                <div>
                  <p className="text-lg font-bold">{stats.totalParceiros}</p>
                  <p className="text-[10px] text-slate-500">Parceiros</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-400">{stats.emNegociacao}</p>
                  <p className="text-[10px] text-slate-500">Negociando</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-400">{stats.fechadas}</p>
                  <p className="text-[10px] text-slate-500">Fechadas</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <span className="text-[11px] text-slate-600">
                  Comissões: R$ {stats.comissaoTotal.toLocaleString("pt-BR")}
                </span>
                <button
                  onClick={() => router.push(`/parceiros?vendedor=${v.id}`)}
                  className="text-[11px] text-[#ec1313] font-semibold flex items-center gap-1"
                >
                  Ver carteira
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <span className="material-symbols-outlined" style={{ fontSize: 48 }}>search_off</span>
            <p className="mt-2 text-sm">Nenhum vendedor encontrado</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
