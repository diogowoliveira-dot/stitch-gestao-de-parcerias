"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavInferior from "@/components/visitas/NavInferior";
import SeletorLocal from "@/components/visitas/SeletorLocal";
import SheetAgendamento from "@/components/visitas/SheetAgendamento";
import SheetImobiliaria from "@/components/visitas/SheetImobiliaria";
import SheetLembretes from "@/components/visitas/SheetLembretes";
import { Badge, Botao, Icon, Info, NomeImobiliaria, Sheet, Toast } from "@/components/visitas/ui";
import { useVisitas } from "@/lib/visitas-context";
import {
  enviarConviteAgenda,
  linkAgendaDoAgendamento,
} from "@/lib/visitas-convite";
import {
  chaveDia,
  DIAS_SEMANA,
  ehHoje,
  fimDaSemana,
  fimDoDia,
  fimDoMes,
  fmtDiaExtenso,
  fmtHora,
  formatarDuracaoMs,
  gradeDoMes,
  inicioDaSemana,
  inicioDoDia,
  inicioDoMes,
  MESES,
  somarDias,
  STATUS_AGENDA,
  type Agendamento,
} from "@/lib/visitas-types";

const CENTRO_PADRAO = { lat: -27.5954, lng: -48.548 };

type Visao = "dia" | "semana" | "mes";

type Fluxo =
  | { tipo: "agendar"; imobId?: string | null; dia?: Date }
  | { tipo: "editar"; agId: string }
  | { tipo: "detalhe"; agId: string }
  | { tipo: "selecionar-local" }
  | { tipo: "cadastrar"; pin: { lat: number; lng: number } }
  | { tipo: "lembretes" }
  | null;

