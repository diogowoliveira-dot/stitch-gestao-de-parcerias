import Link from "next/link";
import { Plus, FileImage, Mail, Clock } from "lucide-react";
import { apiGet, type Campanha } from "@/lib/api";
import NavBar from "@/components/NavBar";

async function getCampanhas(): Promise<Campanha[]> {
  try {
    return await apiGet<Campanha[]>("/campaign/");
  } catch {
    return [];
  }
}

const TIPO_LABEL: Record<string, string> = {
  lancamento: "Lançamento",
  case: "Case",
  educativo: "Educativo",
  evento: "Evento",
};

export default async function DashboardPage() {
  const campanhas = await getCampanhas();

  return (
    <div className="flex min-h-screen bg-dark">
      <NavBar />
      <main className="ml-56 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">Campanhas</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {campanhas.length} campanha{campanhas.length !== 1 ? "s" : ""} gerada{campanhas.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/campanha/nova"
            className="flex items-center gap-2 bg-gold text-dark text-sm font-bold px-5 py-2.5 hover:bg-gold/90 transition-colors"
          >
            <Plus size={16} />
            Nova Campanha
          </Link>
        </div>

        {/* Empty state */}
        {campanhas.length === 0 && (
          <div className="border border-[rgba(255,255,255,0.06)] rounded-sm p-16 text-center">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-4" />
            <p className="text-white/40 text-sm">Nenhuma campanha gerada ainda.</p>
            <Link
              href="/campanha/nova"
              className="inline-flex items-center gap-2 mt-6 bg-gold/10 text-gold text-sm font-semibold px-5 py-2.5 border border-dark-border hover:bg-gold/15 transition-colors"
            >
              <Plus size={14} />
              Criar primeira campanha
            </Link>
          </div>
        )}

        {/* Grid de campanhas */}
        {campanhas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campanhas.map((c) => (
              <Link
                key={c.id}
                href={`/campanha/${c.id}`}
                className="block bg-[#141414] border border-[rgba(255,255,255,0.06)] hover:border-gold/30 transition-colors rounded-sm p-5 group"
              >
                {/* Tipo badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gold bg-gold/10 px-2.5 py-1">
                    {TIPO_LABEL[c.tipo] || c.tipo}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Clock size={11} />
                    {new Date(c.criada_em).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-white leading-tight group-hover:text-gold/90 transition-colors">
                  {c.empreendimento}
                </h3>
                <p className="text-sm text-white/40 mt-1">{c.cliente}</p>

                {c.executivos?.nome && (
                  <p className="text-xs text-white/25 mt-3 border-t border-white/5 pt-3">
                    {c.executivos.nome}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <FileImage size={11} /> Story + Post
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30">
                    <Mail size={11} /> E-mail
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
