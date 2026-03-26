"use client";
import { useEffect } from "react";
import { useDiagData } from "@/lib/diagnostico-context";

export default function Step4Resumo() {
  const { formState, dispatch } = useDiagData();
  const cargosExistentes = formState.cargos.filter((c) => c.existe);

  // Auto-generate problems on mount
  useEffect(() => {
    if (formState.problemas.length === 0 && cargosExistentes.length > 0) {
      dispatch({ type: "GERAR_PROBLEMAS" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 40, color: "#ec1313" }}>summarize</span>
        <h2 className="text-xl font-bold text-white">Resumo do Diagnóstico</h2>
        <p className="text-sm mt-1 text-slate-500">Confirme os dados antes de gerar os diagramas</p>
      </div>

      {/* Empresa */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ec1313" }}>business</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Empresa</h3>
        </div>
        <p className="text-lg font-bold text-white">{formState.empresa.nome}</p>
        <p className="text-xs text-slate-500">{formState.empresa.cidade}/{formState.empresa.estado}</p>
      </div>

      {/* Cargos */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#8b5cf6" }}>account_tree</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Cargos Mapeados ({cargosExistentes.length})
          </h3>
        </div>
        <div className="space-y-3">
          {cargosExistentes.map((cargo) => (
            <div key={cargo.id} className="rounded-xl p-4 bg-white/[0.03] border border-white/[0.06]">
              <p className="text-sm font-bold text-white mb-2">{cargo.nome}</p>
              {cargo.tarefas.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#ec1313" }}>Tarefas</p>
                  <div className="flex flex-wrap gap-1">
                    {cargo.tarefas.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#ec1313]/[0.08] text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(cargo.kpiPrincipal || []).length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#f59e0b" }}>KPI</p>
                  <div className="flex flex-wrap gap-1">
                    {(cargo.kpiPrincipal || []).map((k) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f59e0b]/[0.08] text-slate-400">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {cargo.ferramentas.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8b5cf6" }}>Ferramentas</p>
                  <div className="flex flex-wrap gap-1">
                    {cargo.ferramentas.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-[#8b5cf6]/[0.08] text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Problemas Identificados */}
      {formState.problemas.length > 0 && (
        <div className="rounded-2xl p-5 bg-[#ec1313]/[0.03] border border-[#ec1313]/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ec1313" }}>warning</span>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#ec1313" }}>
              Problemas Identificados ({formState.problemas.length})
            </h3>
          </div>
          <div className="space-y-2">
            {formState.problemas.map((problema, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-xs bg-[#ec1313]/[0.04] text-[#ff9999]"
              >
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 14, color: "#ec1313" }}>error</span>
                <span className="leading-relaxed">{problema}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
