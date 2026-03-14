export interface PhaseHistory {
  phase: { name: string };
  firstTimeIn: string;
  lastTimeOut: string | null;
  duration: number; // seconds
}

export interface CardField {
  name: string;
  value: string;
}

export interface CardLabel {
  name: string;
  color?: string;
}

export interface AnalyticsCard {
  id: string;
  title: string;
  current_phase: { name: string };
  assignees: { name: string }[];
  createdBy: { name: string };
  labels: CardLabel[];
  fields: CardField[];
  phases_history: PhaseHistory[];
  created_at: string;
  done: boolean;
}

export interface TimeMetrics {
  averageConversionDays: number;
  medianConversionDays: number;
  phaseAverageDays: {
    phaseName: string;
    avgDays: number;
    cardCount: number;
  }[];
}

export interface GeographicEntry {
  state: string;
  total: number;
  closed: number;
  conversionRate: number;
}

export interface PlanDistribution {
  plan: string;
  count: number;
  closedCount: number;
  totalAdhesion: number;
  avgAdhesion: number;
}

export interface SellerMetrics {
  name: string;
  totalCards: number;
  closedCards: number;
  conversionRate: number;
  avgDealDays: number;
}

export interface LossReason {
  reason: string;
  count: number;
  companies: string[];
}

export interface LossByPhase {
  fromPhase: string;
  count: number;
}

export interface LossTypeBreakdown {
  type: string;
  phase: string;
  count: number;
  color: string;
}

export interface LeadSourceMetrics {
  source: string;
  total: number;
  closed: number;
  conversionRate: number;
}

export interface ModalityEntry {
  type: string;
  total: number;
  closed: number;
  conversionRate: number;
}

export interface ContractStatusEntry {
  status: string;
  count: number;
}

export interface ProductBreakdown {
  type: string;
  count: number;
  color: string;
}

export interface MonthlyClosing {
  month: string;
  monthKey: string;
  count: number;
  sellerBreakdown: { name: string; count: number }[];
  productBreakdown: ProductBreakdown[];
}

export interface MonthlySellerEntry {
  name: string;
  closed: number;
  total: number;
  conversionRate: number;
}

export interface MonthlySellerPerformance {
  month: string;
  monthKey: string;
  cardCount: number;
  sellers: MonthlySellerEntry[];
}

export interface ProspectingEntry {
  name: string;
  total: number;
}

export interface AnalyticsData {
  timeMetrics: TimeMetrics;
  geographic: GeographicEntry[];
  plans: PlanDistribution[];
  sellerPerformance: SellerMetrics[];
  lossAnalysis: {
    totalWon: number;
    totalLost: number;
    winLossRatio: number;
    lossReasons: LossReason[];
    lossByPhase: LossByPhase[];
    lossTypes: LossTypeBreakdown[];
  };
  modality: ModalityEntry[];
  leadSource: LeadSourceMetrics[];
  contractStatus: ContractStatusEntry[];
  timeline: MonthlyClosing[];
  monthlySellerPerformance: MonthlySellerPerformance[];
  prospecting: ProspectingEntry[];
  dateRange: { from: string; to: string } | null;
  timestamp: string;
}
