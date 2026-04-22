'use client'
// src/components/embaixadores/EmbaixadoresClient.tsx
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Embaixador, EmbaixadorFormData, UF } from '@/types/embaixadores'

const UFS: UF[] = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

function ini(name: string) {
  return name.trim().split(/\s+/).slice(0,2).map(w => w[0].toUpperCase()).join('')
}
function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('pt-BR')
}

const EMPTY_FORM: EmbaixadorFormData = { nome:'', email:'', uf:'SC', meta:'R$13k/mês', periodo:'0 meses' }

interface Props {
  embaixadores: Embaixador[]
  userRole:     string
}

export default function EmbaixadoresClient({ embaixadores: initial, userRole }: Props) {
  const router  = useRouter()
  const [embs, setEmbs]       = useState<Embaixador[]>(initial)
  const [modal, setModal]     = useState<'new'|'edit'|null>(null)
  const [editing, setEditing] = useState<Embaixador | null>(null)
  const [form, setForm]       = useState<EmbaixadorFormData>(EMPTY_FORM)
  const [err,  setErr]        = useState('')
  const [busy, setBusy]       = useState(false)
  const [, startT]            = useTransition()

  const isMaster = userRole === 'master'

  const openNew  = () => { setForm(EMPTY_FORM); setEditing(null); setErr(''); setModal('new') }
  const openEdit = (emb: Embaixador) => {
    setForm({ nome: emb.nome, email: emb.email, uf: emb.uf as UF, meta: emb.meta, periodo: emb.periodo })
    setEditing(emb); setErr(''); setModal('edit')
  }
  const close = () => { setModal(null); setErr('') }

  const save = async () => {
    if (!form.nome.trim() || !form.email.trim()) { setErr('Nome e e-mail são obrigatórios.'); return }
    setBusy(true); setErr('')
    try {
      if (modal === 'new') {
        const res  = await fetch('/api/diagnostico/embaixadores', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
        const data = await res.json()
        if (!res.ok) { setErr(data.error || 'Erro ao salvar'); return }
        setEmbs(prev => [...prev, data].sort((a,b) => a.nome.localeCompare(b.nome)))
      } else if (editing) {
        const res  = await fetch(`/api/diagnostico/embaixadores/${editing.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
        const data = await res.json()
        if (!res.ok) { setErr(data.error || 'Erro ao salvar'); return }
        setEmbs(prev => prev.map(e => e.id === editing.id ? { ...data, diagnosticosCount: e.diagnosticosCount } : e))
      }
      close()
      startT(() => router.refresh())
    } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!editing) return
    if (!confirm(`Remover ${editing.nome}?`)) return
    setBusy(true)
    const res = await fetch(`/api/diagnostico/embaixadores/${editing.id}`, { method:'DELETE' })
    if (res.ok) {
      setEmbs(prev => prev.filter(e => e.id !== editing.id))
      close()
    } else {
      setErr('Erro ao remover')
    }
    setBusy(false)
  }

  const S = styles

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.hdr}>
        <div>
          <h1 style={S.title}>Embaixadores</h1>
          <p style={S.sub}>{embs.length} cadastrado{embs.length !== 1 ? 's' : ''}</p>
        </div>
        {isMaster && (
          <button style={S.btnRed} onClick={openNew}>+ Novo embaixador</button>
        )}
      </div>

      {/* Table */}
      {embs.length === 0 ? (
        <div style={S.empty}>
          <p style={{ fontSize:14, fontWeight:600, marginBottom:6, color:'rgba(255,255,255,.55)' }}>Nenhum embaixador cadastrado</p>
          {isMaster && <p style={{ fontSize:12 }}>Clique em &quot;+ Novo embaixador&quot; para começar</p>}
        </div>
      ) : (
        <table style={S.tbl}>
          <thead>
            <tr>{['Nome','UF','Meta','Diagnósticos','Cadastrado em',''].map(h => (
              <th key={h} style={S.th}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {embs.map(emb => (
              <tr key={emb.id} style={{ cursor:'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.013)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                <td style={S.td}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={S.av}>
                      {emb.photoUrl
                        ? <img src={emb.photoUrl} alt={emb.nome} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                        : <span style={{ color:'#fff' }}>{ini(emb.nome)}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600 }}>{emb.nome}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>{emb.email}</div>
                    </div>
                  </div>
                </td>
                <td style={S.td}><span style={S.ufTag}>{emb.uf}</span></td>
                <td style={{ ...S.td, fontSize:11, color:'rgba(255,255,255,.52)' }}>{emb.meta}</td>
                <td style={S.td}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#E8392A' }}>
                    {emb.diagnosticosCount ?? 0}
                  </span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginLeft:4 }}>diag.</span>
                </td>
                <td style={{ ...S.td, fontSize:10, color:'rgba(255,255,255,.3)' }}>{fmtDate(emb.createdAt)}</td>
                <td style={{ ...S.td, textAlign:'right' }}>
                  <button style={S.btnPerf} onClick={() => router.push(`/diagnostico/embaixadores/${emb.id}`)}>Performance</button>
                  {isMaster && (
                    <button style={S.btnGrey} onClick={() => openEdit(emb)}>Editar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL */}
      {modal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) close() }}>
          <div style={S.modal}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:15, fontWeight:700 }}>{modal === 'new' ? 'Novo Embaixador' : 'Editar Embaixador'}</h2>
              <button onClick={close} style={{ background:'#1c1c1c', border:'none', color:'rgba(255,255,255,.5)', width:26, height:26, borderRadius:6, cursor:'pointer', fontSize:14 }}>×</button>
            </div>

            {(['nome','email'] as const).map(k => (
              <div key={k} style={{ marginBottom:12 }}>
                <label style={S.fldLbl}>{k}</label>
                <input style={S.fldInput} value={form[k]} onChange={e => setForm(p => ({...p, [k]: e.target.value}))} placeholder={k === 'nome' ? 'Ex: Caio Mendes' : 'caio@dwv.com.br'} />
              </div>
            ))}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div>
                <label style={S.fldLbl}>UF</label>
                <select style={S.fldInput} value={form.uf} onChange={e => setForm(p => ({...p, uf: e.target.value as UF}))}>
                  {UFS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={S.fldLbl}>Meta mensal</label>
                <input style={S.fldInput} value={form.meta} onChange={e => setForm(p => ({...p, meta: e.target.value}))} placeholder="R$13k/mês" />
              </div>
              <div>
                <label style={S.fldLbl}>Período ativo</label>
                <input style={S.fldInput} value={form.periodo} onChange={e => setForm(p => ({...p, periodo: e.target.value}))} placeholder="Ex: 6 meses" />
              </div>
            </div>

            {err && <p style={{ fontSize:11, color:'#f87171', marginBottom:10 }}>{err}</p>}

            <div style={{ display:'flex', gap:8 }}>
              <button style={{ ...S.btnRed, flex:1 }} onClick={save} disabled={busy}>
                {busy ? 'Salvando…' : 'Salvar'}
              </button>
              <button style={S.btnGrey} onClick={close}>Cancelar</button>
              {modal === 'edit' && (
                <button style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.22)', color:'#f87171', padding:'9px 14px', borderRadius:8, fontSize:12, cursor:'pointer' }}
                  onClick={remove} disabled={busy}>Remover</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Estilos ──────────────────────────────────────────────────
const styles = {
  wrap:    { maxWidth:1100, margin:'0 auto', padding:'24px 24px 48px' } as React.CSSProperties,
  hdr:     { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 } as React.CSSProperties,
  title:   { fontSize:18, fontWeight:700, letterSpacing:'-.3px' } as React.CSSProperties,
  sub:     { fontSize:11, color:'rgba(255,255,255,.35)', marginTop:3 } as React.CSSProperties,
  tbl:     { width:'100%', borderCollapse:'collapse' as const },
  th:      { fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase' as const, letterSpacing:'1px', padding:'8px 11px', textAlign:'left' as const, borderBottom:'1px solid rgba(255,255,255,.06)' },
  td:      { padding:'10px 11px', borderBottom:'1px solid rgba(255,255,255,.05)', verticalAlign:'middle' as const },
  av:      { width:32, height:32, borderRadius:'50%', background:'#E8392A', display:'grid', placeItems:'center', fontSize:11, fontWeight:800, overflow:'hidden', flexShrink:0 } as React.CSSProperties,
  ufTag:   { fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, background:'rgba(232,57,42,.1)', color:'rgba(232,57,42,.75)', border:'1px solid rgba(232,57,42,.25)' } as React.CSSProperties,
  empty:   { textAlign:'center' as const, padding:'60px 20px', color:'rgba(255,255,255,.3)' },
  btnRed:  { background:'#E8392A', border:'none', color:'#fff', padding:'9px 16px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' } as React.CSSProperties,
  btnGrey: { background:'transparent', border:'1px solid rgba(255,255,255,.12)', color:'rgba(255,255,255,.5)', padding:'8px 13px', borderRadius:8, fontSize:11, cursor:'pointer' } as React.CSSProperties,
  btnPerf: { background:'transparent', border:'1px solid rgba(232,57,42,.25)', color:'rgba(232,57,42,.7)', padding:'4px 10px', borderRadius:6, fontSize:10, cursor:'pointer', marginRight:4 } as React.CSSProperties,
  overlay: { position:'fixed' as const, inset:0, background:'rgba(0,0,0,.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:20 },
  modal:   { background:'#111', border:'1px solid rgba(255,255,255,.12)', borderRadius:15, padding:26, width:'100%', maxWidth:440 } as React.CSSProperties,
  fldLbl:  { display:'block', fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase' as const, letterSpacing:'.8px', marginBottom:4 },
  fldInput:{ width:'100%', background:'#1a1a1a', border:'1px solid rgba(255,255,255,.12)', color:'#fff', padding:'8px 10px', borderRadius:7, fontSize:12, outline:'none', fontFamily:'inherit' } as React.CSSProperties,
}
