'use client'
// /diagnostico/embaixadores/[id] — dashboard de performance individual
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDiagAuth } from '@/lib/diagnostico-context'
import DashboardEmb from '@/components/embaixadores/DashboardEmb'
import { EmbaixadorComMetricas } from '@/types/embaixadores'

export default function EmbaixadorDashboardPage() {
  const { user, isMaster } = useDiagAuth()
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [emb, setEmb]         = useState<EmbaixadorComMetricas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Redireciona se não logado
  useEffect(() => {
    if (!user) router.replace('/diagnostico')
  }, [user, router])

  const fetchEmb = useCallback(() => {
    if (!user || !id) return
    setLoading(true)
    fetch(`/api/diagnostico/embaixadores/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Não encontrado')
        return r.json()
      })
      .then(data => setEmb(data))
      .catch(e => setError(e.message || 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [user, id])

  useEffect(() => { fetchEmb() }, [fetchEmb])

  const handleSave = async (data: Partial<EmbaixadorComMetricas>) => {
    const res = await fetch(`/api/diagnostico/embaixadores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setEmb(prev => prev ? { ...prev, ...updated } : prev)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Remover ${emb?.nome}? Todos os dados serão apagados.`)) return
    const res = await fetch(`/api/diagnostico/embaixadores/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/diagnostico/embaixadores')
  }

  if (!user) return null

  return (
    <div style={{ minHeight:'100vh', background:'#060606', color:'#fff', fontFamily:'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,.07)', padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', height:52, gap:16 }}>
          <button
            onClick={() => router.push('/diagnostico/embaixadores')}
            style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.4)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:0 }}>
            ← Embaixadores
          </button>
          {emb && (
            <>
              <span style={{ color:'rgba(255,255,255,.15)' }}>·</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,.55)', fontWeight:600 }}>{emb.nome}</span>
              <span style={{ fontSize:9, padding:'2px 7px', borderRadius:20, background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.3)', border:'1px solid rgba(255,255,255,.1)' }}>{emb.uf}</span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 24px 48px' }}>
        {loading && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'rgba(255,255,255,.3)', fontSize:13 }}>
            Carregando…
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#f87171', fontSize:13 }}>
            {error}
          </div>
        )}
        {emb && !loading && (
          <DashboardEmb
            emb={emb}
            isMaster={isMaster}
            onSave={isMaster ? handleSave : undefined}
            onDelete={isMaster ? handleDelete : undefined}
            onSync={isMaster ? async () => { fetchEmb() } : undefined}
          />
        )}
      </div>
    </div>
  )
}
