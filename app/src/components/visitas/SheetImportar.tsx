"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import SeletorLocal from "./SeletorLocal";
import { Badge, Botao, Icon, Sheet } from "./ui";
import { useVisitas } from "@/lib/visitas-context";
import {
  baixarModelo,
  CAMPOS,
  detectarColunas,
  geocodificar,
  geocodificarLote,
  lerPlanilha,
  montarLinhas,
  type LinhaImport,
  type MapaColunas,
  type Planilha,
  type StatusLinha,
} from "@/lib/visitas-import";

const CENTRO_PADRAO = { lat: -27.5954, lng: -48.548 };

const STATUS: Record<StatusLinha, { cor: string; label: string }> = {
  ok: { cor: "#00c29f", label: "Pronta" },
  sem_local: { cor: "#ffc300", label: "Sem localização" },
  duplicada: { cor: "#8b5cf6", label: "Já cadastrada" },
  invalida: { cor: "#ef4444", label: "Sem nome" },
};

type Etapa = "arquivo" | "colunas" | "geo" | "revisao";

export default function SheetImportar({
  onFechar,
  onConcluir,
  perto,
}: {
  onFechar: () => void;
  onConcluir: (quantidade: number) => void;
  /** Posição atual do executivo — prioriza resultados da região */
  perto?: { lat: number; lng: number } | null;
}) {
  const { imobiliarias, addImobiliaria, totalVisitasDe } = useVisitas();

  const [etapa, setEtapa] = useState<Etapa>("arquivo");
  const [erro, setErro] = useState("");
  const [lendo, setLendo] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [planilha, setPlanilha] = useState<Planilha | null>(null);
  const [mapa, setMapa] = useState<MapaColunas | null>(null);
  const [linhas, setLinhas] = useState<LinhaImport[]>([]);
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0 });
  const [marcando, setMarcando] = useState<LinhaImport | null>(null);

  const cancelar = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ——— 1. arquivo ———
  const escolherArquivo = useCallback(async (arquivo: File) => {
    setErro("");
    setLendo(true);
    try {
      const p = await lerPlanilha(arquivo);
      if (p.linhas.length === 0) {
        setErro("Não encontrei nenhuma linha de dados além do cabeçalho.");
        return;
      }
      setNomeArquivo(arquivo.name);
      setPlanilha(p);
      setMapa(detectarColunas(p.cabecalho));
      setEtapa("colunas");
    } catch (e) {
      setErro((e as Error).message || "Não consegui ler este arquivo.");
    } finally {
      setLendo(false);
    }
  }, []);

  // ——— 2. colunas → 3. geocodificação ———
  async function buscarCoordenadas() {
    if (!planilha || !mapa) return;
    const base = montarLinhas(
      planilha,
      mapa,
      imobiliarias.map((i) => i.nome)
    );
    setLinhas(base);
    setProgresso({ feitas: 0, total: base.filter((l) => l.status !== "invalida" && l.consulta).length });
    setEtapa("geo");
    cancelar.current = false;

    const resolvidas = await geocodificarLote(base, {
      perto: perto ?? null,
      onProgresso: (feitas, total) => setProgresso({ feitas, total }),
      cancelado: () => cancelar.current,
    });

    setLinhas(resolvidas);
    setEtapa("revisao");
  }

  // ——— 4. importar ———
  function importar() {
    const aImportar = linhas.filter(
      (l) => l.incluir && l.lat !== null && l.lng !== null
    );
    aImportar.forEach((l) => {
      addImobiliaria({
        nome: l.nome,
        lat: l.lat!,
        lng: l.lng!,
        endereco: l.endereco || l.enderecoEncontrado,
        responsavel: {
          nome: l.responsavel,
          telefone: l.telefone,
          email: l.email,
        },
      });
    });
    onConcluir(aImportar.length);
  }

  const resumo = useMemo(() => {
    const c = { ok: 0, sem_local: 0, duplicada: 0, invalida: 0 };
    linhas.forEach((l) => c[l.status]++);
    return c;
  }, [linhas]);

  const prontasParaImportar = linhas.filter(
    (l) => l.incluir && l.lat !== null && l.lng !== null
  ).length;

  // ————————————————————————————————————————
  // Marcação manual de uma linha sem localização
  // ————————————————————————————————————————
  if (marcando) {
    return (
      <SeletorLocal
        centroInicial={perto ?? CENTRO_PADRAO}
        pontos={imobiliarias.map((i) => ({
          id: i.id,
          lat: i.lat,
          lng: i.lng,
          nome: i.nome,
          cor: "#6b7280",
          rotulo: "já cadastrada",
          visitas: totalVisitasDe(i.id),
          emVisita: false,
        }))}
        onCancelar={() => setMarcando(null)}
        onConfirmar={(lat, lng) => {
          setLinhas((prev) =>
            prev.map((l) =>
              l.indice === marcando.indice
                ? { ...l, lat, lng, status: "ok", incluir: true }
                : l
            )
          );
          setMarcando(null);
        }}
      />
    );
  }

  return (
    <Sheet
      aberto
      onFechar={onFechar}
      titulo="Importar lista de imobiliárias"
      subtitulo={
        etapa === "arquivo"
          ? "Planilha do Excel (.xlsx) ou CSV"
          : etapa === "colunas"
            ? `${nomeArquivo} · ${planilha?.linhas.length ?? 0} linhas`
            : etapa === "geo"
              ? "Localizando os endereços no mapa"
              : `${linhas.length} linhas lidas`
      }
      rodape={
        etapa === "colunas" ? (
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="secundario" onClick={() => setEtapa("arquivo")}>
              Voltar
            </Botao>
            <Botao
              variante="primario"
              icone="travel_explore"
              disabled={!mapa || mapa.nome === -1}
              onClick={buscarCoordenadas}
            >
              Continuar
            </Botao>
          </div>
        ) : etapa === "geo" ? (
          <Botao
            full
            variante="secundario"
            icone="stop_circle"
            onClick={() => {
              cancelar.current = true;
            }}
          >
            Parar e revisar o que já achei
          </Botao>
        ) : etapa === "revisao" ? (
          <div className="flex flex-col gap-2">
            <Botao
              full
              variante="primario"
              icone="download_done"
              disabled={prontasParaImportar === 0}
              onClick={importar}
            >
              {prontasParaImportar === 0
                ? "Nenhuma linha pronta"
                : `Importar ${prontasParaImportar} ${prontasParaImportar === 1 ? "imobiliária" : "imobiliárias"}`}
            </Botao>
            <Botao variante="fantasma" onClick={() => setEtapa("arquivo")}>
              Escolher outro arquivo
            </Botao>
          </div>
        ) : undefined
      }
    >
      {erro && (
        <div className="rounded-xl border border-[#7f1d1d] bg-[#1a0a0a] p-3 mb-4 flex items-start gap-2.5">
          <Icon name="error" size={18} className="text-[#ef4444] mt-0.5" />
          <p className="text-[13px] text-[#fca5a5] leading-relaxed">{erro}</p>
        </div>
      )}

      {/* ——————————— 1. ARQUIVO ——————————— */}
      {etapa === "arquivo" && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) escolherArquivo(f);
              e.target.value = "";
            }}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={lendo}
            className="w-full rounded-2xl border-2 border-dashed border-[#2e2e2e] hover:border-[#ec1313] bg-[#111] p-8 flex flex-col items-center gap-2 transition disabled:opacity-50"
          >
            <Icon
              name={lendo ? "progress_activity" : "upload_file"}
              size={32}
              className={lendo ? "text-[#ec1313] animate-spin" : "text-[#6a6a6a]"}
            />
            <span className="text-sm font-bold">
              {lendo ? "Lendo a planilha…" : "Escolher arquivo"}
            </span>
            <span className="text-[12px] text-[#7a7a7a]">
              .xlsx ou .csv — até algumas centenas de linhas
            </span>
          </button>

          <div className="mt-4 rounded-xl border border-[#1f1f1f] bg-[#111] p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
              O que a planilha precisa ter
            </p>
            <ul className="text-[13px] text-[#b0b0b0] leading-relaxed space-y-1">
              <li>
                <strong className="text-white">Nome</strong> da imobiliária — obrigatório
              </li>
              <li>
                <strong className="text-white">Endereço</strong> — usado para achar o pin
                no mapa (aceita colunas separadas de bairro, cidade e UF)
              </li>
              <li>
                <strong className="text-white">Responsável</strong>, telefone e e-mail —
                opcionais
              </li>
            </ul>
            <p className="text-[12px] text-[#7a7a7a] mt-2.5 leading-relaxed">
              A primeira linha deve ser o cabeçalho. Na etapa seguinte você confirma de
              qual coluna vem cada campo.
            </p>
            <div className="mt-3">
              <Botao variante="secundario" icone="download" onClick={baixarModelo}>
                Baixar modelo
              </Botao>
            </div>
          </div>
        </div>
      )}

      {/* ——————————— 2. COLUNAS ——————————— */}
      {etapa === "colunas" && planilha && mapa && (
        <div>
          <p className="text-[13px] text-[#9a9a9a] leading-relaxed mb-4">
            Confirme de qual coluna vem cada campo. Já preenchi o que consegui
            reconhecer pelo cabeçalho.
          </p>

          <div className="space-y-2.5">
            {CAMPOS.map((campo) => (
              <label key={campo.id} className="flex items-center gap-3">
                <span className="w-[38%] shrink-0 text-[12px] font-bold text-[#c0c0c0] leading-tight">
                  {campo.label}
                  {campo.obrigatorio && <span className="text-[#ec1313]"> *</span>}
                  {campo.ajuda && (
                    <span className="block text-[10px] font-normal text-[#6a6a6a]">
                      {campo.ajuda}
                    </span>
                  )}
                </span>
                <select
                  value={mapa[campo.id]}
                  onChange={(e) =>
                    setMapa({ ...mapa, [campo.id]: Number(e.target.value) })
                  }
                  className="flex-1 min-w-0 bg-[#141414] border border-[#262626] rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-[#ec1313]"
                >
                  <option value={-1}>— não importar —</option>
                  {planilha.cabecalho.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Coluna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* Prévia */}
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mt-5 mb-2">
            Prévia das 3 primeiras linhas
          </p>
          <div className="space-y-2">
            {planilha.linhas.slice(0, 3).map((l, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#1f1f1f] bg-[#111] p-3 text-[12px]"
              >
                <p className="font-bold text-white truncate">
                  {mapa.nome >= 0 ? l[mapa.nome] || "(sem nome)" : "(sem nome)"}
                </p>
                <p className="text-[#8a8a8a] truncate">
                  {[mapa.endereco, mapa.bairro, mapa.cidade, mapa.uf]
                    .filter((idx) => idx >= 0)
                    .map((idx) => l[idx])
                    .filter(Boolean)
                    .join(" — ") || "(sem endereço)"}
                </p>
                {mapa.responsavel >= 0 && l[mapa.responsavel] && (
                  <p className="text-[#6a6a6a] truncate">{l[mapa.responsavel]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[#222] bg-[#111] p-3 flex items-start gap-2.5">
            <Icon name="schedule" size={16} className="text-[#ffc300] mt-0.5" />
            <p className="text-[12px] text-[#9a9a9a] leading-relaxed">
              A busca das coordenadas usa o OpenStreetMap e leva cerca de{" "}
              <strong className="text-white">1 segundo por linha</strong> — {planilha.linhas.length}{" "}
              linhas levam mais ou menos{" "}
              {Math.max(1, Math.round(planilha.linhas.length * 1.1 / 60))} min. Dá para
              parar no meio.
            </p>
          </div>
        </div>
      )}

      {/* ——————————— 3. GEOCODIFICAÇÃO ——————————— */}
      {etapa === "geo" && (
        <div className="py-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-4">
            <Icon name="travel_explore" size={28} className="text-[#ec1313] animate-pulse-dot" />
          </div>
          <p className="text-sm font-bold mb-1">Localizando endereços no mapa</p>
          <p className="text-[13px] text-[#8a8a8a] mb-4">
            {progresso.feitas} de {progresso.total}
          </p>
          <div className="h-2 rounded-full bg-[#1c1c1c] overflow-hidden">
            <div
              className="h-full bg-[#ec1313] transition-all duration-300"
              style={{
                width: `${progresso.total ? (progresso.feitas / progresso.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[12px] text-[#6a6a6a] mt-4 leading-relaxed">
            Pode deixar em segundo plano — só não feche esta tela.
          </p>
        </div>
      )}

      {/* ——————————— 4. REVISÃO ——————————— */}
      {etapa === "revisao" && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(Object.keys(STATUS) as StatusLinha[])
              .filter((s) => resumo[s] > 0)
              .map((s) => (
                <Badge key={s} cor={STATUS[s].cor}>
                  {resumo[s]} {STATUS[s].label}
                </Badge>
              ))}
          </div>

          {resumo.sem_local > 0 && (
            <div className="rounded-xl border border-[#3d3210] bg-[#1a1608] p-3 mb-4 flex items-start gap-2.5">
              <Icon name="wrong_location" size={18} className="text-[#ffc300] mt-0.5" />
              <p className="text-[12px] text-[#d6c68a] leading-relaxed">
                Não achei o endereço de {resumo.sem_local}{" "}
                {resumo.sem_local === 1 ? "linha" : "linhas"}. Toque em{" "}
                <strong>Marcar no mapa</strong> para colocar o pin à mão — sem pin a
                imobiliária não entra.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {linhas.map((l) => (
              <LinhaRevisao
                key={l.indice}
                linha={l}
                onAlternar={() =>
                  setLinhas((prev) =>
                    prev.map((x) =>
                      x.indice === l.indice ? { ...x, incluir: !x.incluir } : x
                    )
                  )
                }
                onMarcar={() => setMarcando(l)}
                onTentarDeNovo={async () => {
                  const c = await geocodificar(l.consulta, perto ?? null);
                  if (!c) return;
                  setLinhas((prev) =>
                    prev.map((x) =>
                      x.indice === l.indice
                        ? {
                            ...x,
                            lat: c.lat,
                            lng: c.lng,
                            enderecoEncontrado: c.enderecoEncontrado,
                            status: x.status === "duplicada" ? "duplicada" : "ok",
                            incluir: x.status === "duplicada" ? x.incluir : true,
                          }
                        : x
                    )
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ==========================================================
// LINHA DA REVISÃO
// ==========================================================
function LinhaRevisao({
  linha,
  onAlternar,
  onMarcar,
  onTentarDeNovo,
}: {
  linha: LinhaImport;
  onAlternar: () => void;
  onMarcar: () => void;
  onTentarDeNovo: () => void;
}) {
  const [buscando, setBuscando] = useState(false);
  const info = STATUS[linha.status];
  const podeIncluir = linha.lat !== null && linha.lng !== null;

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        linha.incluir && podeIncluir
          ? "border-[#262626] bg-[#131313]"
          : "border-[#1a1a1a] bg-[#0e0e0e] opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onAlternar}
          disabled={!podeIncluir}
          aria-label={linha.incluir ? "Não importar" : "Importar"}
          className={`shrink-0 w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition ${
            linha.incluir && podeIncluir
              ? "bg-[#ec1313] border-[#ec1313]"
              : "bg-transparent border-[#3a3a3a]"
          } disabled:opacity-40`}
        >
          {linha.incluir && podeIncluir && (
            <Icon name="check" size={14} className="text-white" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold truncate">
              {linha.nome || "(sem nome)"}
            </p>
            <Badge cor={info.cor}>{info.label}</Badge>
          </div>

          {linha.endereco && (
            <p className="text-[11px] text-[#8a8a8a] truncate mt-0.5">
              {linha.endereco}
            </p>
          )}
          {linha.responsavel && (
            <p className="text-[11px] text-[#6a6a6a] truncate">
              {linha.responsavel}
              {linha.telefone && ` · ${linha.telefone}`}
            </p>
          )}
          {linha.status === "ok" && linha.enderecoEncontrado && (
            <p className="text-[10px] text-[#00c29f] truncate mt-1 flex items-center gap-1">
              <Icon name="check_circle" size={12} />
              {linha.enderecoEncontrado}
            </p>
          )}

          {(linha.status === "sem_local" ||
            (linha.status === "duplicada" && !podeIncluir)) && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={onMarcar}
                className="h-8 px-3 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[11px] font-bold text-[#d0d0d0] hover:text-white flex items-center gap-1.5"
              >
                <Icon name="add_location_alt" size={14} /> Marcar no mapa
              </button>
              {linha.consulta && (
                <button
                  onClick={async () => {
                    setBuscando(true);
                    await onTentarDeNovo();
                    setBuscando(false);
                  }}
                  disabled={buscando}
                  className="h-8 px-3 rounded-lg bg-[#1a1a1a] border border-[#2e2e2e] text-[11px] font-bold text-[#d0d0d0] hover:text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Icon
                    name={buscando ? "progress_activity" : "refresh"}
                    size={14}
                    className={buscando ? "animate-spin" : ""}
                  />
                  Tentar de novo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
