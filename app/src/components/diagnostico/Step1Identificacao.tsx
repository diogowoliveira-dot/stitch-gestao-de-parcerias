"use client";
import { useDiagData } from "@/lib/diagnostico-context";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function Step1Identificacao() {
  const { formState, dispatch } = useDiagData();
  const { empresa } = formState;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 40, color: "#ec1313" }}>business</span>
        <h2 className="text-xl font-bold text-white">Identificação da Incorporadora</h2>
        <p className="text-sm mt-1 text-slate-500">Dados básicos da empresa a ser diagnosticada</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
          Nome da Incorporadora *
        </label>
        <input
          type="text"
          value={empresa.nome}
          onChange={(e) => dispatch({ type: "SET_EMPRESA", data: { nome: e.target.value } })}
          placeholder="Ex: Incorporadora Alpha"
          className="w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
        />
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
            placeholder="São Paulo"
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
    </div>
  );
}
