import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ──────────────────────────────────────────────
// DDD → UF mapping (all Brazilian states)
// ──────────────────────────────────────────────
const UF_DDD: Record<string, number[]> = {
  AC: [68],
  AL: [82],
  AM: [92, 97],
  AP: [96],
  BA: [71, 73, 74, 75, 77],
  CE: [85, 88],
  DF: [61],
  ES: [27, 28],
  GO: [62, 64],
  MA: [98, 99],
  MG: [31, 32, 33, 34, 35, 37, 38],
  MS: [67],
  MT: [65, 66],
  PA: [91, 93, 94],
  PB: [83],
  PE: [81, 87],
  PI: [86, 89],
  PR: [41, 42, 43, 44, 45, 46],
  RJ: [21, 22, 24],
  RN: [84],
  RO: [69],
  RR: [95],
  RS: [51, 53, 54, 55],
  SC: [47, 48, 49],
  SE: [79],
  SP: [11, 12, 13, 14, 15, 16, 17, 18, 19],
  TO: [63],
}

const GRAFANA_URL  = process.env.GRAFANA_URL  ?? 'https://dwv.grafana.net'
const GRAFANA_TOKEN = process.env.GRAFANA_TOKEN ?? ''
const DS_UID = 'cxHJf2Y4k'

// ──────────────────────────────────────────────
// Grafana query helper
// Returns array of row-objects using first row as keys
// ──────────────────────────────────────────────
async function grafanaQuery(sql: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${GRAFANA_URL}/api/ds/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GRAFANA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      queries: [{
        datasource: { type: 'grafana-postgresql-datasource', uid: DS_UID },
        rawSql: sql,
        format: 'table',
        refId: 'A',
      }],
      range: { from: 'now-2y', to: 'now' },
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Grafana HTTP ${res.status}: ${txt.slice(0, 200)}`)
  }
  const data = await res.json() as {
    results: { A: { frames: Array<{ schema: { fields: Array<{ name: string }> }; data: { values: unknown[][] } }> } }
  }
  const frame = data?.results?.A?.frames?.[0]
  if (!frame) return []
  const cols = frame.schema.fields.map(f => f.name)
  const vals = frame.data.values
  if (!vals.length) return []
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < (vals[0]?.length ?? 0); i++) {
    const row: Record<string, unknown> = {}
    cols.forEach((col, ci) => { row[col] = vals[ci]?.[i] ?? null })
    rows.push(row)
  }
  return rows
}

// ──────────────────────────────────────────────
// Build a cumulative-monthly SQL for user-based metrics
// Returns: (competencia TEXT, total INT, novos INT)
// ──────────────────────────────────────────────
function buildUsersSQL(ddds: number[]): string {
  const list = ddds.join(',')
  return `
WITH mc AS (
  SELECT DATE_TRUNC('month', inserted_at)::date AS mes, COUNT(*) AS ct
  FROM users
  WHERE deleted_at IS NULL
    AND area_code IN (${list})
    AND inserted_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  GROUP BY 1
),
base AS (
  SELECT COUNT(*) AS n
  FROM users
  WHERE deleted_at IS NULL
    AND area_code IN (${list})
    AND inserted_at < DATE_TRUNC('month', NOW() - INTERVAL '11 months')
)
SELECT
  TO_CHAR(gs.mes, 'YYYY-MM-DD') AS competencia,
  (b.n + COALESCE(SUM(COALESCE(mc.ct, 0)) OVER (ORDER BY gs.mes ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0))::int AS total,
  COALESCE(mc.ct, 0)::int AS novos
FROM generate_series(
  DATE_TRUNC('month', NOW() - INTERVAL '11 months')::timestamp,
  DATE_TRUNC('month', NOW())::timestamp,
  INTERVAL '1 month'
) gs(mes)
LEFT JOIN mc ON mc.mes = gs.mes::date
CROSS JOIN base b
ORDER BY gs.mes`
}

// ──────────────────────────────────────────────
// Imobiliárias cadastradas (cumulative, by city UF)
// ──────────────────────────────────────────────
function buildImobCadastradasSQL(uf: string): string {
  return `
WITH mc AS (
  SELECT DATE_TRUNC('month', a.inserted_at)::date AS mes, COUNT(DISTINCT a.id) AS ct
  FROM re_agencies a
  JOIN addresses addr ON addr.id = a.address_id
  JOIN cities c ON c.id = addr.city_id
  WHERE a.deleted_at IS NULL AND c.uf = '${uf}'
    AND a.inserted_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  GROUP BY 1
),
base AS (
  SELECT COUNT(DISTINCT a.id) AS n
  FROM re_agencies a
  JOIN addresses addr ON addr.id = a.address_id
  JOIN cities c ON c.id = addr.city_id
  WHERE a.deleted_at IS NULL AND c.uf = '${uf}'
    AND a.inserted_at < DATE_TRUNC('month', NOW() - INTERVAL '11 months')
)
SELECT
  TO_CHAR(gs.mes, 'YYYY-MM-DD') AS competencia,
  (b.n + COALESCE(SUM(COALESCE(mc.ct, 0)) OVER (ORDER BY gs.mes ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0))::int AS total,
  COALESCE(mc.ct, 0)::int AS novos
FROM generate_series(
  DATE_TRUNC('month', NOW() - INTERVAL '11 months')::timestamp,
  DATE_TRUNC('month', NOW())::timestamp,
  INTERVAL '1 month'
) gs(mes)
LEFT JOIN mc ON mc.mes = gs.mes::date
CROSS JOIN base b
ORDER BY gs.mes`
}

// ──────────────────────────────────────────────
// Imobiliárias integradas (integration_system_id IS NOT NULL)
// ──────────────────────────────────────────────
function buildImobIntegradasSQL(uf: string): string {
  return `
WITH mc AS (
  SELECT DATE_TRUNC('month', a.inserted_at)::date AS mes, COUNT(DISTINCT a.id) AS ct
  FROM re_agencies a
  JOIN addresses addr ON addr.id = a.address_id
  JOIN cities c ON c.id = addr.city_id
  WHERE a.deleted_at IS NULL
    AND a.integration_system_id IS NOT NULL
    AND c.uf = '${uf}'
    AND a.inserted_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  GROUP BY 1
),
base AS (
  SELECT COUNT(DISTINCT a.id) AS n
  FROM re_agencies a
  JOIN addresses addr ON addr.id = a.address_id
  JOIN cities c ON c.id = addr.city_id
  WHERE a.deleted_at IS NULL
    AND a.integration_system_id IS NOT NULL
    AND c.uf = '${uf}'
    AND a.inserted_at < DATE_TRUNC('month', NOW() - INTERVAL '11 months')
)
SELECT
  TO_CHAR(gs.mes, 'YYYY-MM-DD') AS competencia,
  (b.n + COALESCE(SUM(COALESCE(mc.ct, 0)) OVER (ORDER BY gs.mes ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0))::int AS total,
  COALESCE(mc.ct, 0)::int AS novos
FROM generate_series(
  DATE_TRUNC('month', NOW() - INTERVAL '11 months')::timestamp,
  DATE_TRUNC('month', NOW())::timestamp,
  INTERVAL '1 month'
) gs(mes)
LEFT JOIN mc ON mc.mes = gs.mes::date
CROSS JOIN base b
ORDER BY gs.mes`
}

// ──────────────────────────────────────────────
// Incorporadoras (re_developers por city UF)
// ──────────────────────────────────────────────
function buildIncorporadorasSQL(uf: string): string {
  return `
WITH mc AS (
  SELECT DATE_TRUNC('month', d.inserted_at)::date AS mes, COUNT(DISTINCT d.id) AS ct
  FROM re_developers d
  JOIN addresses addr ON addr.id = d.legal_address_id
  JOIN cities c ON c.id = addr.city_id
  WHERE d.deleted_at IS NULL AND c.uf = '${uf}'
    AND d.inserted_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  GROUP BY 1
),
base AS (
  SELECT COUNT(DISTINCT d.id) AS n
  FROM re_developers d
  JOIN addresses addr ON addr.id = d.legal_address_id
  JOIN cities c ON c.id = addr.city_id
  WHERE d.deleted_at IS NULL AND c.uf = '${uf}'
    AND d.inserted_at < DATE_TRUNC('month', NOW() - INTERVAL '11 months')
)
SELECT
  TO_CHAR(gs.mes, 'YYYY-MM-DD') AS competencia,
  (b.n + COALESCE(SUM(COALESCE(mc.ct, 0)) OVER (ORDER BY gs.mes ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0))::int AS total,
  COALESCE(mc.ct, 0)::int AS novos
FROM generate_series(
  DATE_TRUNC('month', NOW() - INTERVAL '11 months')::timestamp,
  DATE_TRUNC('month', NOW())::timestamp,
  INTERVAL '1 month'
) gs(mes)
LEFT JOIN mc ON mc.mes = gs.mes::date
CROSS JOIN base b
ORDER BY gs.mes`
}

// ──────────────────────────────────────────────
// Acessos totais: distinct active users per month (updated_at)
// ──────────────────────────────────────────────
function buildAcessosSQL(ddds: number[]): string {
  const list = ddds.join(',')
  return `
SELECT
  TO_CHAR(gs.mes, 'YYYY-MM-DD') AS competencia,
  COALESCE(mc.ct, 0)::int AS total
FROM generate_series(
  DATE_TRUNC('month', NOW() - INTERVAL '11 months')::timestamp,
  DATE_TRUNC('month', NOW())::timestamp,
  INTERVAL '1 month'
) gs(mes)
LEFT JOIN (
  SELECT DATE_TRUNC('month', updated_at)::date AS mes, COUNT(DISTINCT id) AS ct
  FROM users
  WHERE deleted_at IS NULL
    AND area_code IN (${list})
    AND updated_at >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
    AND updated_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  GROUP BY 1
) mc ON mc.mes = gs.mes::date
ORDER BY gs.mes`
}

// ──────────────────────────────────────────────
// POST /api/diagnostico/embaixadores/[id]/sync
// ──────────────────────────────────────────────
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!GRAFANA_TOKEN) {
      return NextResponse.json({ error: 'GRAFANA_TOKEN não configurado' }, { status: 500 })
    }

    // 1. Fetch embaixador
    const emb = await prisma.embaixador.findUnique({ where: { id } })
    if (!emb) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const uf = emb.uf
    const ddds = UF_DDD[uf]
    if (!ddds?.length) {
      return NextResponse.json({ error: `UF "${uf}" não tem DDDs mapeados` }, { status: 400 })
    }

    // 2. Run all 5 Grafana queries in parallel
    const [
      corretoresRows,
      imobCadRows,
      imobIntRows,
      incorporRows,
      acessosRows,
    ] = await Promise.all([
      grafanaQuery(buildUsersSQL(ddds)),
      grafanaQuery(buildImobCadastradasSQL(uf)),
      grafanaQuery(buildImobIntegradasSQL(uf)),
      grafanaQuery(buildIncorporadorasSQL(uf)),
      grafanaQuery(buildAcessosSQL(ddds)),
    ])

    // 3. Index by competencia date string (YYYY-MM-DD)
    type Row2 = { competencia: string; total: number; novos: number }
    type Row1 = { competencia: string; total: number }

    const toMap2 = (rows: Record<string, unknown>[]): Map<string, Row2> =>
      new Map(rows.map(r => [
        String(r.competencia ?? ''),
        {
          competencia: String(r.competencia ?? ''),
          total: Number(r.total ?? 0),
          novos: Number(r.novos ?? 0),
        },
      ]))

    const toMap1 = (rows: Record<string, unknown>[]): Map<string, Row1> =>
      new Map(rows.map(r => [
        String(r.competencia ?? ''),
        {
          competencia: String(r.competencia ?? ''),
          total: Number(r.total ?? 0),
        },
      ]))

    const corMap   = toMap2(corretoresRows)
    const imobCMap = toMap2(imobCadRows)
    const imobIMap = toMap2(imobIntRows)
    const incorMap = toMap2(incorporRows)
    const acesMap  = toMap1(acessosRows)

    // 4. Collect all unique months across all queries
    const allMonths = new Set<string>()
    for (const m of [corMap, imobCMap, imobIMap, incorMap]) m.forEach((_, k) => allMonths.add(k))
    acesMap.forEach((_, k) => allMonths.add(k))

    // 5. Upsert each month
    let upserted = 0
    const errors: string[] = []

    for (const dateStr of Array.from(allMonths).sort()) {
      try {
        const competencia = new Date(dateStr + 'T00:00:00Z')
        if (isNaN(competencia.getTime())) continue

        const cor   = corMap.get(dateStr)
        const imobC = imobCMap.get(dateStr)
        const imobI = imobIMap.get(dateStr)
        const incor = incorMap.get(dateStr)
        const aces  = acesMap.get(dateStr)

        await prisma.embaixadorMetrica.upsert({
          where: { embaixadorId_competencia: { embaixadorId: id, competencia } },
          create: {
            embaixadorId:         id,
            competencia,
            corretoresTotal:      cor?.total   ?? 0,
            corretoresNovos:      cor?.novos   ?? 0,
            imobCadastradas:      imobC?.total ?? 0,
            imobCadastradasNovas: imobC?.novos ?? 0,
            imobIntegradas:       imobI?.total ?? 0,
            imobIntegradasNovas:  imobI?.novos ?? 0,
            incorporadoras:       incor?.total ?? 0,
            incorporadorasNovas:  incor?.novos ?? 0,
            acessosTotais:        aces?.total  ?? 0,
          },
          update: {
            corretoresTotal:      cor?.total   ?? 0,
            corretoresNovos:      cor?.novos   ?? 0,
            imobCadastradas:      imobC?.total ?? 0,
            imobCadastradasNovas: imobC?.novos ?? 0,
            imobIntegradas:       imobI?.total ?? 0,
            imobIntegradasNovas:  imobI?.novos ?? 0,
            incorporadoras:       incor?.total ?? 0,
            incorporadorasNovas:  incor?.novos ?? 0,
            acessosTotais:        aces?.total  ?? 0,
          },
        })
        upserted++
      } catch (e) {
        errors.push(`${dateStr}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    return NextResponse.json({
      ok: true,
      uf,
      ddds,
      monthsSynced: upserted,
      errors: errors.length ? errors : undefined,
    })
  } catch (err) {
    console.error('POST /embaixadores/[id]/sync error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
