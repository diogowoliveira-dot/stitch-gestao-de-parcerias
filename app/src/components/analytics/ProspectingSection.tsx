"use client";
import type { ProspectingEntry } from "@/types/pipefy";

interface ProspectingSectionProps {
  data: ProspectingEntry[];
}

export default function ProspectingSection({ data }: ProspectingSectionProps) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => b.total - a.total);
  const maxTotal = sorted[0]?.total || 1;
  const totalLeads = sorted.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#06b6d4]" style={{ fontSize: 20 }}>person_search</span>
        <h2 className="text-sm font-bold uppercase tracking-widest">Prospecção</h2>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-[#06b6d4] bg-[#06b6d415]">
          {totalLeads} leads
        </span>
      </div>

      <p className="text-[10px] text-slate-600 mb-3">Leads cadastrados por pessoa no período (quem criou o card)</p>

      <div className="space-y-2">
        {sorted.map((entry, i) => {
          const width = Math.max((entry.total / maxTotal) * 100, 8);
          return (
            <div key={entry.name} className="flex items-center gap-3 py-1.5">
              <span className={`text-[10px] font-bold w-5 text-right ${i === 0 ? "text-[#06b6d4]" : "text-slate-600"}`}>{i + 1}</span>
              <span className="text-[11px] text-slate-300 w-32 truncate shrink-0">{entry.name}</span>
              <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-500 flex items-center px-2"
                  style={{
                    width: `${width}%`,
                    backgroundColor: i === 0 ? "#06b6d430" : "#06b6d418",
                    borderLeft: `2px solid ${i === 0 ? "#06b6d4" : "#06b6d480"}`,
                  }}
                >
                  <span className="text-[10px] font-bold text-[#06b6d4]">{entry.total}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-600 w-10 text-right shrink-0">
                {((entry.total / totalLeads) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
