"use client";
import type { MonthlyClosing } from "@/types/pipefy";

interface TimelineChartProps {
  data: MonthlyClosing[];
  activeMonthKey?: string;
  onMonthClick?: (monthKey: string, from: string, to: string) => void;
}

export default function TimelineChart({ data, activeMonthKey, onMonthClick }: TimelineChartProps) {
  if (!data || data.length === 0) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 36;
  const gap = 8;
  const chartHeight = 140;
  const labelHeight = 40;
  const topPadding = 24;
  const totalWidth = data.length * (barWidth + gap) - gap;
  const svgHeight = chartHeight + labelHeight + topPadding;

  const activeMonth = data.find((d) => d.monthKey === activeMonthKey);

  return (
    <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#10b981]" style={{ fontSize: 20 }}>bar_chart</span>
        <h2 className="text-sm font-bold uppercase tracking-widest">Fechamentos Mensais</h2>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-[#10b981] bg-[#10b98115]">
          {data.reduce((s, d) => s + d.count, 0)} total
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <svg width={totalWidth + 16} height={svgHeight} viewBox={`0 0 ${totalWidth + 16} ${svgHeight}`}>
          {data.map((d, i) => {
            const x = i * (barWidth + gap) + 8;
            const barHeight = maxCount > 0 ? (d.count / maxCount) * chartHeight : 0;
            const y = topPadding + chartHeight - barHeight;
            const isActive = d.monthKey === activeMonthKey;
            const color = isActive ? "#ec1313" : "#10b981";

            return (
              <g
                key={d.monthKey}
                onClick={() => {
                  if (onMonthClick) {
                    const [year, month] = d.monthKey.split("-").map(Number);
                    const lastDay = new Date(year, month, 0).getDate();
                    const from = `${d.monthKey}-01`;
                    const to = `${d.monthKey}-${String(lastDay).padStart(2, "0")}`;
                    onMonthClick(d.monthKey, from, to);
                  }
                }}
                style={{ cursor: onMonthClick ? "pointer" : "default" }}
              >
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill={color}
                  opacity={isActive ? 0.9 : 0.5}
                />
                {/* Count label */}
                {d.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    fill={color}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {d.count}
                  </text>
                )}
                {/* Month label */}
                <text
                  x={x + barWidth / 2}
                  y={topPadding + chartHeight + 16}
                  textAnchor="middle"
                  fill={isActive ? "#ec1313" : "#64748b"}
                  fontSize="10"
                  fontWeight={isActive ? "bold" : "normal"}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line
            x1={4}
            y1={topPadding + chartHeight}
            x2={totalWidth + 12}
            y2={topPadding + chartHeight}
            stroke="#ffffff08"
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* Product breakdown for active month */}
      {activeMonth && activeMonth.productBreakdown && activeMonth.productBreakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
            Tipos de Fechamento — {activeMonth.month}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {activeMonth.productBreakdown.map((p) => (
              <div
                key={p.type}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03]"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-[11px] text-slate-300">{p.type}</span>
                <span className="text-sm font-bold text-white">{p.count}</span>
              </div>
            ))}
          </div>
          {/* Mini bar breakdown */}
          <div className="h-3 rounded-full overflow-hidden flex bg-white/[0.04]">
            {activeMonth.productBreakdown.map((p) => (
              <div
                key={p.type}
                className="h-full transition-all duration-300"
                style={{
                  width: `${(p.count / activeMonth.count) * 100}%`,
                  backgroundColor: p.color,
                  opacity: 0.8,
                }}
                title={`${p.type}: ${p.count}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
