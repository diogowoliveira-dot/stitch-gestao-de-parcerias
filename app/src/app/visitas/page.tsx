"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import MapaVisitas, {
  type MapaApi,
  type PontoMapa,
} from "@/components/visitas/MapaVisitas";
import ItemVisita from "@/components/visitas/ItemVisita";
import NavInferior from "@/components/visitas/NavInferior";
import SheetImobiliaria from "@/components/visitas/SheetImobiliaria";
import SheetAgendamento from "@/components/visitas/SheetAgendamento";
import SeletorMotivo from "@/components/visitas/SeletorMotivo";
import SheetEditarVisita from "@/components/visitas/SheetEditarVisita";
import SheetImportar from "@/components/visitas/SheetImportar";
import {
  Badge,
  Botao,
  Campo,
  Icon,
  Info,
  NomeImobiliaria,
  Sheet,
  Toast,
} from "@/components/visitas/ui";
import { useVisitas } from "@/lib/visitas-context";
import { enviarConviteAgenda } from "@/lib/visitas-convite";
import {
  cronometro,
  distanciaMetros,
  fimDoDia,
  fmtData,
  fmtDataHora,
  fmtDiaExtenso,
  fmtHora,
  inicioDoDia,
  lerPosicao,
  statusPorUltimaVisita,
  STATUS_INFO,

  type Agendamento,
  type Coords,
} from "@/lib/visitas-types";

// Fallback de centro: Florianópolis/SC (usado até o GPS responder)
const CENTRO_PADRAO = { lat: -27.5954, lng: -48.548 };

/** Raio em metros para considerar que o clique caiu sobre uma imobiliária já cadastrada */
const RAIO_DUPLICATA = 45;

type SheetState =
  | { tipo: "detalhe"; imobId: string }
  | { tipo: "novo" }
  | { tipo: "editar"; imobId: string }
  | { tipo: "checkin"; imobId: string; agendamentoId?: string | null }
  | { tipo: "checkout"; visitaId: string }
  | { tipo: "historico"; imobId: string }
  | { tipo: "editarVisita"; visitaId: string; imobId: string }
  | { tipo: "agendar"; imobId: string }
  | null;

export default function PaginaVisitas() {
  return (
    <Suspense fallback={<div className="w-full h-dvh bg-black" />}>
      <MapaScreen />
    </Suspense>
  );
}

