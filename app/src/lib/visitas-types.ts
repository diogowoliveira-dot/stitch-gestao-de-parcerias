// ============================================
// REGISTRO DE VISITAS — TIPOS E HELPERS
// ============================================

export interface Coords {
  lat: number;
  lng: number;
  precisao: number | null; // metros (accuracy do GPS)
}

export interface Responsavel {
  nome: string;
  telefone: string;
  email: string;
}

export interface Imobiliaria {
  id: string;
  nome: string;
  lat: number;
  lng: number;
  endereco: string;
  responsavel: Responsavel;
  criadaEm: string; // ISO
}

export interface Visita {
  id: string;
  imobiliariaId: string;
  motivo: string;
  observacao: string;
  checkIn: string; // ISO — data/hora extraída do sistema
  checkOut: string | null; // ISO — preenchido no check-out
  coordsCheckIn: Coords | null;
  coordsCheckOut: Coords | null;
  /** Distância em metros entre o GPS do check-in e o pin da imobiliária */
  distanciaCheckIn: number | null;
}

export interface VisitasState {
  imobiliarias: Imobiliaria[];
  visitas: Visita[];
}

// ============================================
// MOTIVOS DE VISITA
// ============================================
// Lista inicial — o executivo pode editar, incluir e remover em
// "Editar motivos" (a lista fica salva junto com os demais dados).

export const MOTIVOS_PADRAO = [
  "Prospecção",
  "Apresentação de produto",
  "Treinamento",
  "Relacionamento",
  "Resolver pendência",
  "Assinatura de contrato",
  "Evento / Ação local",
] as const;

/** Sempre disponível no fim da lista, abre campo de texto livre */
export const MOTIVO_OUTRO = "Outro";

// ============================================
// GEO
// ============================================

/** Distância em metros entre duas coordenadas (Haversine). */
export function distanciaMetros(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const R = 6371000;
  const rad = (v: number) => (v * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

/** Lê a posição atual do dispositivo. Rejeita com mensagem em pt-BR. */
export function lerPosicao(timeout = 12000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Este dispositivo não suporta geolocalização."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          precisao: pos.coords.accuracy ?? null,
        }),
      (err) => {
        const msgs: Record<number, string> = {
          1: "Permissão de localização negada. Libere o GPS nas configurações do navegador.",
          2: "Não foi possível obter sua localização agora.",
          3: "Tempo esgotado ao buscar sua localização.",
        };
        reject(new Error(msgs[err.code] || "Falha ao obter localização."));
      },
      { enableHighAccuracy: true, timeout, maximumAge: 15000 }
    );
  });
}

/** Busca o endereço aproximado de uma coordenada (via /api/visitas/geocodificar). */
export async function buscarEndereco(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`/api/visitas/geocodificar?lat=${lat}&lng=${lng}`);
    if (!res.ok) return "";
    const d = await res.json();
    return d?.encontrado ? String(d.endereco ?? "") : "";
  } catch {
    return "";
  }
}

// ============================================
// DATAS
// ============================================

const TZ = "pt-BR";

export function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString(TZ, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString(TZ, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDataHora(iso: string): string {
  return `${fmtData(iso)} às ${fmtHora(iso)}`;
}

/** "hoje", "ontem", "há 5 dias", "há 2 meses" */
export function tempoRelativo(iso: string): string {
  const dias = diasDesde(iso);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  if (meses === 1) return "há 1 mês";
  if (meses < 12) return `há ${meses} meses`;
  const anos = Math.floor(meses / 12);
  return anos === 1 ? "há 1 ano" : `há ${anos} anos`;
}

export function diasDesde(iso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje.getTime() - d.getTime()) / 86400000));
}

/** Duração entre check-in e check-out formatada (ex.: "1h 12min"). */
export function duracao(inicio: string, fim: string): string {
  return formatarDuracaoMs(new Date(fim).getTime() - new Date(inicio).getTime());
}

