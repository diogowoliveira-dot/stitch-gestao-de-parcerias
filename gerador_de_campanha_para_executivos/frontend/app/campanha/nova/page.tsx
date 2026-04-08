"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiGet, apiPost, type Executivo, type GenerateResult } from "@/lib/api";
import NavBar from "@/components/NavBar";

const TIPOS = [
  { value: "lancamento", label: "Lançamento" },
  { value: "evento", label: "Evento" },
  { value: "case", label: "Case de Sucesso" },
  { value: "educativo", label: "Educativo" },
];

export default function NovaCampanhaPage() {
  const router = useRouter();
  const [executivos, setExecutivos] = useState<Executivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    executivo_id: "",
    tipo: "lancamento",
    cliente: "",
    empreendimento: "",
    copy_base: "",
    data_evento: "",
    url_imagem_produto: "",
    url_logo_incorporadora: "",
    stats_pavimentos: "",
    stats_unidades: "",
    stats_suites: "",
    stats_extra_label: "",
    stats_extra_valor: "",
  });

  useEffect(() => {
    apiGet<Executivo[]>("/executivos/").then(setExecutivos);
  }, []);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const stats: Record<string, string> = {};
    if (form.stats_pavimentos) stats["Pavimentos"] = form.stats_pavimentos;
    if (form.stats_unidades) stats["Unidades"] = form.stats_unidades;
    if (form.stats_suites) stats["Suítes"] = form.stats_suites;
    if (form.stats_extra_label && form.stats_extra_valor)
      stats[form.stats_extra_label] = form.stats_extra_valor;

    try {
      const result = await apiPost<GenerateResult>("/campaign/generate", {
        executivo_id: form.executivo_id,
        briefing: {
          tipo: form.tipo,
          cliente: form.cliente,
          empreendimento: form.empreendimento,
          copy_base: form.copy_base,
          data_evento: form.data_evento,
          url_imagem_produto: form.url_imagem_produto || undefined,
          url_logo_incorporadora: form.url_logo_incorporadora || undefined,
          stats: Object.keys(stats).length > 0 ? stats : undefined,
        },
      });
      router.push(`/campanha/${result.campanha_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar campanha");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-dark">
      <NavBar />
      <main className="ml-56 flex-1 p-8 max-w-3xl">
        <div className="mb-8">
          <div className="w-8 h-0.5 bg-gold mb-3" />
          <h1 className="font-serif text-2xl font-bold text-white">Nova Campanha</h1>
          <p className="text-sm text-white/40 mt-0.5">Preencha o briefing e a IA gera story, post e e-mail</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Executivo */}
          <section>
            <SectionTitle>Executivo</SectionTitle>
            <select
              required
              value={form.executivo_id}
              onChange={(e) => set("executivo_id", e.target.value)}
              className="w-full bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white px-3 py-3 text-sm outline-none focus:border-gold/50"
            >
              <option value="">Selecione o executivo…</option>
              {executivos.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.nome}</option>
              ))}
            </select>
          </section>

          {/* Tipo */}
          <section>
            <SectionTitle>Tipo de Campanha</SectionTitle>
            <div className="flex gap-2 flex-wrap">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set("tipo", t.value)}
                  className={`px-4 py-2 text-xs font-bold tracking-widest uppercase border transition-colors ${
                    form.tipo === t.value
                      ? "bg-gold text-dark border-gold"
                      : "border-[rgba(255,255,255,0.1)] text-white/50 hover:border-gold/30 hover:text-white/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Produto */}
          <section>
            <SectionTitle>Produto</SectionTitle>
            <div className="space-y-3">
              <InputField
                label="Incorporadora / Cliente"
                value={form.cliente}
                onChange={(v) => set("cliente", v)}
                required
                placeholder="ex: Orgânica Incorporadora"
              />
              <InputField
                label="Empreendimento"
                value={form.empreendimento}
                onChange={(v) => set("empreendimento", v)}
                required
                placeholder="ex: Orgânica Meia Praia"
              />
              <InputField
                label="URL da imagem do produto"
                value={form.url_imagem_produto}
                onChange={(v) => set("url_imagem_produto", v)}
                placeholder="https://…"
              />
              <InputField
                label="URL da logo da incorporadora"
                value={form.url_logo_incorporadora}
                onChange={(v) => set("url_logo_incorporadora", v)}
                placeholder="https://…"
              />
            </div>
          </section>

          {/* Stats do empreendimento */}
          <section>
            <SectionTitle>Dados do Empreendimento (opcional)</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Pavimentos" value={form.stats_pavimentos} onChange={(v) => set("stats_pavimentos", v)} placeholder="50" />
              <InputField label="Unidades" value={form.stats_unidades} onChange={(v) => set("stats_unidades", v)} placeholder="82" />
              <InputField label="Suítes" value={form.stats_suites} onChange={(v) => set("stats_suites", v)} placeholder="4" />
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Label extra" value={form.stats_extra_label} onChange={(v) => set("stats_extra_label", v)} placeholder="Vista" />
                <InputField label="Valor" value={form.stats_extra_valor} onChange={(v) => set("stats_extra_valor", v)} placeholder="360°" />
              </div>
            </div>
          </section>

          {/* Copy base */}
          <section>
            <SectionTitle>Mensagem Principal (opcional)</SectionTitle>
            <textarea
              value={form.copy_base}
              onChange={(e) => set("copy_base", e.target.value)}
              placeholder="Descreva o ponto central da campanha ou deixe em branco para a IA criar livremente…"
              rows={3}
              className="w-full bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white px-3 py-3 text-sm outline-none focus:border-gold/50 resize-none"
            />
          </section>

          {/* Data/local */}
          {(form.tipo === "lancamento" || form.tipo === "evento") && (
            <section>
              <SectionTitle>Data e Local do Evento</SectionTitle>
              <InputField
                label=""
                value={form.data_evento}
                onChange={(v) => set("data_evento", v)}
                placeholder="02 de abril · 19h00 · Meia Praia, Itapema/SC"
              />
            </section>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-dark font-bold text-sm tracking-widest uppercase py-4 hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gerando campanha…
              </>
            ) : (
              "Gerar Campanha com IA"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-3">{children}</h2>
  );
}

function InputField({
  label, value, onChange, required, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs text-white/30 mb-1">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition-colors placeholder:text-white/20"
      />
    </div>
  );
}