function MapaScreen() {
  const {
    imobiliarias,
    visitas,
    agendamentos,
    carregado,
    visitaAberta,
    addImobiliaria,
    updateImobiliaria,
    removeImobiliaria,
    addAgendamento,
    checkIn,
    checkOut,
    visitasDe,
    totalVisitasDe,
    ultimaVisitaDe,
    imobiliariaPorId,
    proximoAgendamentoDe,
    agendamentosDoDia,
    perfil,
    seedDemo,
  } = useVisitas();

  const params = useSearchParams();
  const focoInicial = params.get("focus");
  const checkinDeAgenda = params.get("checkin");

  const mapa = useRef<MapaApi | null>(null);
  const [minhaPos, setMinhaPos] = useState<Coords | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [semGps, setSemGps] = useState(false);
  const [pinNovo, setPinNovo] = useState<{ lat: number; lng: number } | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "sucesso" } | null>(null);
  const [importando, setImportando] = useState(false);

  const avisar = useCallback(
    (msg: string, tipo: "info" | "erro" | "sucesso" = "info") => {
      setToast({ msg, tipo });
      window.setTimeout(() => setToast(null), 3600);
    },
    []
  );

  // ——— GPS ———
  const localizar = useCallback(
    async (voar = true, silencioso = false) => {
      setBuscandoGps(true);
      try {
        const pos = await lerPosicao();
        setMinhaPos(pos);
        setSemGps(false);
        if (voar) mapa.current?.irPara(pos.lat, pos.lng, 16);
        return pos;
      } catch (e) {
        setSemGps(true);
        if (!silencioso) avisar((e as Error).message, "erro");
        return null;
      } finally {
        setBuscandoGps(false);
      }
    },
    [avisar]
  );

  // Ao abrir o sistema: mapa + localização atual (sem toast se o GPS estiver bloqueado)
  useEffect(() => {
    localizar(true, true);
  }, [localizar]);

  // Entradas vindas da agenda: ?focus=<imob> ou ?checkin=<agendamento>
  const entradaAplicada = useRef(false);
  useEffect(() => {
    if (!carregado || entradaAplicada.current) return;

    if (checkinDeAgenda) {
      const ag = agendamentos.find((a) => a.id === checkinDeAgenda);
      if (!ag) return;
      entradaAplicada.current = true;
      const imob = imobiliarias.find((i) => i.id === ag.imobiliariaId);
      if (imob) mapa.current?.irPara(imob.lat, imob.lng, 17);
      setSheet({ tipo: "checkin", imobId: ag.imobiliariaId, agendamentoId: ag.id });
      return;
    }

    if (focoInicial) {
      const imob = imobiliarias.find((i) => i.id === focoInicial);
      if (!imob) return;
      entradaAplicada.current = true;
      setTimeout(() => {
        mapa.current?.irPara(imob.lat, imob.lng, 17);
        setSheet({ tipo: "detalhe", imobId: imob.id });
      }, 400);
    }
  }, [carregado, focoInicial, checkinDeAgenda, imobiliarias, agendamentos]);

  // ——— Pontos do mapa ———
  const pontos: PontoMapa[] = useMemo(
    () =>
      imobiliarias.map((i) => {
        const ultima = ultimaVisitaDe(i.id);
        const emVisita = visitaAberta?.imobiliariaId === i.id;
        const status = statusPorUltimaVisita(ultima?.checkIn ?? null, emVisita);
        return {
          id: i.id,
          lat: i.lat,
          lng: i.lng,
          nome: i.nome,
          cor: STATUS_INFO[status].cor,
          rotulo: emVisita
            ? "visita em andamento"
            : ultima
              ? `últ. visita ${fmtData(ultima.checkIn)}`
              : "nunca visitada",
          visitas: totalVisitasDe(i.id),
          emVisita,
        };
      }),
    [imobiliarias, ultimaVisitaDe, totalVisitasDe, visitaAberta]
  );

  // ——— Clique no mapa: cadastrar aqui, ou abrir a imobiliária existente ———
  const aoClicarMapa = useCallback(
    (lat: number, lng: number) => {
      if (sheet) return; // não cria pin com um painel aberto
      const proxima = imobiliarias.find(
        (i) => distanciaMetros(lat, lng, i.lat, i.lng) <= RAIO_DUPLICATA
      );
      if (proxima) {
        setSheet({ tipo: "detalhe", imobId: proxima.id });
        return;
      }
      setPinNovo({ lat, lng });
      setSheet({ tipo: "novo" });
    },
    [imobiliarias, sheet]
  );

  const cadastrarNaMinhaPosicao = useCallback(async () => {
    const pos = minhaPos ?? (await localizar(true, true));
    // Sem GPS o cadastro continua possível: o pin nasce no centro do mapa e o
    // executivo arrasta até a porta da imobiliária.
    const alvo = pos ?? mapa.current?.centro() ?? CENTRO_PADRAO;

    const proxima = imobiliarias.find(
      (i) => distanciaMetros(alvo.lat, alvo.lng, i.lat, i.lng) <= RAIO_DUPLICATA
    );
    if (proxima) {
      avisar(`"${proxima.nome}" já está cadastrada neste endereço.`, "info");
      mapa.current?.irPara(proxima.lat, proxima.lng, 17);
      setSheet({ tipo: "detalhe", imobId: proxima.id });
      return;
    }

    if (pos) {
      mapa.current?.irPara(pos.lat, pos.lng, 17);
    } else {
      avisar("Sem GPS: arraste o pin até o local exato.", "info");
    }
    setPinNovo({ lat: alvo.lat, lng: alvo.lng });
    setSheet({ tipo: "novo" });
  }, [minhaPos, localizar, imobiliarias, avisar]);

  const fecharSheet = useCallback(() => {
    setSheet(null);
    setPinNovo(null);
  }, []);

  // ——— Estatísticas do topo ———
  const stats = useMemo(() => {
    const hoje = new Date().toDateString();
    return {
      imobiliarias: imobiliarias.length,
      visitas: visitas.length,
      hoje: visitas.filter((v) => new Date(v.checkIn).toDateString() === hoje).length,
    };
  }, [imobiliarias, visitas]);

  const agendaHoje = useMemo(
    () => agendamentosDoDia(new Date()).filter((a) => a.status === "programada"),
    [agendamentosDoDia]
  );

  const imobAtiva = visitaAberta ? imobiliariaPorId(visitaAberta.imobiliariaId) : null;
  const mostrarVazio = carregado && imobiliarias.length === 0 && !sheet;
  const mostrarBanner = !!visitaAberta && !!imobAtiva && !sheet;

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      <MapaVisitas
        pontos={pontos}
        minhaPos={minhaPos}
        pinProvisorio={pinNovo}
        centroInicial={CENTRO_PADRAO}
        zoomInicial={13}
        modoAdicionar={sheet?.tipo === "novo"}
        onMapClick={aoClicarMapa}
        onPontoClick={(id) => setSheet({ tipo: "detalhe", imobId: id })}
        onPinProvisorioMove={(lat, lng) => setPinNovo({ lat, lng })}
        apiRef={mapa}
      />

      {/* ——— Barra superior ——— */}
      <header className="absolute top-0 left-0 right-0 z-[900] p-3 pointer-events-none">
        <div className="pointer-events-auto bg-[#0a0a0a]/92 backdrop-blur-md border border-[#222] rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_6px_24px_rgba(0,0,0,0.6)]">
          <div className="w-9 h-9 rounded-xl bg-[#ec1313] flex items-center justify-center shrink-0">
            <Icon name="location_on" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold leading-tight">Registro de Visitas</h1>
            <p className="text-[11px] text-[#7a7a7a] leading-tight">
              {stats.imobiliarias} imobiliárias · {stats.visitas} visitas · {stats.hoje} hoje
            </p>
          </div>
        </div>

        {semGps && (
          <div className="pointer-events-auto mt-2 bg-[#1a1608]/95 backdrop-blur-md border border-[#3d3210] rounded-xl px-3 py-2 flex items-start gap-2">
            <Icon name="gps_off" size={15} className="text-[#ffc300] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#d6c68a] leading-relaxed">
              Localização bloqueada no navegador. Dá para usar tudo assim mesmo —{" "}
              <strong className="text-white">toque no mapa</strong> para marcar o local.
              Libere o GPS para registrar a distância no check-in.
            </p>
          </div>
        )}

        {/* Legenda */}
        <div className="pointer-events-auto mt-2 flex flex-wrap gap-1.5">
          {(["recente", "atencao", "fria", "nunca"] as const).map((s) => (
            <span
              key={s}
              className="flex items-center gap-1.5 bg-[#0a0a0a]/92 backdrop-blur-md border border-[#222] rounded-lg px-2 py-1 text-[10px] font-semibold text-[#a0a0a0]"
              title={STATUS_INFO[s].descricao}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: STATUS_INFO[s].cor }}
              />
              {STATUS_INFO[s].label}
            </span>
          ))}
        </div>
      </header>

      {/* ——— Ações flutuantes ——— */}
      <div
        className={`absolute right-3 z-[900] flex flex-col gap-2.5 items-end transition-all ${
          mostrarVazio
            ? "bottom-[296px]"
            : mostrarBanner
              ? "bottom-[172px]"
              : "bottom-[132px]"
        }`}
      >
        <button
          onClick={() => localizar(true)}
          aria-label="Centralizar na minha localização"
          className="w-12 h-12 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,0,0,0.7)] hover:bg-[#1f1f1f] transition"
        >
          <Icon
            name={buscandoGps ? "progress_activity" : "my_location"}
            size={22}
            className={buscandoGps ? "animate-spin" : ""}
          />
        </button>
        <button
          onClick={cadastrarNaMinhaPosicao}
          className="h-12 pl-4 pr-5 rounded-full bg-[#ec1313] hover:bg-[#d40000] flex items-center gap-2 text-white text-sm font-bold shadow-[0_4px_20px_rgba(236,19,19,0.4)] transition"
        >
          <Icon name="add_location_alt" size={20} />
          Nova imobiliária
        </button>
      </div>

      {/* ——— Dica de uso / estado vazio ——— */}
      {mostrarVazio && (
        <div className="absolute left-3 right-3 bottom-[76px] z-[900]">
          <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-[#222] rounded-2xl p-4 shadow-[0_6px_24px_rgba(0,0,0,0.7)]">
            <p className="text-sm font-bold mb-1">Nenhuma imobiliária no mapa</p>
            <p className="text-[13px] text-[#8a8a8a] leading-relaxed mb-3">
              Toque em qualquer ponto do mapa para cadastrar uma imobiliária ali, ou
              use <span className="text-white font-semibold">Nova imobiliária</span>{" "}
              para cadastrar na sua posição atual.
            </p>
            <div className="grid grid-cols-1 gap-2">
              <Botao
                variante="secundario"
                icone="upload_file"
                onClick={() => setImportando(true)}
              >
                Importar lista de imobiliárias
              </Botao>
              <Botao
                variante="fantasma"
                icone="science"
                onClick={() => {
                  const c = mapa.current?.centro() ?? CENTRO_PADRAO;
                  seedDemo(c.lat, c.lng);
                  avisar("Dados de demonstração criados ao seu redor.", "sucesso");
                }}
              >
                Carregar dados de demonstração
              </Botao>
            </div>
          </div>
        </div>
      )}

      {/* ——— Banner de visita em andamento ——— */}
      {mostrarBanner && visitaAberta && imobAtiva && (
        <BannerVisitaAberta
          nome={imobAtiva.nome}
          visitas={visitasDe(imobAtiva.id).length}
          inicio={visitaAberta.checkIn}
          motivo={visitaAberta.motivo}
          onCheckout={() => setSheet({ tipo: "checkout", visitaId: visitaAberta.id })}
        />
      )}

      <NavInferior badgeAgenda={agendaHoje.length} />

      {/* ——————————————— SHEETS ——————————————— */}

      {sheet?.tipo === "novo" && pinNovo && (
        <SheetImobiliaria
          pin={pinNovo}
          acaoDestaque="checkin"
          onCancelar={fecharSheet}
          onSalvar={(dados, acao) => {
            const id = addImobiliaria({ ...dados, lat: pinNovo.lat, lng: pinNovo.lng });
            setPinNovo(null);
            if (acao === "checkin") {
              setSheet({ tipo: "checkin", imobId: id });
            } else {
              setSheet(null);
              avisar(`"${dados.nome}" cadastrada.`, "sucesso");
            }
          }}
        />
      )}

      {sheet?.tipo === "editar" &&
        (() => {
          const imob = imobiliariaPorId(sheet.imobId);
          if (!imob) return null;
          return (
            <SheetImobiliaria
              modoEdicao
              inicial={{
                nome: imob.nome,
                endereco: imob.endereco,
                responsavel: imob.responsavel,
              }}
              pin={{ lat: imob.lat, lng: imob.lng }}
              onCancelar={() => setSheet({ tipo: "detalhe", imobId: imob.id })}
              onSalvar={(dados) => {
                updateImobiliaria(imob.id, dados);
                setSheet({ tipo: "detalhe", imobId: imob.id });
                avisar("Cadastro atualizado.", "sucesso");
              }}
            />
          );
        })()}

      {sheet?.tipo === "detalhe" && (
        <SheetDetalhe
          imobId={sheet.imobId}
          onFechar={fecharSheet}
          onCheckin={() => {
            if (visitaAberta) {
              avisar(
                `Faça o check-out em "${imobAtiva?.nome}" antes de iniciar outra visita.`,
                "erro"
              );
              setSheet({ tipo: "checkout", visitaId: visitaAberta.id });
              return;
            }
            const ag = proximoAgendamentoDe(sheet.imobId);
            const hoje =
              ag &&
              new Date(ag.inicio) >= inicioDoDia(new Date()) &&
              new Date(ag.inicio) <= fimDoDia(new Date());
            setSheet({
              tipo: "checkin",
              imobId: sheet.imobId,
              agendamentoId: hoje ? ag!.id : null,
            });
          }}
          onCheckout={() =>
            visitaAberta && setSheet({ tipo: "checkout", visitaId: visitaAberta.id })
          }
          onHistorico={() => setSheet({ tipo: "historico", imobId: sheet.imobId })}
          onEditar={() => setSheet({ tipo: "editar", imobId: sheet.imobId })}
          onAgendar={() => setSheet({ tipo: "agendar", imobId: sheet.imobId })}
          onExcluir={() => {
            const nome = imobiliariaPorId(sheet.imobId)?.nome ?? "";
            removeImobiliaria(sheet.imobId);
            fecharSheet();
            avisar(`"${nome}" e seu histórico foram removidos.`, "info");
          }}
          emVisita={visitaAberta?.imobiliariaId === sheet.imobId}
        />
      )}

      {sheet?.tipo === "agendar" && (
        <SheetAgendamento
          imobiliarias={imobiliarias}
          imobIdInicial={sheet.imobId}
          onCancelar={() => setSheet({ tipo: "detalhe", imobId: sheet.imobId })}
          onNovaImobiliaria={() => {
            setSheet(null);
            avisar("Toque no mapa para marcar o local da nova imobiliária.", "info");
          }}
          onSalvar={async (dados, enviarConvite) => {
            const id = addAgendamento(dados);
            setSheet(null);
            avisar(`Visita agendada para ${fmtDataHora(dados.inicio)}.`, "sucesso");

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

      {sheet?.tipo === "checkin" && (
        <SheetCheckin
          imobId={sheet.imobId}
          agendamento={
            sheet.agendamentoId
              ? agendamentos.find((a) => a.id === sheet.agendamentoId) ?? null
              : null
          }
          onCancelar={() => setSheet({ tipo: "detalhe", imobId: sheet.imobId })}
          onConfirmar={(motivo, obs, coords, agendamentoId) => {
            checkIn(sheet.imobId, motivo, obs, coords, agendamentoId);
            setSheet(null);
            avisar("Check-in registrado. Bom trabalho!", "sucesso");
          }}
        />
      )}

      {sheet?.tipo === "checkout" && (
        <SheetCheckout
          visitaId={sheet.visitaId}
          onCancelar={() => setSheet(null)}
          onConfirmar={(coords) => {
            checkOut(sheet.visitaId, coords);
            setSheet(null);
            avisar("Check-out registrado.", "sucesso");
          }}
        />
      )}

      {sheet?.tipo === "editarVisita" && (
        <SheetEditarVisita
          visitaId={sheet.visitaId}
          onFechar={() => setSheet({ tipo: "historico", imobId: sheet.imobId })}
          onSalvo={() => avisar("Visita atualizada.", "sucesso")}
        />
      )}

      {sheet?.tipo === "historico" && (
        <SheetHistorico
          imobId={sheet.imobId}
          onFechar={() => setSheet({ tipo: "detalhe", imobId: sheet.imobId })}
        />
      )}

      {importando && (
        <SheetImportar
          perto={minhaPos}
          onFechar={() => setImportando(false)}
          onConcluir={(qtd) => {
            setImportando(false);
            avisar(
              qtd === 0
                ? "Nenhuma imobiliária importada."
                : `${qtd} ${qtd === 1 ? "imobiliária importada" : "imobiliárias importadas"}.`,
              qtd === 0 ? "info" : "sucesso"
            );
          }}
        />
      )}

      {toast && <Toast mensagem={toast.msg} tipo={toast.tipo} />}
    </div>
  );

  // ==========================================================
  // SUBCOMPONENTES QUE USAM O CONTEXTO DA TELA
  // ==========================================================

  function SheetDetalhe({
    imobId,
    onFechar,
    onCheckin,
    onCheckout,
    onHistorico,
    onEditar,
    onAgendar,
    onExcluir,
    emVisita,
  }: {
    imobId: string;
    onFechar: () => void;
    onCheckin: () => void;
    onCheckout: () => void;
    onHistorico: () => void;
    onEditar: () => void;
    onAgendar: () => void;
    onExcluir: () => void;
    emVisita: boolean;
  }) {
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
    const imob = imobiliariaPorId(imobId);
    if (!imob) return null;

    const lista = visitasDe(imobId);
    const ultima = lista[0] ?? null;
    const proxima = proximoAgendamentoDe(imobId);
    const status = statusPorUltimaVisita(ultima?.checkIn ?? null, emVisita);
    const info = STATUS_INFO[status];
    const dist = minhaPos
      ? distanciaMetros(minhaPos.lat, minhaPos.lng, imob.lat, imob.lng)
      : null;

    return (
      <Sheet
        aberto
        onFechar={onFechar}
        titulo={<NomeImobiliaria nome={imob.nome} visitas={lista.length} />}
        subtitulo={
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge cor={info.cor} pulsando={emVisita}>
              {info.label}
            </Badge>
            <span className="text-[#7a7a7a] text-xs">
              {lista.length} {lista.length === 1 ? "visita" : "visitas"}
            </span>
            {dist !== null && (
              <span className="text-[#7a7a7a] text-xs">
                · {dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${dist} m`} de você
              </span>
            )}
          </div>
        }
        rodape={
          <div className="flex flex-col gap-2">
            {emVisita ? (
              <Botao full variante="sucesso" icone="logout" onClick={onCheckout}>
                Fazer check-out
              </Botao>
            ) : (
              <Botao full variante="primario" icone="how_to_reg" onClick={onCheckin}>
                Fazer check-in
              </Botao>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Botao variante="secundario" icone="event_available" onClick={onAgendar}>
                Agendar
              </Botao>
              <Botao variante="secundario" icone="history" onClick={onHistorico}>
                Histórico
              </Botao>
              <Botao variante="secundario" icone="edit" onClick={onEditar}>
                Editar
              </Botao>
              {confirmandoExclusao ? (
                <Botao variante="perigo" icone="delete_forever" onClick={onExcluir}>
                  Confirmar
                </Botao>
              ) : (
                <Botao
                  variante="perigo"
                  icone="delete"
                  onClick={() => setConfirmandoExclusao(true)}
                >
                  Excluir
                </Botao>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-1">
          <Info icone="person">{imob.responsavel.nome || "—"}</Info>
          {imob.responsavel.telefone && (
            <Info
              icone="call"
              href={`tel:${imob.responsavel.telefone.replace(/\D/g, "")}`}
            >
              {imob.responsavel.telefone}
            </Info>
          )}
          {imob.responsavel.email && (
            <Info icone="mail" href={`mailto:${imob.responsavel.email}`}>
              {imob.responsavel.email}
            </Info>
          )}
          {imob.endereco && <Info icone="location_on">{imob.endereco}</Info>}
          <Info icone="explore">
            {imob.lat.toFixed(5)}, {imob.lng.toFixed(5)}
          </Info>
        </div>

        {proxima && (
          <div className="mt-4 rounded-xl border border-[#1e3a5f] bg-[#0e1a2b] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#60a5fa] mb-1 flex items-center gap-1.5">
              <Icon name="event_upcoming" size={14} /> Próxima visita programada
            </p>
            <p className="text-sm font-bold">
              {fmtDiaExtenso(proxima.inicio)} às {fmtHora(proxima.inicio)}
            </p>
            <p className="text-[12px] text-[#9a9a9a]">{proxima.motivo}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
          {ultima ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
                Última visita
              </p>
              <ItemVisita visita={ultima} />
            </>
          ) : (
            <p className="text-sm text-[#7a7a7a]">
              Nenhuma visita registrada nesta imobiliária ainda.
            </p>
          )}
        </div>
      </Sheet>
    );
  }

  function SheetCheckin({
    imobId,
    agendamento,
    onCancelar,
    onConfirmar,
  }: {
    imobId: string;
    agendamento: Agendamento | null;
    onCancelar: () => void;
    onConfirmar: (
      motivo: string,
      obs: string,
      coords: Coords | null,
      agendamentoId: string | null
    ) => void;
  }) {
    const imob = imobiliariaPorId(imobId);
    const [motivo, setMotivo] = useState<string>(agendamento?.motivo ?? "");
    const [obs, setObs] = useState(agendamento?.observacao ?? "");
    const [coords, setCoords] = useState<Coords | null>(minhaPos);
    const [gpsStatus, setGpsStatus] = useState<"buscando" | "ok" | "erro">(
      minhaPos ? "ok" : "buscando"
    );
    const [gpsMsg, setGpsMsg] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Confirma a posição no momento do check-in
    useEffect(() => {
      let vivo = true;
      setGpsStatus("buscando");
      lerPosicao()
        .then((p) => {
          if (!vivo) return;
          setCoords(p);
          setMinhaPos(p);
          setGpsStatus("ok");
        })
        .catch((e: Error) => {
          if (!vivo) return;
          setGpsStatus("erro");
          setGpsMsg(e.message);
        });
      return () => {
        vivo = false;
      };
    }, []);

    if (!imob) return null;

    const distancia =
      coords && distanciaMetros(coords.lat, coords.lng, imob.lat, imob.lng);
    const motivoFinal = motivo.trim();
    const podeConfirmar = motivoFinal.length > 0 && !salvando;

    return (
      <Sheet
        aberto
        onFechar={onCancelar}
        titulo="Check-in"
        subtitulo={
          <NomeImobiliaria nome={imob.nome} visitas={visitasDe(imobId).length} tamanho="sm" />
        }
        rodape={
          <Botao
            full
            variante="primario"
            icone="how_to_reg"
            disabled={!podeConfirmar}
            onClick={() => {
              setSalvando(true);
              onConfirmar(motivoFinal, obs.trim(), coords, agendamento?.id ?? null);
            }}
          >
            Confirmar check-in
          </Botao>
        }
      >
        {agendamento && (
          <div className="rounded-xl border border-[#1e3a5f] bg-[#0e1a2b] p-3 mb-4 flex items-start gap-2.5">
            <Icon name="event_available" size={18} className="text-[#60a5fa] mt-0.5" />
            <p className="text-[13px] text-[#cfe3ff] leading-relaxed">
              Check-in referente à visita programada para{" "}
              <strong>{fmtHora(agendamento.inicio)}</strong>. Ao confirmar, o
              agendamento será marcado como realizado.
            </p>
          </div>
        )}

        {/* Situação do GPS */}
        <div className="rounded-xl border border-[#222] bg-[#111] p-3 mb-4 flex items-start gap-2.5">
          <Icon
            name={
              gpsStatus === "ok"
                ? "gps_fixed"
                : gpsStatus === "buscando"
                  ? "gps_not_fixed"
                  : "gps_off"
            }
            size={18}
            className={
              gpsStatus === "ok"
                ? "text-[#00c29f] mt-0.5"
                : gpsStatus === "buscando"
                  ? "text-[#ffc300] mt-0.5 animate-pulse-dot"
                  : "text-[#ef4444] mt-0.5"
            }
          />
          <div className="text-[13px] leading-relaxed">
            {gpsStatus === "buscando" && (
              <span className="text-[#c0c0c0]">Confirmando sua localização…</span>
            )}
            {gpsStatus === "ok" && coords && (
              <span className="text-[#c0c0c0]">
                Localização confirmada
                {coords.precisao ? ` · precisão ${Math.round(coords.precisao)} m` : ""}
                {distancia !== null && (
                  <>
                    {" · "}
                    <strong
                      className={
                        distancia <= 150 ? "text-[#00c29f]" : "text-[#ffc300]"
                      }
                    >
                      {distancia} m do pin
                    </strong>
                  </>
                )}
              </span>
            )}
            {gpsStatus === "erro" && (
              <span className="text-[#fca5a5]">
                {gpsMsg} O check-in será registrado sem coordenadas.
              </span>
            )}
            <div className="text-[11px] text-[#6a6a6a] mt-0.5">
              Entrada: {fmtDataHora(new Date().toISOString())}
            </div>
          </div>
        </div>

        <SeletorMotivo valor={motivo} onChange={setMotivo} />

        <Campo
          label="Observações"
          valor={obs}
          onChange={setObs}
          placeholder="O que será tratado nesta visita? (opcional)"
          multiline
        />
      </Sheet>
    );
  }

  function SheetCheckout({
    visitaId,
    onCancelar,
    onConfirmar,
  }: {
    visitaId: string;
    onCancelar: () => void;
    onConfirmar: (coords: Coords | null) => void;
  }) {
    const visita = visitas.find((v) => v.id === visitaId);
    const imob = visita ? imobiliariaPorId(visita.imobiliariaId) : null;
    const [coords, setCoords] = useState<Coords | null>(minhaPos);
    const [agora, setAgora] = useState(() => Date.now());
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
      const t = window.setInterval(() => setAgora(Date.now()), 1000);
      return () => window.clearInterval(t);
    }, []);

    useEffect(() => {
      let vivo = true;
      lerPosicao()
        .then((p) => {
          if (!vivo) return;
          setCoords(p);
          setMinhaPos(p);
        })
        .catch(() => {});
      return () => {
        vivo = false;
      };
    }, []);

    if (!visita || !imob) return null;

    const decorrido = agora - new Date(visita.checkIn).getTime();

    return (
      <Sheet
        aberto
        onFechar={onCancelar}
        titulo="Check-out"
        subtitulo={
          <NomeImobiliaria
            nome={imob.nome}
            visitas={visitasDe(imob.id).length}
            tamanho="sm"
          />
        }
        rodape={
          <Botao
            full
            variante="sucesso"
            icone="logout"
            disabled={salvando}
            onClick={() => {
              setSalvando(true);
              onConfirmar(coords);
            }}
          >
            Confirmar saída
          </Botao>
        }
      >
        <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-center mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">
            Tempo em visita
          </p>
          <p className="text-3xl font-bold tabular-nums mt-1">{cronometro(decorrido)}</p>
        </div>

        <div className="space-y-1">
          <Info icone="login">Entrada: {fmtDataHora(visita.checkIn)}</Info>
          <Info icone="logout">
            Saída: {fmtDataHora(new Date().toISOString())} (agora)
          </Info>
          <Info icone="flag">Motivo: {visita.motivo}</Info>
          {visita.observacao && <Info icone="notes">{visita.observacao}</Info>}
          <Info icone={coords ? "gps_fixed" : "gps_off"}>
            {coords
              ? `Saída registrada em ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
              : "Sem coordenadas de saída (GPS indisponível)"}
          </Info>
        </div>
      </Sheet>
    );
  }

  function SheetHistorico({
    imobId,
    onFechar,
  }: {
    imobId: string;
    onFechar: () => void;
  }) {
    const imob = imobiliariaPorId(imobId);
    const lista = visitasDe(imobId);
    if (!imob) return null;

    return (
      <Sheet
        aberto
        onFechar={onFechar}
        titulo="Histórico de visitas"
        subtitulo={<NomeImobiliaria nome={imob.nome} visitas={lista.length} tamanho="sm" />}
      >
        {lista.length === 0 ? (
          <p className="text-sm text-[#7a7a7a]">Nenhuma visita registrada.</p>
        ) : (
          <div className="space-y-2.5">
            {lista.map((v) => (
              <ItemVisita
                key={v.id}
                visita={v}
                onEditar={() =>
                  setSheet({ tipo: "editarVisita", visitaId: v.id, imobId })
                }
              />
            ))}
          </div>
        )}
      </Sheet>
    );
  }
}

// ==========================================================
// BANNER DE VISITA EM ANDAMENTO
// ==========================================================
function BannerVisitaAberta({
  nome,
  visitas,
  inicio,
  motivo,
  onCheckout,
}: {
  nome: string;
  visitas: number;
  inicio: string;
  motivo: string;
  onCheckout: () => void;
}) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="absolute left-3 right-3 bottom-[76px] z-[950]">
      <div className="bg-[#0d0d0d]/96 backdrop-blur-md border border-[#1e3a5f] rounded-2xl p-3.5 flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] animate-pulse-dot shrink-0" />
        <div className="flex-1 min-w-0">
          <NomeImobiliaria
            nome={nome}
            visitas={visitas}
            className="text-[13px] font-bold"
            tamanho="sm"
          />
          <p className="text-[11px] text-[#8a8a8a] truncate">
            {motivo} · desde {fmtHora(inicio)}
          </p>
        </div>
        <span className="text-base font-bold tabular-nums text-[#3b82f6] shrink-0">
          {cronometro(agora - new Date(inicio).getTime())}
        </span>
        <button
          onClick={onCheckout}
          className="shrink-0 h-10 px-4 rounded-xl bg-[#00c29f] hover:bg-[#00a98b] text-black text-xs font-bold flex items-center gap-1.5 transition"
        >
          <Icon name="logout" size={16} />
          Check-out
        </button>
      </div>
    </div>
  );
}
