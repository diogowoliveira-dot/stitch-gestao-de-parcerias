import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST — upload de foto do embaixador (armazena como data URL no banco)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    // Limita a 2MB para não estourar o banco
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Imagem deve ter menos de 2MB' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    await prisma.embaixador.update({
      where: { id },
      data: { photoUrl: dataUrl },
    })

    return NextResponse.json({ url: dataUrl })
  } catch (err) {
    console.error('POST /embaixadores/[id]/photo error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
