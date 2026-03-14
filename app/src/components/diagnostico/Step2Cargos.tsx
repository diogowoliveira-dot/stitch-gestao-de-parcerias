"use client";
import { useState } from "react";
import { useDiagData } from "@/lib/diagnostico-context";
import { CARGOS_PADRAO, CargoData } from "@/lib/diagnostico-mock-data";

export default function Step2Cargos() {
  const { formState, dispatch } = useDiagData();
  const [cargoCustomNome, setCargoCustomNome] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleCargo = (cargoPadrao: typeof CARGOS_PADRAO[0]) => {
    const existing = formState.cargos.find((c) => c.id === cargoPadrao.id);
    if (existing) {
      if (existing.existe) {
        dispatch({ type: "REMOVE_CARGO", id: cargoPadrao.id });
      } else {
        dispatch({
          type: "UPDATE_CARGO",
          index: formState.cargos.findIndex((c) => c.id === cargoPadrao.id),
          data: { existe: true },
        });
      }
    } else {
      const newCargo: CargoData = {
        id: cargoPadrao.id,
        nome: cargoPadrao.nome,
        existe: true,
        tarefas: [],
        metricas: [],
        ferramentas: [],
        subordinadosDe: null,
        subordinados: [],
      };
      dispatch({ type: "ADD_CARGO", cargo: newCargo });
    }
  };

  const addCustomCargo = () => {
    if (!cargoCustomNome.trim()) return;
    const id = `cargo_custom_${Date.now()}`;
    const newCargo: CargoData = {
      id,
      nome: cargoCustomNome.trim(),
      existe: true,
      personalizado: true,
      tarefas: [],
      metricas: [],
      ferramentas: [],
      subordinadosDe: null,
      subordinados: [],
    };
    dispatch({ type: "ADD_CARGO", cargo: newCargo });
    setCargoCustomNome("");
    setShowCustomInput(false);
  };

  const isCargoSelected = (id: string) => formState.cargos.some((c) => c.id === id && c.existe);
  const customCargos = formState.cargos.filter((c) => c.personalizado);

  // Check missing roles for special questions
  const hasDiretorParceria = isCargoSelected("cargo_diretor_parceria");
  const hasGerente = isCargoSelected("cargo_gerente_parceria");
  const hasExecutivo = isCargoSelected("cargo_executivo_parceria");
  const hasDiretorComercial = isCargoSelected("cargo_diretor_comercial");

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 40, color: "#ec1313" }}>account_tree</span>
        <h2 className="text-xl font-bold text-white">Mapeamento de Cargos</h2>
        <p className="text-sm mt-1 text-slate-500">Quais cargos existem na estrutura da incorporadora?</p>
      </div>

      {/* Standard Roles */}
      <div className="space-y-2">
        {CARGOS_PADRAO.map((cargo) => {
          const selected = isCargoSelected(cargo.id);
          return (
            <button
              key={cargo.id}
              onClick={() => toggleCargo(cargo)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-left ${
                selected
                  ? "bg-[#ec1313]/[0.08] border border-[#ec1313]/30"
                  : "bg-[#121212] border border-white/[0.06]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  selected
                    ? "bg-[#ec1313]"
                    : "bg-white/[0.04] border border-white/[0.06]"
                }`}
              >
                {selected && <span className="material-symbols-outlined text-white" style={{ fontSize: 16 }}>check</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{cargo.nome}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-600">
                  Nível {cargo.nivel}
                  {cargo.id === "cargo_coordenador_comercial" || cargo.id === "cargo_supervisor_vendas"
                    ? " · Cargo alternativo"
                    : ""}
                </p>
              </div>
              {selected && (
                <span className="material-symbols-outlined text-[#ec1313]" style={{ fontSize: 16 }}>check_circle</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Roles */}
      {customCargos.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Cargos Personalizados</p>
          {customCargos.map((cargo) => (
            <div
              key={cargo.id}
              className="flex items-center gap-3 px-4 py-4 rounded-xl bg-[#ec1313]/[0.08] border border-[#ec1313]/30"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ec1313" }}>person</span>
              <p className="text-sm font-medium text-white flex-1">{cargo.nome}</p>
              <button
                onClick={() => dispatch({ type: "REMOVE_CARGO", id: cargo.id })}
                className="p-1 rounded-lg hover:bg-red-500/10 transition-all text-slate-500"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom */}
      {showCustomInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={cargoCustomNome}
            onChange={(e) => setCargoCustomNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomCargo()}
            placeholder="Nome do cargo personalizado"
            autoFocus
            className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
          />
          <button onClick={addCustomCargo} className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#ec1313]">
            Adicionar
          </button>
          <button onClick={() => { setShowCustomInput(false); setCargoCustomNome(""); }} className="px-3 py-3 rounded-xl hover:bg-white/5 text-slate-500">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5 border border-dashed border-[#ec1313]/30 text-[#ec1313]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Adicionar cargo personalizado
        </button>
      )}

      {/* Smart Questions */}
      {hasDiretorComercial && !hasDiretorParceria && (
        <div className="px-4 py-3 rounded-xl bg-[#f59e0b]/[0.08] border border-[#f59e0b]/[0.15]">
          <p className="text-xs text-[#f59e0b]">
            <span className="font-bold">Nota:</span> Sem Diretor de Parceria, o Diretor Comercial acumula essa função.
          </p>
        </div>
      )}
      {!hasGerente && (hasDiretorParceria || hasDiretorComercial) && hasExecutivo && (
        <div className="px-4 py-3 rounded-xl bg-[#f59e0b]/[0.08] border border-[#f59e0b]/[0.15]">
          <p className="text-xs text-[#f59e0b]">
            <span className="font-bold">Nota:</span> Sem Gerente, a Diretoria faz gestão direta dos Executivos.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="pt-4 border-t border-white/[0.06]">
        <p className="text-xs font-semibold text-slate-500">
          {formState.cargos.filter((c) => c.existe).length} cargo(s) selecionado(s)
        </p>
      </div>
    </div>
  );
}
