"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
  const verId     = searchParams.get("ver");          // modo leitura
  const versaoDe  = searchParams.get("versaoDe");     // nova versão de um diagnóstico existente
  const continuar = searchParams.get("continuar");    // retomar rascunho salvo
  const isSimulacao = searchParams.get("simulacao") === "true";

  const { user } = useDiagAuth();
  const { formState, dispatch, diagnosticos, addDiagnostico, refreshDiagnosticos } = useDiagData();

  // Estados de save final (completo)
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // Estados de rascunho
  const [rascunhoId, setRascunhoId] = useState<string | null>(null);
  const rascunhoIdRef = useRef<string | null>(null);   // ref síncrono — evita race conditions
  const isSavingDraftRef = useRef(false);              // impede saves paralelos
  const [salvandoRascunho, setSalvandoRascunho] = useState(false);
  const [rascunhoSalvoEm, setRascunhoSalvoEm] = useState<Date | null>(null);
  const [erroRascunho, setErroRascunho] = useState<string | null>(null);
  const [versaoDeNome, setVersaoDeNome] = useState<string | null>(null);
  const [continuarNome, setContinuarNome] = useState<string | null>(null);

  // Helpers
  const setDraftId = (id: string) => {
    rascunhoIdRef.current = id;
    setRascunhoId(id);
  };

  // ── Modo leitura (ver=) ─────────────────────────────────────────────────────
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

  // ── Nova versão (versaoDe=) ──────────────────────────────────────────────────
  useEffect(() => {
    if (versaoDe) {
      const pai = diagnosticos.find((d) => d.id === versaoDe);
      if (pai) {
        setVersaoDeNome(pai.empresa.nome);
        dispatch({
          type: "LOAD",
          data: {
            etapaAtual: 1,
            empresa: pai.empresa,
            cargos: pai.cargos,
            cargoAtualIndex: 0,
            problemas: [],
            outputGerado: false,
            responsibleName: pai.responsavelNome,
            responsibleRole: pai.responsavelCargo,
            totalVGV: pai.totalVGV,
            vgvGoal: pai.vgvGoal,
            avgTicket: pai.avgTicket,
            totalBrokers: pai.totalBrokers,
            activeBrokers: pai.activeBrokers,
            shareHouse: pai.shareHouse,
            shareParcerias: pai.shareParcerias,
            numImobiliarias: pai.numImobiliarias,
            segmentacao: pai.segmentacao,
            segmentacaoDescritiva: pai.segmentacaoDescritiva,
            relatoriosDesejados: pai.relatoriosDesejados,
            relatoriosDescritivo: pai.relatoriosDescritivo,
            tabelaZeroParcerias: pai.tabelaZeroParcerias,
          },
        });
      }
    }
  }, [versaoDe, diagnosticos, dispatch]);

  // ── Retomar rascunho (continuar=) ───────────────────────────────────────────
  useEffect(() => {
    if (continuar) {
      const diag = diagnosticos.find((d) => d.id === continuar);
      if (diag) {
        setContinuarNome(diag.empresa.nome);
        setDraftId(continuar);
        dispatch({
          type: "LOAD",
          data: {
            etapaAtual: 1,
            empresa: diag.empresa,
            cargos: diag.cargos,
            cargoAtualIndex: 0,
            problemas: diag.problemasIdentificados || [],
            outputGerado: false,
            responsibleName: diag.responsavelNome,
            responsibleRole: diag.responsavelCargo,
            totalVGV: diag.totalVGV,
            vgvGoal: diag.vgvGoal,
            avgTicket: diag.avgTicket,
            totalBrokers: diag.totalBrokers,
            activeBrokers: diag.activeBrokers,
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
  }, [continuar, diagnosticos, dispatch]);

  const { etapaAtual } = formState;
  const cargosExistentes = formState.cargos.filter((c) => c.existe);

  // ── Salvar Rascunho ─────────────────────────────────────────────────────────
  // silent=true → fire-and-forget (auto-save ao avançar etapa)
  // silent=false → mostra spinner e erro ao usuário (botão manual)
  const salvarRascunho = useCallback(async (silent = true) => {
    if (isSavingDraftRef.current) return;
    if (!user) return;
    // Mínimo obrigatório no DB: empresaNome/Cidade/Estado
    if (!formState.empresa.nome.trim() || !formState.empresa.cidade.trim() || !formState.empresa.estado) {
      if (!silent) setErroRascunho("Preencha pelo menos o nome, cidade e estado da empresa.");
      return;
    }

    isSavingDraftRef.current = true;
    if (!silent) { setSalvandoRascunho(true); setErroRascunho(null); }

    try {
      // Calcular ferramentas e flags derivadas
      const cargosEx = formState.cargos.filter((c) => c.existe);
      const ferramentasSet = new Set<string>();
      cargosEx.forEach((c) => c.ferramentas.forEach((f) => ferramentasSet.add(f)));
      const crgNomes = cargosEx.map((c) => ({ id: c.id, nome: c.nome.toLowerCase() }));
      const crmCargoLocal = cargosEx.find((c) => c.crmNome && c.crmNome.length > 0);

      const payload = {
        empresa: formState.empresa,
        cargos: formState.cargos,
        ferramentasGerais: [...ferramentasSet],
        problemasIdentificados: formState.problemas,
        criadoPor: user.id,
        status: "rascunho",
        isSimulacao,
        parentId: versaoDe ?? undefined,
        responsavelNome: formState.responsibleName,
        responsavelCargo: formState.responsibleRole,
        totalVGV: formState.totalVGV,
        vgvGoal: formState.vgvGoal,
        avgTicket: formState.avgTicket,
        totalBrokers: formState.totalBrokers,
        activeBrokers: formState.activeBrokers,
        shareHouse: formState.shareHouse,
        shareParcerias: formState.shareParcerias,
        numImobiliarias: formState.numImobiliarias,
        segmentacao: formState.segmentacao,
        segmentacaoDescritiva: formState.segmentacaoDescritiva,
        relatoriosDesejados: formState.relatoriosDesejados,
        relatoriosDescritivo: formState.relatoriosDescritivo,
        tabelaZeroParcerias: formState.tabelaZeroParcerias,
        hasHouse: crgNomes.some((c) => c.nome.includes("house") || c.id === "cargo_house") || undefined,
        hasParc: crgNomes.some((c) => c.nome.includes("parceria") || c.id.includes("parc")) || undefined,
        hasImob: crgNomes.some((c) => c.nome.includes("imobiliária") || c.nome.includes("imobiliaria") || c.id.includes("imob")) || undefined,
        temCRM: crmCargoLocal ? true : undefined,
        crmNome: crmCargoLocal?.crmNome ?? undefined,
      };

      const existingId = rascunhoIdRef.current;

      if (existingId) {
        // Atualizar rascunho existente
        const res = await fetch("/api/diagnostico/diagnosticos", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existingId, ...payload }),
        });
        if (!res.ok) {
          if (!silent) throw new Error("Erro ao atualizar rascunho");
          console.warn("Auto-save rascunho (PUT) falhou:", res.status);
        }
      } else {
        // Criar novo rascunho
        const res = await fetch("/api/diagnostico/diagnosticos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const result = await res.json();
          setDraftId(result.id);
        } else {
          const body = await res.json().catch(() => ({}));
          if (!silent) throw new Error(body.error || "Erro ao criar rascunho");
          console.warn("Auto-save rascunho (POST) falhou:", body.error ?? res.status);
        }
      }

      setRascunhoSalvoEm(new Date());
    } catch (err) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar rascunho";
        setErroRascunho(msg);
      }
    } finally {
      isSavingDraftRef.current = false;
      if (!silent) setSalvandoRascunho(false);
    }
  }, [user, formState, isSimulacao, versaoDe]);

  // ── Validação de avanço ─────────────────────────────────────────────────────
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

  // ── Avançar / Gerar Diagnóstico ─────────────────────────────────────────────
  const handleNext = async () => {
    if (etapaAtual === 3) {
      dispatch({ type: "SET_CARGO_INDEX", index: 0 });
    }

    // Auto-save rascunho ao avançar etapas 1-4 (silencioso, não bloqueia)
    if (etapaAtual >= 1 && etapaAtual <= 4 && !verId) {
      salvarRascunho(true).catch(() => {});
    }

    if (etapaAtual === 5) {
      dispatch({ type: "GERAR_PROBLEMAS" });
      dispatch({ type: "GERAR_OUTPUT" });

      // Gerar problemas localmente para salvar
      const todasFerramentas = new Set<string>();
      cargosExistentes.forEach((c) => c.ferramentas.forEach((f) => todasFerramentas.add(f)));
      const problemas: string[] = [];
      const { PROBLEMAS_POR_FERRAMENTA } = await import("@/lib/diagnostico-mock-data");
      todasFerramentas.forEach((f) => {
        if (PROBLEMAS_POR_FERRAMENTA[f]) problemas.push(PROBLEMAS_POR_FERRAMENTA[f]);
      });
      if (todasFerramentas.size > 4) problemas.push("Estrutura com alto grau de fragmentação operacional");

      if (!verId && user) {
        // Derivar flags de canal a partir dos cargos
        const crgNomes = cargosExistentes.map((c) => ({ id: c.id, nome: c.nome.toLowerCase() }));
        const derivedHasHouse = crgNomes.some((c) => c.nome.includes("house") || c.id === "cargo_house");
        const derivedHasParc  = crgNomes.some((c) => c.nome.includes("parceria") || c.nome.includes("parcerias") || c.id.includes("parc"));
        const derivedHasImob  = crgNomes.some((c) => c.nome.includes("imobiliária") || c.nome.includes("imobiliaria") || c.id.includes("imob"));
        const crmCargo        = cargosExistentes.find((c) => c.crmNome && c.crmNome.length > 0);
        const derivedTemCRM   = !!crmCargo;
        const derivedCrmNome  = crmCargo?.crmNome ?? undefined;

        setSalvando(true);
        setErroSalvar(null);

        try {
          const currentRascunhoId = rascunhoIdRef.current;

          if (currentRascunhoId) {
            // ── Finalizar rascunho existente via PUT ────────────────────────────
            const res = await fetch("/api/diagnostico/diagnosticos", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: currentRascunhoId,
                status: "completo",
                empresa: formState.empresa,
                cargos: formState.cargos,
                ferramentasGerais: [...todasFerramentas],
                problemasIdentificados: problemas,
                responsavelNome: formState.responsibleName,
                responsavelCargo: formState.responsibleRole,
                totalVGV: formState.totalVGV,
                vgvGoal: formState.vgvGoal,
                avgTicket: formState.avgTicket,
                totalBrokers: formState.totalBrokers,
                activeBrokers: formState.activeBrokers,
                shareHouse: formState.shareHouse,
                shareParcerias: formState.shareParcerias,
                numImobiliarias: formState.numImobiliarias,
                segmentacao: formState.segmentacao,
                segmentacaoDescritiva: formState.segmentacaoDescritiva,
                relatoriosDesejados: formState.relatoriosDesejados,
                relatoriosDescritivo: formState.relatoriosDescritivo,
                tabelaZeroParcerias: formState.tabelaZeroParcerias,
                hasHouse: derivedHasHouse || undefined,
                hasParc:  derivedHasParc  || undefined,
                hasImob:  derivedHasImob  || undefined,
                temCRM:   derivedTemCRM   || undefined,
                crmNome:  derivedCrmNome,
              }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || "Erro ao finalizar diagnóstico");
            }
            await refreshDiagnosticos();
          } else {
            // ── Criar novo diagnóstico completo (fluxo original) ────────────────
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
              // Versioning
              parentId: versaoDe ?? undefined,
              // Responsável
              responsavelNome: formState.responsibleName,
              responsavelCargo: formState.responsibleRole,
              // Métricas VGV / corretores
              totalVGV: formState.totalVGV,
              vgvGoal: formState.vgvGoal,
              avgTicket: formState.avgTicket,
              totalBrokers: formState.totalBrokers,
              activeBrokers: formState.activeBrokers,
              // Canais
              shareHouse: formState.shareHouse,
              shareParcerias: formState.shareParcerias,
              numImobiliarias: formState.numImobiliarias,
              segmentacao: formState.segmentacao,
              segmentacaoDescritiva: formState.segmentacaoDescritiva,
              relatoriosDesejados: formState.relatoriosDesejados,
              relatoriosDescritivo: formState.relatoriosDescritivo,
              tabelaZeroParcerias: formState.tabelaZeroParcerias,
              // Derivados dos cargos
              hasHouse: derivedHasHouse || undefined,
              hasParc:  derivedHasParc  || undefined,
              hasImob:  derivedHasImob  || undefined,
              temCRM:   derivedTemCRM   || undefined,
              crmNome:  derivedCrmNome,
            };
            await addDiagnostico(newDiag);
          }
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

  // Mínimo para habilitar o botão de rascunho
  const canSaveDraft = !!(
    formState.empresa.nome.trim() &&
    formState.empresa.cidade.trim() &&
    formState.empresa.estado
  );

  return (
    <DiagShell
      title={verId ? "Ver Diagnóstico" : continuar ? "Retomar Rascunho" : versaoDe ? "Nova Versão" : "Novo Diagnóstico"}
      subtitle={formState.empresa.nome || "Preencha os dados"}
      icon="assignment"
      showBack
    >
      <div className="max-w-2xl mx-auto">

        {/* Banner: Retomando Rascunho */}
        {continuar && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bookmark_added</span>
            <span className="font-medium">Retomando rascunho</span>
            {continuarNome && (
              <span className="text-xs text-amber-400/60">de {continuarNome} — dados da última sessão pré-preenchidos</span>
            )}
          </div>
        )}

        {/* Banner: Nova Versão */}
        {versaoDe && !continuar && (
          <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
            <span className="font-medium">Nova versão</span>
            {versaoDeNome && (
              <span className="text-xs text-emerald-400/60">de {versaoDeNome} — dados pré-preenchidos, ajuste o necessário</span>
            )}
          </div>
        )}

        {/* Banner: Simulação */}
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

        {/* Erro ao salvar (final) */}
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

        {/* Erro ao salvar rascunho (manual) */}
        {erroRascunho && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="material-symbols-outlined text-amber-400" style={{ fontSize: 16 }}>warning</span>
            <p className="text-xs text-amber-400">{erroRascunho}</p>
            <button onClick={() => setErroRascunho(null)} className="ml-auto text-amber-400/60 hover:text-amber-400">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pb-8 items-center">

          {/* Botão Salvar Rascunho — visível nos passos 1-5 (não em modo leitura) */}
          {etapaAtual < 6 && !verId && (
            <button
              onClick={() => salvarRascunho(false)}
              disabled={salvandoRascunho || !canSaveDraft || salvando}
              className="px-4 py-3.5 rounded-xl text-xs font-medium transition-all border border-white/[0.06] hover:bg-white/5 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
              style={{ color: rascunhoSalvoEm && !salvandoRascunho ? "#10b981" : "#64748b" }}
              title={rascunhoSalvoEm ? `Rascunho salvo às ${rascunhoSalvoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Salvar progresso sem finalizar"}
            >
              {salvandoRascunho ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 15 }}>progress_activity</span>
              ) : rascunhoSalvoEm ? (
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bookmark_added</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>bookmark</span>
              )}
              {salvandoRascunho ? "Salvando…" : rascunhoSalvoEm ? "Salvo" : "Salvar rascunho"}
            </button>
          )}

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
                background: etapaAtual === 5 ? "#f59e0b" : "#ec1313",
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
