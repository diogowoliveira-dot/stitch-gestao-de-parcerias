import {
  pipefyQuery,
  PIPE_ID,
  PHASE_IDS,
  WON_PHASES,
  LOST_PHASES,
  STATE_LABELS,
  parseAdhesionValue,
  categorizeLossReason,
  normalizePhase,
} from "../utils";
import type {
  AnalyticsCard,
  AnalyticsData,
  TimeMetrics,
  GeographicEntry,
  PlanDistribution,
  SellerMetrics,
  LossReason,
  LossByPhase,
  LossTypeBreakdown,
  LeadSourceMetrics,
  ModalityEntry,
  ContractStatusEntry,
  MonthlyClosing,
  MonthlySellerPerformance,
  ProspectingEntry,
  ProductBreakdown,
} from "@/types/pipefy";

// ─── Cache Layer 1: Raw cards (15 min) ───
let rawCache: {
  wonCards: AnalyticsCard[];
  lostCards: AnalyticsCard[];
  negotiationCards: AnalyticsCard[];
  prospectionCards: AnalyticsCard[];
  phaseCounts: Record<string, number>;
  timestamp: number;
} | null = null;
const RAW_CACHE_TTL = 15 * 60 * 1000;

// ─── Cache Layer 2: Computed analytics keyed by date range (5 min) ───
const analyticsCache = new Map<string, { data: AnalyticsData; timestamp: number }>();
const ANALYTICS_CACHE_TTL = 5 * 60 * 1000;

const CARD_FIELDS_QUERY = `
  id
  title
  current_phase { name }
  assignees { name }
  createdBy { name }
  labels { name }
  fields { name value }
  phases_history {
    phase { name }
    firstTimeIn
    lastTimeOut
    duration
  }
  created_at
  done
`;

// ─── Data Fetching with Pagination ───

async function fetchAllPhaseCards(phaseId: string): Promise<AnalyticsCard[]> {
  const allCards: AnalyticsCard[] = [];
  let hasMore = true;
  let cursor: string | null = null;
  const PAGE_SIZE = 50;

  while (hasMore) {
    try {
      const afterClause = cursor ? `, after: "${cursor}"` : "";
      const result = await pipefyQuery(`{
        phase(id: ${phaseId}) {
          cards(first: ${PAGE_SIZE}${afterClause}) {
            edges {
              cursor
              node {
                ${CARD_FIELDS_QUERY}
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }`);

      const edges = result.data?.phase?.cards?.edges || [];
      const pageInfo = result.data?.phase?.cards?.pageInfo;
      allCards.push(...edges.map((e: { node: AnalyticsCard }) => e.node));
      hasMore = pageInfo?.hasNextPage ?? false;
      cursor = pageInfo?.endCursor ?? null;
    } catch {
      break;
    }
  }

  return allCards;
}

async function fetchAllMultiPhaseCards(phaseIds: string[]): Promise<AnalyticsCard[]> {
  const results = await Promise.all(phaseIds.map((id) => fetchAllPhaseCards(id)));
  return results.flat();
}

// Keep limited fetch for phases where we don't need all cards
async function fetchPhaseCards(phaseId: string, count: number = 50): Promise<AnalyticsCard[]> {
  try {
    const result = await pipefyQuery(`{
      phase(id: ${phaseId}) {
        cards(first: ${count}) {
          edges {
            node {
              ${CARD_FIELDS_QUERY}
            }
          }
        }
      }
    }`);
    return result.data?.phase?.cards?.edges?.map((e: { node: AnalyticsCard }) => e.node) || [];
  } catch {
    return [];
  }
}

async function fetchMultiPhaseCards(phaseIds: string[], count: number = 50): Promise<AnalyticsCard[]> {
  const results = await Promise.all(phaseIds.map((id) => fetchPhaseCards(id, count)));
  return results.flat();
}

// ─── Date Utilities ───

