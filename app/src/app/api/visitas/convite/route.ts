import { NextRequest, NextResponse } from "next/server";
import { enviarEmail, htmlConvite, type DadosVisitaEmail } from "@/lib/visitas-email";
import { montarICS, type DadosConvite } from "@/lib/visitas-ics";

export const dynamic = "force-dynamic";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envia o convite de agenda da visita programada.
 *
 * O anexo .ics com METHOD:REQUEST é o que faz o Google Agenda (e Outlook,
 * Apple Calendar) criar o evento na agenda de quem recebe, com os botões de
 * confirmação — sem exigir que o executivo conecte a conta Google.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cancelar = body?.acao === "cancelamento";

    const organizadorEmail = String(body?.organizador?.email ?? "").trim();
    const organizadorNome = String(body?.organizador?.nome ?? "").trim();
    if (!EMAIL_OK.test(organizadorEmail)) {
      return NextResponse.json(
        { erro: "Configure seu e-mail em Agenda → Lembretes para enviar convites." },
        { status: 400 }
      );
    }

    const convidadoEmail = String(body?.convidado?.email ?? "").trim();
    const convidadoNome = String(body?.convidado?.nome ?? "").trim();
    const temConvidado = EMAIL_OK.test(convidadoEmail);

    const visita: DadosVisitaEmail = {
      imobiliaria: String(body?.imobiliaria ?? "Imobiliária"),
      inicio: String(body?.inicio ?? ""),
      duracaoMin: Number(body?.duracaoMin ?? 60),
      motivo: String(body?.motivo ?? ""),
      observacao: String(body?.observacao ?? ""),
      endereco: String(body?.endereco ?? ""),
      lat: body?.lat ?? null,
      lng: body?.lng ?? null,
      executivo: organizadorNome || organizadorEmail,
    };

    if (!visita.inicio || Number.isNaN(new Date(visita.inicio).getTime())) {
      return NextResponse.json({ erro: "Data da visita inválida." }, { status: 400 });
    }

    const dados: DadosConvite = {
      uid: String(body?.uid ?? `visita-${Date.now()}`),
      inicio: visita.inicio,
      duracaoMin: visita.duracaoMin,
      imobiliaria: visita.imobiliaria,
      motivo: visita.motivo,
      observacao: visita.observacao,
      endereco: visita.endereco,
      lat: visita.lat,
      lng: visita.lng,
      organizador: { nome: organizadorNome, email: organizadorEmail },
      convidado: temConvidado
        ? { nome: convidadoNome, email: convidadoEmail }
        : null,
      sequencia: Number(body?.sequencia ?? 0),
    };

    const ics = montarICS(dados, cancelar);
    const { assunto, html } = htmlConvite(visita, cancelar);

    const destinatarios = [
      { email: organizadorEmail, nome: organizadorNome },
      ...(temConvidado ? [{ email: convidadoEmail, nome: convidadoNome }] : []),
    ];

    await enviarEmail({
      para: destinatarios,
      assunto,
      html,
      anexos: [
        {
          nome: cancelar ? "cancelamento.ics" : "convite.ics",
          tipo: `text/calendar; charset=utf-8; method=${cancelar ? "CANCEL" : "REQUEST"}`,
          // SparkPost espera o conteúdo em base64
          dados: Buffer.from(ics, "utf-8").toString("base64"),
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      enviadoPara: destinatarios.map((d) => d.email),
      convidado: temConvidado,
    });
  } catch (e) {
    console.error("[visitas/convite]", e);
    return NextResponse.json({ erro: (e as Error).message }, { status: 500 });
  }
}
