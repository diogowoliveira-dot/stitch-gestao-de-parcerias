import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Conta diagnósticos feitos pelo User vinculado ao embaixador
async function getDiagCount(userId: string | null): Promise<number> {
  if (!userId) return 0
  return prisma.diagnostico.count({ where: { criadoPorId: userId } })
}

function serializeEmb(e: {
  id: string; nome: string; email: string; uf: string; meta: string; periodo: string;
  photoUrl: string | null; grafanaUid: string | null; ativo: boolean; userId: string | null;
  createdAt: Date; updatedAt: Date;
}, diagCount: number) {
  return {
    id: e.id,
    nome: e.nome,
    email: e.email,
    uf: e.uf,
    meta: e.meta,
    periodo: e.periodo,
    photoUrl: e.photoUrl,
    grafanaUid: e.grafanaUid,
    ativo: e.ativo,
    userId: e.userId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    diagnosticosCount: diagCount,
  }
}

// GET — lista todos os embaixadores com contagem de diagnósticos do usuário vinculado
export async function GET() {
  try {
    const embaixadores = await prisma.embaixador.findMany({
      orderBy: { nome: 'asc' },
    })

    const result = await Promise.all(
      embaixadores.map(async e => serializeEmb(e, await getDiagCount(e.userId)))
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('GET /embaixadores error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST — cria novo embaixador
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, uf, meta, periodo, userId } = body

    if (!nome?.trim() || !email?.trim() || !uf) {
      return NextResponse.json({ error: 'nome, email e uf são obrigatórios' }, { status: 400 })
    }

    const emb = await prisma.embaixador.create({
      data: {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        uf,
        meta: meta || 'R$13k/mês',
        periodo: periodo || '0 meses',
        userId: userId || null,
      },
    })

    return NextResponse.json(serializeEmb(emb, await getDiagCount(emb.userId)), { status: 201 })
  } catch (err: unknown) {
    console.error('POST /embaixadores error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