export default function PaginaAgenda() {
  const router = useRouter();
  const {
    imobiliarias,
    agendamentos,
    carregado,
    addImobiliaria,
    addAgendamento,
    updateAgendamento,
    cancelarAgendamento,
    removeAgendamento,
    agendamentosNoIntervalo,
    imobiliariaPorId,
    totalVisitasDe,
    perfil,
  } = useVisitas();

  const [visao, setVisao] = useState<Visao>("dia");
  const [ref, setRef] = useState<Date>(() => new Date());
  const [fluxo, setFluxo] = useState<Fluxo>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "sucesso" } | null>(null);

  const avisar = useCallback(
    (msg: string, tipo: "info" | "erro" | "sucesso" = "info") => {
      setToast({ msg, tipo });
      window.setTimeout(() => setToast(null), 3600);
    },
    []
  );

  // ——— Intervalo da visão atual ———
  const [de, ate] = useMemo((): [Date, Date] => {
    if (visao === "dia") return [inicioDoDia(ref), fimDoDia(ref)];
    if (visao === "semana") return [inicioDaSemana(ref), fimDaSemana(ref)];
    return [inicioDoMes(ref), fimDoMes(ref)];
  }, [visao, ref]);

  const doPeriodo = useMemo(
    () => agendamentosNoIntervalo(de, ate),
    [agendamentosNoIntervalo, de, ate]
  );

  const programadasDoPeriodo = doPeriodo.filter((a) => a.status === "programada");

  const tituloPeriodo = useMemo(() => {
    if (visao === "dia") {
      return ehHoje(ref) ? `Hoje · ${fmtDiaExtenso(ref)}` : fmtDiaExtenso(ref);
    }
    if (visao === "semana") {
      const f = fimDaSemana(ref);
      const i = inicioDaSemana(ref);
      const mesmoMes = i.getMonth() === f.getMonth();
      return mesmoMes
        ? `${i.getDate()} – ${f.getDate()} de ${MESES[i.getMonth()].toLowerCase()}`
        : `${i.getDate()} ${MESES[i.getMonth()].slice(0, 3).toLowerCase()} – ${f.getDate()} ${MESES[f.getMonth()].slice(0, 3).toLowerCase()}`;
    }
    return `${MESES[ref.getMonth()]} de ${ref.getFullYear()}`;
  }, [visao, ref]);

  function navegar(dir: -1 | 1) {
    if (visao === "dia") return setRef((d) => somarDias(d, dir));
    if (visao === "semana") return setRef((d) => somarDias(d, dir * 7));
    setRef((d) => new Date(d.getFullYear(), d.getMonth() + dir, 1));
  }

  const agendaHoje = useMemo(
    () =>
      agendamentosNoIntervalo(inicioDoDia(new Date()), fimDoDia(new Date())).filter(
        (a) => a.status === "programada"
      ),
    [agendamentosNoIntervalo]
  );

  const tempoTotal = programadasDoPeriodo.reduce((s, a) => s + a.duracaoMin, 0);

  return (
    <div className="min-h-dvh bg-black pb-24">
      {/* ——— Cabeçalho ——— */}
      <header className="sticky top-0 z-[900] bg-[#0a0a0a]/97 backdrop-blur-md border-b border-[#1c1c1c]">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ec1313] flex items-center justify-center shrink-0">
            <Icon name="calendar_month" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold leading-tight">Agenda de visitas</h1>
            <p className="text-[11px] text-[#7a7a7a] leading-tight">
              {agendaHoje.length === 0
                ? "Nenhuma visita programada para hoje"
                : `${agendaHoje.length} ${agendaHoje.length === 1 ? "visita programada" : "visitas programadas"} hoje`}
            </p>
          </div>
          <button
            onClick={() => setFluxo({ tipo: "lembretes" })}
            aria-label="Lembretes por e-mail"
            className="w-9 h-9 rounded-xl bg-[#171717] border border-[#2a2a2a] flex items-center justify-center text-[#b0b0b0] hover:text-white transition"
          >
            <Icon name="notifications" size={18} />
          </button>
        </div>

        {/* Seletor de visão */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-3 gap-1 bg-[#141414] border border-[#242424] rounded-xl p-1">
            {(["dia", "semana", "mes"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVisao(v)}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition ${
                  visao === v
                    ? "bg-[#ec1313] text-white"
                    : "text-[#8a8a8a] hover:text-white"
                }`}
              >
                {v === "mes" ? "Mês" : v}
              </button>
            ))}
          </div>
        </div>

        {/* Navegação do período */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => navegar(-1)}
            aria-label="Período anterior"
            className="w-9 h-9 rounded-lg bg-[#141414] border border-[#242424] flex items-center justify-center text-[#b0b0b0] hover:text-white"
          >
            <Icon name="chevron_left" size={20} />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-sm font-bold truncate first-letter:uppercase">{tituloPeriodo}</p>
            <p className="text-[11px] text-[#7a7a7a]">
              {programadasDoPeriodo.length}{" "}
              {programadasDoPeriodo.length === 1 ? "visita" : "visitas"}
              {tempoTotal > 0 && ` · ${formatarDuracaoMs(tempoTotal * 60000)} previstos`}
            </p>
          </div>
          <button
            onClick={() => navegar(1)}
            aria-label="Próximo período"
            className="w-9 h-9 rounded-lg bg-[#141414] border border-[#242424] flex items-center justify-center text-[#b0b0b0] hover:text-white"
          >
            <Icon name="chevron_right" size={20} />
          </button>
          <button
            onClick={() => setRef(new Date())}
            className="h-9 px-3 rounded-lg bg-[#141414] border border-[#242424] text-[11px] font-bold text-[#b0b0b0] hover:text-white"
          >
            Hoje
          </button>
        </div>
      </header>

      {/* ——— Conteúdo ——— */}
      <main className="px-4 pt-4">
        {!carregado ? null : visao === "dia" ? (
          <VisaoDia
            dia={ref}
            itens={doPeriodo}
            onAbrir={(id) => setFluxo({ tipo: "detalhe", agId: id })}
            onAgendar={() => setFluxo({ tipo: "agendar", dia: ref })}
          />
        ) : visao === "semana" ? (
          <VisaoSemana
            ref_={ref}
            itens={doPeriodo}
            onAbrir={(id) => setFluxo({ tipo: "detalhe", agId: id })}
            onDia={(d) => {
              setRef(d);
              setVisao("dia");
            }}
          />
        ) : (
          <VisaoMes
            ref_={ref}
            itens={doPeriodo}
            onDia={(d) => {
              setRef(d);
              setVisao("dia");
            }}
          />
        )}
      </main>

      {/* ——— FAB ——— */}
      <button
        onClick={() => setFluxo({ tipo: "agendar", dia: ref })}
        className="fixed right-4 bottom-[86px] z-[950] h-13 pl-4 pr-5 py-3.5 rounded-full bg-[#ec1313] hover:bg-[#d40000] flex items-center gap-2 text-white text-sm font-bold shadow-[0_4px_20px_rgba(236,19,19,0.45)] transition"
      >
        <Icon name="add" size={20} />
        Agendar visita
      </button>

      <NavInferior badgeAgenda={agendaHoje.length} />

      {/* ——————————————— FLUXOS ——————————————— */}

      {fluxo?.tipo === "agendar" && (
        <SheetAgendamento
          imobiliarias={imobiliarias}
          imobIdInicial={fluxo.imobId ?? null}
          diaInicial={fluxo.dia}
          onCancelar={() => setFluxo(null)}
          onNovaImobiliaria={() => setFluxo({ tipo: "selecionar-local" })}
          onSalvar={async (dados, enviarConvite) => {
            const id = addAgendamento(dados);
            setFluxo(null);
            setRef(new Date(dados.inicio));
            avisar("Visita programada com sucesso.", "sucesso");

            if (!enviarConvite) return;
            const imob = imobiliariaPorId(dados.imobiliariaId);
            if (!imob) return;
            const r = await enviarConviteAgenda({
              agendamento: {
                ...dados,
                id,
                status: "programada",
                visitaId: null,
                criadoEm: new Date().toISOString(),
              },
              imobiliaria: imob,
              perfil,
            });
            avisar(r.mensagem, r.ok ? "sucesso" : "erro");
          }}
        />
      )}

      {fluxo?.tipo === "editar" &&
        (() => {
          const ag = agendamentos.find((a) => a.id === fluxo.agId);
          if (!ag) return null;
          return (
            <SheetAgendamento
              imobiliarias={imobiliarias}
              agendamento={ag}
              onCancelar={() => setFluxo({ tipo: "detalhe", agId: ag.id })}
              onNovaImobiliaria={() => setFluxo({ tipo: "selecionar-local" })}
              onSalvar={async (dados, enviarConvite) => {
                updateAgendamento(ag.id, dados);
                setFluxo(null);
                setRef(new Date(dados.inicio));
                avisar("Agendamento atualizado.", "sucesso");

                if (!enviarConvite) return;
                const imob = imobiliariaPorId(dados.imobiliariaId);
                if (!imob) return;
                const r = await enviarConviteAgenda({
                  agendamento: { ...ag, ...dados },
                  imobiliaria: imob,
                  perfil,
                });
                avisar(
                  r.ok ? "Convite atualizado na agenda dos participantes." : r.mensagem,
                  r.ok ? "sucesso" : "erro"
                );
              }}
            />
          );
        })()}

      {/* Cadastro de imobiliária nova direto da agenda: pin no mapa + dados */}
      {fluxo?.tipo === "selecionar-local" && (
        <SeletorLocal
          centroInicial={
            imobiliarias[0]
              ? { lat: imobiliarias[0].lat, lng: imobiliarias[0].lng }
              : CENTRO_PADRAO
          }
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
          onCancelar={() => setFluxo({ tipo: "agendar" })}
          onConfirmar={(lat, lng) => setFluxo({ tipo: "cadastrar", pin: { lat, lng } })}
        />
      )}

      {fluxo?.tipo === "cadastrar" && (
        <SheetImobiliaria
          pin={fluxo.pin}
          acaoDestaque="agendar"
          onCancelar={() => setFluxo({ tipo: "selecionar-local" })}
          onSalvar={(dados, acao) => {
            const id = addImobiliaria({ ...dados, ...fluxo.pin });
            if (acao === "agendar") {
              setFluxo({ tipo: "agendar", imobId: id, dia: ref });
            } else {
              setFluxo(null);
              avisar(`"${dados.nome}" cadastrada.`, "sucesso");
            }
          }}
        />
      )}

      {fluxo?.tipo === "detalhe" &&
        (() => {
          const ag = agendamentos.find((a) => a.id === fluxo.agId);
          const imob = ag ? imobiliariaPorId(ag.imobiliariaId) : null;
          if (!ag || !imob) return null;
          const atrasada =
            ag.status === "programada" && new Date(ag.inicio) < new Date();

          return (
            <Sheet
              aberto
              onFechar={() => setFluxo(null)}
              titulo={
                <NomeImobiliaria nome={imob.nome} visitas={totalVisitasDe(imob.id)} />
              }
              subtitulo={
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <Badge cor={STATUS_AGENDA[ag.status].cor}>
                    {STATUS_AGENDA[ag.status].label}
                  </Badge>
                  {atrasada && <Badge cor="#ffc300">Atrasada</Badge>}
                </div>
              }
              rodape={
                <div className="flex flex-col gap-2">
                  {ag.status === "programada" && (
                    <Botao
                      full
                      variante="primario"
                      icone="how_to_reg"
                      onClick={() => router.push(`/visitas?checkin=${ag.id}`)}
                    >
                      Fazer check-in agora
                    </Botao>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Botao
                      variante="secundario"
                      icone="map"
                      onClick={() => router.push(`/visitas?focus=${imob.id}`)}
                    >
                      Mapa
                    </Botao>
                    <Botao
                      variante="secundario"
                      icone="edit"
                      onClick={() => setFluxo({ tipo: "editar", agId: ag.id })}
                    >
                      Editar
                    </Botao>
                    {ag.status === "programada" ? (
                      <Botao
                        variante="perigo"
                        icone="event_busy"
                        onClick={async () => {
                          cancelarAgendamento(ag.id);
                          setFluxo(null);
                          avisar("Visita cancelada.", "info");
                          if (perfil.email && imob.responsavel.email) {
                            await enviarConviteAgenda({
                              agendamento: ag,
                              imobiliaria: imob,
                              perfil,
                              acao: "cancelamento",
                            });
                          }
                        }}
                      >
                        Cancelar
                      </Botao>
                    ) : (
                      <Botao
                        variante="perigo"
                        icone="delete"
                        onClick={() => {
                          removeAgendamento(ag.id);
                          setFluxo(null);
                          avisar("Agendamento removido.", "info");
                        }}
                      >
                        Excluir
                      </Botao>
                    )}
                  </div>
                </div>
              }
            >
              <div className="space-y-1">
                <Info icone="event">{fmtDiaExtenso(ag.inicio)}</Info>
                <Info icone="schedule">
                  {fmtHora(ag.inicio)} · {formatarDuracaoMs(ag.duracaoMin * 60000)}{" "}
                  previstos
                </Info>
                <Info icone="flag">{ag.motivo}</Info>
                {ag.observacao && <Info icone="notes">{ag.observacao}</Info>}
                <Info icone="person">{imob.responsavel.nome || "—"}</Info>
                {imob.responsavel.telefone && (
                  <Info
                    icone="call"
                    href={`tel:${imob.responsavel.telefone.replace(/\D/g, "")}`}
                  >
                    {imob.responsavel.telefone}
                  </Info>
                )}
                {imob.endereco && <Info icone="location_on">{imob.endereco}</Info>}
              </div>

              {ag.status === "programada" && (
                <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
                    Agenda
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={linkAgendaDoAgendamento(ag, imob, perfil)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 rounded-xl bg-[#171717] border border-[#2a2a2a] text-[12px] font-bold text-[#d0d0d0] hover:text-white flex items-center justify-center gap-1.5"
                    >
                      <Icon name="calendar_add_on" size={15} /> Google Agenda
                    </a>
                    <button
                      onClick={async () => {
                        const r = await enviarConviteAgenda({
                          agendamento: ag,
                          imobiliaria: imob,
                          perfil,
                        });
                        avisar(r.mensagem, r.ok ? "sucesso" : "erro");
                      }}
                      disabled={!imob.responsavel.email || !perfil.email}
                      className="h-10 rounded-xl bg-[#171717] border border-[#2a2a2a] text-[12px] font-bold text-[#d0d0d0] hover:text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Icon name="forward_to_inbox" size={15} /> Enviar convite
                    </button>
                  </div>
                  {!imob.responsavel.email && (
                    <p className="text-[11px] text-[#6a6a6a] mt-2">
                      Sem e-mail do responsável no cadastro — só dá para adicionar na sua
                      própria agenda.
                    </p>
                  )}
                </div>
              )}
            </Sheet>
          );
        })()}

      {fluxo?.tipo === "lembretes" && (
        <SheetLembretes onFechar={() => setFluxo(null)} onAvisar={avisar} />
      )}

      {toast && <Toast mensagem={toast.msg} tipo={toast.tipo} />}
    </div>
  );
}

// ==========================================================
// VISÃO: DIA
// ==========================================================
function VisaoDia({
  dia,
  itens,
  onAbrir,
  onAgendar,
}: {
  dia: Date;
  itens: Agendamento[];
  onAbrir: (id: string) => void;
  onAgendar: () => void;
}) {
  if (itens.length === 0) {
    return (
      <Vazio
        titulo={ehHoje(dia) ? "Dia livre" : "Nenhuma visita neste dia"}
        texto="Programe uma visita para organizar sua rota."
        acao={onAgendar}
      />
    );
  }

  return (
    <div className="space-y-2.5">
      {itens.map((a) => (
        <CardAgendamento key={a.id} ag={a} onClick={() => onAbrir(a.id)} mostrarHora />
      ))}
    </div>
  );
}

// ==========================================================
// VISÃO: SEMANA
// ==========================================================
function VisaoSemana({
  ref_,
  itens,
  onAbrir,
  onDia,
}: {
  ref_: Date;
  itens: Agendamento[];
  onAbrir: (id: string) => void;
  onDia: (d: Date) => void;
}) {
  const inicio = inicioDaSemana(ref_);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));

  const porDia = useMemo(() => {
    const m = new Map<string, Agendamento[]>();
    itens.forEach((a) => {
      const k = chaveDia(a.inicio);
      m.set(k, [...(m.get(k) ?? []), a]);
    });
    return m;
  }, [itens]);

  return (
    <div>
      {/* Faixa dos 7 dias */}
      <div className="grid grid-cols-7 gap-1 mb-5">
        {dias.map((d) => {
          const qtd = (porDia.get(chaveDia(d)) ?? []).filter(
            (a) => a.status === "programada"
          ).length;
          const hoje = ehHoje(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onDia(d)}
              className={`rounded-xl border py-2 flex flex-col items-center gap-1 transition ${
                hoje
                  ? "border-[#ec1313] bg-[#1a0a0a]"
                  : "border-[#1f1f1f] bg-[#111] hover:border-[#333]"
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-[#7a7a7a]">
                {DIAS_SEMANA[d.getDay()]}
              </span>
              <span className={`text-sm font-bold ${hoje ? "text-[#ec1313]" : ""}`}>
                {d.getDate()}
              </span>
              <span className="h-1.5 flex items-center gap-0.5">
                {qtd > 0 &&
                  Array.from({ length: Math.min(qtd, 3) }, (_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-[#3b82f6]" />
                  ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista agrupada por dia */}
      {itens.length === 0 ? (
        <Vazio
          titulo="Semana sem visitas programadas"
          texto="Use o botão Agendar visita para montar sua semana."
        />
      ) : (
        <div className="space-y-5">
          {dias
            .filter((d) => (porDia.get(chaveDia(d)) ?? []).length > 0)
            .map((d) => (
              <section key={d.toISOString()}>
                <button
                  onClick={() => onDia(d)}
                  className="flex items-center gap-2 mb-2 group"
                >
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      ehHoje(d) ? "text-[#ec1313]" : "text-[#8a8a8a]"
                    }`}
                  >
                    {fmtDiaExtenso(d)}
                  </span>
                  <Icon
                    name="chevron_right"
                    size={14}
                    className="text-[#5a5a5a] group-hover:text-white"
                  />
                </button>
                <div className="space-y-2.5">
                  {(porDia.get(chaveDia(d)) ?? []).map((a) => (
                    <CardAgendamento
                      key={a.id}
                      ag={a}
                      onClick={() => onAbrir(a.id)}
                      mostrarHora
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}

// ==========================================================
// VISÃO: MÊS
// ==========================================================
function VisaoMes({
  ref_,
  itens,
  onDia,
}: {
  ref_: Date;
  itens: Agendamento[];
  onDia: (d: Date) => void;
}) {
  const grade = useMemo(() => gradeDoMes(ref_), [ref_]);
  const porDia = useMemo(() => {
    const m = new Map<string, Agendamento[]>();
    itens.forEach((a) => {
      const k = chaveDia(a.inicio);
      m.set(k, [...(m.get(k) ?? []), a]);
    });
    return m;
  }, [itens]);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map((d) => (
          <span
            key={d}
            className="text-[10px] font-bold uppercase text-[#5a5a5a] text-center py-1"
          >
            {d.charAt(0)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grade.map((d) => {
          const doMes = d.getMonth() === ref_.getMonth();
          const lista = (porDia.get(chaveDia(d)) ?? []).filter(
            (a) => a.status === "programada"
          );
          const hoje = ehHoje(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onDia(d)}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 transition ${
                hoje
                  ? "border-[#ec1313] bg-[#1a0a0a]"
                  : doMes
                    ? "border-[#1c1c1c] bg-[#0f0f0f] hover:border-[#333]"
                    : "border-transparent bg-transparent"
              }`}
            >
              <span
                className={`text-[13px] font-bold ${
                  hoje ? "text-[#ec1313]" : doMes ? "text-white" : "text-[#3a3a3a]"
                }`}
              >
                {d.getDate()}
              </span>
              <span className="h-1.5 flex items-center gap-0.5">
                {lista.slice(0, 3).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-[#3b82f6]" />
                ))}
                {lista.length > 3 && (
                  <span className="text-[8px] text-[#3b82f6] font-bold leading-none">
                    +
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-[#1f1f1f] bg-[#111] p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
          Resumo do mês
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {(["programada", "realizada", "cancelada"] as const).map((s) => (
            <div key={s}>
              <p className="text-xl font-bold" style={{ color: STATUS_AGENDA[s].cor }}>
                {itens.filter((a) => a.status === s).length}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#7a7a7a]">
                {STATUS_AGENDA[s].label}s
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// CARD DE AGENDAMENTO
// ==========================================================
function CardAgendamento({
  ag,
  onClick,
  mostrarHora,
}: {
  ag: Agendamento;
  onClick: () => void;
  mostrarHora?: boolean;
}) {
  const { imobiliariaPorId, totalVisitasDe } = useVisitas();
  const imob = imobiliariaPorId(ag.imobiliariaId);
  const atrasada = ag.status === "programada" && new Date(ag.inicio) < new Date();
  const cor = STATUS_AGENDA[ag.status].cor;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex gap-3 rounded-xl border border-[#1f1f1f] bg-[#111] hover:border-[#333] p-3 transition"
    >
      {mostrarHora && (
        <div className="flex flex-col items-center shrink-0 w-12">
          <span className="text-sm font-bold tabular-nums">{fmtHora(ag.inicio)}</span>
          <span className="text-[10px] text-[#6a6a6a]">{ag.duracaoMin}min</span>
        </div>
      )}
      <div className="w-0.5 rounded-full shrink-0" style={{ background: cor }} />
      <div className="flex-1 min-w-0">
        {imob ? (
          <NomeImobiliaria
            nome={imob.nome}
            visitas={totalVisitasDe(imob.id)}
            className="text-sm font-bold"
            tamanho="sm"
          />
        ) : (
          <p className="text-sm font-bold truncate">Imobiliária removida</p>
        )}
        <p className="text-[12px] text-[#9a9a9a] truncate">{ag.motivo}</p>
        {imob?.endereco && (
          <p className="text-[11px] text-[#6a6a6a] truncate mt-0.5 flex items-center gap-1">
            <Icon name="location_on" size={12} />
            {imob.endereco}
          </p>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {ag.status !== "programada" ? (
          <Badge cor={cor}>{STATUS_AGENDA[ag.status].label}</Badge>
        ) : atrasada ? (
          <Badge cor="#ffc300">Atrasada</Badge>
        ) : (
          <Icon name="chevron_right" size={18} className="text-[#4a4a4a]" />
        )}
      </div>
    </button>
  );
}

// ==========================================================
// ESTADO VAZIO
// ==========================================================
function Vazio({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#1c1c1c] bg-[#0d0d0d] p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#161616] flex items-center justify-center mx-auto mb-3">
        <Icon name="event_available" size={24} className="text-[#5a5a5a]" />
      </div>
      <p className="text-sm font-bold mb-1">{titulo}</p>
      <p className="text-[13px] text-[#7a7a7a] leading-relaxed mb-4">{texto}</p>
      {acao && (
        <Botao variante="secundario" icone="add" onClick={acao}>
          Agendar visita
        </Botao>
      )}
    </div>
  );
}
