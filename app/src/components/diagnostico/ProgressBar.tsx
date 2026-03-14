"use client";

const ETAPAS = [
  { num: 1, label: "Empresa" },
  { num: 2, label: "Cargos" },
  { num: 3, label: "Detalhamento" },
  { num: 4, label: "Resumo" },
  { num: 5, label: "Diagnóstico" },
];

export default function ProgressBar({ etapaAtual }: { etapaAtual: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {ETAPAS.map((etapa, i) => {
        const isActive = etapa.num === etapaAtual;
        const isDone = etapa.num < etapaAtual;
        return (
          <div key={etapa.num} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-[#ec1313] text-white"
                    : isActive
                    ? "bg-[#ec1313]/20 border-2 border-[#ec1313] text-white"
                    : "bg-white/[0.04] border-2 border-transparent text-slate-600"
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                ) : (
                  etapa.num
                )}
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider mt-1.5 text-center ${
                  isActive || isDone ? "text-[#ec1313]" : "text-slate-600"
                }`}
              >
                {etapa.label}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div
                className={`h-0.5 flex-1 -mt-4 mx-1 rounded-full ${
                  isDone ? "bg-[#ec1313]" : "bg-white/[0.06]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
