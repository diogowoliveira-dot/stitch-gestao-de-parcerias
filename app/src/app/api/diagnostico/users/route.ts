import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/email";

// GET all users
export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      dataCriacao: true,
      ultimoAcesso: true,
    },
    orderBy: { dataCriacao: "desc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      dataCriacao: u.dataCriacao.toISOString().split("T")[0],
      ultimoAcesso: u.ultimoAcesso?.toISOString().split("T")[0] ?? null,
    }))
  );
}

// POST create user
export async function POST(req: NextRequest) {
  const data = await req.json();

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      nome: data.nome,
      email: data.email,
      senha: await bcrypt.hash(data.senha, 10),
      role: data.role || "consultor",
      status: data.status || "ativo",
      avatar: data.avatar || null,
    },
  });

  // Enviar e-mail de convite (não bloqueia se falhar)
  try {
    await sendInviteEmail({ nome: user.nome, email: user.email, senha: data.senha });
  } catch (err) {
    console.error("Erro ao enviar e-mail de convite:", err);
  }

  return NextResponse.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    dataCriacao: user.dataCriacao.toISOString().split("T")[0],
  });
}

// PUT update user
export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json();

  // Hash password if being changed
  if (data.senha) {
    data.senha = await bcrypt.hash(data.senha, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    dataCriacao: user.dataCriacao.toISOString().split("T")[0],
    ultimoAcesso: user.ultimoAcesso?.toISOString().split("T")[0] ?? null,
  });
}

// PATCH resend invite email
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const tempSenha = crypto.randomBytes(5).toString('hex').toUpperCase();

  // IMPORTANT: enviar o e-mail PRIMEIRO — só atualiza a senha se o envio tiver sucesso.
  // Se a ordem fosse inversa, o usuário ficaria bloqueado com senha desconhecida quando o e-mail falha.
  try {
    await sendInviteEmail({ nome: user.nome, email: user.email, senha: tempSenha });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Erro reenvio convite (senha NÃO alterada):", msg);
    return NextResponse.json({ error: "Falha ao enviar e-mail. A senha do usuário NÃO foi alterada.", detail: msg }, { status: 500 });
  }

  // Só chegou aqui se o e-mail foi enviado com sucesso
  await prisma.user.update({
    where: { id },
    data: { senha: await bcrypt.hash(tempSenha, 10) },
  });

  return NextResponse.json({ ok: true });
}

// DELETE user
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  const diagCount = await prisma.diagnostico.count({ where: { criadoPorId: id } });
  if (diagCount > 0) {
    return NextResponse.json({ error: `Usuário possui ${diagCount} diagnóstico(s). Reatribua-os antes de deletar.` }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
