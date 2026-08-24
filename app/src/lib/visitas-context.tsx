"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  distanciaMetros,
  fimDoDia,
  inicioDoDia,
  MOTIVOS_PADRAO,
  PERFIL_VAZIO,
  type Agendamento,
  type Coords,
  type Imobiliaria,
  type Perfil,
  type Responsavel,
  type Visita,
} from "./visitas-types";

const STORAGE_KEY = "dwv_registro_visitas_v1";

// ============================================
// ESTADO PERSISTIDO
// ============================================

export interface VisitasState {
  imobiliarias: Imobiliaria[];
  visitas: Visita[];
  agendamentos: Agendamento[];
  perfil: Perfil;
  /** Motivos de visita disponíveis — editáveis pelo executivo */
  motivos: string[];
}

const VAZIO: VisitasState = {
  imobiliarias: [],
  visitas: [],
  agendamentos: [],
  perfil: { ...PERFIL_VAZIO },
  motivos: [...MOTIVOS_PADRAO],
};

function carregar(): VisitasState {
  if (typeof window === "undefined") return VAZIO;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return VAZIO;
    const p = JSON.parse(raw) as Partial<VisitasState>;
    return {
      imobiliarias: Array.isArray(p.imobiliarias) ? p.imobiliarias : [],
      visitas: Array.isArray(p.visitas) ? p.visitas : [],
      agendamentos: Array.isArray(p.agendamentos) ? p.agendamentos : [],
      perfil: { ...PERFIL_VAZIO, ...(p.perfil ?? {}) },
      motivos:
        Array.isArray(p.motivos) && p.motivos.length
          ? p.motivos
          : [...MOTIVOS_PADRAO],
    };
  } catch {
    return VAZIO;
  }
}

function salvar(state: VisitasState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota cheia / modo privado — o protótipo segue em memória */
  }
}

// ============================================
// CONTEXT
// ============================================

export interface NovaImobiliaria {
  nome: string;
  lat: number;
  lng: number;
  endereco: string;
  responsavel: Responsavel;
}

export interface NovoAgendamento {
  imobiliariaId: string;
  motivo: string;
  observacao: string;
  inicio: string;
  duracaoMin: number;
}

export interface VisitasContextType {
  imobiliarias: Imobiliaria[];
  visitas: Visita[];
  agendamentos: Agendamento[];
  perfil: Perfil;
  motivos: string[];
  carregado: boolean;
  sincronizando: boolean;

  visitaAberta: Visita | null;

  addImobiliaria: (data: NovaImobiliaria) => string;
  updateImobiliaria: (id: string, data: Partial<NovaImobiliaria>) => void;
  removeImobiliaria: (id: string) => void;

  checkIn: (
    imobiliariaId: string,
    motivo: string,
    observacao: string,
    coords: Coords | null,
    agendamentoId?: string | null
  ) => string;
  checkOut: (visitaId: string, coords: Coords | null) => void;
  updateVisita: (
    visitaId: string,
    data: { motivo?: string; observacao?: string }
  ) => void;
  removeVisita: (visitaId: string) => void;

  addAgendamento: (data: NovoAgendamento) => string;
  updateAgendamento: (id: string, data: Partial<NovoAgendamento>) => void;
  cancelarAgendamento: (id: string) => void;
  removeAgendamento: (id: string) => void;

  setPerfil: (p: Partial<Perfil>) => void;

  setMotivos: (lista: string[]) => void;
  /** Renomeia e leva o novo nome para o histórico e a agenda */
  renomearMotivo: (antigo: string, novo: string) => void;

  visitasDe: (imobiliariaId: string) => Visita[];
  totalVisitasDe: (imobiliariaId: string) => number;
  ultimaVisitaDe: (imobiliariaId: string) => Visita | null;
  imobiliariaPorId: (id: string) => Imobiliaria | undefined;
  agendamentosNoIntervalo: (de: Date, ate: Date) => Agendamento[];
  agendamentosDoDia: (dia: Date) => Agendamento[];
  proximoAgendamentoDe: (imobiliariaId: string) => Agendamento | null;

  seedDemo: (lat: number, lng: number) => void;
  limparTudo: () => void;
}

const Ctx = createContext<VisitasContextType | null>(null);

