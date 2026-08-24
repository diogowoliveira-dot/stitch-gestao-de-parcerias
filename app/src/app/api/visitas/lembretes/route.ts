import { NextRequest, NextResponse } from "next/server";
import {
  diaBR,
  enviarEmail,
  fimDiaBR,
  htmlAviso2Dias,
  htmlResumoDiario,
  htmlResumoSemanal,
  inicioDiaBR,
  segundaDaSemana,
  somarDiasISO,
  type AgendamentoEmail,
  type DadosVisitaEmail,
  type ImobiliariaEmail,
} from "@/lib/visitas-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Tipo = "diario" | "semanal";

interface Payload {
  agendamentos: AgendamentoEmail[];
  imobiliarias: ImobiliariaEmail[];
}

/** Recorta a agenda no intervalo do resumo (fuso de Brasília) */
function filtrar(itens: AgendamentoEmail[], de: Date, ate: Date) {
  return itens
    .filter((a) => a.status === "programada")
    .filter((a) => {
      const t = new Date(a.inicio).getTime();
      return t >= de.getTime() && t <= ate.getTime();
    })
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Monta assunto/html do resumo pedido */
function montar(tipo: Tipo, nome: string, payload: Payload) {
  const hoje = diaBR();

  if (tipo === "diario") {
    const itens = filtrar(
      payload.agendamentos,
      inicioDiaBR(hoje),
      fimDiaBR(hoje)
    );
    return { ...htmlResumoDiario(nome, hoje, itens, payload.imobiliarias), itens };
  }

  // Semanal: da segunda-feira desta semana até domingo
  const segunda = segundaDaSemana(hoje);
  const domingo = somarDiasISO(segunda, 6);
  // no envio de segunda-feira o início é o próprio dia; se rodar no meio da
  // semana (teste), mostra a semana inteira a partir de hoje
  const inicio = hoje > segunda ? hoje : segunda;
  const itens = filtrar(
    payload.agendamentos,
    inicioDiaBR(inicio),
    fimDiaBR(domingo)
  );
  return {
    ...htmlResumoSemanal(nome, inicio, domingo, itens, payload.imobiliarias),
    itens,
  };
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Avisos de 2 dias de antecedência.
 * Vão junto com a rodada diária — o plano Hobby da Vercel permite só 2 crons,
 * então não faz sentido gastar um terceiro só para isso.
 */
async function enviarAvisosD2(
  executivo: { nome: string; email: string },
  payload: Payload
): Promise<number> {
  const alvo = somarDiasISO(diaBR(), 2);
  const de = inicioDiaBR(alvo).getTime();
  const ate = fimDiaBR(alvo).getTime();

  const porId = new Map(payload.imobiliarias.map((i) => [i.id, i]));
  const itens = payload.agendamentos
    .filter((a) => a.status === "programada")
    .filter((a) => {
      const t = new Date(a.inicio).getTime();
      return t >= de && t <= ate;
    });

  let enviados = 0;

  for (const a of itens) {
    const imob = porId.get(a.imobiliariaId);
    const visita: DadosVisitaEmail = {
      imobiliaria: imob?.nome ?? "Imobiliária",
      inicio: a.inicio,
      duracaoMin: a.duracaoMin,
      motivo: a.motivo,
      observacao: a.observacao,
      endereco: imob?.endereco,
      lat: imob?.lat ?? null,
      lng: imob?.lng ?? null,
      executivo: executivo.nome || executivo.email,
    };

    // avisa o executivo
    try {
      const { assunto, html } = htmlAviso2Dias(visita, false);
      await enviarEmail({ para: executivo.email, nome: executivo.nome, assunto, html });
      enviados++;
    } catch (e) {
      console.error("[visitas/lembretes] aviso D-2 executivo", e);
    }

    // e o responsável da imobiliária, quando há e-mail no cadastro
    const contato = imob?.responsavel?.email?.trim() ?? "";
    if (EMAIL_OK.test(contato)) {
      try {
        const { assunto, html } = htmlAviso2Dias(visita, true);
        await enviarEmail({
          para: contato,
          nome: imob?.responsavel?.nome ?? "",
          assunto,
          html,
        });
        enviados++;
      } catch (e) {
        console.error("[visitas/lembretes] aviso D-2 responsável", e);
      }
    }
  }

  return enviados;
}

// ============================================
// GET — disparo automático (Vercel Cron)
// ============================================
export async function GET(req: NextRequest) {
  const tipo = (req.nextUrl.searchParams.get("tipo") ?? "diario") as Tipo;
  if (tipo !== "diario" && tipo !== "semanal") {
    return NextResponse.json({ erro: "tipo inválido" }, { status: 400 });
  }

  // O Vercel Cron envia "Authorization: Bearer $CRON_SECRET"
  const segredo = process.env.CRON_SECRET;
  if (segredo) {
    if (req.headers.get("authorization") !== `Bearer ${segredo}`) {
      return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { erro: "CRON_SECRET não configurado" },
      { status: 401 }
    );
  }

  try {
    // carregado aqui e não no topo: sem banco configurado o build não quebra
    const { prisma } = await import("@/lib/prisma");
    const inscritos = await prisma.visitaAgendaSnapshot.findMany({
      where: tipo === "diario" ? { lembreteDiario: true } : { lembreteSemanal: true },
    });

    const resultados: { email: string; visitas: number; ok: boolean; erro?: string }[] =
      [];
    let avisosD2 = 0;

    for (const snap of inscritos) {
      const payload = (snap.payload ?? {}) as unknown as Payload;
      const dados: Payload = {
        agendamentos: Array.isArray(payload.agendamentos) ? payload.agendamentos : [],
        imobiliarias: Array.isArray(payload.imobiliarias) ? payload.imobiliarias : [],
      };
      const { assunto, html, itens } = montar(tipo, snap.nome, dados);

      try {
        await enviarEmail({ para: snap.email, nome: snap.nome, assunto, html });
        resultados.push({ email: snap.email, visitas: itens.length, ok: true });

        // na rodada diária vão junto os avisos de 2 dias de antecedência
        if (tipo === "diario" && snap.avisoDoisDias) {
          avisosD2 += await enviarAvisosD2(
            { nome: snap.nome, email: snap.email },
            dados
          );
        }
      } catch (e) {
        console.error("[visitas/lembretes] falha para", snap.email, e);
        resultados.push({
          email: snap.email,
          visitas: itens.length,
          ok: false,
          erro: (e as Error).message,
        });
      }
    }

    return NextResponse.json({
      tipo,
      dia: diaBR(),
      enviados: resultados.filter((r) => r.ok).length,
      falhas: resultados.filter((r) => !r.ok).length,
      avisosDoisDias: avisosD2,
      resultados,
    });
  } catch (e) {
    console.error("[visitas/lembretes] GET", e);
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}

// ============================================
// POST — envio manual/teste a partir do app
// ============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tipo = (body?.tipo ?? "diario") as Tipo;
    const email = String(body?.perfil?.email ?? "").trim();
    const nome = String(body?.perfil?.nome ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
    }

    const payload: Payload = {
      agendamentos: Array.isArray(body?.agendamentos) ? body.agendamentos : [],
      imobiliarias: Array.isArray(body?.imobiliarias) ? body.imobiliarias : [],
    };

    const { assunto, html, itens } = montar(tipo, nome, payload);
    await enviarEmail({ para: email, nome, assunto, html });

    return NextResponse.json({ ok: true, tipo, visitas: itens.length });
  } catch (e) {
    console.error("[visitas/lembretes] POST", e);
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
