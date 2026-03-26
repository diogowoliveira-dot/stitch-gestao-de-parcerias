"use client";
import type { JSX } from "react";
import { CargoData } from "@/lib/diagnostico-mock-data";

// ============================================
// CONSTANTS & TYPES
// ============================================

const FONT = "Space Grotesk, sans-serif";

// ── Level-based color system ──
// Each hierarchical level gets a distinct, vibrant color
const LEVEL_COLORS: Record<number, { main: string; bg: string; border: string; label: string }> = {
  1: { main: "#f97316", bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.5)", label: "Nível estratégico" },   // orange
  2: { main: "#f97316", bg: "rgba(249, 115, 22, 0.12)", border: "rgba(249, 115, 22, 0.5)", label: "Nível estratégico" },   // orange (same as 1)
  3: { main: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.5)", label: "Nível gerencial" },      // blue
  4: { main: "#a855f7", bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.5)", label: "Nível operacional" },    // purple
  5: { main: "#a855f7", bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.5)", label: "Nível operacional" },    // purple (same as 4)
};

function getLevelColor(nivel: number) {
  return LEVEL_COLORS[nivel] || LEVEL_COLORS[4];
}

const COLORS = {
  bg: "#121212",
  bgCard: "rgba(24, 24, 27, 0.95)",
  border: "rgba(255, 255, 255, 0.1)",
  text: "#ffffff",
  textSub: "#cbd5e1",
  textDim: "#94a3b8",
  red: "#ef4444",
  redBg: "rgba(239, 68, 68, 0.12)",
  redBorder: "rgba(239, 68, 68, 0.4)",
  green: "#10b981",
  greenBg: "rgba(16, 185, 129, 0.12)",
  greenBorder: "rgba(16, 185, 129, 0.4)",
  amber: "#f59e0b",
  amberBg: "rgba(245, 158, 11, 0.12)",
  amberBorder: "rgba(245, 158, 11, 0.4)",
  purple: "#a855f7",
  purpleBg: "rgba(168, 85, 247, 0.12)",
  purpleBorder: "rgba(168, 85, 247, 0.4)",
  teal: "#14b8a6",
  tealBg: "rgba(20, 184, 166, 0.12)",
  tealBorder: "rgba(20, 184, 166, 0.4)",
  // Visible connection lines
  lineHierarchy: "#6b7280",       // gray-500 — very visible
  lineHierarchyWidth: 2,
  operadoraMain: "#ec1313",       // DWV red
};

// ============================================
// TEXT WRAPPING UTILITY
// ============================================

/** Wraps text at word boundaries (spaces, ·, —) instead of cutting mid-word.
 *  Returns an array of lines, each fitting within maxChars. */
function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const separators = /(\s+|·|—)/;
  const words = text.split(separators).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current + word;
    if (test.length > maxChars && current.length > 0) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current = test;
    }
  }
  if (current.trim()) lines.push(current.trimEnd());
  return lines;
}

/** Truncate text at word boundary with ellipsis */
function truncateAtWord(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  const lastSep = Math.max(lastSpace, truncated.lastIndexOf("·"), truncated.lastIndexOf("—"));
  if (lastSep > maxChars * 0.4) {
    return truncated.slice(0, lastSep).trimEnd() + "…";
  }
  return truncated.trimEnd() + "…";
}

// ============================================
// HELPERS
// ============================================

function getNivel(cargo: CargoData): number {
  if (cargo.nome.includes("Diretor de Parceria") || cargo.nome.includes("Diretor")) return 1;
  if (cargo.nome.includes("Gerente") || cargo.nome.includes("Marketing")) return 3;
  if (cargo.nome.includes("Executivo")) return 4;
  return 4;
}

function getNivelLabel(nivel: number): string {
  return getLevelColor(nivel).label;
}

function getResumoPrincipalTarefa(cargo: CargoData): string {
  if (cargo.tarefas.length === 0) return "";
  return truncateAtWord(cargo.tarefas[0], 40);
}

function shortFerramenta(f: string): string {
  if (f.includes("E-mail marketing")) return "E-mail mkt";
  if (f.includes("CRM interno")) return "CRM interno";
  if (f.includes("Excel") || f.includes("Planilhas")) return "Excel/Sheets";
  if (f.includes("Google Drive")) return "Drive/Intranet";
  if (f.includes("WhatsApp")) return "WhatsApp";
  if (f.includes("não oficial") || f.includes("disparo")) return "Disparo massa";
  if (f.includes("Propostas") || f.includes("canais variados")) return "Propostas variadas";
  return truncateAtWord(f, 18);
}

function getProblemaFerramenta(f: string): string {
  if (f.includes("E-mail marketing")) return "Sem taxa de abertura · Sem mapeamento de quem leu";
  if (f.includes("CRM interno")) return "Feito para fluxo de venda — não para gestão de parceiros";
  if (f.includes("Excel") || f.includes("Planilhas")) return "Sistema pouco amistoso · Sem visão de carteira em tempo real";
  if (f.includes("Google Drive")) return "Sem rastreamento de acesso · Pouco amigável ao corretor";
  if (f.includes("WhatsApp")) return "Conversa misturada · Histórico some quando o executivo sai";
  if (f.includes("não oficial") || f.includes("disparo")) return "Risco real de banimento do chip";
  if (f.includes("Propostas") || f.includes("canais variados")) return "Sem rastreamento por executivo · Gerente não sabe a origem";
  return "Sem visibilidade";
}

function getPontoCego(nivel: number): { titulo: string; texto: string } {
  if (nivel <= 2) return { titulo: "Ponto cego", texto: "Só vê VGV vendido. Nada mais." };
  if (nivel === 3) return { titulo: "Ponto cego", texto: "Só vê propostas na mesa. Ações dos executivos: invisíveis." };
  return { titulo: "Ponto cego", texto: "Sem dados em tempo real da carteira." };
}

function getVisibilidadeDWV(nivel: number): { titulo: string; texto: string } {
  if (nivel <= 2) return { titulo: "Visibilidade total", texto: "Relatório geral de performance · VGV · Funil completo" };
  if (nivel === 3) return { titulo: "Visibilidade total", texto: "BI por carteira de cada executivo · KPIs · Propostas" };
  return { titulo: "Visibilidade total", texto: "Corretores ativos · Próximos da venda · Histórico" };
}

// ============================================
// SVG BUILDING BLOCKS
// ============================================

