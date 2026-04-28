import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/email";

// GET all users
export async function GET() {
  try {
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
  } catch (err) {
    console.error("GET /users error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST create user
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
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
  } catch (err) {
    console.error("POST /users error:", err);
    // P2002 = unique constraint violation (duplicate email)
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro interno ao criar usuário" }, { status: 500 });
  }
}

// PUT update user
export async function PUT(req: NextRequest) {
  try {
    const { id, nome, email, role, status, senha } = await req.json();

    const updateData: Record<string, unknown> = {};
    if (nome   !== undefined) updateData.nome   = String(nome).trim();
    if (email  !== undefined) updateData.email  = String(email).trim().toLowerCase();
    if (role   !== undefined && ['master', 'admin', 'consultor'].includes(role)) updateData.role = role;
    if (status !== undefined && ['ativo', 'inativo'].includes(status)) updateData.status = status;

    // Hash password if being changed
    if (senha) {
      updateData.senha = await bcrypt.hash(String(senha), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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
  } catch (err) {
    console.error("PUT /users error:", err);
    return NextResponse.json({ error: "Erro interno ao atualizar usuário" }, { status: 500 });
  }
}

// PATCH resend invite email
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const tempSenha = crypto.randomBytes(5).toString('hex').toUpperCase();

  // Sempre atualiza a senha — email é best-effort
  // A senha nova é retornada no response para o admin comunicar ao usuário
  // caso o e-mail falhe
  await prisma.user.update({
    where: { id },
    data: { senha: await bcrypt.hash(tempSenha, 10) },
  });

  let emailEnviado = false;
  let emailErro: string | null = null;
  try {
    await sendInviteEmail({ nome: user.nome, email: user.email, senha: tempSenha });
    emailEnviado = true;
  } catch (err: unknown) {
    emailErro = err instanceof Error ? err.message : String(err);
    console.error("Erro reenvio convite:", emailErro);
  }

  // Retorna a senha temporária para o admin poder copiar e enviar manualmente
  return NextResponse.json({ ok: true, senha: tempSenha, emailEnviado, emailErro });
}

// DELETE user
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    const diagCount = await prisma.diagnostico.count({ where: { criadoPorId: id } });
    if (diagCount > 0) {
      return NextResponse.json({ error: `Usuário possui ${diagCount} diagnóstico(s). Reatribua-os antes de deletar.` }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /users error:", err);
    // P2003 = foreign key constraint violation
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2003") {
      return NextResponse.json({ error: "Não é possível deletar: usuário possui registros vinculados." }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro interno ao deletar usuário" }, { status: 500 });
  }
}
