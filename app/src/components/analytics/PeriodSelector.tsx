"use client";

interface PeriodSelectorProps {
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  customFrom: string;
  customTo: string;
  onCustomChange: (from: string, to: string) => void;
  activeLabel: string;
}

function getRecentMonths(): { label: string; key: string; from: string; to: string }[] {
  const months: { label: string; key: string; from: string; to: string }[] = [];
  const now = new Date();

  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    months.push({
      label: `${monthNames[month]}/${String(year).slice(2)}`,
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      from: `${year}-${String(month + 1).padStart(2, "0")}-01`,
      to: `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    });
  }

  return months;
}

export default function PeriodSelector({
  selectedPreset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomChange,
  activeLabel,
}: PeriodSelectorProps) {
  const recentMonths = getRecentMonths();
  const showCustom = selectedPreset === "custom";

  const presets = [
    { key: "last-month", label: "Último Mês" },
    { key: "current-month", label: "Mês Atual" },
    ...recentMonths.map((m) => ({ key: m.key, label: m.label })),
    { key: "custom", label: "Período" },
    { key: "all", label: "Tudo" },
  ];

  return (
    <div className="bg-[#121212] rounded-2xl p-4 border border-white/[0.06]">
      {/* Active period label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[#ec1313]" style={{ fontSize: 16 }}>date_range</span>
        <span className="text-xs font-bold text-white uppercase tracking-widest">{activeLabel}</span>
      </div>

      {/* Preset pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => onPresetChange(p.key)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
              selectedPreset === p.key
                ? "bg-[#ec1313] text-white"
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex gap-3 mt-3">
          <div className="flex-1">
            <label className="text-[9px] text-slate-600 uppercase tracking-widest block mb-1">De</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomChange(e.target.value, customTo)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#ec1313] [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-slate-600 uppercase tracking-widest block mb-1">Até</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomChange(customFrom, e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#ec1313] [color-scheme:dark]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
