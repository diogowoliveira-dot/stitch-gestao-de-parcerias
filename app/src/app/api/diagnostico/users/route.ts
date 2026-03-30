import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
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

// DELETE user
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
