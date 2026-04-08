"use client";
import { useState, useMemo, useRef } from "react";
import { useDiagData } from "@/lib/diagnostico-context";

// ── Constants ──────────────────────────────────────────────────
const PLANO_ANUAL = 57295.20;
const PLANO_MENSAL = 4774.60;

// ── Format helpers ─────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

const fmtN = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.round(v || 0));

const fmtP = (v: number) => (v || 0).toFixed(1) + "%";

// ── Challenge / Report labels ──────────────────────────────────
const CHAL_LABELS: Record<string, string> = {
  engagement: "Baixo engajamento de corretores",
  visibility: "Falta de visibilidade das ações",
  exec_mgmt: "Falta de gestão dos executivos de parceria",
  build_team: "Construir e treinar time de parcerias",
  high_demand: "Alta demanda de solicitações dos corretores",
  turnover: "Alto giro de corretores",
  training: "Falta de capacitação dos corretores",
  competition: "Concorrência com outras incorporadoras",
  product: "Corretores não conhecem o produto",
  crm: "Sem gestão de carteira (Ouro/Prata/Bronze)",
  data_loss: "Histórico perdido quando executivo sai",
};

const RPT_LABELS: Record<string, string> = {
  engagement: "Engajamento por corretor/imobiliária",
  exec_kpi: "KPIs por executivo de parceria",
  vgv_exec: "VGV por executivo/gerente",
  portfolio: "Carteira Ouro/Prata/Bronze",
  other: "Outro",
};

const TZ_LABELS: Record<string, string> = {
  house: "Canal House",
  parcerias: "House + Parcerias",
  imobiliarias: "Imobiliárias parceiras selecionadas",
  todos: "Todos ao mesmo tempo",
};

const TOOLS_DEF = [
  { k: "toolsWhatsapp", l: "WhatsApp pessoal / grupos avulsos" },
  { k: "toolsWhatsappBiz", l: "WhatsApp Business sem API oficial" },
  { k: "toolsEmail", l: "E-mail marketing" },
  { k: "toolsDrive", l: "Google Drive" },
  { k: "toolsIntranet", l: "Intranet / portal próprio" },
  { k: "toolsExcel", l: "Planilhas Excel / Google Sheets" },
  { k: "toolsOfficialCRM", l: "CRM focado em contratos" },
  { k: "toolsUnofficial", l: "Apps/ferramentas não homologadas" },
];

// ── Calc engine (same as original app.js) ──────────────────────
interface CalcResult {
  te: number;
  dc: number;
  nc: number;
  nct: number;
  nteNeeded: number;
  dcNovo: number;
  gap: number;
  vgvPorCorretor: number;
  corretoresAdicionar: number;
  planoAnual: number;
  planoMensal: number;
  retornoPorCorretor: number;
  corretoresParaPagarPlano: number | null;
  retornoTotal: number;
  totalToolCost: number;
  nTools: number;
  unids: number | null;
}

function calcDiag(d: {
  totalVGV: number;
  vgvGoal: number;
  avgTicket: number;
  totalBrokers: number;
  activeBrokers: number;
  hasCRM: boolean;
  toolCosts: Record<string, number>;
  ferramentas: string[];
}): CalcResult {
  const te = d.totalBrokers > 0 ? (d.activeBrokers / d.totalBrokers) * 100 : 0;
  const dc = d.totalVGV > 0 ? d.activeBrokers / (d.totalVGV / 1e6) : 0;
  const nc = d.vgvGoal > 0 ? dc * (d.vgvGoal / 1e6) : 0;
  const nct = te > 0 ? nc / (te / 100) : 0;
  const nteNeeded = d.totalBrokers > 0 ? (nc / d.totalBrokers) * 100 : 0;
  const dcNovo =
    d.vgvGoal > 0 && d.activeBrokers > 0
      ? 1e6 / (d.vgvGoal / d.activeBrokers)
      : 0;
  const gap = d.vgvGoal - d.totalVGV;
  const vgvPorCorretor = d.activeBrokers > 0 ? d.totalVGV / d.activeBrokers : 0;
  const corretoresAdicionar = Math.max(0, Math.ceil(nc - d.activeBrokers));
  const planoAnual = PLANO_ANUAL;
  const planoMensal = PLANO_MENSAL;
  const retornoPorCorretor = vgvPorCorretor;
  const corretoresParaPagarPlano =
    vgvPorCorretor > 0 ? Math.ceil(planoAnual / vgvPorCorretor) : null;
  const retornoTotal = corretoresAdicionar * vgvPorCorretor;
  const totalToolCost =
    Object.values(d.toolCosts || {}).reduce((a, b) => a + (b || 0), 0) * 12;
  const nTools = d.ferramentas.length + (!d.hasCRM ? 1 : 0);
  const unids = d.avgTicket > 0 ? Math.ceil(gap / d.avgTicket) : null;

  return {
    te,
    dc,
    nc,
    nct,
    nteNeeded,
    dcNovo,
    gap,
    vgvPorCorretor,
    corretoresAdicionar,
    planoAnual,
    planoMensal,
    retornoPorCorretor,
    corretoresParaPagarPlano,
    retornoTotal,
    totalToolCost,
    nTools,
    unids,
  };
}

