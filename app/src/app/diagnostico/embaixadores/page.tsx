'use client'
// /diagnostico/embaixadores — lista de embaixadores (master only para CRUD)
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDiagAuth } from '@/lib/diagnostico-context'
import EmbaixadoresClient from '@/components/embaixadores/EmbaixadoresClient'
import { Embaixador } from '@/types/embaixadores'

export default function EmbaixadoresPage() {
  const { user, isMaster } = useDiagAuth()
  const router = useRouter()
  const [embs, setEmbs]   = useState<Embaixador[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Redireciona se não logado
  useEffect(() => {
    if (!user) {
      router.replace('/diagnostico')
    }
  }, [user, router])

  useEffect(() => {
    if (!user) return
    fetch('/api/diagnostico/embaixadores')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setEmbs(data)
        else setError('Erro ao carregar embaixadores')
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#060606', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>Carregando…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight:'100vh', background:'#060606', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:13, color:'#f87171' }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#060606', color:'#fff', fontFamily:'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,.07)', padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', height:52, gap:16 }}>
          <button
            onClick={() => router.push('/diagnostico/dashboard')}
            style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.4)', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:0 }}>
            ← Dashboard
          </button>
          <span style={{ color:'rgba(255,255,255,.15)' }}>·</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>Embaixadores</span>
          {isMaster && (
            <>
              <span style={{ color:'rgba(255,255,255,.15)' }}>·</span>
              <span style={{ fontSize:9, padding:'2px 8px', borderRadius:20, background:'rgba(232,57,42,.1)', color:'rgba(232,57,42,.65)', border:'1px solid rgba(232,57,42,.25)', textTransform:'uppercase', letterSpacing:'.8px' }}>master</span>
            </>
          )}
        </div>
      </div>

      <EmbaixadoresClient embaixadores={embs} userRole={user.role} />
    </div>
  )
}