function getCardEventDate(card: AnalyticsCard): Date {
  const currentPhaseName = card.current_phase.name;
  const matchingHistory = card.phases_history.find(
    (h) => normalizePhase(h.phase.name) === normalizePhase(currentPhaseName)
  );
  if (matchingHistory?.firstTimeIn) {
    return new Date(matchingHistory.firstTimeIn);
  }
  return new Date(card.created_at);
}

function filterCardsByDate(
  cards: AnalyticsCard[],
  from: Date | null,
  to: Date | null
): AnalyticsCard[] {
  if (!from && !to) return cards;
  return cards.filter((card) => {
    const date = getCardEventDate(card);
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });
}

// ─── Field Helpers ───

function getFieldValue(card: AnalyticsCard, fieldName: string): string {
  const field = card.fields.find((f) =>
    f.name.toLowerCase().includes(fieldName.toLowerCase())
  );
  return field?.value || "";
}

function hasLabel(card: AnalyticsCard, labelName: string): boolean {
  return card.labels.some(
    (l) => l.name.toLowerCase() === labelName.toLowerCase()
  );
}

function getStateFromLabels(card: AnalyticsCard): string | null {
  for (const state of STATE_LABELS) {
    if (card.labels.some((l) => l.name === state)) return state;
  }
  return null;
}

function getPlanFromCard(card: AnalyticsCard): string | null {
  const fieldPlan = getFieldValue(card, "plano escolhido");
  if (fieldPlan && fieldPlan !== "[]") return fieldPlan;
  if (hasLabel(card, "Plano Essencial")) return "Essencial";
  if (hasLabel(card, "Plano Performance")) return "Performance";
  if (hasLabel(card, "Plano Avançado")) return "Avançado";
  return null;
}

function getConversionDays(card: AnalyticsCard): number | null {
  const history = card.phases_history;
  if (history.length < 2) return null;
  const startPhase = history.find(
    (h) => h.phase.name !== "Start form" && h.firstTimeIn
  );
  if (!startPhase) return null;
  const totalSeconds = history.reduce((sum, h) => {
    if (h.phase.name === "Start form") return sum;
    return sum + (h.duration || 0);
  }, 0);
  return totalSeconds / 86400;
}

function getLastActivePhase(card: AnalyticsCard): string | null {
  const lostPhaseNames = [
    "Não Fechado Comercial", "Distrato", "Churn", "Sem Perfil",
    "Arquivo", "Não mexer", "Start form",
  ];
  const activePhases = card.phases_history.filter(
    (h) => !lostPhaseNames.some((lp) => h.phase.name.includes(lp))
  );
  if (activePhases.length === 0) return null;
  const sorted = [...activePhases].sort(
    (a, b) => new Date(b.firstTimeIn).getTime() - new Date(a.firstTimeIn).getTime()
  );
  return sorted[0].phase.name;
}

// ─── Existing Compute Functions (unchanged) ───

function computeTimeMetrics(wonCards: AnalyticsCard[]): TimeMetrics {
  const conversionDays: number[] = [];
  const phaseDurations: Record<string, { total: number; count: number }> = {};

  wonCards.forEach((card) => {
    const days = getConversionDays(card);
    if (days !== null && days > 0 && days < 3650) {
      conversionDays.push(days);
    }
    card.phases_history.forEach((h) => {
      if (h.phase.name === "Start form") return;
      const phaseName = h.phase.name;
      if (!phaseDurations[phaseName]) phaseDurations[phaseName] = { total: 0, count: 0 };
      phaseDurations[phaseName].total += h.duration / 86400;
      phaseDurations[phaseName].count += 1;
    });
  });

  conversionDays.sort((a, b) => a - b);
  const avg = conversionDays.length > 0
    ? conversionDays.reduce((s, d) => s + d, 0) / conversionDays.length : 0;
  const median = conversionDays.length > 0
    ? conversionDays[Math.floor(conversionDays.length / 2)] : 0;

  return {
    averageConversionDays: Math.round(avg * 10) / 10,
    medianConversionDays: Math.round(median * 10) / 10,
    phaseAverageDays: Object.entries(phaseDurations)
      .map(([phaseName, data]) => ({ phaseName, avgDays: data.total / data.count, cardCount: data.count }))
      .filter((p) => p.avgDays > 0.01)
      .sort((a, b) => b.avgDays - a.avgDays),
  };
}