export function VisitasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VisitasState>(VAZIO);
  const [carregado, setCarregado] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  // Hidrata do localStorage só no cliente (evita divergência de SSR)
  useEffect(() => {
    setState(carregar());
    setCarregado(true);
  }, []);

  // Persiste a cada mudança
  useEffect(() => {
    if (carregado) salvar(state);
  }, [state, carregado]);

  // ——— Espelha a agenda no servidor para os e-mails automáticos ———
  const timerSync = useRef<number | null>(null);
  useEffect(() => {
    if (!carregado) return;
    const { perfil, agendamentos, imobiliarias } = state;
    if (!perfil.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email)) return;

    if (timerSync.current) window.clearTimeout(timerSync.current);
    timerSync.current = window.setTimeout(async () => {
      setSincronizando(true);
      try {
        const desde = inicioDoDia(new Date()).toISOString();
        await fetch("/api/visitas/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            perfil,
            // só o que interessa aos lembretes: agenda de hoje em diante
            agendamentos: agendamentos.filter(
              (a) => a.status === "programada" && a.inicio >= desde
            ),
            imobiliarias: imobiliarias.map((i) => ({
              id: i.id,
              nome: i.nome,
              endereco: i.endereco,
              lat: i.lat,
              lng: i.lng,
              responsavel: i.responsavel,
            })),
          }),
        });
      } catch {
        /* offline: o protótipo continua funcionando localmente */
      } finally {
        setSincronizando(false);
      }
    }, 1500);

    return () => {
      if (timerSync.current) window.clearTimeout(timerSync.current);
    };
  }, [state, carregado]);

  // ——— Imobiliárias ———
  const addImobiliaria = useCallback((data: NovaImobiliaria): string => {
    const id = `imob_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const nova: Imobiliaria = { ...data, id, criadaEm: new Date().toISOString() };
    setState((p) => ({ ...p, imobiliarias: [...p.imobiliarias, nova] }));
    return id;
  }, []);

  const updateImobiliaria = useCallback(
    (id: string, data: Partial<NovaImobiliaria>) => {
      setState((p) => ({
        ...p,
        imobiliarias: p.imobiliarias.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }));
    },
    []
  );

  const removeImobiliaria = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      imobiliarias: p.imobiliarias.filter((i) => i.id !== id),
      visitas: p.visitas.filter((v) => v.imobiliariaId !== id),
      agendamentos: p.agendamentos.filter((a) => a.imobiliariaId !== id),
    }));
  }, []);

  // ——— Visitas ———
  const checkIn = useCallback(
    (
      imobiliariaId: string,
      motivo: string,
      observacao: string,
      coords: Coords | null,
      agendamentoId: string | null = null
    ): string => {
      const id = `vis_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      setState((p) => {
        const imob = p.imobiliarias.find((i) => i.id === imobiliariaId);
        const distancia =
          coords && imob
            ? distanciaMetros(coords.lat, coords.lng, imob.lat, imob.lng)
            : null;
        const nova: Visita = {
          id,
          imobiliariaId,
          motivo,
          observacao,
          checkIn: new Date().toISOString(), // data/hora do sistema
          checkOut: null,
          coordsCheckIn: coords,
          coordsCheckOut: null,
          distanciaCheckIn: distancia,
        };
        return {
          ...p,
          visitas: [...p.visitas, nova],
          // agendamento vira "realizada" e aponta para a visita
          agendamentos: agendamentoId
            ? p.agendamentos.map((a) =>
                a.id === agendamentoId
                  ? { ...a, status: "realizada" as const, visitaId: id }
                  : a
              )
            : p.agendamentos,
        };
      });
      return id;
    },
    []
  );

  const checkOut = useCallback((visitaId: string, coords: Coords | null) => {
    setState((p) => ({
      ...p,
      visitas: p.visitas.map((v) =>
        v.id === visitaId && !v.checkOut
          ? { ...v, checkOut: new Date().toISOString(), coordsCheckOut: coords }
          : v
      ),
    }));
  }, []);

  const updateVisita = useCallback(
    (visitaId: string, data: { motivo?: string; observacao?: string }) => {
      setState((p) => ({
        ...p,
        visitas: p.visitas.map((v) => (v.id === visitaId ? { ...v, ...data } : v)),
      }));
    },
    []
  );

  const removeVisita = useCallback((visitaId: string) => {
    setState((p) => ({
      ...p,
      visitas: p.visitas.filter((v) => v.id !== visitaId),
      agendamentos: p.agendamentos.map((a) =>
        a.visitaId === visitaId
          ? { ...a, visitaId: null, status: "programada" as const }
          : a
      ),
    }));
  }, []);

  // ——— Agenda ———
  const addAgendamento = useCallback((data: NovoAgendamento): string => {
    const id = `ag_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const novo: Agendamento = {
      ...data,
      id,
      status: "programada",
      visitaId: null,
      criadoEm: new Date().toISOString(),
    };
    setState((p) => ({ ...p, agendamentos: [...p.agendamentos, novo] }));
    return id;
  }, []);

  const updateAgendamento = useCallback(
    (id: string, data: Partial<NovoAgendamento>) => {
      setState((p) => ({
        ...p,
        agendamentos: p.agendamentos.map((a) =>
          a.id === id ? { ...a, ...data } : a
        ),
      }));
    },
    []
  );

  const cancelarAgendamento = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      agendamentos: p.agendamentos.map((a) =>
        a.id === id ? { ...a, status: "cancelada" as const } : a
      ),
    }));
  }, []);

  const removeAgendamento = useCallback((id: string) => {
    setState((p) => ({
      ...p,
      agendamentos: p.agendamentos.filter((a) => a.id !== id),
    }));
  }, []);

  const setPerfil = useCallback((p: Partial<Perfil>) => {
    setState((prev) => ({ ...prev, perfil: { ...prev.perfil, ...p } }));
  }, []);

  // ——— Motivos ———
  const setMotivos = useCallback((lista: string[]) => {
    const limpos = lista.map((m) => m.trim()).filter(Boolean);
    // remove repetidos preservando a ordem
    const unicos = limpos.filter((m, i) => limpos.indexOf(m) === i);
    setState((p) => ({ ...p, motivos: unicos }));
  }, []);

  const renomearMotivo = useCallback((antigo: string, novo: string) => {
    const alvo = novo.trim();
    if (!alvo || alvo === antigo) return;
    setState((p) => ({
      ...p,
      motivos: p.motivos.map((m) => (m === antigo ? alvo : m)),
      // o histórico acompanha, senão o relatório separaria em dois motivos
      visitas: p.visitas.map((v) => (v.motivo === antigo ? { ...v, motivo: alvo } : v)),
      agendamentos: p.agendamentos.map((a) =>
        a.motivo === antigo ? { ...a, motivo: alvo } : a
      ),
    }));
  }, []);

  // ——— Derivados ———
  const visitaAberta = useMemo(
    () =>
      [...state.visitas]
        .filter((v) => !v.checkOut)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0] ?? null,
    [state.visitas]
  );

  const visitasDe = useCallback(
    (imobiliariaId: string) =>
      state.visitas
        .filter((v) => v.imobiliariaId === imobiliariaId)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    [state.visitas]
  );

  const totalVisitasDe = useCallback(
    (imobiliariaId: string) =>
      state.visitas.reduce(
        (n, v) => (v.imobiliariaId === imobiliariaId ? n + 1 : n),
        0
      ),
    [state.visitas]
  );

  const ultimaVisitaDe = useCallback(
    (imobiliariaId: string) => visitasDe(imobiliariaId)[0] ?? null,
    [visitasDe]
  );

  const imobiliariaPorId = useCallback(
    (id: string) => state.imobiliarias.find((i) => i.id === id),
    [state.imobiliarias]
  );

  const agendamentosNoIntervalo = useCallback(
    (de: Date, ate: Date) => {
      const a = de.getTime();
      const b = ate.getTime();
      return state.agendamentos
        .filter((ag) => {
          const t = new Date(ag.inicio).getTime();
          return t >= a && t <= b;
        })
        .sort((x, y) => x.inicio.localeCompare(y.inicio));
    },
    [state.agendamentos]
  );

  const agendamentosDoDia = useCallback(
    (dia: Date) => agendamentosNoIntervalo(inicioDoDia(dia), fimDoDia(dia)),
    [agendamentosNoIntervalo]
  );

  const proximoAgendamentoDe = useCallback(
    (imobiliariaId: string) => {
      const agora = new Date().toISOString();
      return (
        state.agendamentos
          .filter(
            (a) =>
              a.imobiliariaId === imobiliariaId &&
              a.status === "programada" &&
              a.inicio >= agora
          )
          .sort((x, y) => x.inicio.localeCompare(y.inicio))[0] ?? null
      );
    },
    [state.agendamentos]
  );

  const seedDemo = useCallback((lat: number, lng: number) => {
    setState((p) => ({ ...gerarDemo(lat, lng), perfil: p.perfil, motivos: p.motivos }));
  }, []);

  const limparTudo = useCallback(
    () => setState((p) => ({ ...VAZIO, perfil: p.perfil, motivos: p.motivos })),
    []
  );

  return (
    <Ctx.Provider
      value={{
        imobiliarias: state.imobiliarias,
        visitas: state.visitas,
        agendamentos: state.agendamentos,
        perfil: state.perfil,
        motivos: state.motivos,
        carregado,
        sincronizando,
        visitaAberta,
        addImobiliaria,
        updateImobiliaria,
        removeImobiliaria,
        checkIn,
        checkOut,
        updateVisita,
        removeVisita,
        addAgendamento,
        updateAgendamento,
        cancelarAgendamento,
        removeAgendamento,
        setPerfil,
        setMotivos,
        renomearMotivo,
        visitasDe,
        totalVisitasDe,
        ultimaVisitaDe,
        imobiliariaPorId,
        agendamentosNoIntervalo,
        agendamentosDoDia,
        proximoAgendamentoDe,
        seedDemo,
        limparTudo,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useVisitas(): VisitasContextType {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useVisitas precisa estar dentro de VisitasProvider");
  return ctx;
}

// ============================================
// DADOS DE DEMONSTRAÇÃO
// ============================================

const DEMO = [
  // ——— Em dia (visitadas nos últimos 7 dias) ———
  {
    nome: "Lopes Imóveis",
    setor: "centro",
    responsavel: { nome: "Marina Duarte", telefone: "(48) 99812-4477", email: "marina@lopesimoveis.com.br" },
    dLat: 0.0072, dLng: -0.0051,
    visitas: [
      { diasAtras: 3, motivo: "Treinamento", obs: "Treinamento do app para 8 corretores.", dur: 95 },
      { diasAtras: 21, motivo: "Apresentação de produto", obs: "Lançamento Vista Mar.", dur: 60 },
      { diasAtras: 48, motivo: "Prospecção", obs: "Primeiro contato presencial.", dur: 40 },
    ],
    agenda: [[0, 14, "Relacionamento", 60] as const, [9, 10, "Treinamento", 90] as const],
  },
  {
    nome: "Ilha Sul Imóveis",
    setor: "sul",
    responsavel: { nome: "Bruno Kramer", telefone: "(48) 99745-6610", email: "bruno@ilhasul.com.br" },
    dLat: 0.0145, dLng: 0.0038,
    visitas: [
      { diasAtras: 1, motivo: "Assinatura de contrato", obs: "Contrato de parceria assinado.", dur: 50 },
      { diasAtras: 8, motivo: "Treinamento", obs: "Turma de 12 corretores.", dur: 120 },
      { diasAtras: 19, motivo: "Relacionamento", obs: "", dur: 35 },
      { diasAtras: 33, motivo: "Apresentação de produto", obs: "Portfólio de alto padrão.", dur: 70 },
      { diasAtras: 52, motivo: "Prospecção", obs: "Indicação do Rafael da Prime.", dur: 45 },
    ],
    agenda: [],
  },
  {
    nome: "Beira-Mar Negócios Imobiliários",
    setor: "norte",
    responsavel: { nome: "Letícia Prado", telefone: "(48) 99320-7788", email: "leticia@beiramarneg.com.br" },
    dLat: 0.0058, dLng: 0.0176,
    visitas: [
      { diasAtras: 6, motivo: "Apresentação de produto", obs: "Apresentação para a diretoria.", dur: 65 },
      { diasAtras: 24, motivo: "Relacionamento", obs: "", dur: 40 },
      { diasAtras: 61, motivo: "Prospecção", obs: "Primeira reunião.", dur: 55 },
    ],
    agenda: [[4, 9, "Treinamento", 90] as const],
  },
  {
    nome: "Palhoça Sul Imóveis",
    setor: "sul",
    responsavel: { nome: "Diego Ramos", telefone: "(48) 99188-2043", email: "diego@palhocasul.com.br" },
    dLat: -0.0247, dLng: 0.0031,
    visitas: [
      { diasAtras: 4, motivo: "Resolver pendência", obs: "Acesso de 3 corretores liberado.", dur: 30 },
      { diasAtras: 29, motivo: "Prospecção", obs: "", dur: 50 },
    ],
    agenda: [],
  },

  // ——— Atenção (entre 8 e 30 dias) ———
  {
    nome: "Prime Negócios Imobiliários",
    setor: "centro",
    responsavel: { nome: "Rafael Antunes", telefone: "(48) 99640-1122", email: "rafael@primeimob.com.br" },
    dLat: -0.0043, dLng: 0.0068,
    visitas: [
      { diasAtras: 12, motivo: "Relacionamento", obs: "Café com a equipe comercial.", dur: 45 },
      { diasAtras: 34, motivo: "Resolver pendência", obs: "Ajuste de tabela de comissão.", dur: 75 },
    ],
    agenda: [[0, 16, "Apresentação de produto", 45] as const, [3, 9, "Prospecção", 60] as const],
  },
  {
    nome: "Horizonte Imóveis",
    setor: "oeste",
    responsavel: { nome: "Patrícia Lemos", telefone: "(48) 99502-3391", email: "patricia@horizonteimoveis.com.br" },
    dLat: -0.0162, dLng: 0.0089,
    visitas: [
      { diasAtras: 9, motivo: "Evento / Ação local", obs: "Plantão de vendas no condomínio.", dur: 180 },
      { diasAtras: 44, motivo: "Prospecção", obs: "", dur: 40 },
    ],
    agenda: [],
  },
  {
    nome: "Trindade Imóveis",
    setor: "leste",
    responsavel: { nome: "Anderson Vieira", telefone: "(48) 99877-5512", email: "anderson@trindadeimoveis.com.br" },
    dLat: 0.0104, dLng: -0.0148,
    visitas: [
      { diasAtras: 17, motivo: "Treinamento", obs: "Reciclagem da equipe.", dur: 80 },
      { diasAtras: 39, motivo: "Apresentação de produto", obs: "", dur: 55 },
      { diasAtras: 67, motivo: "Prospecção", obs: "Contato via indicação.", dur: 45 },
    ],
    agenda: [[7, 15, "Relacionamento", 45] as const],
  },
  {
    nome: "Campeche Imobiliária",
    setor: "sul",
    responsavel: { nome: "Fernanda Rocha", telefone: "(48) 99411-8827", email: "fernanda@campecheimob.com.br" },
    dLat: -0.0221, dLng: -0.0074,
    visitas: [
      { diasAtras: 27, motivo: "Resolver pendência", obs: "Divergência de comissão resolvida.", dur: 60 },
      { diasAtras: 55, motivo: "Relacionamento", obs: "", dur: 35 },
    ],
    agenda: [],
  },
  {
    nome: "São José Imobiliária",
    setor: "oeste",
    responsavel: { nome: "Gustavo Marin", telefone: "(48) 99233-9014", email: "gustavo@sjimob.com.br" },
    dLat: 0.0087, dLng: 0.0241,
    visitas: [
      { diasAtras: 22, motivo: "Apresentação de produto", obs: "Lançamento Reserva Norte.", dur: 70 },
      { diasAtras: 46, motivo: "Treinamento", obs: "", dur: 90 },
      { diasAtras: 71, motivo: "Relacionamento", obs: "Almoço com os sócios.", dur: 100 },
      { diasAtras: 96, motivo: "Prospecção", obs: "", dur: 45 },
    ],
    agenda: [[21, 10, "Treinamento", 120] as const],
  },

  // ——— Frias (mais de 30 dias sem visita) ———
  {
    nome: "Costa Verde Imóveis",
    setor: "leste",
    responsavel: { nome: "Juliana Braga", telefone: "(48) 98877-3020", email: "juliana@costaverde.com.br" },
    dLat: 0.0031, dLng: 0.0094,
    visitas: [
      { diasAtras: 41, motivo: "Prospecção", obs: "Apresentação institucional DWV.", dur: 55 },
    ],
    agenda: [[1, 11, "Resolver pendência", 60] as const, [18, 15, "Relacionamento", 45] as const],
  },
  {
    nome: "Jurerê Prime Imóveis",
    setor: "norte",
    responsavel: { nome: "Camila Nogueira", telefone: "(48) 99655-4180", email: "camila@jurereprime.com.br" },
    dLat: 0.0198, dLng: 0.0127,
    visitas: [
      { diasAtras: 35, motivo: "Apresentação de produto", obs: "Portfólio de veraneio.", dur: 60 },
      { diasAtras: 88, motivo: "Prospecção", obs: "", dur: 50 },
    ],
    agenda: [[12, 14, "Relacionamento", 60] as const],
  },
  {
    nome: "Santa Mônica Imóveis",
    setor: "leste",
    responsavel: { nome: "Otávio Bernardes", telefone: "(48) 99044-7726", email: "otavio@santamonicaimoveis.com.br" },
    dLat: -0.0035, dLng: -0.0187,
    visitas: [
      { diasAtras: 58, motivo: "Relacionamento", obs: "Sem retorno desde então.", dur: 40 },
    ],
    agenda: [],
  },
  {
    nome: "Portal Norte Imobiliária",
    setor: "norte",
    responsavel: { nome: "Renata Feltrin", telefone: "(48) 99762-1198", email: "renata@portalnorte.com.br" },
    dLat: 0.0231, dLng: -0.0042,
    visitas: [
      { diasAtras: 74, motivo: "Treinamento", obs: "Equipe trocou de gestor depois disso.", dur: 85 },
      { diasAtras: 112, motivo: "Prospecção", obs: "", dur: 45 },
    ],
    agenda: [],
  },

  // ——— Cadastradas, nunca visitadas ———
  {
    nome: "Âncora Imobiliária",
    setor: "centro",
    responsavel: { nome: "Pedro Salles", telefone: "(48) 99101-8899", email: "pedro@ancoraimob.com.br" },
    dLat: -0.0088, dLng: -0.0032,
    visitas: [],
    agenda: [[2, 14, "Prospecção", 60] as const],
  },
  {
    nome: "Coqueiros Imóveis",
    setor: "oeste",
    responsavel: { nome: "Sandra Mafra", telefone: "(48) 99318-6605", email: "sandra@coqueirosimoveis.com.br" },
    dLat: -0.0129, dLng: -0.0213,
    visitas: [],
    agenda: [],
  },
  {
    nome: "Estreito Negócios Imobiliários",
    setor: "oeste",
    responsavel: { nome: "Thiago Locks", telefone: "(48) 99580-2247", email: "thiago@estreitoneg.com.br" },
    dLat: -0.0186, dLng: 0.0195,
    visitas: [],
    agenda: [[5, 11, "Prospecção", 45] as const],
  },
];

function gerarDemo(lat: number, lng: number): VisitasState {
  const agora = Date.now();
  const imobiliarias: Imobiliaria[] = [];
  const visitas: Visita[] = [];
  const agendamentos: Agendamento[] = [];

  DEMO.forEach((d, idx) => {
    const id = `imob_demo_${idx}`;
    imobiliarias.push({
      id,
      nome: d.nome,
      lat: lat + d.dLat,
      lng: lng + d.dLng,
      endereco: `Ponto de demonstração — setor ${d.setor} do mapa`,
      responsavel: d.responsavel,
      criadaEm: new Date(agora - 60 * 86400000).toISOString(),
    });

    d.visitas.forEach((v, vi) => {
      const inicio = new Date(agora - v.diasAtras * 86400000);
      inicio.setHours(9 + (vi % 5) * 2, 30, 0, 0);
      const fim = new Date(inicio.getTime() + v.dur * 60000);
      visitas.push({
        id: `vis_demo_${idx}_${vi}`,
        imobiliariaId: id,
        motivo: v.motivo,
        observacao: v.obs,
        checkIn: inicio.toISOString(),
        checkOut: fim.toISOString(),
        coordsCheckIn: { lat: lat + d.dLat + 0.0001, lng: lng + d.dLng, precisao: 12 },
        coordsCheckOut: { lat: lat + d.dLat, lng: lng + d.dLng + 0.0001, precisao: 15 },
        distanciaCheckIn: 8 + ((idx * 7 + vi * 13) % 34),
      });
    });

    d.agenda.forEach(([dias, hora, motivo, dur], ai) => {
      const quando = new Date(agora + dias * 86400000);
      quando.setHours(hora, 0, 0, 0);
      agendamentos.push({
        id: `ag_demo_${idx}_${ai}`,
        imobiliariaId: id,
        motivo,
        observacao: "",
        inicio: quando.toISOString(),
        duracaoMin: dur,
        status: "programada",
        visitaId: null,
        criadoEm: new Date(agora).toISOString(),
      });
    });
  });

  return {
    imobiliarias,
    visitas,
    agendamentos,
    perfil: { ...PERFIL_VAZIO },
    motivos: [...MOTIVOS_PADRAO],
  };
}
