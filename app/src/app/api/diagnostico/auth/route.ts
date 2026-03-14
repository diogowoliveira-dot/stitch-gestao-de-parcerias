import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status !== "ativo") {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const senhaCorreta = await bcrypt.compare(senha, user.senha);
  if (!senhaCorreta) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  // Update last access
  await prisma.user.update({
    where: { id: user.id },
    data: { ultimoAcesso: new Date() },
  });

  return NextResponse.json({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    dataCriacao: user.dataCriacao.toISOString().split("T")[0],
    ultimoAcesso: new Date().toISOString().split("T")[0],
  });
}
