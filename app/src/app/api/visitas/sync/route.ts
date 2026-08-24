import { NextRequest, NextResponse } from "next/server";

/**
 * Espelha a agenda do executivo no servidor.
 * É a cópia que os Cron Jobs de /api/visitas/lembretes leem para
 * disparar os e-mails de resumo diário e semanal.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { perfil, agendamentos, imobiliarias } = body ?? {};

    const email = String(perfil?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ erro: "E-mail inválido." }, { status: 400 });
    }

    const dados = {
      nome: String(perfil?.nome ?? ""),
      lembreteDiario: perfil?.lembreteDiario !== false,
      lembreteSemanal: perfil?.lembreteSemanal !== false,
      avisoDoisDias: perfil?.avisoDoisDias !== false,
      payload: {
        agendamentos: Array.isArray(agendamentos) ? agendamentos : [],
        imobiliarias: Array.isArray(imobiliarias) ? imobiliarias : [],
      },
    };

    // carregado aqui e não no topo: sem banco configurado o build não quebra
    const { prisma } = await import("@/lib/prisma");
    await prisma.visitaAgendaSnapshot.upsert({
      where: { email },
      create: { email, ...dados },
      update: dados,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[visitas/sync]", e);
    // O protótipo continua funcionando localmente mesmo sem o banco.
    return NextResponse.json(
      { ok: false, erro: (e as Error).message },
      { status: 503 }
    );
  }
}
