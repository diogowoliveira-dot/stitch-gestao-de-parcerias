"use client";

import { useEffect, type ReactNode } from "react";

// ——————————————————————————————————————————
// ÍCONE
// ——————————————————————————————————————————
export function Icon({
  name,
  size = 20,
  className = "",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  );
}

// ——————————————————————————————————————————
// BOTTOM SHEET
// ——————————————————————————————————————————
export function Sheet({
  aberto,
  onFechar,
  titulo,
  subtitulo,
  children,
  rodape,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onFechar}
      />
      <div className="sheet-up relative w-full sm:max-w-lg bg-[#0d0d0d] border-t sm:border border-[#262626] sm:rounded-2xl rounded-t-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.8)] max-h-[88dvh] flex flex-col">
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3a3a3a]" />
        </div>

        <header className="px-5 pt-3 pb-3 flex items-start gap-3 shrink-0 border-b border-[#1c1c1c]">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate">{titulo}</h2>
            {subtitulo && (
              <div className="text-[13px] text-[#8a8a8a] mt-0.5">{subtitulo}</div>
            )}
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="shrink-0 w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#9a9a9a] hover:text-white hover:bg-[#242424] transition"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="px-5 py-4 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {rodape && (
          <div className="px-5 py-4 border-t border-[#1c1c1c] shrink-0 bg-[#0d0d0d] sm:rounded-b-2xl">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————
// BOTÃO
// ——————————————————————————————————————————
export function Botao({
  children,
  onClick,
  variante = "primario",
  icone,
  disabled,
  full,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "perigo" | "sucesso" | "fantasma";
  icone?: string;
  disabled?: boolean;
  full?: boolean;
  type?: "button" | "submit";
}) {
  const estilos: Record<string, string> = {
    primario: "bg-[#ec1313] hover:bg-[#d40000] text-white border-transparent",
    sucesso: "bg-[#00c29f] hover:bg-[#00a98b] text-black border-transparent",
    secundario:
      "bg-[#1a1a1a] hover:bg-[#242424] text-white border-[#2e2e2e]",
    perigo:
      "bg-transparent hover:bg-[#2a0d0d] text-[#ef4444] border-[#3a1a1a]",
    fantasma:
      "bg-transparent hover:bg-[#1a1a1a] text-[#9a9a9a] hover:text-white border-transparent",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} ${estilos[variante]} border rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icone && <Icon name={icone} size={18} />}
      {children}
    </button>
  );
}

// ——————————————————————————————————————————
// CAMPO DE TEXTO
// ——————————————————————————————————————————
export function Campo({
  label,
  valor,
  onChange,
  placeholder,
  tipo = "text",
  obrigatorio,
  erro,
  icone,
  multiline,
  inputMode,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: string;
  obrigatorio?: boolean;
  erro?: string;
  icone?: string;
  multiline?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  const base =
    "w-full bg-[#141414] border rounded-xl px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#ec1313] placeholder:text-[#5a5a5a]";
  const borda = erro ? "border-[#7f1d1d]" : "border-[#262626]";

  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] flex items-center gap-1.5 mb-1.5">
        {icone && <Icon name={icone} size={14} />}
        {label}
        {obrigatorio && <span className="text-[#ec1313]">*</span>}
      </span>
      {multiline ? (
        <textarea
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} ${borda} resize-none`}
        />
      ) : (
        <input
          type={tipo}
          inputMode={inputMode}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} ${borda}`}
        />
      )}
      {erro && (
        <span className="text-[11px] text-[#ef4444] mt-1 block">{erro}</span>
      )}
    </label>
  );
}

// ——————————————————————————————————————————
// CHIP SELECIONÁVEL
// ——————————————————————————————————————————
export function Chip({
  label,
  ativo,
  onClick,
}: {
  label: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
        ativo
          ? "bg-[#ec1313] border-[#ec1313] text-white"
          : "bg-[#141414] border-[#262626] text-[#b0b0b0] hover:border-[#3a3a3a] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

// ——————————————————————————————————————————
// BADGE DE STATUS
// ——————————————————————————————————————————
export function Badge({
  cor,
  children,
  pulsando,
}: {
  cor: string;
  children: ReactNode;
  pulsando?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
      style={{ color: cor, background: `${cor}1f`, border: `1px solid ${cor}3d` }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${pulsando ? "animate-pulse-dot" : ""}`}
        style={{ background: cor }}
      />
      {children}
    </span>
  );
}

// ——————————————————————————————————————————
// CONTADOR DE VISITAS
// ——————————————————————————————————————————
/** Selo com o total de visitas realizadas — acompanha o nome da imobiliária */
export function ContadorVisitas({
  n,
  tamanho = "md",
}: {
  n: number;
  tamanho?: "sm" | "md";
}) {
  const zero = n === 0;
  return (
    <span
      title={`${n} ${n === 1 ? "visita realizada" : "visitas realizadas"}`}
      className={`shrink-0 inline-flex items-center justify-center rounded-md font-bold tabular-nums border ${
        tamanho === "sm"
          ? "min-w-[18px] h-[16px] px-1 text-[9px]"
          : "min-w-[22px] h-[19px] px-1.5 text-[11px]"
      } ${
        zero
          ? "bg-transparent border-[#2a2a2a] text-[#5a5a5a]"
          : "bg-[#1f1f1f] border-[#333] text-[#e5e5e5]"
      }`}
    >
      {n}
    </span>
  );
}

/** Nome da imobiliária seguido do total de visitas */
export function NomeImobiliaria({
  nome,
  visitas,
  className = "",
  tamanho = "md",
}: {
  nome: string;
  visitas: number;
  className?: string;
  tamanho?: "sm" | "md";
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`}>
      <span className="truncate">{nome}</span>
      <ContadorVisitas n={visitas} tamanho={tamanho} />
    </span>
  );
}

// ——————————————————————————————————————————
// LINHA DE INFORMAÇÃO
// ——————————————————————————————————————————
export function Info({
  icone,
  children,
  href,
}: {
  icone: string;
  children: ReactNode;
  href?: string;
}) {
  const conteudo = (
    <>
      <Icon name={icone} size={16} className="text-[#6a6a6a] shrink-0 mt-0.5" />
      <span className="flex-1 min-w-0 break-words">{children}</span>
    </>
  );
  if (href)
    return (
      <a
        href={href}
        className="flex items-start gap-2.5 text-sm text-[#cfcfcf] hover:text-white transition py-1"
      >
        {conteudo}
      </a>
    );
  return (
    <div className="flex items-start gap-2.5 text-sm text-[#cfcfcf] py-1">
      {conteudo}
    </div>
  );
}

// ——————————————————————————————————————————
// TOAST
// ——————————————————————————————————————————
export function Toast({
  mensagem,
  tipo = "info",
}: {
  mensagem: string;
  tipo?: "info" | "erro" | "sucesso";
}) {
  const cores = {
    info: "border-[#2e2e2e] text-white",
    erro: "border-[#7f1d1d] text-[#fca5a5]",
    sucesso: "border-[#0f766e] text-[#5eead4]",
  };
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[2100] bg-[#0d0d0d] border ${cores[tipo]} rounded-xl px-4 py-2.5 text-[13px] font-medium shadow-[0_8px_30px_rgba(0,0,0,0.8)] max-w-[92vw] text-center`}
    >
      {mensagem}
    </div>
  );
}
