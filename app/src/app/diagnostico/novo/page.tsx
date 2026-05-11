"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DiagShell from "@/components/diagnostico/DiagShell";
import ProgressBar from "@/components/diagnostico/ProgressBar";
import Step1Identificacao from "@/components/diagnostico/Step1Identificacao";
import Step2Cargos from "@/components/diagnostico/Step2Cargos";
import Step3Detalhamento from "@/components/diagnostico/Step3Detalhamento";
import Step4Canal from "@/components/diagnostico/Step4Canal";
import Step5Resumo from "@/components/diagnostico/Step4Resumo";
import Step6Diagnostico from "@/components/diagnostico/Step5Diagnostico";
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
  const isSimulacao = searchParams.get("simulacao") === "true";
  const { user } = useDiagAuth();
  const { formState, dispatch, diagnosticos, addDiagnostico } = useDiagData();
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // Load existing diagnostic if viewing
  useEffect(() => {
    if (verId) {
      const diag = diagnosticos.find((d) => d.id === verId);
      if (diag) {
        dispatch({
          type: "LOAD",
          data: {
            etapaAtual: 6,
            empresa: diag.empresa,
            cargos: diag.cargos,
            cargoAtualIndex: 0,
            problemas: diag.problemasIdentificados,
            outputGerado: true,
            shareHouse: diag.shareHouse,
            shareParcerias: diag.shareParcerias,
            numImobiliarias: diag.numImobiliarias,
            segmentacao: diag.segmentacao,
            segmentacaoDescritiva: diag.segmentacaoDescritiva,
            relatoriosDesejados: diag.relatoriosDesejados,
            relatoriosDescritivo: diag.relatoriosDescritivo,
            tabelaZeroParcerias: diag.tabelaZeroParcerias,
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
        return !!(
          formState.empresa.nome.trim() &&
          formState.empresa.cidade.trim() &&
          formState.empresa.estado &&
          (formState.totalVGV || 0) > 0 &&
          (formState.vgvGoal || 0) > 0 &&
          (formState.totalBrokers || 0) > 0 &&
          (formState.activeBrokers || 0) > 0
        );
      case 2:
        return cargosExistentes.length > 0;
      case 3:
        return cargosExistentes.every((c) => c.tarefas.length > 0 && c.ferramentas.length > 0);
      case 4:
        return true; // Canal e Mercado - all optional
      case 5:
        return true; // Resumo
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (etapaAtual === 3) {
      dispatch({ type: "SET_CARGO_INDEX", index: 0 });
    }
    if (etapaAtual === 5) {
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

      // Save diagnostic to DB — inclui TODOS os campos coletados no formulário
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
          isSimulacao,

          // Responsável
          responsavelNome: formState.responsibleName,
          responsavelCargo: formState.responsibleRole,

          // Métricas VGV / corretores (coletadas no Step 1)
          totalVGV: formState.totalVGV,
          vgvGoal: formState.vgvGoal,
          avgTicket: formState.avgTicket,
          totalBrokers: formState.totalBrokers,
          activeBrokers: formState.activeBrokers,

          // Canais (coletadas no Step 4)
          shareHouse: formState.shareHouse,
          shareParcerias: formState.shareParcerias,
          numImobiliarias: formState.numImobiliarias,
          segmentacao: formState.segmentacao,
          segmentacaoDescritiva: formState.segmentacaoDescritiva,
          relatoriosDesejados: formState.relatoriosDesejados,
          relatoriosDescritivo: formState.relatoriosDescritivo,
          tabelaZeroParcerias: formState.tabelaZeroParcerias,
        };

        setSalvando(true);
        setErroSalvar(null);
        try {
          await addDiagnostico(newDiag);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Erro ao salvar diagnóstico";
          setErroSalvar(msg);
          setSalvando(false);
          // NÃO avança de etapa — diagnóstico não foi salvo
          return;
        }
        setSalvando(false);
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
        {/* Simulação Banner */}
        {isSimulacao && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6]">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>science</span>
            <span className="font-medium">Modo Simulação</span>
            <span className="text-xs text-[#8b5cf6]/60">— estes dados não afetam o BI</span>
          </div>
        )}
        {/* Progress Bar */}
        <ProgressBar etapaAtual={etapaAtual} />

        {/* Step Content */}
        <div className="mb-8">
          {etapaAtual === 1 && <Step1Identificacao />}
          {etapaAtual === 2 && <Step2Cargos />}
          {etapaAtual === 3 && <Step3Detalhamento />}
          {etapaAtual === 4 && <Step4Canal />}
          {etapaAtual === 5 && <Step5Resumo />}
          {etapaAtual === 6 && <Step6Diagnostico />}
        </div>

        {/* Erro ao salvar */}
        {erroSalvar && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="material-symbols-outlined text-red-400 mt-0.5" style={{ fontSize: 18 }}>error</span>
            <div>
              <p className="text-sm font-semibold text-red-400">Falha ao salvar diagnóstico</p>
              <p className="text-xs text-red-400/70 mt-0.5">{erroSalvar}</p>
              <p className="text-xs text-red-400/60 mt-1">Verifique sua conexão e tente novamente. Nenhum dado foi perdido.</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pb-8">
          {etapaAtual > 1 && etapaAtual < 6 && (
            <button
              onClick={handlePrev}
              disabled={salvando}
              className="flex-1 py-3.5 rounded-xl text-sm font-medium transition-all text-slate-400 border border-white/[0.06] hover:bg-white/5 disabled:opacity-40"
            >
              Voltar
            </button>
          )}

          {etapaAtual < 6 && (
            <button
              onClick={handleNext}
              disabled={!canAdvance() || salvando}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
              style={{
                background: etapaAtual === 5
                  ? "#f59e0b"
                  : "#ec1313",
                boxShadow: canAdvance() && !salvando
                  ? etapaAtual === 5
                    ? "0 4px 16px rgba(245, 158, 11, 0.3)"
                    : "0 4px 16px rgba(236, 19, 19, 0.3)"
                  : "none",
              }}
            >
              {salvando
                ? "Salvando…"
                : etapaAtual === 5
                  ? "Gerar Diagnóstico"
                  : "Avançar"}
            </button>
          )}

          {etapaAtual === 6 && (
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
