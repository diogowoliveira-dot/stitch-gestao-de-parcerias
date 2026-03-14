"use client";
import { useState } from "react";
import { useDiagData } from "@/lib/diagnostico-context";
import { OrganogramaSVG, FluxogramaSVG } from "./DiagramSVG";
import DiagramViewer from "./DiagramViewer";

type TabView = "atual" | "dwv";
type DiagramType = "organograma" | "fluxograma";

export default function Step5Diagnostico() {
  const { formState } = useDiagData();
  const [tab, setTab] = useState<TabView>("atual");
  const [diagram, setDiagram] = useState<DiagramType>("organograma");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <span className="material-symbols-outlined mb-2 block" style={{ fontSize: 40, color: "#ec1313" }}>assessment</span>
        <h2 className="text-xl font-bold text-white">Diagnóstico Gerado</h2>
        <p className="text-sm mt-1 text-slate-500">
          {formState.empresa.nome} — {formState.empresa.cidade}/{formState.empresa.estado}
        </p>
      </div>

      {/* Tab Selector: Atual vs DWV */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#121212] border border-white/[0.06]">
        <button
          onClick={() => setTab("atual")}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
          style={{
            background: tab === "atual" ? "rgba(239, 68, 68, 0.15)" : "transparent",
            color: tab === "atual" ? "#ef4444" : "#64748b",
            border: tab === "atual" ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid transparent",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
          Situação Atual
        </button>
        <button
          onClick={() => setTab("dwv")}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
          style={{
            background: tab === "dwv" ? "rgba(16, 185, 129, 0.15)" : "transparent",
            color: tab === "dwv" ? "#10b981" : "#64748b",
            border: tab === "dwv" ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid transparent",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
          Com Operadora DWV
        </button>
      </div>

      {/* Diagram Type + Title */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setDiagram("organograma")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: diagram === "organograma" ? "rgba(139, 92, 246, 0.1)" : "rgba(255, 255, 255, 0.04)",
              color: diagram === "organograma" ? "#8b5cf6" : "#64748b",
              border: `1px solid ${diagram === "organograma" ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.06)"}`,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>account_tree</span>
            Organograma
          </button>
          <button
            onClick={() => setDiagram("fluxograma")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: diagram === "fluxograma" ? "rgba(139, 92, 246, 0.1)" : "rgba(255, 255, 255, 0.04)",
              color: diagram === "fluxograma" ? "#8b5cf6" : "#64748b",
              border: `1px solid ${diagram === "fluxograma" ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.06)"}`,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schema</span>
            Fluxograma
          </button>
        </div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
          {diagram === "organograma" ? "Organograma" : "Fluxograma"} — {tab === "atual" ? "Situação Atual" : "Com Operadora DWV"}
        </h3>
      </div>

      {/* ═══ DIAGRAM CANVAS — full width, tall like Miro ═══ */}
      <DiagramViewer resetKey={`${tab}-${diagram}`}>
        {diagram === "organograma" ? (
          <OrganogramaSVG
            cargos={formState.cargos}
            comDWV={tab === "dwv"}
            problemas={formState.problemas}
          />
        ) : (
          <FluxogramaSVG cargos={formState.cargos} comDWV={tab === "dwv"} />
        )}
      </DiagramViewer>

      {/* Problems Panel (only in "atual" tab) */}
      {tab === "atual" && formState.problemas.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(236, 19, 19, 0.03)", border: "1px solid rgba(236, 19, 19, 0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ef4444" }}>warning</span>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
              Pontos Cegos Identificados
            </h3>
          </div>
          <div className="space-y-2">
            {formState.problemas.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "#ff9999" }}>
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 12, color: "#ef4444" }}>error</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DWV Benefits (only in "dwv" tab) */}
      {tab === "dwv" && (
        <div className="rounded-2xl p-5" style={{ background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#10b981" }}>verified</span>
            <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#10b981" }}>
              Ganhos com a Operadora DWV
            </h3>
          </div>
          <div className="space-y-2">
            {[
              "Captação qualificada via Meta Ads com tracking completo",
              "CRM dedicado a parcerias com perfil de engajamento",
              "Carteiras classificadas (Ouro/Prata/Bronze) por potencial",
              "SLA de ativação com alertas automáticos",
              "Relatórios em tempo real para cada nível hierárquico",
              "Histórico de relacionamento protegido (independe do executivo)",
              "Visibilidade total do funil de parcerias",
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "#7dd3a8" }}>
                <span className="material-symbols-outlined shrink-0 mt-0.5" style={{ fontSize: 12, color: "#10b981" }}>check_circle</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
