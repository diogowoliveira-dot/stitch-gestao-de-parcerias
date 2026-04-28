import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCompletionReminderEmail } from "@/lib/email";

// POST /api/diagnostico/admin/send-reminder
// Body: { userId: string (master), diagnosticoId: string }
export async function POST(req: NextRequest) {
  try {
    const { userId, diagnosticoId } = await req.json();
    console.log("[send-reminder] solicitado por userId:", userId, "para diagnosticoId:", diagnosticoId);

    const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!caller || caller.role !== "master") {
      console.warn("[send-reminder] acesso negado para userId:", userId);
      return NextResponse.json({ error: "Acesso restrito a master" }, { status: 403 });
    }

    const diag = await prisma.diagnostico.findUnique({
      where: { id: diagnosticoId },
      select: {
        empresaNome: true,
        empresaCidade: true,
        empresaEstado: true,
        criadoPor: { select: { nome: true, email: true } },
      },
    });
    if (!diag) {
      console.warn("[send-reminder] diagnóstico não encontrado:", diagnosticoId);
      return NextResponse.json({ error: "Diagnóstico não encontrado" }, { status: 404 });
    }

    await sendCompletionReminderEmail({
      nome: diag.criadoPor.nome,
      email: diag.criadoPor.email,
      empresa: diag.empresaNome,
      cidade: diag.empresaCidade ?? "",
      estado: diag.empresaEstado ?? "",
    });

    console.log("[send-reminder] e-mail enviado com sucesso para:", diag.criadoPor.email);
    return NextResponse.json({ ok: true, enviado_para: diag.criadoPor.email });
  } catch (err) {
    console.error("[send-reminder] erro:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
