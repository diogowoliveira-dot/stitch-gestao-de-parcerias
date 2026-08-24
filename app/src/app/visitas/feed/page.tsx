"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ItemVisita from "@/components/visitas/ItemVisita";
import NavInferior from "@/components/visitas/NavInferior";
import SheetEditarVisita from "@/components/visitas/SheetEditarVisita";
import SheetImportar from "@/components/visitas/SheetImportar";
import { Badge, Icon, NomeImobiliaria, Toast } from "@/components/visitas/ui";
import { useVisitas } from "@/lib/visitas-context";
import {
  fimDoDia,
  fmtData,
  fmtDiaExtenso,
  fmtHora,
  inicioDoDia,
  statusPorUltimaVisita,
  STATUS_INFO,
  tempoRelativo,
} from "@/lib/visitas-types";

type Ordem = "recentes" | "mais_visitadas" | "esquecidas" | "nome";

const ORDENS: { valor: Ordem; label: string }[] = [
  { valor: "recentes", label: "Visitadas por último" },
  { valor: "mais_visitadas", label: "Mais visitadas" },
  { valor: "esquecidas", label: "Precisam de visita" },
  { valor: "nome", label: "Nome (A–Z)" },
];

export default function PaginaFeed() {
  const router = useRouter();
  const {
    imobiliarias,
    visitas,
    carregado,
    visitasDe,
    visitaAberta,
    proximoAgendamentoDe,
    agendamentosNoIntervalo,
  } = useVisitas();

  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [aberta, setAberta] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [editandoVisita, setEditandoVisita] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const agendaHoje = useMemo(
    () =>
      agendamentosNoIntervalo(inicioDoDia(new Date()), fimDoDia(new Date())).filter(
        (a) => a.status === "programada"
      ),
    [agendamentosNoIntervalo]
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();

    const enriquecidas = imobiliarias.map((i) => {
      const vs = visitasDe(i.id);
      const ultima = vs[0] ?? null;
      return {
        imob: i,
        visitas: vs,
        total: vs.length,
        ultima,
        emVisita: visitaAberta?.imobiliariaId === i.id,
        proxima: proximoAgendamentoDe(i.id),
      };
    });

    const filtradas = q
      ? enriquecidas.filter(
          (e) =>
            e.imob.nome.toLowerCase().includes(q) ||
            e.imob.responsavel.nome.toLowerCase().includes(q) ||
            e.imob.endereco.toLowerCase().includes(q) ||
            e.visitas.some((v) => v.motivo.toLowerCase().includes(q))
        )
      : enriquecidas;

    const ordenadas = [...filtradas];
    if (ordem === "recentes") {
      ordenadas.sort((a, b) =>
        (b.ultima?.checkIn ?? "").localeCompare(a.ultima?.checkIn ?? "")
      );
    } else if (ordem === "mais_visitadas") {
      ordenadas.sort((a, b) => b.total - a.total);
    } else if (ordem === "esquecidas") {
      ordenadas.sort((a, b) =>
        (a.ultima?.checkIn ?? "").localeCompare(b.ultima?.checkIn ?? "")
      );
    } else {
      ordenadas.sort((a, b) => a.imob.nome.localeCompare(b.imob.nome));
    }
    return ordenadas;
  }, [imobiliarias, busca, ordem, visitasDe, visitaAberta, proximoAgendamentoDe]);

  const totalVisitas = visitas.length;
  const tempoMedio = useMemo(() => {
    const fechadas = visitas.filter((v) => v.checkOut);
    if (fechadas.length === 0) return null;
    const soma = fechadas.reduce(
      (s, v) => s + (new Date(v.checkOut!).getTime() - new Date(v.checkIn).getTime()),
      0
    );
    return Math.round(soma / fechadas.length / 60000);
  }, [visitas]);

  return (
    <div className="min-h-dvh bg-black pb-24">
      {/* ——— Cabeçalho ——— */}
      <header className="sticky top-0 z-[900] bg-[#0a0a0a]/97 backdrop-blur-md border-b border-[#1c1c1c]">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ec1313] flex items-center justify-center shrink-0">
            <Icon name="format_list_bulleted" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold leading-tight">Minhas imobiliárias</h1>
            <p className="text-[11px] text-[#7a7a7a] leading-tight">
              {imobiliarias.length} cadastradas · {totalVisitas} visitas
              {tempoMedio !== null && ` · ${tempoMedio}min em média`}
            </p>
          </div>
          <button
            onClick={() => setImportando(true)}
            aria-label="Importar lista de imobiliárias"
            className="shrink-0 h-9 px-3 rounded-xl bg-[#171717] border border-[#2a2a2a] flex items-center gap-1.5 text-xs font-bold text-[#d0d0d0] hover:text-white hover:bg-[#222] transition"
          >
            <Icon name="upload_file" size={16} />
            Importar
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Icon
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a5a]"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar imobiliária, responsável ou motivo"
              className="w-full bg-[#141414] border border-[#262626] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#ec1313] placeholder:text-[#5a5a5a]"
            />
          </div>
        </div>

        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto custom-scrollbar">
          {ORDENS.map((o) => (
            <button
              key={o.valor}
              onClick={() => setOrdem(o.valor)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                ordem === o.valor
                  ? "bg-[#ec1313] border-[#ec1313] text-white"
                  : "bg-[#141414] border-[#262626] text-[#9a9a9a] hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </header>

      {/* ——— Lista ——— */}
      <main className="px-4 pt-4 space-y-2.5">
        {carregado && lista.length === 0 && (
          <div className="rounded-2xl border border-[#1c1c1c] bg-[#0d0d0d] p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-3">
              <Icon name="apartment" size={24} className="text-[#5a5a5a]" />
            </div>
            <p className="text-sm font-bold mb-1">
              {busca ? "Nada encontrado" : "Nenhuma imobiliária cadastrada"}
            </p>
            <p className="text-[13px] text-[#7a7a7a] leading-relaxed">
              {busca
                ? "Tente outro termo de busca."
                : "Abra o mapa e toque no local da imobiliária para cadastrar a primeira — ou importe sua lista pronta."}
            </p>
            {!busca && (
              <button
                onClick={() => setImportando(true)}
                className="mt-4 h-10 px-4 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] text-[13px] font-bold text-white inline-flex items-center gap-2 hover:bg-[#242424] transition"
              >
                <Icon name="upload_file" size={16} />
                Importar planilha
              </button>
            )}
          </div>
        )}

        {lista.map(({ imob, visitas: vs, total, ultima, emVisita, proxima }) => {
          const status = statusPorUltimaVisita(ultima?.checkIn ?? null, emVisita);
          const info = STATUS_INFO[status];
          const expandida = aberta === imob.id;

          return (
            <article
              key={imob.id}
              className="rounded-2xl border border-[#1c1c1c] bg-[#0d0d0d] overflow-hidden"
            >
              <button
                onClick={() => setAberta(expandida ? null : imob.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[13px]"
                  style={{ background: `${info.cor}1f`, color: info.cor }}
                >
                  {iniciais(imob.nome)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold truncate flex-1 min-w-0">
                      <NomeImobiliaria nome={imob.nome} visitas={total} />
                    </h2>
                    <Icon
                      name={expandida ? "expand_less" : "expand_more"}
                      size={20}
                      className="text-[#5a5a5a] shrink-0"
                    />
                  </div>

                  <p className="text-[12px] text-[#8a8a8a] truncate">
                    {imob.responsavel.nome}
                    {imob.responsavel.telefone && ` · ${imob.responsavel.telefone}`}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <Badge cor={info.cor} pulsando={emVisita}>
                      {info.label}
                    </Badge>
                    <span className="text-[11px] text-[#7a7a7a] font-semibold">
                      {total} {total === 1 ? "visita" : "visitas"}
                    </span>
                    {ultima && (
                      <span className="text-[11px] text-[#6a6a6a]">
                        últ. {fmtData(ultima.checkIn)} ({tempoRelativo(ultima.checkIn)})
                      </span>
                    )}
                  </div>

                  {proxima && (
                    <p className="text-[11px] text-[#60a5fa] font-semibold mt-1.5 flex items-center gap-1">
                      <Icon name="event_upcoming" size={13} />
                      Próxima: {fmtDiaExtenso(proxima.inicio)} às{" "}
                      {fmtHora(proxima.inicio)}
                    </p>
                  )}
                </div>
              </button>

              {expandida && (
                <div className="px-4 pb-4 -mt-1">
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => router.push(`/visitas?focus=${imob.id}`)}
                      className="flex-1 h-9 rounded-lg bg-[#171717] border border-[#2a2a2a] text-[12px] font-bold text-[#d0d0d0] hover:text-white flex items-center justify-center gap-1.5"
                    >
                      <Icon name="map" size={15} /> Ver no mapa
                    </button>
                    {imob.responsavel.telefone && (
                      <a
                        href={`https://wa.me/55${imob.responsavel.telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-9 rounded-lg bg-[#171717] border border-[#2a2a2a] text-[12px] font-bold text-[#d0d0d0] hover:text-white flex items-center justify-center gap-1.5"
                      >
                        <Icon name="chat" size={15} /> WhatsApp
                      </a>
                    )}
                  </div>

                  {imob.endereco && (
                    <p className="text-[12px] text-[#7a7a7a] mb-3 flex items-start gap-1.5">
                      <Icon name="location_on" size={14} className="mt-0.5 shrink-0" />
                      {imob.endereco}
                    </p>
                  )}

                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
                    Histórico de visitas
                  </p>
                  {vs.length === 0 ? (
                    <p className="text-[13px] text-[#7a7a7a]">
                      Nenhuma visita registrada ainda.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {vs.map((v) => (
                        <ItemVisita
                          key={v.id}
                          visita={v}
                          onEditar={() => setEditandoVisita(v.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </main>

      <NavInferior badgeAgenda={agendaHoje.length} />

      {importando && (
        <SheetImportar
          onFechar={() => setImportando(false)}
          onConcluir={(qtd) => {
            setImportando(false);
            setToast(
              qtd === 0
                ? "Nenhuma imobiliária importada."
                : `${qtd} ${qtd === 1 ? "imobiliária importada" : "imobiliárias importadas"} com sucesso.`
            );
            window.setTimeout(() => setToast(null), 3600);
          }}
        />
      )}

      {editandoVisita && (
        <SheetEditarVisita
          visitaId={editandoVisita}
          onFechar={() => setEditandoVisita(null)}
          onSalvo={() => {
            setToast("Visita atualizada.");
            window.setTimeout(() => setToast(null), 3600);
          }}
        />
      )}

      {toast && <Toast mensagem={toast} tipo="sucesso" />}
    </div>
  );
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
