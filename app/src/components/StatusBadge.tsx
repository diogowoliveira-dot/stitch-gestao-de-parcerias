interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  fechada: { label: "Fechada", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  em_negociacao: { label: "Em Negociação", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  recusada: { label: "Recusada", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  ativo: { label: "Ativo", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  inativo: { label: "Inativo", bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400" },
  cliente: { label: "Cliente", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  corretor: { label: "Corretor", bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  consultor: { label: "Consultor", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} ${config.text} font-semibold ${
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
