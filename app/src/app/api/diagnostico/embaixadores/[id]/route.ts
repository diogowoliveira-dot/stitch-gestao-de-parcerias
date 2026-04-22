import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — busca embaixador com métricas
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const emb = await prisma.embaixador.findUnique({
      where: { id },
      include: {
        metricas: { orderBy: { competencia: 'asc' } },
        _count: { select: { diagnosticos: true } },
      },
    })

    if (!emb) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

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
      metricas: emb.metricas.map(m => ({
        id: m.id,
        embaixadorId: m.embaixadorId,
        competencia: m.competencia.toISOString(),
        corretoresTotal: m.corretoresTotal,
        corretoresNovos: m.corretoresNovos,
        imobCadastradas: m.imobCadastradas,
        imobCadastradasNovas: m.imobCadastradasNovas,
        imobIntegradas: m.imobIntegradas,
        imobIntegradasNovas: m.imobIntegradasNovas,
        incorporadoras: m.incorporadoras,
        incorporadorasNovas: m.incorporadorasNovas,
        acessosTotais: m.acessosTotais,
        createdAt: m.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /embaixadores/[id] error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT — atualiza embaixador
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, email, uf, meta, periodo, ativo } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {}
    if (nome  !== undefined) data.nome   = nome.trim()
    if (email !== undefined) data.email  = email.trim().toLowerCase()
    if (uf    !== undefined) data.uf     = uf
    if (meta  !== undefined) data.meta   = meta
    if (periodo !== undefined) data.periodo = periodo
    if (ativo !== undefined) data.ativo  = ativo

    const emb = await prisma.embaixador.update({
      where: { id },
      data,
      include: { _count: { select: { diagnosticos: true } } },
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
    })
  } catch (err: unknown) {
    console.error('PUT /embaixadores/[id] error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — remove embaixador
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.embaixador.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('DELETE /embaixadores/[id] error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
