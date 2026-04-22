import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — lista todos os embaixadores com contagem de diagnósticos
export async function GET() {
  try {
    const embaixadores = await prisma.embaixador.findMany({
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { diagnosticos: true } },
      },
    })

    const result = embaixadores.map(e => ({
      id: e.id,
      nome: e.nome,
      email: e.email,
      uf: e.uf,
      meta: e.meta,
      periodo: e.periodo,
      photoUrl: e.photoUrl,
      grafanaUid: e.grafanaUid,
      ativo: e.ativo,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      diagnosticosCount: e._count.diagnosticos,
    }))

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
    const { nome, email, uf, meta, periodo } = body

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
      },
      include: {
        _count: { select: { diagnosticos: true } },
      },
    })

    return NextResponse.json({
      id: emb.id,
      nome: emb.nome,
      email: emb.email,
      uf: emb.uf,
      meta: emb.meta,
      periodo: emb.periodo,
      photoUrl: emb.photoUrl,
      grafanaUid: emb.grafanaUid,
      ativo: emb.ativo,
      createdAt: emb.createdAt.toISOString(),
      updatedAt: emb.updatedAt.toISOString(),
      diagnosticosCount: emb._count.diagnosticos,
    }, { status: 201 })
  } catch (err: unknown) {
    console.error('POST /embaixadores error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