function computeGeographic(allCards: AnalyticsCard[], wonCards: AnalyticsCard[]): GeographicEntry[] {
  const stateMap: Record<string, { total: number; closed: number }> = {};
  allCards.forEach((card) => {
    const state = getStateFromLabels(card);
    if (!state) return;
    if (!stateMap[state]) stateMap[state] = { total: 0, closed: 0 };
    stateMap[state].total += 1;
  });
  wonCards.forEach((card) => {
    const state = getStateFromLabels(card);
    if (!state) return;
    if (!stateMap[state]) stateMap[state] = { total: 0, closed: 0 };
    stateMap[state].closed += 1;
  });
  return Object.entries(stateMap)
    .map(([state, data]) => ({
      state, total: data.total, closed: data.closed,
      conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function computePlans(wonCards: AnalyticsCard[], allNegociation: AnalyticsCard[]): PlanDistribution[] {
  const planMap: Record<string, { count: number; closedCount: number; totalAdhesion: number }> = {};
  [...wonCards, ...allNegociation].forEach((card) => {
    const plan = getPlanFromCard(card);
    if (!plan) return;
    if (!planMap[plan]) planMap[plan] = { count: 0, closedCount: 0, totalAdhesion: 0 };
    planMap[plan].count += 1;
  });
  wonCards.forEach((card) => {
    const plan = getPlanFromCard(card);
    if (!plan) return;
    if (!planMap[plan]) planMap[plan] = { count: 0, closedCount: 0, totalAdhesion: 0 };
    planMap[plan].closedCount += 1;
    planMap[plan].totalAdhesion += parseAdhesionValue(getFieldValue(card, "valor da Ades"));
  });
  return Object.entries(planMap)
    .map(([plan, data]) => ({
      plan, count: data.count, closedCount: data.closedCount,
      totalAdhesion: Math.round(data.totalAdhesion),
      avgAdhesion: data.closedCount > 0 ? Math.round(data.totalAdhesion / data.closedCount) : 0,
    }))
    .sort((a, b) => b.closedCount - a.closedCount);
}

function computeSellerPerformance(allCards: AnalyticsCard[], wonCards: AnalyticsCard[]): SellerMetrics[] {
  const sellerMap: Record<string, { total: number; closed: number; dealDays: number[] }> = {};
  allCards.forEach((card) => {
    card.assignees.forEach((a) => {
      if (!sellerMap[a.name]) sellerMap[a.name] = { total: 0, closed: 0, dealDays: [] };
      sellerMap[a.name].total += 1;
    });
  });
  wonCards.forEach((card) => {
    const days = getConversionDays(card);
    card.assignees.forEach((a) => {
      if (!sellerMap[a.name]) sellerMap[a.name] = { total: 0, closed: 0, dealDays: [] };
      sellerMap[a.name].closed += 1;
      if (days !== null && days > 0 && days < 3650) sellerMap[a.name].dealDays.push(days);
    });
  });
  return Object.entries(sellerMap)
    .map(([name, data]) => ({
      name, totalCards: data.total, closedCards: data.closed,
      conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 1000) / 10 : 0,
      avgDealDays: data.dealDays.length > 0
        ? Math.round((data.dealDays.reduce((s, d) => s + d, 0) / data.dealDays.length) * 10) / 10 : 0,
    }))
    .filter((s) => s.totalCards >= 1)
    .sort((a, b) => b.closedCards - a.closedCards);
}

function computeLossAnalysis(
  lostCards: AnalyticsCard[], wonCount: number, phaseCounts: Record<string, number> = {}
) {
  const totalLost = lostCards.length;
  const winLossRatio = totalLost > 0 ? Math.round((wonCount / totalLost) * 100) / 100 : wonCount;

  const reasonMap: Record<string, { count: number; companies: string[] }> = {};
  lostCards.forEach((card) => {
    const obs = getFieldValue(card, "Observaç") || getFieldValue(card, "motivo") || getFieldValue(card, "Detalhes da negociaç");
    const reason = categorizeLossReason(obs);
    if (!reasonMap[reason]) reasonMap[reason] = { count: 0, companies: [] };
    reasonMap[reason].count += 1;
    if (reasonMap[reason].companies.length < 5) reasonMap[reason].companies.push(card.title);
  });

  lostCards.forEach((card) => {
    const checkLabel = (label: string) => {
      if (!hasLabel(card, label)) return;
      if (!reasonMap[label]) reasonMap[label] = { count: 0, companies: [] };
      const obs = getFieldValue(card, "Observaç");
      if (categorizeLossReason(obs) !== label) {
        reasonMap[label].count += 1;
        if (reasonMap[label].companies.length < 5) reasonMap[label].companies.push(card.title);
      }
    };
    checkLabel("Sem Retorno");
    checkLabel("Inadimplência");
    checkLabel("Cancelamento");
  });

  const lossReasons: LossReason[] = Object.entries(reasonMap)
    .map(([reason, data]) => ({ reason, count: data.count, companies: data.companies }))
    .sort((a, b) => b.count - a.count);

  const dropOffMap: Record<string, number> = {};
  lostCards.forEach((card) => {
    const lastPhase = getLastActivePhase(card);
    if (lastPhase) dropOffMap[lastPhase] = (dropOffMap[lastPhase] || 0) + 1;
  });
  const lossByPhase: LossByPhase[] = Object.entries(dropOffMap)
    .map(([fromPhase, count]) => ({ fromPhase, count }))
    .sort((a, b) => b.count - a.count);

  const lossTypes: LossTypeBreakdown[] = [
    { type: "Não Fechou", phase: "naoFechado", count: phaseCounts[PHASE_IDS.naoFechado] || 0, color: "#ef4444" },
    { type: "Distrato", phase: "distrato", count: phaseCounts[PHASE_IDS.distrato] || 0, color: "#f97316" },
    { type: "Churn / Inadimplência", phase: "churn", count: phaseCounts[PHASE_IDS.churn] || 0, color: "#eab308" },
    { type: "Sem Perfil", phase: "semPerfil", count: phaseCounts[PHASE_IDS.semPerfil] || 0, color: "#6b7280" },
    { type: "Arquivado", phase: "arquivo", count: phaseCounts[PHASE_IDS.arquivo] || 0, color: "#374151" },
  ];

  return { totalWon: wonCount, totalLost, winLossRatio, lossReasons, lossByPhase, lossTypes };
}

function computeModality(allCards: AnalyticsCard[], wonCards: AnalyticsCard[]): ModalityEntry[] {
  const modMap: Record<string, { total: number; closed: number }> = {};
  const extract = (card: AnalyticsCard): string[] => {
    const val = getFieldValue(card, "Modalidade");
    if (!val || val === "[]") return [];
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : [val]; } catch { return [val]; }
  };
  allCards.forEach((card) => extract(card).forEach((m) => {
    if (!modMap[m]) modMap[m] = { total: 0, closed: 0 }; modMap[m].total += 1;
  }));
  wonCards.forEach((card) => extract(card).forEach((m) => {
    if (!modMap[m]) modMap[m] = { total: 0, closed: 0 }; modMap[m].closed += 1;
  }));
  return Object.entries(modMap)
    .map(([type, data]) => ({
      type, total: data.total, closed: data.closed,
      conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function computeLeadSource(allCards: AnalyticsCard[], wonCards: AnalyticsCard[]): LeadSourceMetrics[] {
  const sourceMap: Record<string, { total: number; closed: number }> = {};
  const normalize = (card: AnalyticsCard) => {
    const s = getFieldValue(card, "lead chegou");
    if (!s) return null;
    return s.includes("indicac") || s.includes("indicaç") ? "Com indicação" : "Sem indicação";
  };
  allCards.forEach((card) => {
    const n = normalize(card); if (!n) return;
    if (!sourceMap[n]) sourceMap[n] = { total: 0, closed: 0 }; sourceMap[n].total += 1;
  });
  wonCards.forEach((card) => {
    const n = normalize(card); if (!n) return;
    if (!sourceMap[n]) sourceMap[n] = { total: 0, closed: 0 }; sourceMap[n].closed += 1;
  });
  return Object.entries(sourceMap)
    .map(([source, data]) => ({
      source, total: data.total, closed: data.closed,
      conversionRate: data.total > 0 ? Math.round((data.closed / data.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function computeContractStatus(wonCards: AnalyticsCard[]): ContractStatusEntry[] {
  const statusMap: Record<string, number> = {};
  wonCards.forEach((card) => {
    const status = getFieldValue(card, "Status") || getFieldValue(card, "status");
    if (!status || status === "[]") return;
    statusMap[status] = (statusMap[status] || 0) + 1;
  });
  return Object.entries(statusMap)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

// ─── Product type from phase name ───

const PRODUCT_TYPE_MAP: { pattern: RegExp; type: string; color: string }[] = [
  { pattern: /essencial/i, type: "Essencial", color: "#3b82f6" },
  { pattern: /performance/i, type: "Performance", color: "#f59e0b" },
  { pattern: /avan[cç]ado/i, type: "Avançado", color: "#8b5cf6" },
  { pattern: /free/i, type: "Free", color: "#10b981" },
  { pattern: /transferir/i, type: "Transferir", color: "#6b7280" },
];

function getProductType(card: AnalyticsCard): { type: string; color: string } {
  const phaseName = card.current_phase?.name || "";
  for (const { pattern, type, color } of PRODUCT_TYPE_MAP) {
    if (pattern.test(phaseName)) return { type, color };
  }
  // Check phases_history for the won phase if current_phase doesn't match
  for (const ph of card.phases_history || []) {
    const name = ph.phase?.name || "";
    for (const { pattern, type, color } of PRODUCT_TYPE_MAP) {
      if (pattern.test(name)) return { type, color };
    }
  }
  // Check if it went through upsell phases
  const hasUpsell = (card.phases_history || []).some((ph) =>
    /upsell/i.test(ph.phase?.name || "")
  );
  if (hasUpsell) return { type: "Upsell", color: "#ec4899" };

  return { type: "Outro", color: "#475569" };
}

// ─── NEW: Timeline (always last 12 months, unfiltered) ───

function computeTimeline(wonCards: AnalyticsCard[]): MonthlyClosing[] {
  const now = new Date();
  const months: MonthlyClosing[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const monthLabel = monthStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

    const monthCards = wonCards.filter((card) => {
      const d = getCardEventDate(card);
      return d >= monthStart && d <= monthEnd;
    });

    const sellerMap: Record<string, number> = {};
    const productMap: Record<string, { count: number; color: string }> = {};
    monthCards.forEach((card) => {
      card.assignees.forEach((a) => {
        sellerMap[a.name] = (sellerMap[a.name] || 0) + 1;
      });
      const product = getProductType(card);
      if (!productMap[product.type]) productMap[product.type] = { count: 0, color: product.color };
      productMap[product.type].count++;
    });

    months.push({
      month: monthLabel,
      monthKey,
      count: monthCards.length,
      sellerBreakdown: Object.entries(sellerMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      productBreakdown: Object.entries(productMap)
        .map(([type, { count, color }]) => ({ type, count, color }))
        .sort((a, b) => b.count - a.count),
    });
  }

  return months;
}

// ─── NEW: Monthly Seller Performance (always last 12 months) ───

function computeMonthlySellerPerformance(
  allCards: AnalyticsCard[],
  wonCards: AnalyticsCard[]
): MonthlySellerPerformance[] {
  const now = new Date();
  const result: MonthlySellerPerformance[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const monthLabel = monthStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

    const monthWon = wonCards.filter((c) => {
      const d = getCardEventDate(c);
      return d >= monthStart && d <= monthEnd;
    });
    const monthAll = allCards.filter((c) => {
      const d = new Date(c.created_at);
      return d >= monthStart && d <= monthEnd;
    });

    // Count cards created in this month per seller (for "total" = leads created)
    const sellerMap: Record<string, { closed: number; total: number }> = {};
    monthAll.forEach((card) => {
      const creator = card.createdBy?.name;
      if (creator) {
        if (!sellerMap[creator]) sellerMap[creator] = { closed: 0, total: 0 };
        sellerMap[creator].total++;
      }
    });
    // Count won cards per assigned seller
    monthWon.forEach((card) => card.assignees.forEach((a) => {
      if (!sellerMap[a.name]) sellerMap[a.name] = { closed: 0, total: 0 };
      sellerMap[a.name].closed++;
    }));

    result.push({
      month: monthLabel,
      monthKey,
      cardCount: monthWon.length,
      sellers: Object.entries(sellerMap)
        .map(([name, data]) => ({
          name,
          closed: data.closed,
          total: data.total,
          conversionRate: 0, // not meaningful per month
        }))
        .filter((s) => s.closed >= 1)
        .sort((a, b) => b.closed - a.closed),
    });
  }

  return result;
}

// ─── NEW: Prospecting (who created leads) ───

function computeProspecting(allCards: AnalyticsCard[]): ProspectingEntry[] {
  const creatorMap: Record<string, number> = {};
  allCards.forEach((card) => {
    const creator = card.createdBy?.name;
    if (!creator) return;
    creatorMap[creator] = (creatorMap[creator] || 0) + 1;
  });
  return Object.entries(creatorMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

// ─── Raw Data Fetching ───

async function ensureRawCache() {
  if (rawCache && Date.now() - rawCache.timestamp < RAW_CACHE_TTL) {
    return rawCache;
  }

  // Fetch ALL won cards and lost cards with full pagination
  // For negotiation/prospection, use limited fetch (active pipeline)
  const [wonCards, lostCards, negotiationCards, prospectionCards, pipeData] = await Promise.all([
    fetchAllMultiPhaseCards(WON_PHASES),
    fetchAllMultiPhaseCards(LOST_PHASES.slice(0, 4)), // Skip Arquivo (1258 cards)
    fetchMultiPhaseCards([
      PHASE_IDS.emContato,
      PHASE_IDS.reuniaoAgendada,
      PHASE_IDS.apresentacaoRealizada,
      PHASE_IDS.propostaEnviada,
    ], 50),
    fetchMultiPhaseCards([
      PHASE_IDS.leadsSDR,
      PHASE_IDS.leadsEmbaixador,
      PHASE_IDS.contato1,
      PHASE_IDS.contato2,
      PHASE_IDS.contato3,
    ], 50),
    pipefyQuery(`{
      pipe(id: ${PIPE_ID}) {
        phases { id name cards_count }
      }
    }`),
  ]);

  const phaseCounts: Record<string, number> = {};
  pipeData.data.pipe.phases.forEach((p: { id: string; name: string; cards_count: number }) => {
    phaseCounts[p.id] = p.cards_count;
  });

  rawCache = { wonCards, lostCards, negotiationCards, prospectionCards, phaseCounts, timestamp: Date.now() };
  return rawCache;
}

// ─── Main Handler ───

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const cacheKey = `${fromParam || "all"}_${toParam || "all"}`;

  // Check computed analytics cache
  const cached = analyticsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ANALYTICS_CACHE_TTL) {
    return Response.json(cached.data);
  }

  try {
    const raw = await ensureRawCache();

    // Parse date range
    const fromDate = fromParam ? new Date(fromParam + "T00:00:00") : null;
    const toDate = toParam ? new Date(toParam + "T23:59:59.999") : null;

    // Filter cards by date range
    const filteredWon = filterCardsByDate(raw.wonCards, fromDate, toDate);
    const filteredLost = filterCardsByDate(raw.lostCards, fromDate, toDate);
    const filteredNegotiation = filterCardsByDate(raw.negotiationCards, fromDate, toDate);
    const filteredProspection = filterCardsByDate(raw.prospectionCards, fromDate, toDate);
    const filteredAll = [...filteredWon, ...filteredLost, ...filteredNegotiation, ...filteredProspection];

    const totalWonCount = filteredWon.length;
    const totalLostCount = filteredLost.length;

    // Compute filtered analytics
    const timeMetrics = computeTimeMetrics(filteredWon);
    const geographic = computeGeographic(filteredAll, filteredWon);
    const plans = computePlans(filteredWon, filteredNegotiation);
    const sellerPerformance = computeSellerPerformance(filteredAll, filteredWon);
    const lossAnalysis = computeLossAnalysis(filteredLost, totalWonCount,
      // When filtered, use filtered counts instead of phaseCounts
      fromDate || toDate ? {} : raw.phaseCounts
    );
    if (fromDate || toDate) {
      // Override with filtered counts
      lossAnalysis.totalWon = totalWonCount;
      lossAnalysis.totalLost = totalLostCount;
      lossAnalysis.winLossRatio = totalLostCount > 0
        ? Math.round((totalWonCount / totalLostCount) * 100) / 100 : totalWonCount;
      // Recompute loss type counts from filtered cards
      const typeCounts = { naoFechado: 0, distrato: 0, churn: 0, semPerfil: 0 };
      filteredLost.forEach((card) => {
        const p = card.current_phase.name;
        if (p.includes("Não Fechado")) typeCounts.naoFechado++;
        else if (p.includes("Distrato")) typeCounts.distrato++;
        else if (p.includes("Churn")) typeCounts.churn++;
        else if (p.includes("Sem Perfil")) typeCounts.semPerfil++;
      });
      lossAnalysis.lossTypes = [
        { type: "Não Fechou", phase: "naoFechado", count: typeCounts.naoFechado, color: "#ef4444" },
        { type: "Distrato", phase: "distrato", count: typeCounts.distrato, color: "#f97316" },
        { type: "Churn / Inadimplência", phase: "churn", count: typeCounts.churn, color: "#eab308" },
        { type: "Sem Perfil", phase: "semPerfil", count: typeCounts.semPerfil, color: "#6b7280" },
      ];
    } else {
      lossAnalysis.totalWon = WON_PHASES.reduce((s, id) => s + (raw.phaseCounts[id] || 0), 0);
      lossAnalysis.totalLost = LOST_PHASES.reduce((s, id) => s + (raw.phaseCounts[id] || 0), 0);
      lossAnalysis.winLossRatio = lossAnalysis.totalLost > 0
        ? Math.round((lossAnalysis.totalWon / lossAnalysis.totalLost) * 100) / 100 : lossAnalysis.totalWon;
    }

    const modality = computeModality(filteredAll, filteredWon);
    const leadSource = computeLeadSource([...filteredProspection, ...filteredNegotiation], filteredWon);
    const contractStatus = computeContractStatus(filteredWon);

    // Timeline and monthly seller: always computed from ALL raw data (not filtered)
    const timeline = computeTimeline(raw.wonCards);
    const monthlySellerPerformance = computeMonthlySellerPerformance(
      [...raw.wonCards, ...raw.lostCards, ...raw.negotiationCards, ...raw.prospectionCards],
      raw.wonCards
    );

    // Prospecting: filtered by date (uses created_at)
    const prospectingCards = fromDate || toDate
      ? filteredAll.filter((c) => {
          const d = new Date(c.created_at);
          if (fromDate && d < fromDate) return false;
          if (toDate && d > toDate) return false;
          return true;
        })
      : [...raw.wonCards, ...raw.lostCards, ...raw.negotiationCards, ...raw.prospectionCards];
    const prospecting = computeProspecting(prospectingCards);

    const data: AnalyticsData = {
      timeMetrics,
      geographic,
      plans,
      sellerPerformance,
      lossAnalysis,
      modality,
      leadSource,
      contractStatus,
      timeline,
      monthlySellerPerformance,
      prospecting,
      dateRange: fromParam && toParam ? { from: fromParam, to: toParam } : null,
      timestamp: new Date().toISOString(),
    };

    analyticsCache.set(cacheKey, { data, timestamp: Date.now() });
    return Response.json(data);
  } catch (error) {
    console.error("Analytics API error:", error);
    return Response.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
}
