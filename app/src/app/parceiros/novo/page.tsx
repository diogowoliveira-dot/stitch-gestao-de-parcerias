"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";
import { PartnerType } from "@/lib/mock-data";

export default function NovoParceiro() {
  const router = useRouter();
  const { isAdmin, vendedor } = useAuth();
  const { addParceiro, vendedores } = useData();

  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    empresa: "",
    tipo: "cliente" as PartnerType,
    vendedorId: vendedor?.id || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.empresa || !form.vendedorId) return;
    addParceiro({
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      empresa: form.empresa,
      tipo: form.tipo,
      vendedorId: form.vendedorId,
    });
    router.push("/parceiros");
  };

  const tipos: { value: PartnerType; label: string; icon: string }[] = [
    { value: "cliente", label: "Cliente", icon: "person" },
    { value: "corretor", label: "Corretor", icon: "real_estate_agent" },
    { value: "consultor", label: "Consultor", icon: "support_agent" },
  ];

  return (
    <AppShell title="Novo Parceiro" subtitle="Cadastrar parceiro indicador" icon="person_add" showBack>
      <form onSubmit={handleSubmit} className="px-5 pt-6 pb-8 space-y-5">
        {/* Tipo de parceiro */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 block">
            Tipo de Parceiro
          </label>
          <div className="grid grid-cols-3 gap-2">
            {tipos.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, tipo: t.value })}
                className={`h-20 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  form.tipo === t.value
                    ? "bg-[#ec1313]/10 border-[#ec1313]/40 text-[#ec1313]"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:border-white/20"
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{t.icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nome */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
            Nome do Parceiro *
          </label>
          <input
            type="text"
            placeholder="Nome completo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
            required
          />
        </div>

        {/* Empresa */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
            Empresa *
          </label>
          <input
            type="text"
            placeholder="Nome da empresa"
            value={form.empresa}
            onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
            required
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
            Telefone
          </label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
            Email *
          </label>
          <input
            type="email"
            placeholder="email@empresa.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
            required
          />
        </div>

        {/* Vendedor responsável (admin only) */}
        {isAdmin && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
              Vendedor Responsável *
            </label>
            <select
              value={form.vendedorId}
              onChange={(e) => setForm({ ...form, vendedorId: e.target.value })}
              className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all appearance-none"
              required
            >
              <option value="" className="bg-[#121212]">Selecionar vendedor...</option>
              {vendedores
                .filter((v) => v.status === "ativo")
                .map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#121212]">
                    {v.nome}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full h-14 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl font-bold text-sm tracking-widest uppercase transition-all active:scale-[0.98] shadow-lg shadow-[#ec1313]/20"
          >
            CADASTRAR PARCEIRO
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full h-12 mt-3 text-sm text-slate-500 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </AppShell>
  );
}