function SvgDefs() {
  return (
    <defs>
      <marker id="arr" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
        <polygon points="0 0, 10 4, 0 8" fill={COLORS.lineHierarchy} />
      </marker>
      <marker id="arr-red" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
        <polygon points="0 0, 10 4, 0 8" fill={COLORS.red} />
      </marker>
      <marker id="arr-green" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
        <polygon points="0 0, 10 4, 0 8" fill={COLORS.green} />
      </marker>
      <marker id="arr-teal" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
        <polygon points="0 0, 10 4, 0 8" fill={COLORS.teal} />
      </marker>
      <marker id="arr-dwv" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
        <polygon points="0 0, 10 4, 0 8" fill={COLORS.operadoraMain} />
      </marker>
      <filter id="glow-red">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
      </filter>
    </defs>
  );
}

// Level badge — colored pill with level name
function LevelBadge({ x, y, nivel, width }: { x: number; y: number; nivel: number; width: number }) {
  const lc = getLevelColor(nivel);
  return (
    <g>
      <rect x={x} y={y} width={width} height={26} rx={13} fill={lc.bg} stroke={lc.border} strokeWidth={1.5} />
      <circle cx={x + 16} cy={y + 13} r={6} fill={lc.main} opacity={0.8} />
      <text x={x + 28} y={y + 17} fontSize="10" fontWeight="700" fill={lc.main} fontFamily={FONT}>
        {lc.label.toUpperCase()}
      </text>
    </g>
  );
}

function LegendBox({ x, y, width, comDWV }: { x: number; y: number; width: number; comDWV: boolean }) {
  const items = [
    { color: "#f97316", label: "Nível estratégico (Diretoria)" },
    { color: "#3b82f6", label: "Nível gerencial (Gerência)" },
    { color: "#a855f7", label: "Nível operacional (Execução)" },
    { color: COLORS.operadoraMain, label: comDWV ? "Operadora DWV" : "Problema identificado" },
    { color: COLORS.teal, label: "Fluxo operacional / ativação" },
    { color: COLORS.amber, label: "Tracking / dado rastreado" },
    { color: COLORS.green, label: "Canal de ativação / melhoria" },
  ];
  const lineItems = [
    { dash: "0", color: COLORS.lineHierarchy, label: "Linha hierárquica", sw: 2 },
    { dash: "6 4", color: COLORS.red, label: "Relatório / feedback loop", sw: 2 },
  ];
  const h = items.length * 24 + lineItems.length * 24 + 48;

  return (
    <g>
      <rect x={x} y={y} width={width} height={h} rx={10} fill="rgba(24, 24, 27, 0.6)" stroke={COLORS.border} strokeWidth={1} strokeDasharray="6 4" />
      <text x={x + 16} y={y + 22} fontSize="11" fontWeight="700" fill={COLORS.textSub} fontFamily={FONT}>LEGENDA</text>
      {items.map((item, i) => (
        <g key={i}>
          <rect x={x + 16} y={y + 36 + i * 24} width={14} height={14} rx={3} fill={item.color} opacity={0.8} />
          <text x={x + 38} y={y + 48 + i * 24} fontSize="11" fill={COLORS.textSub} fontFamily={FONT}>{item.label}</text>
        </g>
      ))}
      {lineItems.map((item, i) => (
        <g key={`l${i}`}>
          <line x1={x + 16} y1={y + 36 + items.length * 24 + i * 24 + 7} x2={x + 30} y2={y + 36 + items.length * 24 + i * 24 + 7} stroke={item.color} strokeWidth={item.sw} strokeDasharray={item.dash} />
          <text x={x + 38} y={y + 36 + items.length * 24 + i * 24 + 12} fontSize="11" fill={COLORS.textSub} fontFamily={FONT}>{item.label}</text>
        </g>
      ))}
    </g>
  );
}

// ============================================
// OUTPUT 1 & 3: ORGANOGRAMA (Atual / DWV)
// ============================================

