'use client'
// src/components/embaixadores/ChartBar.tsx
import { useEffect, useRef } from 'react'
import { Chart } from './chart-setup'

interface Props { data: number[]; labels: string[]; color: string }

export default function ChartBar({ data, labels, color }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const ch  = useRef<import('chart.js').Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    let mounted = true
    ;(async () => {
      if (!mounted || !ref.current) return
      if (ch.current) ch.current.destroy()
      ch.current = new Chart(ref.current.getContext('2d')!, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data, backgroundColor: color + '40', borderColor: color, borderWidth: 1, borderRadius: 3 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          plugins: { legend:{ display:false }, tooltip:{ backgroundColor:'#1a1a1a', titleColor:'rgba(255,255,255,.4)', bodyColor:'#fff', borderColor:'rgba(255,255,255,.1)', borderWidth:1, padding:8, displayColors:false, callbacks:{ label: c => (c.parsed.y ?? 0).toLocaleString('pt-BR') } } },
          scales: {
            x: { display:true, ticks:{ color:'rgba(255,255,255,.2)', font:{size:9}, maxRotation:0, autoSkip:true, maxTicksLimit:6 }, grid:{display:false}, border:{display:false} },
            y: { display:false },
          },
        },
      })
    })()
    return () => {
      mounted = false
      if (ch.current) {
        ch.current.destroy()
        ch.current = null
      }
    }
  }, [data, labels, color])

  return <canvas ref={ref} style={{ width:'100%', height:'100%' }} />
}
