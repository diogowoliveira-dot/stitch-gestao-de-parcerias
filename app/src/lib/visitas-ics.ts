// ============================================
// CONVITE DE AGENDA (iCalendar / .ics)
// ============================================
// O convite vai por e-mail com METHOD:REQUEST. É assim que o Google Agenda
// (e Outlook, Apple Calendar) cria o evento na agenda de quem recebe, com os
// botões de Sim/Não — sem precisar que o executivo conecte a conta Google.

export interface DadosConvite {
  /** Id do agendamento — mantém o mesmo evento em atualizações */
  uid: string;
  inicio: string; // ISO
  duracaoMin: number;
  imobiliaria: string;
  motivo: string;
  observacao?: string;
  endereco?: string;
  lat?: number | null;
  lng?: number | null;
  organizador: { nome: string; email: string };
  convidado?: { nome: string; email: string } | null;
  /** Sobe a cada alteração para o calendário aceitar a atualização */
  sequencia?: number;
  /** Aviso automático no calendário de quem recebe */
  avisoDias?: number;
}

const DOMINIO = "dwvapp.com.br";

// ——————————————————————————————————————————
// FORMATAÇÃO
// ——————————————————————————————————————————

/** 2026-08-26T17:00:00.000Z → 20260826T170000Z */
export function dataICS(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapar(v: string): string {
  return String(v ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const octetos = (s: string) =>
  typeof TextEncoder !== "undefined"
    ? new TextEncoder().encode(s).length
    : Buffer.byteLength(s, "utf8");

/**
 * O RFC 5545 limita a linha a 75 **octetos** (não caracteres) e a continuação
 * começa com um espaço. Com acentos um caractere ocupa 2 bytes, então a conta
 * é feita em bytes — e nunca no meio de um caractere.
 */
function dobrar(linha: string): string {
  if (octetos(linha) <= 75) return linha;

  const partes: string[] = [];
  // usa os code points para não partir caractere acentuado nem emoji
  const chars = Array.from(linha);
  let atual = "";
  let bytes = 0;
  let limite = 75; // primeira linha

  for (const c of chars) {
    const b = octetos(c);
    if (bytes + b > limite) {
      partes.push(atual);
      atual = " "; // continuação
      bytes = 1;
      limite = 75;
    }
    atual += c;
    bytes += b;
  }
  if (atual) partes.push(atual);

  return partes.join("\r\n");
}

// ——————————————————————————————————————————
// ICS
// ——————————————————————————————————————————

export function tituloVisita(imobiliaria: string): string {
  return `Visita DWV — ${imobiliaria}`;
}

export function montarICS(d: DadosConvite, cancelar = false): string {
  const inicio = new Date(d.inicio);
  const fim = new Date(inicio.getTime() + d.duracaoMin * 60000);
  const avisoDias = d.avisoDias ?? 2;

  const descricao = [
    `Motivo: ${d.motivo}`,
    d.observacao ? `Observações: ${d.observacao}` : "",
    d.endereco ? `Endereço: ${d.endereco}` : "",
    "",
    "Agendado pelo Registro de Visitas da DWV.",
  ]
    .filter(Boolean)
    .join("\n");

  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//DWV//Registro de Visitas//PT-BR`,
    "CALSCALE:GREGORIAN",
    `METHOD:${cancelar ? "CANCEL" : "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${d.uid}@${DOMINIO}`,
    `SEQUENCE:${d.sequencia ?? 0}`,
    `DTSTAMP:${dataICS(new Date())}`,
    `DTSTART:${dataICS(inicio)}`,
    `DTEND:${dataICS(fim)}`,
    `SUMMARY:${escapar(tituloVisita(d.imobiliaria))}`,
    `DESCRIPTION:${escapar(descricao)}`,
    d.endereco ? `LOCATION:${escapar(d.endereco)}` : "",
    d.lat != null && d.lng != null ? `GEO:${d.lat};${d.lng}` : "",
    `ORGANIZER;CN=${escapar(d.organizador.nome || d.organizador.email)}:mailto:${d.organizador.email}`,
    `ATTENDEE;CN=${escapar(d.organizador.nome || d.organizador.email)};ROLE=CHAIR;PARTSTAT=ACCEPTED;RSVP=FALSE:mailto:${d.organizador.email}`,
    d.convidado?.email
      ? `ATTENDEE;CN=${escapar(d.convidado.nome || d.convidado.email)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${d.convidado.email}`
      : "",
    `STATUS:${cancelar ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
  ].filter(Boolean);

  if (!cancelar) {
    linhas.push(
      "BEGIN:VALARM",
      `TRIGGER:-P${avisoDias}D`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapar(`Visita na ${d.imobiliaria} em ${avisoDias} dias`)}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapar(`Visita na ${d.imobiliaria} em 1 hora`)}`,
      "END:VALARM"
    );
  }

  linhas.push("END:VEVENT", "END:VCALENDAR");

  return linhas.map(dobrar).join("\r\n") + "\r\n";
}

// ——————————————————————————————————————————
// LINK "ADICIONAR AO GOOGLE AGENDA"
// ——————————————————————————————————————————

/** Abre o Google Agenda já preenchido — atalho para a agenda do próprio executivo */
export function linkGoogleAgenda(d: DadosConvite): string {
  const inicio = new Date(d.inicio);
  const fim = new Date(inicio.getTime() + d.duracaoMin * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: tituloVisita(d.imobiliaria),
    dates: `${dataICS(inicio)}/${dataICS(fim)}`,
    details: [
      `Motivo: ${d.motivo}`,
      d.observacao ? `Observações: ${d.observacao}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (d.endereco) params.set("location", d.endereco);
  if (d.convidado?.email) params.set("add", d.convidado.email);

  return `https://calendar.google.com/calendar/render?${params}`;
}