export function OrganogramaSVG({
  cargos,
  comDWV = false,
  problemas = [],
}: {
  cargos: CargoData[];
  comDWV?: boolean;
  problemas?: string[];
}) {
  const existentes = cargos.filter((c) => c.existe);
  if (existentes.length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 800 200" className="w-full" style={{ minWidth: 500 }}>
          <text x={400} y={100} fontSize="14" fill={COLORS.textDim} textAnchor="middle" fontFamily={FONT}>Nenhum cargo mapeado</text>
        </svg>
      </div>
    );
  }

  // Group by level
  const niveis: Record<number, CargoData[]> = {};
  existentes.forEach((c) => {
    const n = getNivel(c);
    if (!niveis[n]) niveis[n] = [];
    niveis[n].push(c);
  });
  const niveisOrdenados = Object.keys(niveis).map(Number).sort((a, b) => a - b);

  // Layout
  const nodeW = 220;
  const nodeH = 80;
  const ySpacing = 140;
  const xSpacing = 50;
  const leftMargin = 180;
  const rightMargin = comDWV ? 300 : 280;
  const diagramLeft = leftMargin;

  interface OrgNode { id: string; cargo: CargoData; x: number; y: number; nivel: number; }
  const nodes: OrgNode[] = [];

  niveisOrdenados.forEach((nivel, yIndex) => {
    const cargosNivel = niveis[nivel];
    const totalWidth = cargosNivel.length * nodeW + (cargosNivel.length - 1) * xSpacing;
    const maxNodesWidth = 800;
    const startX = diagramLeft + (maxNodesWidth - totalWidth) / 2;
    cargosNivel.forEach((cargo, xIndex) => {
      nodes.push({
        id: cargo.id,
        cargo,
        x: startX + xIndex * (nodeW + xSpacing),
        y: 70 + yIndex * ySpacing,
        nivel,
      });
    });
  });

  // Operadora DWV node
  let operadoraNode: OrgNode | null = null;
  if (comDWV) {
    const hasGerente = existentes.some((c) => c.nome.includes("Gerente"));
    const hasDiretorParceria = existentes.some((c) => c.nome.includes("Diretor de Parceria"));
    let opY: number, opX: number;
    if (hasGerente) {
      const gerentes = nodes.filter((n) => n.cargo.nome.includes("Gerente"));
      const last = gerentes[gerentes.length - 1];
      opX = last.x + nodeW + 60;
      opY = last.y;
    } else if (hasDiretorParceria) {
      const dir = nodes.find((n) => n.cargo.nome.includes("Diretor de Parceria"));
      opX = (dir?.x || 400) + nodeW + 60;
      opY = dir?.y || 70;
    } else {
      opX = diagramLeft + 300;
      opY = 20;
    }

    operadoraNode = {
      id: "operadora_dwv",
      cargo: { id: "operadora_dwv", nome: "Operadora de Parceria DWV", existe: true, tarefas: [], metricas: [], ferramentas: ["BI", "CRM", "Ativações", "SLA"], subordinadosDe: null, subordinados: [], quantidade: 1, kpiPrincipal: [], atividadesDescritivas: '' },
      x: Math.min(opX, diagramLeft + 700),
      y: opY,
      nivel: -1,
    };
  }

  const lastY = Math.max(...nodes.map((n) => n.y)) + ySpacing;
  const baseY = lastY;
  const resultY = baseY + 100;
  const legendY = comDWV ? resultY + 90 : baseY + 90;
  const svgW = Math.max(diagramLeft + 800 + rightMargin, 1100);
  const svgH = legendY + 260;

  // Hierarchy lines — thick and visible
  const renderLines = () => {
    const lineEls: JSX.Element[] = [];
    for (let i = 0; i < niveisOrdenados.length - 1; i++) {
      const currentLevel = niveisOrdenados[i];
      const nextLevel = niveisOrdenados[i + 1];
      const parentNodes = nodes.filter((n) => n.nivel === currentLevel);
      const childNodes = nodes.filter((n) => n.nivel === nextLevel);

      parentNodes.forEach((parent) => {
        childNodes.forEach((child) => {
          const px = parent.x + nodeW / 2;
          const py = parent.y + nodeH;
          const cx = child.x + nodeW / 2;
          const cy = child.y;
          const midY = (py + cy) / 2;

          // L-shaped connector with rounded feel
          lineEls.push(
            <g key={`h-${parent.id}-${child.id}`}>
              <path
                d={`M ${px} ${py} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy}`}
                fill="none"
                stroke={COLORS.lineHierarchy}
                strokeWidth={COLORS.lineHierarchyWidth}
                markerEnd="url(#arr)"
                opacity={0.8}
              />
            </g>
          );
        });
      });
    }

    // Lines to base
    const lowestLevel = niveisOrdenados[niveisOrdenados.length - 1];
    const lowestNodes = nodes.filter((n) => n.nivel === lowestLevel);
    const baseCenter = diagramLeft + 400;
    lowestNodes.forEach((node) => {
      const nx = node.x + nodeW / 2;
      const ny = node.y + nodeH;
      const midY = (ny + baseY) / 2;
      lineEls.push(
        <path
          key={`base-${node.id}`}
          d={`M ${nx} ${ny} L ${nx} ${midY} L ${baseCenter} ${midY} L ${baseCenter} ${baseY}`}
          fill="none"
          stroke={COLORS.lineHierarchy}
          strokeWidth={COLORS.lineHierarchyWidth}
          strokeDasharray="8 4"
          markerEnd="url(#arr)"
          opacity={0.5}
        />
      );
    });

    // Operadora lines
    if (comDWV && operadoraNode) {
      const hasGerente = existentes.some((c) => c.nome.includes("Gerente"));
      const targetNodes = nodes.filter((n) => {
        if (hasGerente) return n.cargo.nome.includes("Gerente");
        return n.nivel === Math.min(...nodes.map((nn) => nn.nivel));
      });
      targetNodes.forEach((target) => {
        lineEls.push(
          <line
            key={`op-${target.id}`}
            x1={operadoraNode!.x}
            y1={operadoraNode!.y + nodeH / 2}
            x2={target.x + nodeW}
            y2={target.y + nodeH / 2}
            stroke={COLORS.operadoraMain}
            strokeWidth={2.5}
            markerEnd="url(#arr-dwv)"
            opacity={0.9}
          />
        );
      });
      const execNodes = nodes.filter((n) => n.nivel >= 4);
      execNodes.forEach((exec) => {
        lineEls.push(
          <line
            key={`op-exec-${exec.id}`}
            x1={operadoraNode!.x + nodeW / 2}
            y1={operadoraNode!.y + nodeH}
            x2={exec.x + nodeW / 2}
            y2={exec.y}
            stroke={COLORS.operadoraMain}
            strokeWidth={2}
            strokeDasharray="8 4"
            markerEnd="url(#arr-dwv)"
            opacity={0.7}
          />
        );
      });
    }
    return lineEls;
  };

  // Level separators with colored badge
  const renderLevelSeparators = () => {
    const seps: JSX.Element[] = [];
    const processedLabels = new Set<string>();
    niveisOrdenados.forEach((nivel, yIndex) => {
      const label = getNivelLabel(nivel);
      if (processedLabels.has(label)) return;
      processedLabels.add(label);
      const lc = getLevelColor(nivel);
      const y = 70 + yIndex * ySpacing - 30;

      seps.push(
        <g key={`sep-${nivel}`}>
          {/* Background band */}
          <rect x={0} y={y - 8} width={svgW} height={nodeH + 66} rx={0} fill={lc.bg} opacity={0.3} />
          {/* Dashed line */}
          <line x1={10} y1={y} x2={svgW - 10} y2={y} stroke={lc.main} strokeWidth={1} strokeDasharray="6 4" opacity={0.4} />
          {/* Level badge */}
          <LevelBadge x={16} y={y - 22} nivel={nivel} width={170} />
        </g>
      );
    });
    return seps;
  };

  // Side cards
  const renderSideCards = () => {
    const cards: JSX.Element[] = [];
    const processedNiveis = new Set<number>();
    niveisOrdenados.forEach((nivel, yIndex) => {
      if (processedNiveis.has(nivel)) return;
      processedNiveis.add(nivel);
      const cardX = svgW - rightMargin + 20;
      const cardY = 70 + yIndex * ySpacing;
      const cardW = rightMargin - 40;
      const cardH = 68;

      if (comDWV) {
        const { titulo, texto } = getVisibilidadeDWV(nivel);
        const maxCharsPerLine = Math.floor((cardW - 28) / 6);
        const wrappedLines = wrapText(texto, maxCharsPerLine);
        const dynamicH = Math.max(cardH, 32 + wrappedLines.length * 16);
        cards.push(
          <g key={`vis-${nivel}`}>
            <rect x={cardX} y={cardY} width={cardW} height={dynamicH} rx={10} fill={COLORS.greenBg} stroke={COLORS.greenBorder} strokeWidth={1.5} />
            <text x={cardX + 14} y={cardY + 20} fontSize="11" fontWeight="700" fill={COLORS.green} fontFamily={FONT}>✓ {titulo}</text>
            {wrappedLines.map((line, li) => (
              <text key={li} x={cardX + 14} y={cardY + 38 + li * 16} fontSize="10" fill={COLORS.green} fontFamily={FONT} opacity={0.9}>
                {line}
              </text>
            ))}
            <line x1={cardX} y1={cardY + dynamicH / 2} x2={cardX - 20} y2={cardY + dynamicH / 2} stroke={COLORS.green} strokeWidth={2} strokeDasharray="6 3" markerEnd="url(#arr-green)" />
          </g>
        );
      } else {
        // No side cards for "atual" — problems shown in panel below
      }
    });
    return cards;
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minWidth: 700 }}>
        <SvgDefs />

        {/* Level separators with colored bands */}
        {renderLevelSeparators()}

        {/* Hierarchy lines */}
        {renderLines()}

        {/* Cargo nodes */}
        {nodes.map((node) => {
          const lc = getLevelColor(node.nivel);
          const ferrTags = node.cargo.ferramentas.slice(0, 3);
          const extraCount = node.cargo.ferramentas.length - 3;
          return (
            <g key={node.id} filter="url(#shadow)">
              {/* Colored left border accent */}
              <rect x={node.x} y={node.y} width={nodeW} height={nodeH} rx={10} fill={COLORS.bgCard} stroke={lc.border} strokeWidth={1.5} />
              <rect x={node.x} y={node.y + 4} width={4} height={nodeH - 8} rx={2} fill={lc.main} />

              <text x={node.x + 16} y={node.y + 24} fontSize="14" fontWeight="700" fill={COLORS.text} fontFamily={FONT}>
                {node.cargo.nome}
              </text>
              <text x={node.x + 16} y={node.y + 42} fontSize="10" fill={COLORS.textDim} fontFamily={FONT}>
                {getResumoPrincipalTarefa(node.cargo)}
              </text>

              {/* Ferramenta pills */}
              {ferrTags.length > 0 && (() => {
                const pills: { label: string; w: number }[] = ferrTags.map((f) => {
                  const label = shortFerramenta(f);
                  return { label, w: Math.max(58, label.length * 6 + 16) };
                });
                let cumX = 0;
                return (
                  <g>
                    {pills.map((pill, fi) => {
                      const px = node.x + 12 + cumX;
                      cumX += pill.w + 4;
                      return (
                        <g key={fi}>
                          <rect x={px} y={node.y + nodeH - 24} width={pill.w} height={18} rx={9} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
                          <text x={px + pill.w / 2} y={node.y + nodeH - 12} fontSize="8" fill={COLORS.textSub} textAnchor="middle" fontFamily={FONT}>
                            {pill.label}
                          </text>
                        </g>
                      );
                    })}
                    {extraCount > 0 && (
                      <g>
                        <rect x={node.x + 12 + cumX} y={node.y + nodeH - 24} width={30} height={18} rx={9} fill="rgba(255,255,255,0.08)" />
                        <text x={node.x + 12 + cumX + 15} y={node.y + nodeH - 12} fontSize="8" fill={COLORS.textDim} textAnchor="middle" fontFamily={FONT}>+{extraCount}</text>
                      </g>
                    )}
                  </g>
                );
              })()}

              {/* Carteira for DWV executivos */}
              {comDWV && node.nivel >= 4 && (
                <g>
                  {["Ouro", "Prata", "Bronze"].map((tier, ti) => (
                    <g key={tier}>
                      <rect
                        x={node.x + 12 + ti * 68}
                        y={node.y + nodeH + 6}
                        width={60}
                        height={16}
                        rx={8}
                        fill={tier === "Ouro" ? "rgba(245, 158, 11, 0.2)" : tier === "Prata" ? "rgba(148, 163, 184, 0.2)" : "rgba(161, 98, 7, 0.2)"}
                        stroke={tier === "Ouro" ? "rgba(245, 158, 11, 0.5)" : tier === "Prata" ? "rgba(148, 163, 184, 0.5)" : "rgba(161, 98, 7, 0.5)"}
                        strokeWidth={0.5}
                      />
                      <text
                        x={node.x + 42 + ti * 68}
                        y={node.y + nodeH + 17}
                        fontSize="8"
                        fill={tier === "Ouro" ? "#f59e0b" : tier === "Prata" ? "#94a3b8" : "#a16207"}
                        textAnchor="middle"
                        fontWeight="600"
                      >{tier}</text>
                    </g>
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {/* Operadora DWV node */}
        {comDWV && operadoraNode && (
          <g filter="url(#glow-red)">
            <rect x={operadoraNode.x} y={operadoraNode.y} width={nodeW} height={nodeH} rx={10} fill="rgba(236, 19, 19, 0.12)" stroke={COLORS.operadoraMain} strokeWidth={2.5} />
            <rect x={operadoraNode.x} y={operadoraNode.y + 4} width={4} height={nodeH - 8} rx={2} fill={COLORS.operadoraMain} />
            <text x={operadoraNode.x + 16} y={operadoraNode.y + 28} fontSize="13" fontWeight="700" fill={COLORS.operadoraMain} fontFamily={FONT}>
              Operadora de Parceria DWV
            </text>
            <text x={operadoraNode.x + 16} y={operadoraNode.y + 48} fontSize="11" fill={COLORS.operadoraMain} fontFamily={FONT} opacity={0.8}>
              BI · CRM · Ativações · SLA
            </text>
          </g>
        )}

        {/* Side cards */}
        {renderSideCards()}

        {/* Base de corretores */}
        <g>
          <rect x={diagramLeft + 180} y={baseY} width={440} height={comDWV ? 65 : 75} rx={10} fill={comDWV ? COLORS.purpleBg : "rgba(30, 30, 30, 0.95)"} stroke={comDWV ? COLORS.purpleBorder : "rgba(255,255,255,0.15)"} strokeWidth={1.5} />
          <text x={diagramLeft + 400} y={baseY + 26} fontSize="14" fontWeight="700" fill={comDWV ? COLORS.purple : COLORS.text} textAnchor="middle" fontFamily={FONT}>
            {comDWV ? "Carteira de corretores" : "Base de corretores cadastrados"}
          </text>
          <text x={diagramLeft + 400} y={baseY + 46} fontSize="11" fill={comDWV ? COLORS.purple : COLORS.textDim} textAnchor="middle" fontFamily={FONT} opacity={0.9}>
            {comDWV ? "Ouro · Prata · Bronze" : "Sem classificação · Sem segmentação · Sem rastreamento"}
          </text>
        </g>

        {/* Result cards */}
        {comDWV ? (
          <g>
            <rect x={diagramLeft + 80} y={resultY} width={640} height={60} rx={10} fill="rgba(30, 30, 30, 0.95)" stroke={COLORS.greenBorder} strokeWidth={1.5} />
            <text x={diagramLeft + 400} y={resultY + 24} fontSize="14" fontWeight="700" fill={COLORS.green} textAnchor="middle" fontFamily={FONT}>
              Canal de parcerias gerenciável, previsível e escalável
            </text>
            <text x={diagramLeft + 400} y={resultY + 44} fontSize="11" fill={COLORS.green} textAnchor="middle" fontFamily={FONT} opacity={0.9}>
              Diretoria com visibilidade real · Executivos com suporte · Corretores com relacionamento ativo
            </text>
          </g>
        ) : (
          <g>
            {/* No problem cards here — problems shown in panel below */}
          </g>
        )}

        {/* Legend */}
        <LegendBox x={20} y={legendY} width={360} comDWV={comDWV} />
      </svg>
    </div>
  );
}

// ============================================
// OUTPUT 2: FLUXOGRAMA ATUAL (sem DWV)
// ============================================

function FluxogramaAtual({ cargos }: { cargos: CargoData[] }) {
  const todasFerramentas = new Set<string>();
  cargos.forEach((c) => c.ferramentas.forEach((f) => todasFerramentas.add(f)));
  const ferramentasList = Array.from(todasFerramentas);

  const svgW = 950;
  const leftLabel = 150;
  const faixaStart = leftLabel + 10;

  // Faixa 1
  const faixa1Y = 50;
  const pairH = 60;
  const faixa1H = ferramentasList.length * pairH + 20;

  // Faixa 2
  const faixa2Y = faixa1Y + faixa1H + 40;
  const faixa2H = 80;

  // Faixa 3
  const faixa3Y = faixa2Y + faixa2H + 40;
  const faixa3H = 75;

  const legendY = faixa3Y + faixa3H + 50;
  const svgH = legendY + 260;

  const faixaLabel = (label: string, y: number, color: string) => {
    const upperLabel = label.toUpperCase();
    const badgeW = upperLabel.length * 6 + 24;
    return (
      <g>
        <rect x={0} y={y - 16} width={svgW} height={1} fill="none" />
        <line x1={10} y1={y - 8} x2={svgW - 10} y2={y - 8} stroke={color} strokeWidth={1} strokeDasharray="6 4" opacity={0.3} />
        <rect x={12} y={y - 24} width={badgeW} height={20} rx={10} fill="rgba(24,24,27,0.9)" stroke={color} strokeWidth={1} opacity={0.6} />
        <text x={22} y={y - 11} fontSize="9" fill={color} fontFamily={FONT} fontWeight="700">{upperLabel}</text>
      </g>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minWidth: 600 }}>
        <SvgDefs />

        {/* Faixa 1 - Tool → Problem pairs */}
        {faixaLabel("Ferramentas utilizadas", faixa1Y, COLORS.textDim)}

        {ferramentasList.map((f, i) => {
          const y = faixa1Y + i * pairH;
          const toolW = 230;
          const probW = 340;
          const toolX = faixaStart;
          const probX = faixaStart + toolW + 90;

          return (
            <g key={i}>
              {/* Tool */}
              <rect x={toolX} y={y} width={toolW} height={48} rx={10} fill={COLORS.bgCard} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              <rect x={toolX} y={y + 4} width={4} height={40} rx={2} fill={COLORS.textDim} />
              <text x={toolX + 16} y={y + 22} fontSize="12" fontWeight="600" fill={COLORS.text} fontFamily={FONT}>{shortFerramenta(f)}</text>
              <text x={toolX + 16} y={y + 38} fontSize="9" fill={COLORS.textDim} fontFamily={FONT}>Ferramenta atual</text>

              {/* Arrow — thick red dashed */}
              <line x1={toolX + toolW} y1={y + 24} x2={probX} y2={y + 24} stroke={COLORS.red} strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#arr-red)" opacity={0.8} />

              {/* Problem */}
              {(() => {
                const probText = getProblemaFerramenta(f);
                const probMaxChars = Math.floor((probW - 30) / 5.5);
                const probLines = wrapText(probText, probMaxChars);
                const probH = Math.max(48, 16 + probLines.length * 16);
                return (
                  <>
                    <rect x={probX} y={y} width={probW} height={probH} rx={10} fill={COLORS.redBg} stroke={COLORS.redBorder} strokeWidth={1.5} />
                    <rect x={probX} y={y + 4} width={4} height={probH - 8} rx={2} fill={COLORS.red} />
                    {probLines.map((line, li) => (
                      <text key={li} x={probX + 16} y={y + 20 + li * 16} fontSize="10" fill={COLORS.red} fontFamily={FONT} fontWeight="500">
                        {line}
                      </text>
                    ))}
                  </>
                );
              })()}
            </g>
          );
        })}

        {/* Faixa 2 — Common problems */}
        {faixaLabel("O que essas ferramentas têm em comum", faixa2Y, COLORS.amber)}

        {[
          { title: "Totalmente desconectadas", desc: "Nenhuma conversa com a outra" },
          { title: "Dados fragmentados", desc: "Cada ferramenta guarda um pedaço" },
          { title: "Liderança no escuro", desc: "Decisão baseada em feeling" },
        ].map((card, i) => (
          <g key={i}>
            <rect x={faixaStart + i * 250} y={faixa2Y} width={230} height={60} rx={10} fill={COLORS.amberBg} stroke={COLORS.amberBorder} strokeWidth={1.5} />
            <rect x={faixaStart + i * 250} y={faixa2Y + 4} width={4} height={52} rx={2} fill={COLORS.amber} />
            <text x={faixaStart + i * 250 + 16} y={faixa2Y + 24} fontSize="12" fontWeight="700" fill={COLORS.amber} fontFamily={FONT}>{card.title}</text>
            <text x={faixaStart + i * 250 + 16} y={faixa2Y + 44} fontSize="10" fill={COLORS.amber} fontFamily={FONT} opacity={0.9}>{card.desc}</text>
          </g>
        ))}

        {/* Connector */}
        <line x1={svgW / 2} y1={faixa2Y + 66} x2={svgW / 2} y2={faixa3Y} stroke={COLORS.lineHierarchy} strokeWidth={2} markerEnd="url(#arr)" />

        {/* Faixa 3 — Only visible data */}
        {faixaLabel("O único dado visível", faixa3Y, COLORS.textDim)}

        <rect x={svgW / 2 - 170} y={faixa3Y} width={340} height={60} rx={10} fill={COLORS.bgCard} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
        <text x={svgW / 2} y={faixa3Y + 26} fontSize="14" fontWeight="700" fill={COLORS.text} textAnchor="middle" fontFamily={FONT}>Proposta na mesa do gerente</text>
        <text x={svgW / 2} y={faixa3Y + 46} fontSize="11" fill={COLORS.textDim} textAnchor="middle" fontFamily={FONT}>Único dado concreto disponível</text>

        <LegendBox x={20} y={legendY} width={360} comDWV={false} />
      </svg>
    </div>
  );
}

// ============================================
// OUTPUT 4: FLUXOGRAMA DWV
// ============================================

function FluxogramaDWV({
  hasDiretor,
  hasGerente,
  hasExecutivo,
  hasDiretorParceria,
}: {
  hasDiretor: boolean;
  hasGerente: boolean;
  hasExecutivo: boolean;
  hasDiretorParceria: boolean;
}) {
  const svgW = 1000;
  const leftLabel = 150;
  const faixaStart = leftLabel + 10;
  let currentY = 50;
  const elements: JSX.Element[] = [];

  const addFaixa = (label: string, y: number, color: string) => {
    const upperLabel = label.toUpperCase();
    const badgeW = upperLabel.length * 6 + 24;
    elements.push(
      <g key={`faixa-${label}-${y}`}>
        <line x1={10} y1={y - 8} x2={svgW - 10} y2={y - 8} stroke={color} strokeWidth={1} strokeDasharray="6 4" opacity={0.3} />
        <rect x={12} y={y - 24} width={badgeW} height={20} rx={10} fill="rgba(24,24,27,0.9)" stroke={color} strokeWidth={1} opacity={0.6} />
        <text x={22} y={y - 11} fontSize="9" fill={color} fontFamily={FONT} fontWeight="700">{upperLabel}</text>
      </g>
    );
  };

  const addConnector = (y1: number, y2: number, key: string) => {
    elements.push(<line key={key} x1={svgW / 2} y1={y1} x2={svgW / 2} y2={y2} stroke={COLORS.lineHierarchy} strokeWidth={2} markerEnd="url(#arr)" />);
  };

  // Faixa 1 - Strategic
  if (hasDiretor) {
    addFaixa("Nível estratégico", currentY, "#f97316");
    const nodeY = currentY;
    elements.push(
      <g key="strat">
        <rect x={faixaStart} y={nodeY} width={190} height={48} rx={10} fill={COLORS.bgCard} stroke={getLevelColor(1).border} strokeWidth={1.5} />
        <rect x={faixaStart} y={nodeY + 4} width={4} height={40} rx={2} fill="#f97316" />
        <text x={faixaStart + 16} y={nodeY + 30} fontSize="12" fontWeight="600" fill={COLORS.text} fontFamily={FONT}>Diretor de Parceria</text>
        <rect x={faixaStart + 480} y={nodeY} width={300} height={48} rx={10} fill={COLORS.redBg} stroke={COLORS.redBorder} strokeWidth={1.5} />
        <rect x={faixaStart + 480} y={nodeY + 4} width={4} height={40} rx={2} fill={COLORS.operadoraMain} />
        <text x={faixaStart + 500} y={nodeY + 20} fontSize="10" fontWeight="700" fill={COLORS.operadoraMain} fontFamily={FONT}>Recebem da Operadora</text>
        <text x={faixaStart + 500} y={nodeY + 38} fontSize="10" fill={COLORS.red} fontFamily={FONT} opacity={0.9}>Relatório geral de performance</text>
        <line x1={faixaStart + 480} y1={nodeY + 24} x2={faixaStart + (hasDiretorParceria ? 400 : 190)} y2={nodeY + 24} stroke={COLORS.operadoraMain} strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#arr-dwv)" />
      </g>
    );
    currentY += 90;
  }

  // Faixa 2 - Managerial
  if (hasGerente) {
    addFaixa("Nível gerencial", currentY, "#3b82f6");
    const nodeY = currentY;
    elements.push(
      <g key="mgmt">
        <rect x={faixaStart + 210} y={nodeY} width={190} height={48} rx={10} fill={COLORS.bgCard} stroke={getLevelColor(3).border} strokeWidth={1.5} />
        <rect x={faixaStart + 210} y={nodeY + 4} width={4} height={40} rx={2} fill="#3b82f6" />
        <text x={faixaStart + 226} y={nodeY + 30} fontSize="12" fontWeight="600" fill={COLORS.text} fontFamily={FONT}>Gerente de Parceria</text>

        <rect x={faixaStart + 480} y={nodeY} width={300} height={48} rx={10} fill={COLORS.bgCard} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
        <text x={faixaStart + 496} y={nodeY + 20} fontSize="10" fontWeight="600" fill={COLORS.textSub} fontFamily={FONT}>Direciona à Operadora</text>
        <text x={faixaStart + 496} y={nodeY + 38} fontSize="10" fill={COLORS.textDim} fontFamily={FONT}>Estratégia · Metas · Prioridades</text>
        <line x1={faixaStart + 400} y1={nodeY + 24} x2={faixaStart + 480} y2={nodeY + 24} stroke={COLORS.lineHierarchy} strokeWidth={2} markerEnd="url(#arr)" />

        <rect x={faixaStart - 150} y={nodeY} width={300} height={48} rx={10} fill={COLORS.redBg} stroke={COLORS.redBorder} strokeWidth={1.5} />
        <rect x={faixaStart - 150} y={nodeY + 4} width={4} height={40} rx={2} fill={COLORS.operadoraMain} />
        <text x={faixaStart - 130} y={nodeY + 20} fontSize="10" fontWeight="700" fill={COLORS.operadoraMain} fontFamily={FONT}>Recebe da Operadora</text>
        <text x={faixaStart - 130} y={nodeY + 38} fontSize="10" fill={COLORS.red} fontFamily={FONT} opacity={0.9}>BI por carteira · KPIs · Visitas · Propostas</text>
        <line x1={faixaStart + 150} y1={nodeY + 24} x2={faixaStart + 210} y2={nodeY + 24} stroke={COLORS.operadoraMain} strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#arr-dwv)" />
      </g>
    );
    currentY += 90;
  }

  addConnector(currentY - 20, currentY + 10, "conn-op");

  // Faixa 3 - Operadora
  addFaixa("Operadora DWV", currentY + 15, COLORS.operadoraMain);
  const opY = currentY + 15;
  elements.push(
    <g key="operadora-faixa">
      <rect x={faixaStart} y={opY} width={svgW - leftLabel - 80} height={60} rx={10} fill="rgba(236, 19, 19, 0.1)" stroke={COLORS.operadoraMain} strokeWidth={2.5} />
      <rect x={faixaStart} y={opY + 4} width={6} height={52} rx={3} fill={COLORS.operadoraMain} />
      <text x={svgW / 2} y={opY + 24} fontSize="15" fontWeight="700" fill={COLORS.operadoraMain} textAnchor="middle" fontFamily={FONT}>Operadora de Parceria DWV</text>
      <text x={svgW / 2} y={opY + 44} fontSize="11" fill={COLORS.operadoraMain} textAnchor="middle" fontFamily={FONT} opacity={0.8}>
        Gestão do CRM · Distribuição de carteiras · Campanhas · BI · SLA de atendimento · Integração Meta Ads
      </text>
    </g>
  );
  currentY = opY + 90;
  addConnector(currentY - 20, currentY + 10, "conn-wf");

  // Faixa 4 - Workflow 3 columns
  addFaixa("Fluxo de trabalho", currentY + 15, COLORS.teal);
  const wfY = currentY + 15;
  const colW = 210;
  const colGap = 40;
  const col1X = faixaStart + 40;
  const col2X = col1X + colW + colGap;
  const col3X = col2X + colW + colGap;

  elements.push(
    <g key="workflow">
      <rect x={col1X} y={wfY} width={colW} height={54} rx={10} fill={COLORS.tealBg} stroke={COLORS.tealBorder} strokeWidth={1.5} />
      <rect x={col1X} y={wfY + 4} width={4} height={46} rx={2} fill={COLORS.teal} />
      <text x={col1X + 16} y={wfY + 22} fontSize="12" fontWeight="700" fill={COLORS.teal} fontFamily={FONT}>Captação</text>
      <text x={col1X + 16} y={wfY + 40} fontSize="10" fill={COLORS.teal} fontFamily={FONT} opacity={0.8}>Meta Ads → CRM DWV</text>

      <line x1={col1X + colW} y1={wfY + 27} x2={col2X} y2={wfY + 27} stroke={COLORS.teal} strokeWidth={2} markerEnd="url(#arr-teal)" />

      <rect x={col2X} y={wfY} width={colW} height={54} rx={10} fill={COLORS.tealBg} stroke={COLORS.tealBorder} strokeWidth={1.5} />
      <rect x={col2X} y={wfY + 4} width={4} height={46} rx={2} fill={COLORS.teal} />
      <text x={col2X + 16} y={wfY + 22} fontSize="12" fontWeight="700" fill={COLORS.teal} fontFamily={FONT}>CRM + Distribuição</text>
      <text x={col2X + 16} y={wfY + 40} fontSize="10" fill={COLORS.teal} fontFamily={FONT} opacity={0.8}>Roleta ou cirúrgica</text>

      <line x1={col2X + colW} y1={wfY + 27} x2={col3X} y2={wfY + 27} stroke={COLORS.teal} strokeWidth={2} markerEnd="url(#arr-teal)" />

      <rect x={col3X} y={wfY} width={colW} height={54} rx={10} fill={COLORS.tealBg} stroke={COLORS.tealBorder} strokeWidth={1.5} />
      <rect x={col3X} y={wfY + 4} width={4} height={46} rx={2} fill={COLORS.teal} />
      <text x={col3X + 16} y={wfY + 22} fontSize="12" fontWeight="700" fill={COLORS.teal} fontFamily={FONT}>Classificação</text>
      <text x={col3X + 16} y={wfY + 40} fontSize="10" fill={COLORS.teal} fontFamily={FONT} opacity={0.8}>Bronze · Prata · Ouro</text>
    </g>
  );
  currentY = wfY + 85;
  addConnector(currentY - 20, currentY + 10, "conn-act");

  // Faixa 5 - Activation
  addFaixa("Ativação segmentada", currentY + 15, COLORS.green);
  const actY = currentY + 15;
  elements.push(
    <g key="activation">
      <rect x={col1X} y={actY} width={colW} height={54} rx={10} fill={COLORS.greenBg} stroke={COLORS.greenBorder} strokeWidth={1.5} />
      <rect x={col1X} y={actY + 4} width={4} height={46} rx={2} fill={COLORS.green} />
      <text x={col1X + 16} y={actY + 22} fontSize="12" fontWeight="700" fill={COLORS.green} fontFamily={FONT}>WhatsApp API</text>
      <text x={col1X + 16} y={actY + 40} fontSize="10" fill={COLORS.green} fontFamily={FONT} opacity={0.8}>Disparo segmentado</text>

      <rect x={col2X} y={actY} width={colW} height={54} rx={10} fill={COLORS.greenBg} stroke={COLORS.greenBorder} strokeWidth={1.5} />
      <rect x={col2X} y={actY + 4} width={4} height={46} rx={2} fill={COLORS.green} />
      <text x={col2X + 16} y={actY + 22} fontSize="12" fontWeight="700" fill={COLORS.green} fontFamily={FONT}>E-mail marketing</text>
      <text x={col2X + 16} y={actY + 40} fontSize="10" fill={COLORS.green} fontFamily={FONT} opacity={0.8}>Por carteira e nível</text>

      <rect x={col3X} y={actY} width={colW} height={54} rx={10} fill={COLORS.greenBg} stroke={COLORS.greenBorder} strokeWidth={1.5} />
      <rect x={col3X} y={actY + 4} width={4} height={46} rx={2} fill={COLORS.green} />
      <text x={col3X + 16} y={actY + 22} fontSize="12" fontWeight="700" fill={COLORS.green} fontFamily={FONT}>Stories no App DWV</text>
      <text x={col3X + 16} y={actY + 40} fontSize="10" fill={COLORS.green} fontFamily={FONT} opacity={0.8}>Marketplace exclusivo</text>
    </g>
  );
  currentY = actY + 85;
  addConnector(currentY - 20, currentY + 10, "conn-sla");

  // Faixa 6 - SLA
  addFaixa("SLA de atendimento", currentY + 15, COLORS.purple);
  const slaY = currentY + 15;
  elements.push(
    <g key="sla">
      <rect x={col1X} y={slaY} width={colW} height={54} rx={10} fill={COLORS.purpleBg} stroke={COLORS.purpleBorder} strokeWidth={1.5} />
      <rect x={col1X} y={slaY + 4} width={4} height={46} rx={2} fill={COLORS.purple} />
      <text x={col1X + 16} y={slaY + 22} fontSize="12" fontWeight="700" fill={COLORS.purple} fontFamily={FONT}>Nível 1 — IA</text>
      <text x={col1X + 16} y={slaY + 40} fontSize="10" fill={COLORS.purple} fontFamily={FONT} opacity={0.8}>Autoatendimento instantâneo</text>

      <line x1={col1X + colW} y1={slaY + 27} x2={col2X} y2={slaY + 27} stroke={COLORS.lineHierarchy} strokeWidth={2} markerEnd="url(#arr)" />

      <rect x={col2X} y={slaY} width={colW} height={54} rx={10} fill={COLORS.tealBg} stroke={COLORS.tealBorder} strokeWidth={1.5} />
      <rect x={col2X} y={slaY + 4} width={4} height={46} rx={2} fill={COLORS.teal} />
      <text x={col2X + 16} y={slaY + 22} fontSize="12" fontWeight="700" fill={COLORS.teal} fontFamily={FONT}>Nível 2 — Executivo</text>
      <text x={col2X + 16} y={slaY + 40} fontSize="10" fill={COLORS.teal} fontFamily={FONT} opacity={0.8}>Dúvidas negociais</text>

      <line x1={col2X + colW} y1={slaY + 27} x2={col3X} y2={slaY + 27} stroke={COLORS.lineHierarchy} strokeWidth={2} markerEnd="url(#arr)" />

      <rect x={col3X} y={slaY} width={colW} height={54} rx={10} fill={COLORS.redBg} stroke={COLORS.redBorder} strokeWidth={1.5} />
      <rect x={col3X} y={slaY + 4} width={4} height={46} rx={2} fill={COLORS.operadoraMain} />
      <text x={col3X + 16} y={slaY + 22} fontSize="12" fontWeight="700" fill={COLORS.operadoraMain} fontFamily={FONT}>Nível 3 — Operadora</text>
      <text x={col3X + 16} y={slaY + 40} fontSize="10" fill={COLORS.red} fontFamily={FONT} opacity={0.8}>Backup · zero sem resposta</text>
    </g>
  );
  currentY = slaY + 85;
  addConnector(currentY - 20, currentY + 10, "conn-track");

  // Faixa 7 - Tracking
  addFaixa("Tracking de engajamento", currentY + 15, COLORS.amber);
  const trackY = currentY + 15;
  const trackCards = [
    "Compartilhou produto com cliente",
    "Acessou tabelas e materiais",
    "Criou página de tráfego pago",
    "Participou de eventos",
    "Proposta enviada ao gerente",
  ];
  const trackW = 155;
  const trackGap = 8;
  elements.push(
    <g key="tracking">
      {trackCards.map((text, i) => {
        const trackMaxChars = Math.floor((trackW - 28) / 5);
        const trackLines = wrapText(text, trackMaxChars);
        return (
          <g key={i}>
            <rect x={faixaStart + i * (trackW + trackGap)} y={trackY} width={trackW} height={54} rx={10} fill={COLORS.amberBg} stroke={COLORS.amberBorder} strokeWidth={1.5} />
            <rect x={faixaStart + i * (trackW + trackGap)} y={trackY + 4} width={4} height={46} rx={2} fill={COLORS.amber} />
            {trackLines.map((line, li) => (
              <text key={li} x={faixaStart + i * (trackW + trackGap) + 14} y={trackY + 22 + li * 16} fontSize="9" fontWeight={li === 0 ? "700" : "400"} fill={COLORS.amber} fontFamily={FONT} opacity={li === 0 ? 1 : 0.9}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
  currentY = trackY + 85;
  addConnector(currentY - 20, currentY + 10, "conn-rep");

  // Faixa 8 - Reports
  addFaixa("Relatórios gerados", currentY + 15, COLORS.operadoraMain);
  const repY = currentY + 15;
  const reports: { label: string; desc: string }[] = [];
  if (hasExecutivo) reports.push({ label: "Para o Executivo", desc: "Corretores ativos na carteira · Próximos da venda" });
  if (hasGerente) reports.push({ label: "Para o Gerente", desc: "Performance por carteira · KPIs de cada executivo" });
  if (hasDiretor) reports.push({ label: "Para a Direção", desc: "VGV · Engajamento geral · Conversões · Funil completo" });

  const repW = 250;
  elements.push(
    <g key="reports">
      {reports.map((r, i) => {
        const repMaxChars = Math.floor((repW - 32) / 5.5);
        const repLines = wrapText(r.desc, repMaxChars);
        const repCardH = Math.max(54, 28 + repLines.length * 16);
        return (
          <g key={i}>
            <rect x={faixaStart + i * (repW + 14)} y={repY} width={repW} height={repCardH} rx={10} fill={COLORS.redBg} stroke={COLORS.redBorder} strokeWidth={1.5} />
            <rect x={faixaStart + i * (repW + 14)} y={repY + 4} width={4} height={repCardH - 8} rx={2} fill={COLORS.operadoraMain} />
            <text x={faixaStart + i * (repW + 14) + 16} y={repY + 22} fontSize="11" fontWeight="700" fill={COLORS.operadoraMain} fontFamily={FONT}>{r.label}</text>
            {repLines.map((line, li) => (
              <text key={li} x={faixaStart + i * (repW + 14) + 16} y={repY + 40 + li * 14} fontSize="10" fill={COLORS.red} fontFamily={FONT} opacity={0.9}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
  currentY = repY + 85;

  // Result
  const resultY = currentY;
  elements.push(
    <g key="result">
      <rect x={faixaStart + 30} y={resultY} width={640} height={60} rx={10} fill="rgba(30, 30, 30, 0.95)" stroke={COLORS.greenBorder} strokeWidth={1.5} />
      <text x={faixaStart + 350} y={resultY + 24} fontSize="14" fontWeight="700" fill={COLORS.green} textAnchor="middle" fontFamily={FONT}>
        Canal de parcerias gerenciável, previsível e escalável
      </text>
      <text x={faixaStart + 350} y={resultY + 44} fontSize="11" fill={COLORS.green} textAnchor="middle" fontFamily={FONT} opacity={0.9}>
        Diretoria com visibilidade real · Executivos com suporte · Corretores com relacionamento ativo
      </text>
    </g>
  );

  const legendY = resultY + 90;
  const svgH = legendY + 260;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minWidth: 600 }}>
        <SvgDefs />
        {elements}
        <LegendBox x={20} y={legendY} width={360} comDWV={true} />
      </svg>
    </div>
  );
}

// ============================================
// MAIN EXPORT
// ============================================

export function FluxogramaSVG({
  cargos,
  comDWV = false,
}: {
  cargos: CargoData[];
  comDWV?: boolean;
}) {
  const existentes = cargos.filter((c) => c.existe);
  const hasDiretor = existentes.some((c) => c.nome.includes("Diretor"));
  const hasDiretorParceria = existentes.some((c) => c.nome.includes("Diretor de Parceria"));
  const hasGerente = existentes.some((c) => c.nome.includes("Gerente"));
  const hasExecutivo = existentes.some((c) => c.nome.includes("Executivo") || getNivel(c) >= 4);

  if (comDWV) {
    return <FluxogramaDWV hasDiretor={hasDiretor} hasGerente={hasGerente} hasExecutivo={hasExecutivo} hasDiretorParceria={hasDiretorParceria} />;
  }
  return <FluxogramaAtual cargos={existentes} />;
}
