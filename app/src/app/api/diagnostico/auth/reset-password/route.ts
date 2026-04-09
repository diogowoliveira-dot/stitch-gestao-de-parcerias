import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendResetPasswordEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// POST /api/diagnostico/auth/reset-password
// Body: { email }
// Gera token e envia e-mail
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // Sempre retorna 200 por segurança (não confirma se e-mail existe)
  if (!user || user.status !== "ativo") {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  let emailEnviado = false;
  try {
    await sendResetPasswordEmail({ nome: user.nome, email: user.email, token });
    emailEnviado = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reset-password] Erro ao enviar e-mail de reset para", user.email, ":", msg);
    // Token salvo no banco mas email não saiu — admin pode reenviar manualmente
  }

  // Retorna ok:true por segurança (não revela se o e-mail existe),
  // mas inclui emailEnviado para depuração em ambiente de desenvolvimento
  return NextResponse.json({ ok: true, emailEnviado: process.env.NODE_ENV !== "production" ? emailEnviado : undefined });
}

// PATCH /api/diagnostico/auth/reset-password
// Body: { token, novaSenha }
// Valida token e atualiza senha
export async function PATCH(req: NextRequest) {
  const { token, novaSenha } = await req.json();
  if (!token || !novaSenha) {
    return NextResponse.json({ error: "Token e nova senha são obrigatórios" }, { status: 400 });
  }
  if (novaSenha.length < 6) {
    return NextResponse.json({ error: "A senha deve ter ao menos 6 caracteres" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return NextResponse.json({ error: "Link inválido ou expirado. Solicite um novo." }, { status: 400 });
  }

  const hash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      senha: hash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
