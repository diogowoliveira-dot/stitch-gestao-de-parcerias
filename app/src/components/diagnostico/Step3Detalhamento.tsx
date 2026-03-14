"use client";
import { useState } from "react";
import { useDiagData } from "@/lib/diagnostico-context";
import { TAREFAS_PREDEFINIDAS, METRICAS_PREDEFINIDAS, FERRAMENTAS_PREDEFINIDAS } from "@/lib/diagnostico-mock-data";

export default function Step3Detalhamento() {
  const { formState, dispatch } = useDiagData();
  const cargosExistentes = formState.cargos.filter((c) => c.existe);
  const cargoAtual = cargosExistentes[formState.cargoAtualIndex];
  const [customTarefa, setCustomTarefa] = useState("");
  const [customMetrica, setCustomMetrica] = useState("");
  const [customFerramenta, setCustomFerramenta] = useState("");

  if (!cargoAtual) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined mb-3 block text-slate-700" style={{ fontSize: 48 }}>check_circle</span>
        <p className="text-sm text-white font-bold">Todos os cargos foram detalhados!</p>
        <p className="text-xs mt-1 text-slate-500">Avance para ver o resumo.</p>
      </div>
    );
  }

  const cargoIndex = formState.cargos.findIndex((c) => c.id === cargoAtual.id);

  const toggleItem = (field: "tarefas" | "metricas" | "ferramentas", item: string) => {
    const current = cargoAtual[field];
    const updated = current.includes(item)
      ? current.filter((t) => t !== item)
      : [...current, item];
    dispatch({ type: "UPDATE_CARGO", index: cargoIndex, data: { [field]: updated } });
  };

  const addCustomItem = (field: "tarefas" | "metricas" | "ferramentas", value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const current = cargoAtual[field];
    if (!current.includes(value.trim())) {
      dispatch({ type: "UPDATE_CARGO", index: cargoIndex, data: { [field]: [...current, value.trim()] } });
    }
    setter("");
  };

  const canGoNext = formState.cargoAtualIndex < cargosExistentes.length - 1;
  const canGoPrev = formState.cargoAtualIndex > 0;

  return (
    <div className="space-y-6">
      {/* Cargo Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#ec1313" }}>badge</span>
        </div>
        <h2 className="text-xl font-bold text-white">{cargoAtual.nome}</h2>
        <p className="text-xs mt-1 text-slate-500">
          Cargo {formState.cargoAtualIndex + 1} de {cargosExistentes.length}
        </p>
        {/* Mini progress */}
        <div className="flex justify-center gap-1.5 mt-3">
          {cargosExistentes.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === formState.cargoAtualIndex ? 24 : 8,
                background: i <= formState.cargoAtualIndex ? "#ec1313" : "rgba(255, 255, 255, 0.06)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Bloco A - Tarefas */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ec1313" }}>task_alt</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Tarefas do dia a dia</h3>
        </div>
        <div className="space-y-1.5">
          {TAREFAS_PREDEFINIDAS.map((tarefa) => {
            const selected = cargoAtual.tarefas.includes(tarefa);
            return (
              <button
                key={tarefa}
                onClick={() => toggleItem("tarefas", tarefa)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                  selected ? "bg-[#ec1313]/[0.06] text-white" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    selected ? "bg-[#ec1313]" : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                >
                  {selected && (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
                  )}
                </div>
                {tarefa}
              </button>
            );
          })}
          {/* Custom tasks already added */}
          {cargoAtual.tarefas.filter((t) => !TAREFAS_PREDEFINIDAS.includes(t)).map((t) => (
            <div
              key={t}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-[#ec1313]/[0.06] text-white"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-[#ec1313]">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
              </div>
              <span className="flex-1">{t}</span>
              <button onClick={() => toggleItem("tarefas", t)} className="p-0.5 rounded hover:bg-red-500/10 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customTarefa}
            onChange={(e) => setCustomTarefa(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomItem("tarefas", customTarefa, setCustomTarefa)}
            placeholder="Outra tarefa..."
            className="flex-1 px-3 py-2.5 rounded-lg text-xs text-white placeholder-[#4a5f73] outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
          <button onClick={() => addCustomItem("tarefas", customTarefa, setCustomTarefa)} className="px-3 py-2.5 rounded-lg text-xs font-bold text-[#ec1313]">
            +
          </button>
        </div>
      </div>

      {/* Bloco B - Métricas */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#f59e0b" }}>speed</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Métricas de resultado</h3>
        </div>
        <div className="space-y-1.5">
          {METRICAS_PREDEFINIDAS.map((metrica) => {
            const selected = cargoAtual.metricas.includes(metrica);
            return (
              <button
                key={metrica}
                onClick={() => toggleItem("metricas", metrica)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                  selected ? "bg-[#f59e0b]/[0.06] text-white" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    selected ? "bg-[#f59e0b]" : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                >
                  {selected && (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
                  )}
                </div>
                {metrica}
              </button>
            );
          })}
          {cargoAtual.metricas.filter((m) => !METRICAS_PREDEFINIDAS.includes(m)).map((m) => (
            <div
              key={m}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-[#f59e0b]/[0.06] text-white"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-[#f59e0b]">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
              </div>
              <span className="flex-1">{m}</span>
              <button onClick={() => toggleItem("metricas", m)} className="p-0.5 rounded hover:bg-red-500/10 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customMetrica}
            onChange={(e) => setCustomMetrica(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomItem("metricas", customMetrica, setCustomMetrica)}
            placeholder="Outra métrica..."
            className="flex-1 px-3 py-2.5 rounded-lg text-xs text-white placeholder-[#4a5f73] outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
          <button onClick={() => addCustomItem("metricas", customMetrica, setCustomMetrica)} className="px-3 py-2.5 rounded-lg text-xs font-bold text-[#f59e0b]">
            +
          </button>
        </div>
      </div>

      {/* Bloco C - Ferramentas */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#8b5cf6" }}>build</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Ferramentas utilizadas</h3>
        </div>
        <div className="space-y-1.5">
          {FERRAMENTAS_PREDEFINIDAS.map((ferramenta) => {
            const selected = cargoAtual.ferramentas.includes(ferramenta);
            return (
              <button
                key={ferramenta}
                onClick={() => toggleItem("ferramentas", ferramenta)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                  selected ? "bg-[#8b5cf6]/[0.06] text-white" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    selected ? "bg-[#8b5cf6]" : "bg-white/[0.04] border border-white/[0.06]"
                  }`}
                >
                  {selected && (
                    <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
                  )}
                </div>
                <span className="text-xs leading-relaxed">{ferramenta}</span>
              </button>
            );
          })}
          {cargoAtual.ferramentas.filter((f) => !FERRAMENTAS_PREDEFINIDAS.includes(f)).map((f) => (
            <div
              key={f}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm bg-[#8b5cf6]/[0.06] text-white"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-[#8b5cf6]">
                <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
              </div>
              <span className="flex-1 text-xs">{f}</span>
              <button onClick={() => toggleItem("ferramentas", f)} className="p-0.5 rounded hover:bg-red-500/10 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customFerramenta}
            onChange={(e) => setCustomFerramenta(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomItem("ferramentas", customFerramenta, setCustomFerramenta)}
            placeholder="Outra ferramenta..."
            className="flex-1 px-3 py-2.5 rounded-lg text-xs text-white placeholder-[#4a5f73] outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
          <button onClick={() => addCustomItem("ferramentas", customFerramenta, setCustomFerramenta)} className="px-3 py-2.5 rounded-lg text-xs font-bold text-[#8b5cf6]">
            +
          </button>
        </div>
      </div>

      {/* Navigation between cargos */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <button
          onClick={() => canGoPrev && dispatch({ type: "SET_CARGO_INDEX", index: formState.cargoAtualIndex - 1 })}
          disabled={!canGoPrev}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30 text-slate-400"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
          Cargo anterior
        </button>
        <button
          onClick={() => canGoNext && dispatch({ type: "SET_CARGO_INDEX", index: formState.cargoAtualIndex + 1 })}
          disabled={!canGoNext}
          className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 text-[#ec1313]"
        >
          Próximo cargo
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
}
