"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, Download, Loader2, FileImage, Mail, LayoutTemplate } from "lucide-react";
import { apiGet, apiPost, type Peca, type EditResult } from "@/lib/api";
import NavBar from "@/components/NavBar";
import Link from "next/link";

type Mensagem = { role: "user" | "assistant"; conteudo: string };

const FORMATOS = [
  { key: "story", label: "Story", icon: LayoutTemplate },
  { key: "post", label: "Post", icon: FileImage },
  { key: "email", label: "E-mail", icon: Mail },
];

export default function CampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [formato, setFormato] = useState("story");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPecas();
  }, [id]);

  useEffect(() => {
    loadMensagens();
  }, [id, formato]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function loadPecas() {
    setLoading(true);
    try {
      const data = await apiGet<Peca[]>(`/campaign/${id}/files`);
      setPecas(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadMensagens() {
    try {
      const data = await apiGet<Mensagem[]>(`/campaign/${id}/mensagens?formato=${formato}`);
      setMensagens(data);
    } catch {
      setMensagens([]);
    }
  }

  const pecaAtual = pecas.find((p) => p.formato === formato);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    setMensagens((prev) => [...prev, { role: "user", conteudo: msg }]);

    try {
      const result = await apiPost<EditResult>("/campaign/edit", {
        campanha_id: id,
        formato,
        mensagem: msg,
      });
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", conteudo: `Alteração aplicada: "${msg}"` },
      ]);
      // Atualiza peça localmente
      setPecas((prev) =>
        prev.map((p) =>
          p.formato === formato
            ? { ...p, html: result.html, arquivo_url: result.arquivo_url || p.arquivo_url }
            : p
        )
      );
    } catch (err) {
      setMensagens((prev) => [
        ...prev,
        { role: "assistant", conteudo: `Erro: ${err instanceof Error ? err.message : "tente novamente"}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  // Dimensões do preview por formato
  const previewDimensions: Record<string, { w: number; h: number; scale: number }> = {
    story: { w: 1080, h: 1920, scale: 0.28 },
    post: { w: 1080, h: 1080, scale: 0.38 },
    email: { w: 600, h: 800, scale: 0.55 },
  };
  const dim = previewDimensions[formato];

  return (
    <div className="flex min-h-screen bg-dark">
      <NavBar />

      <div className="ml-56 flex-1 flex h-screen overflow-hidden">

        {/* Preview central */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[rgba(255,255,255,0.06)]">
          {/* Abas de formato */}
          <div className="flex items-center gap-0 border-b border-[rgba(255,255,255,0.06)] px-6 bg-[#0D0D0D]">
            {FORMATOS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFormato(key)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-bold tracking-widest uppercase border-b-2 transition-colors ${
                  formato === key
                    ? "border-gold text-gold"
                    : "border-transparent text-white/30 hover:text-white/60"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}

            {/* Download */}
            {pecaAtual?.arquivo_url && (
              <a
                href={pecaAtual.arquivo_url}
                download
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-white/30 hover:text-gold transition-colors py-4"
              >
                <Download size={13} />
                Baixar
              </a>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-[#080808] p-6">
            {loading ? (
              <div className="flex items-center gap-2 text-white/30 text-sm">
                <Loader2 size={16} className="animate-spin" /> Carregando…
              </div>
            ) : pecaAtual?.html ? (
              <div className="relative" style={{ width: dim.w * dim.scale, height: dim.h * dim.scale }}>
                <iframe
                  srcDoc={pecaAtual.html}
                  style={{
                    width: dim.w,
                    height: dim.h,
                    transform: `scale(${dim.scale})`,
                    transformOrigin: "top left",
                    pointerEvents: "none",
                    border: "none",
                  }}
                  title={`preview-${formato}`}
                />
              </div>
            ) : (
              <p className="text-white/20 text-sm">Nenhuma peça gerada para este formato.</p>
            )}
          </div>
        </div>

        {/* Chat lateral */}
        <div className="w-80 flex flex-col bg-[#0D0D0D]">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-xs font-bold tracking-widest uppercase text-white/40">Editar por conversa</h2>
            <p className="text-[11px] text-white/20 mt-0.5">Descreva a alteração que deseja</p>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.length === 0 && (
              <div className="space-y-2 pt-4">
                {[
                  "Aumenta a logo do empreendimento",
                  "Muda o CTA para vermelho",
                  "O nome do executivo está pequeno",
                  "Remove o subtítulo",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="block w-full text-left text-xs text-white/30 hover:text-gold/70 border border-white/5 hover:border-gold/20 px-3 py-2 rounded-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {mensagens.map((m, i) => (
              <div
                key={i}
                className={`text-xs px-3 py-2.5 rounded-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gold/10 text-gold border border-gold/20 ml-4"
                    : "bg-white/4 text-white/60 border border-white/6 mr-4"
                }`}
              >
                {m.conteudo}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-white/30 text-xs mr-4 bg-white/4 border border-white/6 px-3 py-2.5 rounded-sm">
                <Loader2 size={11} className="animate-spin" /> Aplicando…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Digite a alteração…"
                disabled={sending}
                className="flex-1 bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white text-xs px-3 py-2.5 outline-none focus:border-gold/50 placeholder:text-white/20"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="bg-gold text-dark p-2.5 hover:bg-gold/90 disabled:opacity-40 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
