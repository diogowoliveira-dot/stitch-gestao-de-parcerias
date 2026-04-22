'use client'
// src/components/embaixadores/DashboardEmb.tsx
// Dashboard de performance de um embaixador (dados via Prisma/Neon, camelCase).

import { useCallback, useMemo, useRef, useState } from 'react'
import { EmbaixadorComMetricas, EmbaixadorMetrica } from '@/types/embaixadores'
import ChartLine from './ChartLine'
import ChartBar  from './ChartBar'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const UFS    = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

function ini(name: string) {
  return name.trim().split(/\s+/).slice(0,2).map(w => w[0].toUpperCase()).join('')
}
function fmt(v: number) {
  return v.toLocaleString('pt-BR')
}
function pct(n: number, t: number) {
  if (!n || !t || t === n) return '+0%'
  const d = t - n
  if (d <= 0) return '+0%'
  return '+' + Math.round((n / d) * 100) + '%'
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function monthLabel(iso: string) {
  const d = new Date(iso)
  return MONTHS[d.getUTCMonth()] + '/' + String(d.getUTCFullYear()).slice(2)
}
// Normaliza ISO string para chave YYYY-MM-01 para comparação
function toMonthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

interface Props {
  emb:       EmbaixadorComMetricas
  isMaster:  boolean
  onSave?:   (data: Partial<EmbaixadorComMetricas>) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function DashboardEmb({ emb, isMaster, onSave, onDelete }: Props) {
  // ── Período ─────────────────────────────────────────
  const now        = new Date()
  const def12From  = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [fromDate, setFromDate] = useState<Date>(def12From)
  const [toDate,   setToDate]   = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1))
  const [preset,   setPreset]   = useState<3|6|12>(12)

  const applyPreset = (m: 3|6|12) => {
    const t = new Date(now.getFullYear(), now.getMonth(), 1)
    const f = new Date(now.getFullYear(), now.getMonth() - (m - 1), 1)
    setFromDate(f); setToDate(t); setPreset(m)
  }

  // Meses dentro do range
  const rangeMetrics = useMemo((): EmbaixadorMetrica[] => {
    const fk = monthKey(fromDate)
    const tk = monthKey(toDate)
    return emb.metricas.filter(m => {
      const k = toMonthKey(m.competencia)
      return k >= fk && k <= tk
    })
  }, [emb.metricas, fromDate, toDate])

  const labels = useMemo(() => rangeMetrics.map(m => monthLabel(m.competencia)), [rangeMetrics])

  // Últimas métricas disponíveis (totais acumulados)
  const last = rangeMetrics[rangeMetrics.length - 1]

  // Soma de "novos" no período
  const sumNew = useMemo(() => rangeMetrics.reduce((acc, m) => ({
    cn:   acc.cn   + m.corretoresNovos,
    icn:  acc.icn  + m.imobCadastradasNovas,
    iin:  acc.iin  + m.imobIntegradasNovas,
    incn: acc.incn + m.incorporadorasNovas,
  }), { cn:0, icn:0, iin:0, incn:0 }), [rangeMetrics])

  // ── Foto ─────────────────────────────────────────────
  const [photoUrl, setPhotoUrl] = useState(emb.photoUrl || '')
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/diagnostico/embaixadores/${emb.id}/photo`, { method: 'POST', body: form })
    if (res.ok) {
      const { url } = await res.json()
      setPhotoUrl(url)
    }
    e.target.value = ''
  }, [emb.id])

  // ── Edição (master) ───────────────────────────────────
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [formData, setFormData] = useState({ nome: emb.nome, email: emb.email, uf: emb.uf, meta: emb.meta, periodo: emb.periodo })

  const handleSave = async () => {
    if (!onSave) return
    setSaving(true)
    try { await onSave(formData) } finally { setSaving(false); setEditing(false) }
  }

  // ── Selectores de data ────────────────────────────────
  const monthOpts = useMemo(() => {
    const opts = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      opts.push({ label: MONTHS[d.getMonth()] + ' ' + d.getFullYear(), value: monthKey(d) })
    }
    return opts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fromStr = monthKey(fromDate)
  const toStr   = monthKey(toDate)

  // ── No data ───────────────────────────────────────────
  if (!last) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'rgba(255,255,255,.35)' }}>
        <p style={{ fontSize: 14, marginBottom: 8 }}>Nenhuma métrica disponível para este período.</p>
        <p style={{ fontSize: 12 }}>Ajuste o intervalo de datas ou aguarde a sincronização com o Grafana.</p>
        <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center' }}>
          {/* Diagnósticos count mesmo sem métricas */}
          {(emb.diagnosticosCount ?? 0) > 0 && (
            <div style={{ background:'#0e0e0e', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, padding:'16px 24px', textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:700, color:'#E8392A' }}>{emb.diagnosticosCount}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.35)', marginTop:4, textTransform:'uppercase', letterSpacing:'.8px' }}>Diagnósticos realizados</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────
  return (
    <div>
      {/* PROFILE ROW */}
      <div style={{ display:'flex', alignItems:'center', gap:18, padding:'15px 0 18px', borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:18 }}>
        <div style={{ position:'relative', flexShrink:0, cursor: isMaster ? 'pointer' : 'default' }}
             onClick={() => isMaster && fileRef.current?.click()}>
          <div style={{
            width:52, height:52, borderRadius:'50%', background: photoUrl ? 'transparent' : '#E8392A',
            display:'grid', placeItems:'center', fontSize:17, fontWeight:800, overflow:'hidden',
            border:'2px solid transparent', transition:'border-color .15s',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt={emb.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ color:'#fff' }}>{ini(emb.nome)}</span>
            }
          </div>
          {isMaster && (
            <div style={{
              position:'absolute', bottom:-1, right:-1, width:17, height:17, borderRadius:'50%',
              background:'#E8392A', border:'1.5px solid #060606', display:'grid', placeItems:'center',
              fontSize:9, color:'#fff',
            }}>✎</div>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
        </div>

        {editing ? (
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {(['nome','email','uf','meta','periodo'] as const).map(k => (
              <div key={k} style={{ gridColumn: ['nome','email'].includes(k) ? 'span 2' : undefined }}>
                <label style={{ display:'block', fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:3 }}>{k}</label>
                {k === 'uf'
                  ? <select value={formData[k]} onChange={e => setFormData(p => ({...p, [k]: e.target.value as typeof formData['uf']}))}
                      style={{ width:'100%', background:'#151515', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'7px 9px', borderRadius:7, fontSize:12, outline:'none' }}>
                      {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  : <input value={formData[k]} onChange={e => setFormData(p => ({...p, [k]: e.target.value}))}
                      style={{ width:'100%', background:'#151515', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'7px 9px', borderRadius:7, fontSize:12, outline:'none' }} />
                }
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-.2px' }}>{emb.nome}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>Embaixador DWV · {emb.uf} · {emb.email}</div>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {!editing && <>
            {/* Diagnósticos counter */}
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#E8392A' }}>{emb.diagnosticosCount ?? 0}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.7px', marginTop:1 }}>Diagnósticos</div>
            </div>
            <div style={{ width:1, height:24, background:'rgba(255,255,255,.1)' }} />
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{emb.meta}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.7px', marginTop:1 }}>Meta mensal</div>
            </div>
            <div style={{ width:1, height:24, background:'rgba(255,255,255,.1)' }} />
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{emb.periodo}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.7px', marginTop:1 }}>Ativo há</div>
            </div>
            <div style={{ width:1, height:24, background:'rgba(255,255,255,.1)' }} />
          </>}
          <div style={{ fontSize:26, fontWeight:900, color:'rgba(232,57,42,.18)', letterSpacing:-2, lineHeight:1 }}>{emb.uf}</div>

          {isMaster && !editing && (
            <button onClick={() => setEditing(true)}
              style={{ background:'transparent', border:'1px solid rgba(255,255,255,.11)', color:'rgba(255,255,255,.5)', padding:'5px 12px', borderRadius:7, fontSize:11, cursor:'pointer' }}>
              Editar
            </button>
          )}
          {isMaster && editing && (
            <div style={{ display:'flex', gap:7 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background:'#E8392A', border:'none', color:'#fff', padding:'7px 14px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer', opacity: saving ? .6 : 1 }}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button onClick={() => setEditing(false)}
                style={{ background:'transparent', border:'1px solid rgba(255,255,255,.11)', color:'rgba(255,255,255,.5)', padding:'7px 12px', borderRadius:7, fontSize:11, cursor:'pointer' }}>
                Cancelar
              </button>
              {onDelete && (
                <button onClick={onDelete}
                  style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#f87171', padding:'7px 12px', borderRadius:7, fontSize:11, cursor:'pointer' }}>
                  Remover
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DATE BAR */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {([3,6,12] as const).map(m => (
          <button key={m} onClick={() => applyPreset(m)}
            style={{
              background: preset === m ? '#1c1c1c' : 'transparent',
              border: `1px solid ${preset === m ? 'rgba(255,255,255,.15)' : 'transparent'}`,
              color: preset === m ? '#fff' : 'rgba(255,255,255,.35)',
              padding:'5px 11px', borderRadius:6, fontSize:11, cursor:'pointer',
            }}>{m}m</button>
        ))}
        <span style={{ fontSize:11, color:'rgba(255,255,255,.25)' }}>ou</span>
        <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.7px' }}>De</span>
        <select value={fromStr} onChange={e => { setFromDate(new Date(e.target.value + 'T12:00')); setPreset(12) }}
          style={{ background:'#151515', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'5px 9px', borderRadius:6, fontSize:11, cursor:'pointer', outline:'none' }}>
          {monthOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:'.7px' }}>até</span>
        <select value={toStr} onChange={e => { setToDate(new Date(e.target.value + 'T12:00')); setPreset(12) }}
          style={{ background:'#151515', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'5px 9px', borderRadius:6, fontSize:11, cursor:'pointer', outline:'none' }}>
          {monthOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div style={{ fontSize:10, color:'rgba(255,255,255,.26)', textTransform:'uppercase', letterSpacing:'.8px', display:'flex', alignItems:'center', gap:7, marginBottom:13 }}>
        <span style={{ width:16, height:1, background:'#E8392A', display:'block', flexShrink:0 }} />
        {labels[0]} – {labels[labels.length - 1]} · {rangeMetrics.length} {rangeMetrics.length === 1 ? 'mês' : 'meses'}
      </div>

      {/* 3 SECTIONS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:11, marginBottom:11 }}>
        <Section title="Corretores" badge={`${fmt(last.corretoresTotal)} total`} badgeRed>
          <StatRow label="Total no estado"        value={fmt(last.corretoresTotal)}  chip="acumulado" />
          <StatRow label="Adicionados no período"  value={fmt(sumNew.cn)}             chip={pct(sumNew.cn, last.corretoresTotal)} chipUp />
          <div style={{ padding:'11px 13px 9px', borderTop:'1px solid rgba(255,255,255,.06)', background:'#060606', marginTop:'auto' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.28)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:8 }}>Evolução mensal</div>
            <div style={{ height:96 }}>
              <ChartLine data={rangeMetrics.map(m => m.corretoresTotal)} labels={labels} color="#E8392A" />
            </div>
          </div>
        </Section>

        <Section title="Imobiliárias" badge={`${fmt(last.imobCadastradas)} cadastradas`}>
          <StatRow label="Cadastradas (total)"    value={fmt(last.imobCadastradas)}     chip="acumulado" />
          <StatRow label="Novas no período"        value={fmt(sumNew.icn)}               chip={pct(sumNew.icn, last.imobCadastradas)} chipUp />
          <StatRow label="Integradas (total)"      value={fmt(last.imobIntegradas)}      chip="acumulado" />
          <StatRow label="Integrações no período"  value={fmt(sumNew.iin)}               chip={pct(sumNew.iin, last.imobIntegradas)} chipUp />
          <div style={{ padding:'11px 13px 9px', borderTop:'1px solid rgba(255,255,255,.06)', background:'#060606', marginTop:'auto' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.28)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:8 }}>Evolução mensal</div>
            <div style={{ height:96 }}>
              <ChartLine data={rangeMetrics.map(m => m.imobCadastradas)} labels={labels} color="#ffffff" />
            </div>
          </div>
        </Section>

        <Section title="Incorporadoras" badge={`${fmt(last.incorporadoras)} total`}>
          <StatRow label="Total no estado"  value={fmt(last.incorporadoras)}   chip="acumulado" />
          <StatRow label="Novas no período" value={fmt(sumNew.incn)}           chip={`+${sumNew.incn}`} chipUp />
          <div style={{ padding:'11px 13px 9px', borderTop:'1px solid rgba(255,255,255,.06)', background:'#060606', marginTop:'auto' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.28)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:8 }}>Evolução mensal</div>
            <div style={{ height:96 }}>
              <ChartLine data={rangeMetrics.map(m => m.incorporadoras)} labels={labels} color="#9ca3af" />
            </div>
          </div>
        </Section>
      </div>

      {/* BOTTOM ROW */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 250px', gap:11 }}>
        {/* Acessos */}
        <div style={{ background:'#0e0e0e', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 15px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,.52)' }}>Acessos gerados no estado</span>
            <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:'rgba(232,57,42,.1)', color:'rgba(232,57,42,.65)', border:'1px solid rgba(232,57,42,.25)' }}>acumulado total</span>
          </div>
          <div style={{ padding:'13px 15px', display:'flex', alignItems:'flex-end', gap:18 }}>
            <div>
              <div style={{ fontSize:24, fontWeight:700, letterSpacing:'-.8px', color:'#E8392A', lineHeight:1 }}>{fmt(last.acessosTotais)}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginTop:4 }}>acessos registrados</div>
            </div>
            <div style={{ flex:1, height:50 }}>
              <ChartBar data={rangeMetrics.map(m => m.acessosTotais)} labels={labels} color="#E8392A" />
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div style={{ background:'#0e0e0e', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, padding:'13px 15px' }}>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:'1.1px', textTransform:'uppercase', color:'rgba(255,255,255,.26)', paddingBottom:9, borderBottom:'1px solid rgba(255,255,255,.06)', marginBottom:9 }}>Resumo do período</div>
          {[
            { k: 'Período',        v: `${rangeMetrics.length}m`,   red: false },
            { k: 'Diagnósticos',   v: `${emb.diagnosticosCount ?? 0}`, red: true  },
            { k: 'Corretores',     v: `+${fmt(sumNew.cn)}`,         red: true  },
            { k: 'Imobiliárias',   v: `+${fmt(sumNew.icn)}`,        red: true  },
            { k: 'Integrações',    v: `+${fmt(sumNew.iin)}`,        red: true  },
            { k: 'Incorporadoras', v: `+${fmt(sumNew.incn)}`,       red: true  },
          ].map(r => (
            <div key={r.k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,.52)' }}>{r.k}</span>
              <span style={{ fontSize:12, fontWeight:600, color: r.red ? '#E8392A' : '#fff' }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────
function Section({ title, badge, badgeRed, children }: {
  title: string; badge: string; badgeRed?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ background:'#0e0e0e', border:'1px solid rgba(255,255,255,.06)', borderRadius:11, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 15px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize:10, fontWeight:600, letterSpacing:'1.2px', textTransform:'uppercase', color:'rgba(255,255,255,.52)' }}>{title}</span>
        <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background: badgeRed ? 'rgba(232,57,42,.1)' : '#1c1c1c', color: badgeRed ? 'rgba(232,57,42,.65)' : 'rgba(255,255,255,.35)', border: `1px solid ${badgeRed ? 'rgba(232,57,42,.25)' : 'rgba(255,255,255,.1)'}` }}>{badge}</span>
      </div>
      {children}
    </div>
  )
}

function StatRow({ label, value, chip, chipUp }: {
  label: string; value: string; chip: string; chipUp?: boolean
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', padding:'9px 15px', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
      <span style={{ flex:1, fontSize:11, color:'rgba(255,255,255,.52)' }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:600, letterSpacing:'-.2px', marginRight:8 }}>{value}</span>
      <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background: chipUp ? 'rgba(52,211,153,.12)' : 'rgba(255,255,255,.08)', color: chipUp ? '#34d399' : 'rgba(255,255,255,.3)' }}>{chip}</span>
    </div>
  )
}
