"use client";
import { useState } from "react";
import type { MonthlySellerPerformance } from "@/types/pipefy";

interface MonthlySellerTableProps {
  data: MonthlySellerPerformance[];
  activeMonthKey?: string;
}

export default function MonthlySellerTable({ data, activeMonthKey }: MonthlySellerTableProps) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(activeMonthKey || (data.length > 0 ? data[data.length - 1]?.monthKey : null));

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-[#121212] rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#f59e0b]" style={{ fontSize: 20 }}>leaderboard</span>
        <h2 className="text-sm font-bold uppercase tracking-widest">Performance Mensal</h2>
      </div>

      <div className="space-y-2">
        {[...data].reverse().map((month) => {
          const isExpanded = expandedMonth === month.monthKey;
          const sorted = [...month.sellers].sort((a, b) => b.closed - a.closed);

          return (
            <div key={month.monthKey} className="rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedMonth(isExpanded ? null : month.monthKey)}
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                  isExpanded ? "bg-white/[0.06]" : "bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500" style={{ fontSize: 16 }}>
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                  <span className="text-xs font-bold text-white uppercase">{month.month}</span>
                </div>
                <span className="text-xs font-bold text-[#10b981]">{month.cardCount} fechados</span>
              </button>

              {isExpanded && (
                <div className="bg-white/[0.02] px-4 pb-3">
                  {sorted.length === 0 ? (
                    <p className="text-[11px] text-slate-600 py-2">Nenhum vendedor neste mês</p>
                  ) : (
                    <div className="space-y-1 pt-1">
                      {sorted.map((seller, i) => {
                        const maxClosed = sorted[0]?.closed || 1;
                        return (
                          <div key={seller.name} className="flex items-center gap-3 py-1.5">
                            <span className={`text-[10px] font-bold w-5 text-right ${i === 0 ? "text-[#f59e0b]" : "text-slate-600"}`}>{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] text-white truncate block">{seller.name}</span>
                              <div className="h-1 bg-white/[0.04] rounded-full mt-1 overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(seller.closed / maxClosed) * 100}%`,
                                    backgroundColor: i === 0 ? "#f59e0b" : "#374151",
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-[#10b981] w-12 text-right">{seller.closed}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
