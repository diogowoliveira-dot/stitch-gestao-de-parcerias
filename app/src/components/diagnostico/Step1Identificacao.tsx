"use client";
import { useDiagData } from "@/lib/diagnostico-context";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

// Currency formatter for input display
function fmtCI(v: number | undefined): string {
  if (!v) return "";
  return Math.round(v).toLocaleString("pt-BR");
}
function parseCur(s: string): number {
  return Number(String(s).replace(/\D/g, "")) || 0;
}

export default function Step1Identificacao() {
  const { formState, dispatch } = useDiagData();
  const { empresa } = formState;

  const setField = (field: string, value: unknown) => dispatch({ type: "SET_FIELD", field, value });

  return (
    <div className="space-y-6">
      {/* Bloco 1 — Dados da Incorporadora */}
      <div className="text-center mb-4">
        <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 40, color: "#ec1313" }}>business</span>
        <h2 className="text-xl font-bold text-white">Dados da Incorporadora</h2>
        <p className="text-sm mt-1 text-slate-500">Empresa, responsável e localização.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
          Nome da Incorporadora *
        </label>
        <input
          type="text"
          value={empresa.nome}
          onChange={(e) => dispatch({ type: "SET_EMPRESA", data: { nome: e.target.value } })}
          placeholder="Ex: Incorporadora Valor S.A."
          className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
            Responsável *
          </label>
          <input
            type="text"
            value={formState.responsibleName || ""}
            onChange={(e) => setField("responsibleName", e.target.value)}
            placeholder="Nome completo"
            className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
            Cargo
          </label>
          <input
            type="text"
            value={formState.responsibleRole || ""}
            onChange={(e) => setField("responsibleRole", e.target.value)}
            placeholder="Ex: Diretor Comercial"
            className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
            Cidade *
          </label>
          <input
            type="text"
            value={empresa.cidade}
            onChange={(e) => dispatch({ type: "SET_EMPRESA", data: { cidade: e.target.value } })}
            placeholder="Ex: Florianópolis"
            className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
            Estado *
          </label>
          <select
            value={empresa.estado}
            onChange={(e) => dispatch({ type: "SET_EMPRESA", data: { estado: e.target.value } })}
            className="w-full px-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          >
            <option value="">Selecione</option>
            {ESTADOS_BR.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06] pt-6 mt-6">
        <div className="text-center mb-4">
          <span className="material-symbols-outlined mb-2 block" style={{ fontSize: 32, color: "#f59e0b" }}>trending_up</span>
          <h3 className="text-lg font-bold text-white">Histórico de Vendas</h3>
          <p className="text-xs text-slate-500">VGV realizado e metas de crescimento.</p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
          VGV Vendido nos últimos 12 meses (canal parcerias) *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
          <input
            type="text"
            value={fmtCI(formState.totalVGV)}
            onChange={(e) => setField("totalVGV", parseCur(e.target.value))}
            placeholder="65.000.000"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
          Meta de VGV *
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
          <input
            type="text"
            value={fmtCI(formState.vgvGoal)}
            onChange={(e) => setField("vgvGoal", parseCur(e.target.value))}
            placeholder="120.000.000"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
          Ticket Médio
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
          <input
            type="text"
            value={fmtCI(formState.avgTicket)}
            onChange={(e) => setField("avgTicket", parseCur(e.target.value))}
            placeholder="750.000"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06] pt-6 mt-6">
        <div className="text-center mb-4">
          <span className="material-symbols-outlined mb-2 block" style={{ fontSize: 32, color: "#8b5cf6" }}>groups</span>
          <h3 className="text-lg font-bold text-white">Estrutura Comercial</h3>
          <p className="text-xs text-slate-500">Base de corretores e equipe.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
            Total de corretores na base *
          </label>
          <input
            type="number"
            value={formState.totalBrokers || ""}
            onChange={(e) => setField("totalBrokers", parseInt(e.target.value) || 0)}
            placeholder="580"
            className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
            Corretores que venderam (12m) *
          </label>
          <input
            type="number"
            value={formState.activeBrokers || ""}
            onChange={(e) => setField("activeBrokers", parseInt(e.target.value) || 0)}
            placeholder="72"
            className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
        </div>
      </div>

      {/* Preview da TE */}
      {(formState.totalBrokers || 0) > 0 && (formState.activeBrokers || 0) > 0 && (
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <p className="text-xs text-slate-400">
            Taxa de Engajamento:{" "}
            <span className={`font-bold ${
              ((formState.activeBrokers || 0) / (formState.totalBrokers || 1)) * 100 < 15
                ? "text-red-400"
                : ((formState.activeBrokers || 0) / (formState.totalBrokers || 1)) * 100 < 30
                  ? "text-amber-400"
                  : "text-green-400"
            }`}>
              {(((formState.activeBrokers || 0) / (formState.totalBrokers || 1)) * 100).toFixed(1)}%
            </span>
            {" "}— {formState.activeBrokers} de {formState.totalBrokers} corretores venderam
          </p>
        </div>
      )}
    </div>
  );
}
