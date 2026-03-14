"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiagShell from "@/components/diagnostico/DiagShell";
import ProgressBar from "@/components/diagnostico/ProgressBar";
import Step1Identificacao from "@/components/diagnostico/Step1Identificacao";
import Step2Cargos from "@/components/diagnostico/Step2Cargos";
import Step3Detalhamento from "@/components/diagnostico/Step3Detalhamento";
import Step4Resumo from "@/components/diagnostico/Step4Resumo";
import Step5Diagnostico from "@/components/diagnostico/Step5Diagnostico";
import { useDiagAuth, useDiagData } from "@/lib/diagnostico-context";
import type { DiagnosticoData } from "@/lib/diagnostico-mock-data";

export default function NovoDiagnosticoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black"><p className="text-sm text-slate-500">Carregando...</p></div>}>
      <NovoDiagnostico />
    </Suspense>
  );
}

function NovoDiagnostico() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verId = searchParams.get("ver");
  const { user } = useDiagAuth();
  const { formState, dispatch, diagnosticos, addDiagnostico } = useDiagData();

  // Load existing diagnostic if viewing
  useEffect(() => {
    if (verId) {
      const diag = diagnosticos.find((d) => d.id === verId);
      if (diag) {
        dispatch({
          type: "LOAD",
          data: {
            etapaAtual: 5,
            empresa: diag.empresa,
            cargos: diag.cargos,
            cargoAtualIndex: 0,
            problemas: diag.problemasIdentificados,
            outputGerado: true,
          },
        });
      }
    }
  }, [verId, diagnosticos, dispatch]);

  const { etapaAtual } = formState;
  const cargosExistentes = formState.cargos.filter((c) => c.existe);

  const canAdvance = (): boolean => {
    switch (etapaAtual) {
      case 1:
        return !!(formState.empresa.nome.trim() && formState.empresa.cidade.trim() && formState.empresa.estado);
      case 2:
        return cargosExistentes.length > 0;
      case 3:
        return cargosExistentes.every((c) => c.tarefas.length > 0 && c.ferramentas.length > 0);
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (etapaAtual === 3) {
      // Reset cargo index when moving to step 3
      dispatch({ type: "SET_CARGO_INDEX", index: 0 });
    }
    if (etapaAtual === 4) {
      dispatch({ type: "GERAR_PROBLEMAS" });
      dispatch({ type: "GERAR_OUTPUT" });

      // Generate problems locally for saving
      const todasFerramentas = new Set<string>();
      cargosExistentes.forEach((c) => c.ferramentas.forEach((f) => todasFerramentas.add(f)));
      const problemas: string[] = [];
      const { PROBLEMAS_POR_FERRAMENTA } = await import("@/lib/diagnostico-mock-data");
      todasFerramentas.forEach((f) => {
        if (PROBLEMAS_POR_FERRAMENTA[f]) problemas.push(PROBLEMAS_POR_FERRAMENTA[f]);
      });
      if (todasFerramentas.size > 4) problemas.push("Estrutura com alto grau de fragmentação operacional");

      // Save diagnostic to DB
      if (!verId && user) {
        const newDiag: DiagnosticoData = {
          id: `diag_${Date.now()}`,
          empresa: formState.empresa,
          cargos: formState.cargos,
          ferramentasGerais: [...todasFerramentas],
          problemasIdentificados: problemas,
          dataCriacao: new Date().toISOString().split("T")[0],
          criadoPor: user.id,
          status: "completo",
        };
        await addDiagnostico(newDiag);
      }
    }
    dispatch({ type: "SET_ETAPA", etapa: etapaAtual + 1 });
  };

  const handlePrev = () => {
    if (etapaAtual === 3) {
      dispatch({ type: "SET_CARGO_INDEX", index: 0 });
    }
    dispatch({ type: "SET_ETAPA", etapa: etapaAtual - 1 });
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
    router.push("/diagnostico/dashboard");
  };

  return (
    <DiagShell
      title={verId ? "Ver Diagnóstico" : "Novo Diagnóstico"}
      subtitle={formState.empresa.nome || "Preencha os dados"}
      icon="assignment"
      showBack
    >
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <ProgressBar etapaAtual={etapaAtual} />

        {/* Step Content */}
        <div className="mb-8">
          {etapaAtual === 1 && <Step1Identificacao />}
          {etapaAtual === 2 && <Step2Cargos />}
          {etapaAtual === 3 && <Step3Detalhamento />}
          {etapaAtual === 4 && <Step4Resumo />}
          {etapaAtual === 5 && <Step5Diagnostico />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pb-8">
          {etapaAtual > 1 && etapaAtual < 5 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all text-slate-400 border border-white/[0.06] hover:bg-white/5"
            >
              Voltar
            </button>
          )}

          {etapaAtual < 5 && (
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: etapaAtual === 4
                  ? "#f59e0b"
                  : "#ec1313",
                boxShadow: canAdvance()
                  ? etapaAtual === 4
                    ? "0 4px 16px rgba(245, 158, 11, 0.3)"
                    : "0 4px 16px rgba(236, 19, 19, 0.3)"
                  : "none",
              }}
            >
              {etapaAtual === 4 ? "Gerar Diagnóstico" : "Avançar"}
            </button>
          )}

          {etapaAtual === 5 && (
            <button
              onClick={handleReset}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "#ec1313", boxShadow: "0 4px 16px rgba(236, 19, 19, 0.3)" }}
            >
              Novo Diagnóstico
            </button>
          )}
        </div>
      </div>
    </DiagShell>
  );
}