// ── Accordion section ──────────────────────────────────────────
function Section({
  number,
  title,
  tag,
  tagColor,
  children,
  defaultOpen = false,
}: {
  number: number;
  title: string;
  tag: string;
  tagColor?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <h3 className="text-sm font-bold text-white">
          {number} &middot; {title}
        </h3>
        <div className="flex items-center gap-3">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
            style={{
              background:
                tagColor === "r"
                  ? "rgba(239,68,68,0.12)"
                  : tagColor === "a"
                  ? "rgba(245,158,11,0.12)"
                  : tagColor === "g"
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(255,255,255,0.06)",
              color:
                tagColor === "r"
                  ? "#ef4444"
                  : tagColor === "a"
                  ? "#f59e0b"
                  : tagColor === "g"
                  ? "#10b981"
                  : "#94a3b8",
            }}
          >
            {tag}
          </span>
          <span
            className="text-slate-500 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            &#9662;
          </span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function FormulaBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-xs font-mono"
      style={{
        background: "rgba(236,19,19,0.04)",
        border: "1px solid rgba(236,19,19,0.1)",
        color: "rgba(255,255,255,0.8)",
      }}
    >
      {children}
    </div>
  );
}

function Commentary({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return (
    <div
      className="text-xs leading-relaxed"
      style={{ color: green ? "rgba(16,185,129,0.85)" : "rgba(255,255,255,0.6)" }}
    >
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="flex-1 min-w-[140px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 14px" }}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color: valueColor || "#fff" }}>{value}</div>
      <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function Step5Diagnostico() {
  const { formState } = useDiagData();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Collect all unique tools from cargos
  const allTools = useMemo(() => {
    const set = new Set<string>();
    formState.cargos
      .filter((c) => c.existe)
      .forEach((c) => c.ferramentas.forEach((f) => set.add(f)));
    return Array.from(set);
  }, [formState.cargos]);

  // Derive CRM info from cargos
  const hasCRM = formState.hasCRM ?? formState.cargos.some((c) => c.crmNome && c.crmNome.length > 0);
  const crmName = formState.crmName ?? formState.cargos.find((c) => c.crmNome)?.crmNome ?? "";

  // Build calc input
  const calcInput = useMemo(
    () => ({
      totalVGV: formState.totalVGV ?? 0,
      vgvGoal: formState.vgvGoal ?? 0,
      avgTicket: formState.avgTicket ?? 0,
      totalBrokers: formState.totalBrokers ?? 0,
      activeBrokers: formState.activeBrokers ?? 0,
      hasCRM,
      toolCosts: formState.toolCosts ?? {},
      ferramentas: allTools,
    }),
    [formState, hasCRM, allTools]
  );

  const r = useMemo(() => calcDiag(calcInput), [calcInput]);

  const teColor = r.te < 15 ? "r" : r.te < 30 ? "a" : "g";
  const teLabel = r.te < 15 ? "Critica" : r.te < 30 ? "Regular" : "Boa";

  const chalLabels = (formState.challenges ?? []).map(
    (k) => CHAL_LABELS[k] || k
  );
  const rptLabels = (formState.desiredReports ?? formState.relatoriosDesejados ?? []).map(
    (k) => RPT_LABELS[k] || k
  );
  const tzTxt = (formState.tabelaZeroAccess ?? [])
    .map((k) => TZ_LABELS[k] || k)
    .join(", ");
  const hasTZ = formState.tabelaZero ?? formState.tabelaZeroParcerias ?? false;

  // Tool badges from TOOLS_DEF that are active
  const activeToolDefs = TOOLS_DEF.filter((t) =>
    allTools.some(
      (f) =>
        f.toLowerCase().includes(t.l.split(" ")[0].toLowerCase()) ||
        (formState as unknown as Record<string, unknown>)[t.k] === true
    )
  );

  // ── AI analysis stub ─────────────────────────────────────────
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    try {
      // Placeholder for AI analysis API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setAiAnalysis(
        `A ${formState.empresa.nome || "incorporadora"} apresenta uma taxa de engajamento de ${fmtP(r.te)}, ` +
          `classificada como ${teLabel.toLowerCase()}. Com ${fmtN(calcInput.totalBrokers)} corretores cadastrados e apenas ` +
          `${fmtN(calcInput.activeBrokers)} ativos, existe um gap significativo de ativação. ` +
          `A DWV pode ativar os ${fmtN(r.corretoresAdicionar)} corretores necessários para atingir a meta de ${fmt(calcInput.vgvGoal)}, ` +
          `gerando um retorno potencial de ${fmt(r.retornoTotal)} em VGV adicional.`
      );
    } catch {
      setAiAnalysis("Erro ao gerar análise. Tente novamente.");
    } finally {
      setAiLoading(false);
    }
  };

  // ── PDF download ─────────────────────────────────────────────
  const handleDownloadPDF = () => {
    window.print();
  };

  // ── Expand all sections ──────────────────────────────────────
  const [allExpanded, setAllExpanded] = useState(false);
  const handleExpandAll = () => {
    setAllExpanded(!allExpanded);
    // Force re-render with all sections open
    // We do this through a key trick below
  };

  // Using a key to force sections to remount with new defaultOpen
  const sectionKey = allExpanded ? "expanded" : "collapsed";

  return (
    <div className="space-y-4" ref={reportRef}>
      {/* ═══ HEADER ═══ */}
      <div className="text-center mb-4">
        <span
          className="material-symbols-outlined mb-2 block"
          style={{ fontSize: 40, color: "#ec1313" }}
        >
          assessment
        </span>
        <h2 className="text-xl font-bold text-white">Diagnostico Gerado</h2>
        <p className="text-sm mt-1 text-slate-500">
          {formState.empresa.nome} — {formState.empresa.cidade}/
          {formState.empresa.estado}
        </p>
      </div>

      {/* ═══ RESUMO EXECUTIVO (always visible, not collapsible) ═══ */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(236,19,19,0.06) 0%, rgba(20,20,20,1) 100%)",
          border: "1px solid rgba(236,19,19,0.15)",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-4">
          Resumo Executivo &middot; {formState.empresa.nome || "Incorporadora"} &middot;{" "}
          {formState.empresa.cidade}/{formState.empresa.estado}
        </div>

        {/* KPI Cards */}
        <div className="flex flex-wrap gap-3 mb-5">
          <KpiCard
            label="VGV Atual (12m)"
            value={fmt(calcInput.totalVGV)}
            sub="Canal parcerias"
          />
          <KpiCard
            label="Meta de VGV"
            value={fmt(calcInput.vgvGoal)}
            sub={`Gap de ${fmt(r.gap)}`}
            valueColor="#ec1313"
          />
          <KpiCard
            label="Taxa de Engajamento"
            value={fmtP(r.te)}
            sub={`${teLabel} · ${fmtN(calcInput.activeBrokers)} de ${fmtN(calcInput.totalBrokers)}`}
            valueColor={
              teColor === "r"
                ? "#ef4444"
                : teColor === "a"
                ? "#f59e0b"
                : "#10b981"
            }
          />
          <KpiCard
            label="Corretores a Ativar"
            value={fmtN(r.corretoresAdicionar)}
            sub="Meta da DWV"
            valueColor="#ec1313"
          />
        </div>

        {/* Narrative */}
        <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
          A <strong className="text-white">{formState.empresa.nome || "incorporadora"}</strong> tem{" "}
          <strong className="text-white">{fmtN(calcInput.totalBrokers)} corretores</strong>{" "}
          cadastrados, mas apenas{" "}
          <strong className="text-white">
            {fmtN(calcInput.activeBrokers)} ({fmtP(r.te)})
          </strong>{" "}
          venderam — engajamento <strong className="text-white">{teLabel.toLowerCase()}</strong>.
          Para atingir <strong className="text-white">{fmt(calcInput.vgvGoal)}</strong>, a DWV
          precisa ativar mais{" "}
          <strong className="text-white">{fmtN(r.corretoresAdicionar)} corretores</strong>. Cada
          corretor ativado representa em media{" "}
          <strong className="text-white">{fmt(r.vgvPorCorretor)}</strong> em VGV.
          {chalLabels.length > 0 && (
            <>
              {" "}
              Principais desafios:{" "}
              <strong className="text-white">{chalLabels.slice(0, 3).join(", ")}</strong>.
            </>
          )}
        </div>
      </div>

      {/* ═══ AI ANALYSIS BUTTON ═══ */}
      <div className="flex justify-center">
        <button
          onClick={handleAiAnalysis}
          disabled={aiLoading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          style={{
            background: aiLoading
              ? "rgba(139,92,246,0.08)"
              : "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.25)",
            color: "#a78bfa",
          }}
        >
          {aiLoading ? (
            <>
              <span className="animate-spin">&#9696;</span>
              Gerando analise...
            </>
          ) : (
            <>&#10024; Gerar Analise com IA</>
          )}
        </button>
      </div>

      {aiAnalysis && (
        <div
          className="rounded-2xl p-5 text-xs leading-relaxed"
          style={{
            background: "rgba(139,92,246,0.04)",
            border: "1px solid rgba(139,92,246,0.12)",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span style={{ color: "#a78bfa" }}>&#10024;</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a78bfa]">
              Analise IA
            </span>
          </div>
          {aiAnalysis}
        </div>
      )}

      {/* ═══ SECTION 1: TAXA DE ENGAJAMENTO ═══ */}
      <Section
        key={`s1-${sectionKey}`}
        number={1}
        title="Taxa de Engajamento (TE)"
        tag={`${teLabel} · ${fmtP(r.te)}`}
        tagColor={teColor}
        defaultOpen={allExpanded}
      >
        <FormulaBox>
          TE = ({fmtN(calcInput.activeBrokers)} / {fmtN(calcInput.totalBrokers)}) x 100 ={" "}
          {fmtP(r.te)}
        </FormulaBox>
        <Commentary>
          Apenas {fmtP(r.te)} da base vendeu nos ultimos 12 meses.{" "}
          {r.te < 15
            ? "Nivel critico — a maioria da base esta inativa."
            : r.te < 30
            ? "Nivel regular — ha espaco para ativar inativos."
            : "Bom engajamento — foco em crescimento de base."}
        </Commentary>
      </Section>

      {/* ═══ SECTION 2: DELTA DE CORRETORES ═══ */}
      <Section
        key={`s2-${sectionKey}`}
        number={2}
        title="Delta de Corretores por Milhao (DC)"
        tag={`${r.dc.toFixed(2)} corretores/M`}
        defaultOpen={allExpanded}
      >
        <FormulaBox>
          DC = {fmtN(calcInput.activeBrokers)} / ({fmt(calcInput.totalVGV)} / 1M) ={" "}
          {r.dc.toFixed(2)} corretores/M
        </FormulaBox>
        <Commentary>
          Sao necessarios {r.dc.toFixed(2)} corretores ativos para gerar R$ 1 milhao em VGV. Cada
          corretor ativado vale em media <strong>{fmt(r.vgvPorCorretor)}</strong>.
        </Commentary>
      </Section>

      {/* ═══ SECTION 3: CORRETORES NECESSÁRIOS ═══ */}
      <Section
        key={`s3-${sectionKey}`}
        number={3}
        title="Corretores Necessarios para a Meta"
        tag={`${fmtN(r.nc)} corretores ativos`}
        defaultOpen={allExpanded}
      >
        <FormulaBox>
          NC = ({fmt(calcInput.vgvGoal)} / 1M) x {r.dc.toFixed(2)} = {fmtN(r.nc)} corretores
          ativos
        </FormulaBox>
        <Commentary>
          Para atingir {fmt(calcInput.vgvGoal)}, a incorporadora precisa de{" "}
          <strong>{fmtN(r.nc)} corretores engajados</strong>. Hoje tem{" "}
          {fmtN(calcInput.activeBrokers)} — a DWV precisa ativar mais{" "}
          <strong>{fmtN(r.corretoresAdicionar)}</strong>.
        </Commentary>
      </Section>

      {/* ═══ SECTION 4: 3 ROTAS ESTRATÉGICAS ═══ */}
      <Section
        key={`s4-${sectionKey}`}
        number={4}
        title="3 Rotas Estrategicas"
        tag="Como atingir a meta"
        defaultOpen={allExpanded}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Rota A */}
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "rgba(236,19,19,0.04)",
              border: "1px solid rgba(236,19,19,0.1)",
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#ec1313] mb-1">
              Rota A
            </div>
            <div className="text-xs text-slate-400 mb-2">Aumentar Engajamento</div>
            <div className="text-lg font-bold text-white">{fmtP(r.nteNeeded)}</div>
            <div className="text-[10px] text-slate-600 mt-1">
              Nova TE mantendo base de {fmtN(calcInput.totalBrokers)}. Hoje: {fmtP(r.te)}.
            </div>
          </div>
          {/* Rota B */}
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "rgba(245,158,11,0.04)",
              border: "1px solid rgba(245,158,11,0.1)",
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b] mb-1">
              Rota B
            </div>
            <div className="text-xs text-slate-400 mb-2">Crescer a Base</div>
            <div className="text-lg font-bold text-white">{fmtN(r.nct)}</div>
            <div className="text-[10px] text-slate-600 mt-1">
              Total necessario mantendo TE atual. Hoje: {fmtN(calcInput.totalBrokers)}.
            </div>
          </div>
          {/* Rota C */}
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: "rgba(16,185,129,0.04)",
              border: "1px solid rgba(16,185,129,0.1)",
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#10b981] mb-1">
              Rota C
            </div>
            <div className="text-xs text-slate-400 mb-2">Aumentar Produtividade</div>
            <div className="text-lg font-bold text-white">{r.dcNovo.toFixed(2)}/M</div>
            <div className="text-[10px] text-slate-600 mt-1">
              DC necessario com base e TE atuais. Hoje: {r.dc.toFixed(2)}/M.
            </div>
          </div>
        </div>
        <Commentary>
          A DWV atua nas 3 rotas: ativa inativos via WhatsApp API + campanhas (A), expande base via
          Meta Ads (B) e aumenta produtividade com CRM, Tabela Zero e treinamento (C).
        </Commentary>
      </Section>

      {/* ═══ SECTION 5: ORGANOGRAMA E FLUXOS ═══ */}
      <Section
        key={`s5-${sectionKey}`}
        number={5}
        title="Organograma e Fluxos · Canal Parcerias"
        tag="Sem DWV vs. Com DWV"
        defaultOpen={allExpanded}
      >
        {/* --- Organograma Atual (Sem DWV) --- */}
        <p className="text-[11px] uppercase tracking-[0.07em] text-slate-500 mb-2">Organograma atual — sem DWV</p>
        <div className="space-y-0">
          {/* Direção */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Direção</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Dir. de Parceria</span>
            </div>
          </div>
          <div className="text-center text-slate-600 text-lg ml-24">↓</div>
          {/* Gerência */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Gerência</span>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const gerCargo = formState.cargos.find(c => c.id.includes('gerente'));
                const qty = gerCargo?.quantidade || 1;
                return Array.from({length: qty}).map((_, i) => (
                  <span key={`ger-${i}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    Ger. Parceria {qty > 1 ? i + 1 : ''}
                  </span>
                ));
              })()}
              {formState.cargos.find(c => c.id.includes('marketing')) && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Marketing</span>
              )}
            </div>
          </div>
          {/* Executivos */}
          {(() => {
            const execCargo = formState.cargos.find(c => c.id.includes('executivo'));
            if (!execCargo) return null;
            const qty = execCargo.quantidade || 1;
            return (
              <>
                <div className="text-center text-slate-600 text-lg ml-24">↓</div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Executivos</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({length: Math.min(qty, 8)}).map((_, i) => (
                      <span key={`exec-${i}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                        Exec. {i + 1}
                      </span>
                    ))}
                    {qty > 8 && <span className="px-3 py-1.5 rounded-lg text-xs text-slate-500">+{qty - 8}</span>}
                  </div>
                </div>
              </>
            );
          })()}
          <div className="text-center text-slate-600 text-lg ml-24">↓</div>
          {/* Base de Corretores */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Base</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">{fmtN(calcInput.totalBrokers)} cadastrados</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">{fmtN(calcInput.activeBrokers)} ativos ({fmtP(r.te)})</span>
            </div>
          </div>
        </div>

        {/* --- Fluxo atual --- */}
        <p className="text-[11px] uppercase tracking-[0.07em] text-slate-500 mt-5 mb-2">Fluxo atual — canal cego</p>
        <div className="flex flex-wrap items-center gap-1">
          {[
            { t: 'Captação', d: 'Manual. Sem rastreio.' },
            { t: 'Cadastro', d: 'Planilha. Sem segmentação.' },
            { t: 'Comunicação', d: 'WhatsApp pessoal.' },
            { t: 'Proposta', d: 'Sem visibilidade.' },
            { t: 'Resultado', d: 'Só na mesa de propostas.' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15">
                <div className="text-[11px] font-bold text-red-400">{s.t}</div>
                <div className="text-[10px] text-slate-500">{s.d}</div>
              </div>
              {i < 4 && <span className="text-slate-600 text-sm">→</span>}
            </div>
          ))}
        </div>

        {/* --- Organograma com DWV --- */}
        <p className="text-[11px] uppercase tracking-[0.07em] text-slate-500 mt-5 mb-2">Organograma com Operadora DWV</p>
        <div className="space-y-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Direção</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Dir. de Parceria</span>
            </div>
          </div>
          <div className="text-center text-slate-600 text-lg ml-24">↓</div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Gerência</span>
            <div className="flex flex-wrap gap-1.5">
              {(() => {
                const gerCargo = formState.cargos.find(c => c.id.includes('gerente'));
                const qty = gerCargo?.quantidade || 1;
                return Array.from({length: qty}).map((_, i) => (
                  <span key={`ger2-${i}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    Ger. {qty > 1 ? i + 1 : 'Parceria'}
                  </span>
                ));
              })()}
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Operadora DWV ↔ Gerentes</span>
            </div>
          </div>
          {(() => {
            const execCargo = formState.cargos.find(c => c.id.includes('executivo'));
            if (!execCargo) return null;
            const qty = execCargo.quantidade || 1;
            return (
              <>
                <div className="text-center text-slate-600 text-lg ml-24">↓</div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Executivos</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({length: Math.min(qty, 8)}).map((_, i) => (
                      <span key={`exec2-${i}`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                        Exec. {i + 1}
                      </span>
                    ))}
                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Suporte Op.</span>
                  </div>
                </div>
              </>
            );
          })()}
          <div className="text-center text-slate-600 text-lg ml-24">↓</div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 w-24 text-right shrink-0">Base Segmentada</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Ouro — já venderam</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-400/10 text-slate-300 border border-slate-400/20">Prata — engajados</span>
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-800/10 text-orange-400 border border-orange-800/20">Bronze — inativos</span>
            </div>
          </div>
        </div>

        {/* --- Fluxo com DWV --- */}
        <p className="text-[11px] uppercase tracking-[0.07em] text-slate-500 mt-5 mb-2">Fluxo com Operadora DWV</p>
        <div className="flex flex-wrap items-center gap-1">
          {[
            { t: 'Captação', d: 'Meta Ads → CRM DWV.' },
            { t: 'Classificação', d: 'Bronze/Prata/Ouro auto.' },
            { t: 'Ativação', d: 'WhatsApp API + e-mail.' },
            { t: 'Proposta', d: 'Rastreada em tempo real.' },
            { t: 'BI Completo', d: 'Exec / Gerente / Diretoria.' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <div className="text-[11px] font-bold text-emerald-400">{s.t}</div>
                <div className="text-[10px] text-slate-500">{s.d}</div>
              </div>
              {i < 4 && <span className="text-slate-600 text-sm">→</span>}
            </div>
          ))}
        </div>

        <Commentary>
          A Operadora DWV não é subordinada — atua <strong>lateralmente</strong> com gerentes e diretores, entregando inteligência de dados que hoje não existe no canal.
        </Commentary>

        {/* Problems Panel (only in "atual" tab) */}
        {formState.problemas.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(236, 19, 19, 0.03)",
              border: "1px solid rgba(236, 19, 19, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "#ef4444" }}
              >
                warning
              </span>
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: "#ef4444" }}
              >
                Pontos Cegos Identificados
              </h3>
            </div>
            <div className="space-y-2">
              {formState.problemas.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                  style={{ color: "#ff9999" }}
                >
                  <span
                    className="material-symbols-outlined shrink-0 mt-0.5"
                    style={{ fontSize: 12, color: "#ef4444" }}
                  >
                    error
                  </span>
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DWV Benefits (only in "dwv" tab) */}
        {(
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(16, 185, 129, 0.03)",
              border: "1px solid rgba(16, 185, 129, 0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "#10b981" }}
              >
                verified
              </span>
              <h3
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: "#10b981" }}
              >
                Ganhos com a Operadora DWV
              </h3>
            </div>
            <div className="space-y-2">
              {[
                "Captacao qualificada via Meta Ads com tracking completo",
                "CRM dedicado a parcerias com perfil de engajamento",
                "Carteiras classificadas (Ouro/Prata/Bronze) por potencial",
                "SLA de ativacao com alertas automaticos",
                "Relatorios em tempo real para cada nivel hierarquico",
                "Historico de relacionamento protegido (independe do executivo)",
                "Visibilidade total do funil de parcerias",
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                  style={{ color: "#7dd3a8" }}
                >
                  <span
                    className="material-symbols-outlined shrink-0 mt-0.5"
                    style={{ fontSize: 12, color: "#10b981" }}
                  >
                    check_circle
                  </span>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        )}

        <Commentary>
          A Operadora DWV nao e subordinada — atua <strong>lateralmente</strong> com gerentes e
          diretores, entregando inteligencia de dados que hoje nao existe no canal.
        </Commentary>
      </Section>

      {/* ═══ SECTION 6: TECNOLOGIA E FERRAMENTAS ═══ */}
      <Section
        key={`s6-${sectionKey}`}
        number={6}
        title="Tecnologia e Ferramentas"
        tag={`${r.nTools} desconectadas`}
        defaultOpen={allExpanded}
      >
        {!hasCRM ? (
          <Commentary>
            Sem CRM voltado para parceiros. Canal opera sem rastreamento de acoes por corretor.
          </Commentary>
        ) : (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            CRM em uso:{" "}
            <strong className="text-white">{crmName || "nao especificado"}</strong> — focado em
            contratos, nao em gestao de corretores.
          </div>
        )}

        {/* Tool badges */}
        <div className="flex flex-wrap gap-2">
          {allTools.map((tool) => {
            const cost = (formState.toolCosts ?? {})[tool];
            return (
              <span
                key={tool}
                className="text-[10px] px-3 py-1.5 rounded-lg font-medium"
                style={{
                  background: "rgba(236,19,19,0.06)",
                  border: "1px solid rgba(236,19,19,0.12)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {tool}
                {cost ? ` · ${fmt(cost * 12)}/ano` : ""}
              </span>
            );
          })}
          {!hasCRM && (
            <span
              className="text-[10px] px-3 py-1.5 rounded-lg font-medium"
              style={{
                background: "rgba(236,19,19,0.06)",
                border: "1px solid rgba(236,19,19,0.12)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              Sem CRM de parceiros
            </span>
          )}
        </div>

        {r.totalToolCost > 0 && (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Custo anual estimado com essas ferramentas:{" "}
            <strong className="text-white">{fmt(r.totalToolCost)}</strong>
          </div>
        )}

        <Commentary>
          A DWV substitui <strong>{r.nTools} ferramentas desconectadas</strong> em um unico ambiente
          integrado — WhatsApp API, e-mail com rastreio, CRM de parceiros, eventos com QR, trafego
          pago e BI completo.
        </Commentary>
      </Section>

      {/* ═══ SECTION 7: ROI ═══ */}
      <Section
        key={`s7-${sectionKey}`}
        number={7}
        title="Retorno sobre Investimento DWV"
        tag={`${fmtN(r.corretoresAdicionar)} corretores · ${fmt(r.retornoTotal)}`}
        tagColor="g"
        defaultOpen={allExpanded}
      >
        {/* Plan + VGV per broker */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Plano com Operadora DWV
            </div>
            <div className="text-xl font-medium text-white">
              {fmt(PLANO_ANUAL)}
              <span className="text-xs text-slate-500 font-normal">/ano</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              12x {fmt(PLANO_MENSAL)}/mes
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              VGV por corretor ativado
            </div>
            <div className="text-xl font-medium" style={{ color: "#ec1313" }}>
              {fmt(r.vgvPorCorretor)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">produtividade media atual</div>
          </div>
        </div>

        {/* Narrative box */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
            Meta da DWV — corretores a ativar
          </div>
          <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            A incorporadora precisa ativar{" "}
            <strong>{fmtN(r.corretoresAdicionar)} corretores</strong> para atingir a meta de VGV.
            <br />
            Cada corretor ativado gera em media <strong>{fmt(r.vgvPorCorretor)}</strong> em VGV.
            <br />
            {r.corretoresParaPagarPlano !== null && (
              <>
                {r.corretoresParaPagarPlano === 1
                  ? "Com apenas 1 corretor ativado pela DWV o investimento anual ja se paga."
                  : `Com apenas ${r.corretoresParaPagarPlano} corretores ativados o investimento anual ja se paga.`}
                <br />
              </>
            )}
            {r.retornoTotal > 0 && (
              <>
                Se a DWV conseguir ativar todos os{" "}
                <strong>{fmtN(r.corretoresAdicionar)} corretores necessarios</strong>, o retorno
                potencial e de <strong>{fmt(r.retornoTotal)}</strong> em VGV adicional.
              </>
            )}
          </div>
        </div>

        {/* ROI 3-column cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div
            className="rounded-xl p-3.5 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-[10px] text-slate-500 mb-1.5">Corretores p/ pagar o plano</div>
            <div className="text-2xl font-medium" style={{ color: "#ec1313" }}>
              {r.corretoresParaPagarPlano !== null ? r.corretoresParaPagarPlano : "—"}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">ponto de equilibrio</div>
          </div>
          <div
            className="rounded-xl p-3.5 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-[10px] text-slate-500 mb-1.5">Meta de ativacoes DWV</div>
            <div className="text-2xl font-medium" style={{ color: "#f59e0b" }}>
              {fmtN(r.corretoresAdicionar)}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">corretores a engajar</div>
          </div>
          <div
            className="rounded-xl p-3.5 text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="text-[10px] text-slate-500 mb-1.5">Retorno se meta atingida</div>
            <div className="text-lg font-medium" style={{ color: "#10b981" }}>
              {fmt(r.retornoTotal)}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">em VGV adicional</div>
          </div>
        </div>

        {/* Tool cost savings */}
        {r.totalToolCost > 0 && (
          <div
            className="text-xs rounded-lg px-4 py-3 mb-3"
            style={{
              background: "rgba(58,184,122,0.06)",
              border: "1px solid rgba(58,184,122,0.15)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Economia adicional ao consolidar {r.nTools} ferramentas na DWV:{" "}
            <strong style={{ color: "#10b981" }}>{fmt(r.totalToolCost)}/ano</strong>
          </div>
        )}

        <Commentary green>
          {rptLabels.length > 0 && (
            <>
              Relatorios desejados pelo cliente —{" "}
              <strong>{rptLabels.join(", ")}</strong> — todos disponiveis na plataforma DWV.
              <br />
              <br />
            </>
          )}
          {hasTZ && (
            <>
              Com <strong>Tabela Zero</strong>
              {tzTxt ? ` (acesso: ${tzTxt})` : ""}, a DWV potencializa a fidelizacao dos corretores
              Ouro, que tem acesso antecipado ao produto — aumentando a produtividade por corretor
              ativo.
            </>
          )}
        </Commentary>
      </Section>

      {/* ═══ ACTION BUTTONS ═══ */}
      <div className="flex flex-wrap gap-3 pt-4">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex-1 min-w-[120px] py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#94a3b8",
          }}
        >
          &larr; Inicio
        </button>
        <button
          onClick={handleExpandAll}
          className="flex-1 min-w-[120px] py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#94a3b8",
          }}
        >
          {allExpanded ? "Recolher Tudo" : "Expandir Tudo"}
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex-1 min-w-[120px] py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          style={{
            background: "rgba(236,19,19,0.1)",
            border: "1px solid rgba(236,19,19,0.2)",
            color: "#ec1313",
          }}
        >
          &#11015; Baixar PDF
        </button>
      </div>
    </div>
  );
}
