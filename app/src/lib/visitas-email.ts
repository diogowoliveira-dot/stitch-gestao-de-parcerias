// ============================================
// REGISTRO DE VISITAS — E-MAILS DE LEMBRETE
// ============================================
// Enviados pelos Cron Jobs em /api/visitas/lembretes:
//   • todo dia às 07:00 (BRT) — visitas do dia
//   • toda segunda às 07:30 (BRT) — visitas da semana

const FROM_NAME = "DWV Visitas";
const FROM_EMAIL = "noreply@mail.dwvapp.com.br";
const SPARKPOST_ENDPOINT = "https://api.sparkpost.com/api/v1/transmissions";

/** Fuso fixo do Brasil (sem horário de verão desde 2019) */
export const OFFSET_BR = "-03:00";

export interface AgendamentoEmail {
  id: string;
  imobiliariaId: string;
  motivo: string;
  observacao: string;
  inicio: string;
  duracaoMin: number;
  status: string;
}

export interface ImobiliariaEmail {
  id: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  responsavel: { nome: string; telefone: string; email: string };
}

// ——————————————————————————————————————————
// DATAS NO FUSO DE BRASÍLIA
// ——————————————————————————————————————————

/** "2026-08-24" para o instante informado, no fuso de Brasília */
export function diaBR(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Instante das 00:00 (BRT) do dia informado */
export function inicioDiaBR(dia: string): Date {
  return new Date(`${dia}T00:00:00${OFFSET_BR}`);
}

/** Instante das 23:59:59 (BRT) do dia informado */
export function fimDiaBR(dia: string): Date {
  return new Date(`${dia}T23:59:59.999${OFFSET_BR}`);
}

export function somarDiasISO(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00${OFFSET_BR}`);
  d.setUTCDate(d.getUTCDate() + n);
  return diaBR(d);
}

const SEMANA_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Dia da semana (0 = domingo) do dia informado, no fuso de Brasília */
export function diaDaSemanaBR(dia: string): number {
  const rotulo = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(new Date(`${dia}T12:00:00${OFFSET_BR}`));
  return Math.max(0, SEMANA_EN.indexOf(rotulo));
}

/** Segunda-feira da semana do dia informado */
export function segundaDaSemana(dia: string): string {
  const dow = diaDaSemanaBR(dia);
  return somarDiasISO(dia, dow === 0 ? -6 : 1 - dow);
}

const FMT_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
});

const FMT_DIA_LONGO = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export const horaBR = (iso: string) => FMT_HORA.format(new Date(iso));
export const diaLongoBR = (iso: string) => FMT_DIA_LONGO.format(new Date(iso));

// ——————————————————————————————————————————
// HTML
// ——————————————————————————————————————————

function esc(s: string): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

function linhaVisita(a: AgendamentoEmail, imob: ImobiliariaEmail | undefined): string {
  const mapa = imob
    ? `https://www.google.com/maps/search/?api=1&query=${imob.lat},${imob.lng}`
    : "";
  const fim = new Date(new Date(a.inicio).getTime() + a.duracaoMin * 60000);

  return `
  <tr>
    <td style="padding:0 0 12px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="border:1px solid #e5e7eb;border-radius:10px;border-left:4px solid #ec1313;">
        <tr>
          <td style="padding:14px 16px;">
            <div style="font-size:13px;font-weight:700;color:#ec1313;letter-spacing:.3px;">
              ${esc(horaBR(a.inicio))} – ${esc(horaBR(fim.toISOString()))}
            </div>
            <div style="font-size:16px;font-weight:700;color:#111827;margin-top:2px;">
              ${esc(imob?.nome ?? "Imobiliária")}
            </div>
            <div style="font-size:13px;color:#4b5563;margin-top:4px;">
              <strong>Motivo:</strong> ${esc(a.motivo)}
            </div>
            ${
              a.observacao
                ? `<div style="font-size:13px;color:#6b7280;margin-top:4px;">${esc(a.observacao)}</div>`
                : ""
            }
            ${
              imob?.responsavel?.nome
                ? `<div style="font-size:13px;color:#6b7280;margin-top:6px;">
                     Contato: ${esc(imob.responsavel.nome)}${
                       imob.responsavel.telefone
                         ? ` — ${esc(imob.responsavel.telefone)}`
                         : ""
                     }
                   </div>`
                : ""
            }
            ${
              imob?.endereco
                ? `<div style="font-size:13px;color:#6b7280;margin-top:4px;">${esc(imob.endereco)}</div>`
                : ""
            }
            ${
              mapa
                ? `<div style="margin-top:10px;">
                     <a href="${mapa}" style="font-size:12px;font-weight:700;color:#ec1313;text-decoration:none;">
                       Abrir no mapa &rarr;
                     </a>
                   </div>`
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function envelope(titulo: string, subtitulo: string, corpo: string, rodape: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
          <tr>
            <td style="background:#0a0a0a;padding:22px 24px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#ec1313;text-transform:uppercase;">
                DWV · Registro de Visitas
              </div>
              <div style="font-size:21px;font-weight:800;color:#ffffff;margin-top:6px;">${esc(titulo)}</div>
              <div style="font-size:13px;color:#9ca3af;margin-top:4px;">${esc(subtitulo)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${corpo}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#fafafa;border-top:1px solid #eeeeee;font-size:11px;color:#9ca3af;">
              ${rodape}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Resumo do dia — enviado todo dia de manhã */
export function htmlResumoDiario(
  nome: string,
  dia: string,
  itens: AgendamentoEmail[],
  imobiliarias: ImobiliariaEmail[]
): { assunto: string; html: string } {
  const porId = new Map(imobiliarias.map((i) => [i.id, i]));
  const data = diaLongoBR(`${dia}T12:00:00${OFFSET_BR}`);
  const saudacao = nome ? `Bom dia, ${nome.split(" ")[0]}!` : "Bom dia!";

  const corpo =
    itens.length === 0
      ? `<tr><td style="font-size:15px;color:#374151;line-height:1.6;">
           ${esc(saudacao)} Você <strong>não tem visitas programadas</strong> para hoje.
           Que tal aproveitar para prospectar uma imobiliária nova?
         </td></tr>`
      : `<tr><td style="font-size:15px;color:#374151;line-height:1.6;padding-bottom:16px;">
           ${esc(saudacao)} Você tem <strong>${itens.length} ${
             itens.length === 1 ? "visita programada" : "visitas programadas"
           }</strong> para hoje:
         </td></tr>` + itens.map((a) => linhaVisita(a, porId.get(a.imobiliariaId))).join("");

  return {
    assunto:
      itens.length === 0
        ? `Agenda de hoje — nenhuma visita programada`
        : `Agenda de hoje — ${itens.length} ${itens.length === 1 ? "visita" : "visitas"}`,
    html: envelope(
      "Suas visitas de hoje",
      data.charAt(0).toUpperCase() + data.slice(1),
      corpo,
      "Você recebe este resumo todo dia às 7h. Ajuste as preferências na tela Agenda do app."
    ),
  };
}

/** Resumo da semana — enviado às segundas-feiras */
export function htmlResumoSemanal(
  nome: string,
  deDia: string,
  ateDia: string,
  itens: AgendamentoEmail[],
  imobiliarias: ImobiliariaEmail[]
): { assunto: string; html: string } {
  const porId = new Map(imobiliarias.map((i) => [i.id, i]));
  const saudacao = nome ? `Boa semana, ${nome.split(" ")[0]}!` : "Boa semana!";

  // agrupa por dia (fuso BR)
  const grupos = new Map<string, AgendamentoEmail[]>();
  itens.forEach((a) => {
    const k = diaBR(new Date(a.inicio));
    grupos.set(k, [...(grupos.get(k) ?? []), a]);
  });

  const dias = [...grupos.keys()].sort();

  const corpo =
    itens.length === 0
      ? `<tr><td style="font-size:15px;color:#374151;line-height:1.6;">
           ${esc(saudacao)} Sua semana está <strong>sem visitas programadas</strong>.
           Abra o app e monte sua rota.
         </td></tr>`
      : `<tr><td style="font-size:15px;color:#374151;line-height:1.6;padding-bottom:16px;">
           ${esc(saudacao)} Você tem <strong>${itens.length} ${
             itens.length === 1 ? "visita programada" : "visitas programadas"
           }</strong> nesta semana, em ${dias.length} ${dias.length === 1 ? "dia" : "dias"}:
         </td></tr>` +
        dias
          .map((d) => {
            const rotulo = diaLongoBR(`${d}T12:00:00${OFFSET_BR}`);
            return (
              `<tr><td style="padding:6px 0 10px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">
                 ${esc(rotulo)}
               </td></tr>` +
              (grupos.get(d) ?? [])
                .map((a) => linhaVisita(a, porId.get(a.imobiliariaId)))
                .join("")
            );
          })
          .join("");

  const fmt = (dia: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(`${dia}T12:00:00${OFFSET_BR}`));

  return {
    assunto: `Agenda da semana — ${itens.length} ${itens.length === 1 ? "visita" : "visitas"}`,
    html: envelope(
      "Suas visitas da semana",
      `${fmt(deDia)} a ${fmt(ateDia)}`,
      corpo,
      "Você recebe este resumo toda segunda às 7h30. Ajuste as preferências na tela Agenda do app."
    ),
  };
}

// ——————————————————————————————————————————
// ENVIO
// ——————————————————————————————————————————

export interface Anexo {
  nome: string;
  tipo: string;
  /** Conteúdo em base64 */
  dados: string;
}

export async function enviarEmail({
  para,
  nome,
  assunto,
  html,
  anexos,
}: {
  /** Um endereço ou vários */
  para: string | { email: string; nome?: string }[];
  nome?: string;
  assunto: string;
  html: string;
  anexos?: Anexo[];
}): Promise<void> {
  const apiKey = process.env.SPARKPOST_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SPARKPOST_API_KEY não configurada. Adicione em Vercel → Settings → Environment Variables."
    );
  }

  const destinatarios =
    typeof para === "string"
      ? [{ address: { email: para, name: nome || para } }]
      : para.map((p) => ({ address: { email: p.email, name: p.nome || p.email } }));

  const conteudo: Record<string, unknown> = {
    from: { name: FROM_NAME, email: FROM_EMAIL },
    subject: assunto,
    html,
  };

  if (anexos?.length) {
    conteudo.attachments = anexos.map((a) => ({
      name: a.nome,
      type: a.tipo,
      data: a.dados,
    }));
  }

  const res = await fetch(SPARKPOST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ recipients: destinatarios, content: conteudo }),
  });

  if (!res.ok) {
    const erro = await res.text();
    throw new Error(`SparkPost HTTP ${res.status}: ${erro}`);
  }
}

// ——————————————————————————————————————————
// CONVITE DE AGENDA
// ——————————————————————————————————————————

export interface DadosVisitaEmail {
  imobiliaria: string;
  inicio: string;
  duracaoMin: number;
  motivo: string;
  observacao?: string;
  endereco?: string;
  lat?: number | null;
  lng?: number | null;
  executivo: string;
}

function blocoVisita(d: DadosVisitaEmail): string {
  const fim = new Date(new Date(d.inicio).getTime() + d.duracaoMin * 60000);
  const mapa =
    d.lat != null && d.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`
      : "";
  const dia = diaLongoBR(d.inicio);

  return `
  <tr>
    <td style="padding:0 0 4px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
             style="border:1px solid #e5e7eb;border-radius:10px;border-left:4px solid #ec1313;">
        <tr>
          <td style="padding:16px;">
            <div style="font-size:13px;font-weight:700;color:#ec1313;text-transform:capitalize;">
              ${esc(dia)}
            </div>
            <div style="font-size:20px;font-weight:800;color:#111827;margin-top:2px;">
              ${esc(horaBR(d.inicio))} – ${esc(horaBR(fim.toISOString()))}
            </div>
            <div style="font-size:15px;font-weight:700;color:#111827;margin-top:8px;">
              ${esc(d.imobiliaria)}
            </div>
            <div style="font-size:13px;color:#4b5563;margin-top:4px;">
              <strong>Motivo:</strong> ${esc(d.motivo)}
            </div>
            ${d.observacao ? `<div style="font-size:13px;color:#6b7280;margin-top:4px;">${esc(d.observacao)}</div>` : ""}
            ${d.endereco ? `<div style="font-size:13px;color:#6b7280;margin-top:6px;">${esc(d.endereco)}</div>` : ""}
            ${
              mapa
                ? `<div style="margin-top:12px;">
                     <a href="${mapa}" style="font-size:12px;font-weight:700;color:#ec1313;text-decoration:none;">Abrir no mapa &rarr;</a>
                   </div>`
                : ""
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

/** E-mail que acompanha o convite .ics */
export function htmlConvite(
  d: DadosVisitaEmail,
  cancelar = false
): { assunto: string; html: string } {
  const corpo =
    `<tr><td style="font-size:15px;color:#374151;line-height:1.6;padding-bottom:16px;">
       ${
         cancelar
           ? `A visita abaixo foi <strong>cancelada</strong> por ${esc(d.executivo)}.`
           : `${esc(d.executivo)} agendou uma visita com você. O convite em anexo entra direto na sua agenda — é só confirmar.`
       }
     </td></tr>` + blocoVisita(d);

  return {
    assunto: cancelar
      ? `Visita cancelada — ${d.imobiliaria}`
      : `Convite de visita — ${d.imobiliaria}, ${diaLongoBR(d.inicio)} às ${horaBR(d.inicio)}`,
    html: envelope(
      cancelar ? "Visita cancelada" : "Convite de visita",
      cancelar ? "O evento foi removido da agenda" : "Adicione à sua agenda",
      corpo,
      "Convite enviado pelo Registro de Visitas da DWV."
    ),
  };
}

/** Aviso enviado 2 dias antes da visita */
export function htmlAviso2Dias(
  d: DadosVisitaEmail,
  paraOResponsavel: boolean
): { assunto: string; html: string } {
  const corpo =
    `<tr><td style="font-size:15px;color:#374151;line-height:1.6;padding-bottom:16px;">
       ${
         paraOResponsavel
           ? `Passando para lembrar: sua visita com ${esc(d.executivo)} (DWV) é <strong>daqui a 2 dias</strong>.`
           : `Sua visita na <strong>${esc(d.imobiliaria)}</strong> é daqui a 2 dias. Vale confirmar com o contato antes.`
       }
     </td></tr>` + blocoVisita(d);

  return {
    assunto: `Daqui a 2 dias: visita — ${d.imobiliaria}`,
    html: envelope(
      "Visita em 2 dias",
      `${diaLongoBR(d.inicio)} às ${horaBR(d.inicio)}`,
      corpo,
      "Aviso automático do Registro de Visitas da DWV."
    ),
  };
}