export function formatarDuracaoMs(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

/** Cronômetro da visita em andamento: "00:12:35" */
export function cronometro(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// ============================================
// STATUS / CORES DO PIN (recência da última visita)
// ============================================

export type StatusVisita = "ativa" | "recente" | "atencao" | "fria" | "nunca";

export const STATUS_INFO: Record<
  StatusVisita,
  { cor: string; label: string; descricao: string }
> = {
  ativa: { cor: "#3b82f6", label: "Em visita", descricao: "Check-in aberto agora" },
  recente: { cor: "#00c29f", label: "Em dia", descricao: "Visitada nos últimos 7 dias" },
  atencao: { cor: "#ffc300", label: "Atenção", descricao: "Última visita entre 8 e 30 dias" },
  fria: { cor: "#ec1313", label: "Fria", descricao: "Sem visita há mais de 30 dias" },
  nunca: { cor: "#6b7280", label: "Sem visita", descricao: "Cadastrada, nunca visitada" },
};

export function statusPorUltimaVisita(
  ultimaVisitaIso: string | null,
  emVisita = false
): StatusVisita {
  if (emVisita) return "ativa";
  if (!ultimaVisitaIso) return "nunca";
  const d = diasDesde(ultimaVisitaIso);
  if (d <= 7) return "recente";
  if (d <= 30) return "atencao";
  return "fria";
}

export function telefoneMask(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// ============================================
// AGENDA DE VISITAS PROGRAMADAS
// ============================================

export type StatusAgendamento = "programada" | "realizada" | "cancelada";

export interface Agendamento {
  id: string;
  imobiliariaId: string;
  motivo: string;
  observacao: string;
  /** Data/hora programada (ISO) */
  inicio: string;
  /** Duração prevista em minutos */
  duracaoMin: number;
  status: StatusAgendamento;
  /** Visita gerada quando o check-in é feito a partir do agendamento */
  visitaId: string | null;
  criadoEm: string;
}

/** Perfil do executivo — destino dos e-mails de lembrete */
export interface Perfil {
  nome: string;
  email: string;
  lembreteDiario: boolean;
  lembreteSemanal: boolean;
  /** Aviso por e-mail 2 dias antes da visita */
  avisoDoisDias: boolean;
  /** Já vem marcado ao agendar: manda convite de agenda ao responsável */
  convidarResponsavel: boolean;
}

export const PERFIL_VAZIO: Perfil = {
  nome: "",
  email: "",
  lembreteDiario: true,
  lembreteSemanal: true,
  avisoDoisDias: true,
  convidarResponsavel: true,
};

export const DURACOES = [30, 45, 60, 90, 120] as const;

export const STATUS_AGENDA: Record<
  StatusAgendamento,
  { cor: string; label: string }
> = {
  programada: { cor: "#3b82f6", label: "Programada" },
  realizada: { cor: "#00c29f", label: "Realizada" },
  cancelada: { cor: "#6b7280", label: "Cancelada" },
};

// ---------- helpers de calendário ----------

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Chave YYYY-MM-DD no fuso local */
export function chaveDia(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

export function inicioDoDia(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function fimDoDia(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Semana começando no domingo */
export function inicioDaSemana(d: Date): Date {
  const x = inicioDoDia(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export function fimDaSemana(d: Date): Date {
  const x = inicioDaSemana(d);
  x.setDate(x.getDate() + 6);
  return fimDoDia(x);
}

export function inicioDoMes(d: Date): Date {
  return inicioDoDia(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function fimDoMes(d: Date): Date {
  return fimDoDia(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function somarDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function mesmoDia(a: Date | string, b: Date | string): boolean {
  return chaveDia(a) === chaveDia(b);
}

export function ehHoje(d: Date | string): boolean {
  return mesmoDia(d, new Date());
}

/** "Seg, 24 de agosto" */
export function fmtDiaExtenso(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${DIAS_SEMANA[dt.getDay()]}, ${dt.getDate()} de ${MESES[dt.getMonth()].toLowerCase()}`;
}

/** Grade do mês: 6 semanas x 7 dias, começando no domingo */
export function gradeDoMes(d: Date): Date[] {
  const primeiro = inicioDaSemana(inicioDoMes(d));
  return Array.from({ length: 42 }, (_, i) => somarDias(primeiro, i));
}

/** Converte "2026-08-24" + "14:30" em ISO local */
export function montarISO(dia: string, hora: string): string {
  const [a, m, d] = dia.split("-").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(a, m - 1, d, h, min, 0, 0).toISOString();
}

export function horaDoISO(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Fim previsto do agendamento */
export function fimPrevisto(a: Agendamento): Date {
  return new Date(new Date(a.inicio).getTime() + a.duracaoMin * 60000);
}
