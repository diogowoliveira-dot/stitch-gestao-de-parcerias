import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all diagnosticos
export async function GET() {
  const diagnosticos = await prisma.diagnostico.findMany({
    include: {
      criadoPor: { select: { id: true, nome: true } },
      cargos: {
        include: {
          tarefas: true,
          metricas: true,
          ferramentas: true,
          subordinados: true,
        },
      },
      ferramentasGerais: true,
      problemasIdentificados: true,
    },
    orderBy: { dataCriacao: "desc" },
  });

  // Transform to match frontend shape
  const result = diagnosticos.map((d) => ({
    id: d.id,
    empresa: {
      nome: d.empresaNome,
      cidade: d.empresaCidade,
      estado: d.empresaEstado,
    },
    cargos: d.cargos.map((c) => ({
      id: c.cargoKey,
      nome: c.nome,
      existe: c.existe,
      acumulaFuncao: c.acumulaFuncao,
      personalizado: c.personalizado,
      tarefas: c.tarefas.map((t) => t.nome),
      metricas: c.metricas.map((m) => m.nome),
      ferramentas: c.ferramentas.map((f) => f.nome),
      subordinadosDe: c.subordinadosDe,
      subordinados: c.subordinados.map((s) => s.cargoKey),
    })),
    ferramentasGerais: d.ferramentasGerais.map((f) => f.nome),
    problemasIdentificados: d.problemasIdentificados.map((p) => p.descricao),
    dataCriacao: d.dataCriacao.toISOString().split("T")[0],
    criadoPor: d.criadoPorId,
    criadoPorNome: d.criadoPor.nome,
    status: d.status,
  }));

  return NextResponse.json(result);
}

// POST create diagnostico
export async function POST(req: NextRequest) {
  const data = await req.json();

  const diag = await prisma.diagnostico.create({
    data: {
      empresaNome: data.empresa.nome,
      empresaCidade: data.empresa.cidade,
      empresaEstado: data.empresa.estado,
      status: data.status || "completo",
      criadoPorId: data.criadoPor,
    },
  });

  // Create cargos with nested relations
  for (const cargo of data.cargos) {
    await prisma.cargo.create({
      data: {
        cargoKey: cargo.id,
        nome: cargo.nome,
        existe: cargo.existe,
        acumulaFuncao: cargo.acumulaFuncao || null,
        personalizado: cargo.personalizado || false,
        subordinadosDe: cargo.subordinadosDe || null,
        diagnosticoId: diag.id,
        tarefas: { create: cargo.tarefas.map((t: string) => ({ nome: t })) },
        metricas: { create: cargo.metricas.map((m: string) => ({ nome: m })) },
        ferramentas: { create: cargo.ferramentas.map((f: string) => ({ nome: f })) },
        subordinados: { create: cargo.subordinados.map((s: string) => ({ cargoKey: s })) },
      },
    });
  }

  // Create ferramentas gerais
  if (data.ferramentasGerais) {
    for (const f of data.ferramentasGerais) {
      await prisma.ferramentaGeral.create({
        data: { nome: f, diagnosticoId: diag.id },
      });
    }
  }

  // Create problemas
  if (data.problemasIdentificados) {
    for (const p of data.problemasIdentificados) {
      await prisma.problemaIdentificado.create({
        data: { descricao: p, diagnosticoId: diag.id },
      });
    }
  }

  return NextResponse.json({ id: diag.id });
}

// DELETE diagnostico
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  await prisma.diagnostico.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
