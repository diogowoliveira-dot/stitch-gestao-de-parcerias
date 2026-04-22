'use client'
// src/components/embaixadores/ChartLine.tsx
import { useEffect, useRef } from 'react'

interface Props {
  data:   number[]
  labels: string[]
  color:  string
}

export default function ChartLine({ data, labels, color }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const ch  = useRef<import('chart.js').Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    let mounted = true

    import('chart.js').then(({ Chart, registerables }) => {
      if (!mounted || !ref.current) return
      Chart.register(...registerables)
      if (ch.current) { ch.current.destroy() }
      const ctx = ref.current.getContext('2d')!
      const g   = ctx.createLinearGradient(0, 0, 0, 96)
      g.addColorStop(0, color + '26')
      g.addColorStop(1, color + '00')
      ch.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{ data, borderColor: color, backgroundColor: g, borderWidth: 1.5, fill: true, tension: .4, pointRadius: 0, pointHoverRadius: 3 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor:'#1a1a1a', titleColor:'rgba(255,255,255,.4)', bodyColor:'#fff', borderColor:'rgba(255,255,255,.1)', borderWidth:1, padding:8, displayColors:false, callbacks:{ label: c => (c.parsed.y ?? 0).toLocaleString('pt-BR') } },
          },
          scales: {
            x: { display:true, ticks:{ color:'rgba(255,255,255,.2)', font:{size:9}, maxRotation:0, autoSkip:true, maxTicksLimit:6 }, grid:{display:false}, border:{display:false} },
            y: { display: false },
          },
        },
      })
    })
    return () => { mounted = false; if (ch.current) { ch.current.destroy(); ch.current = null } }
  }, [data, labels, color])

  return <canvas ref={ref} style={{ width:'100%', height:'100%' }} />
}
