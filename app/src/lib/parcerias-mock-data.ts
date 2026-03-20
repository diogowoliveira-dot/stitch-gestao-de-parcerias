// ============================================
// PARCERIAS DASHBOARD — MOCK DATA
// ============================================

export interface Executivo {
  id: string;
  nome: string;
  iniciais: string;
  cargo: string;
  gestorId: string;
  status: "ativo" | "inativo";
  foto?: string;
  meta: {
    propostas: number;
    corretoresAtivos: number;
    imobiliarias: number;
  };
  imobiliarias: Imobiliaria[];
  propostas: {
    total: number;
    aceitas: number;
    recusadas: number;
    emAberto: number;
  };
  acessosProdutos: number;
  visitas: {
    realizadas: number;
    corretoresAlcancados: number;
  };
  eventos: Evento[];
  acoes: AcoesCarteira;
}

export interface Imobiliaria {
  id: string;
  nome: string;
  iniciais: string;
  totalCorretores: number;
  corretoresAtivos: number;
  novosCorretores: number;
  integrada: boolean;
  novaNoPeríodo: boolean;
}

export interface Evento {
  id: string;
  nome: string;
  data: string;
  participantes: number;
}

export interface AcoesCarteira {
  compartilhamentos: number;
  chamadasWhatsApp: number;
  participacoesEventos: number;
  integracoesImovel: number;
  solicitacoesTabela: number;
  propostasCriadas: number;
  solicitacoesAutorizacao: number;
  pontuacoes: number;
}

export interface Gestor {
  id: string;
  nome: string;
  iniciais: string;
  cargo: string;
  status: "ativo";
  executivos: string[];
  meta: {
    propostas: number;
    corretoresAtivos: number;
    imobiliarias: number;
  };
}

export interface Alerta {
  id: string;
  tipo: "critico" | "atencao";
  titulo: string;
  descricao: string;
  executivoId?: string;
}

// ============================================
// MOCK EXECUTIVOS
// ============================================

const imobiliariasRoberto: Imobiliaria[] = [
  { id: "imob1", nome: "Lopes Imóveis", iniciais: "LI", totalCorretores: 28, corretoresAtivos: 22, novosCorretores: 4, integrada: true, novaNoPeríodo: false },
  { id: "imob2", nome: "Fernandez Imobiliária", iniciais: "FI", totalCorretores: 15, corretoresAtivos: 9, novosCorretores: 2, integrada: true, novaNoPeríodo: false },
  { id: "imob3", nome: "Remax Premium", iniciais: "RP", totalCorretores: 34, corretoresAtivos: 28, novosCorretores: 6, integrada: true, novaNoPeríodo: true },
  { id: "imob4", nome: "Century 21 Centro", iniciais: "C2", totalCorretores: 20, corretoresAtivos: 14, novosCorretores: 3, integrada: false, novaNoPeríodo: false },
  { id: "imob5", nome: "Rede Imóveis SP", iniciais: "RI", totalCorretores: 18, corretoresAtivos: 12, novosCorretores: 1, integrada: true, novaNoPeríodo: false },
  { id: "imob6", nome: "Apolar Curitiba", iniciais: "AC", totalCorretores: 22, corretoresAtivos: 15, novosCorretores: 5, integrada: true, novaNoPeríodo: true },
];

const imobiliariasAna: Imobiliaria[] = [
  { id: "imob7", nome: "Coelho da Fonseca", iniciais: "CF", totalCorretores: 42, corretoresAtivos: 35, novosCorretores: 8, integrada: true, novaNoPeríodo: false },
  { id: "imob8", nome: "Brasil Brokers", iniciais: "BB", totalCorretores: 30, corretoresAtivos: 24, novosCorretores: 5, integrada: true, novaNoPeríodo: false },
  { id: "imob9", nome: "Patrimóvel", iniciais: "PM", totalCorretores: 25, corretoresAtivos: 18, novosCorretores: 3, integrada: true, novaNoPeríodo: true },
  { id: "imob10", nome: "Abyara", iniciais: "AB", totalCorretores: 19, corretoresAtivos: 11, novosCorretores: 2, integrada: false, novaNoPeríodo: false },
  { id: "imob11", nome: "Imobiliária Leal", iniciais: "IL", totalCorretores: 12, corretoresAtivos: 8, novosCorretores: 1, integrada: true, novaNoPeríodo: false },
];

const imobiliariasCarlos: Imobiliaria[] = [
  { id: "imob12", nome: "Imovelweb Parceiros", iniciais: "IP", totalCorretores: 20, corretoresAtivos: 10, novosCorretores: 2, integrada: true, novaNoPeríodo: false },
  { id: "imob13", nome: "QuintoAndar Select", iniciais: "QA", totalCorretores: 15, corretoresAtivos: 7, novosCorretores: 1, integrada: false, novaNoPeríodo: false },
  { id: "imob14", nome: "Zap Parceiros", iniciais: "ZP", totalCorretores: 18, corretoresAtivos: 9, novosCorretores: 3, integrada: true, novaNoPeríodo: true },
  { id: "imob15", nome: "Ponto Imóvel", iniciais: "PI", totalCorretores: 10, corretoresAtivos: 4, novosCorretores: 0, integrada: false, novaNoPeríodo: false },
];

const imobiliariasJuliana: Imobiliaria[] = [
  { id: "imob16", nome: "Souza Neto Imóveis", iniciais: "SN", totalCorretores: 14, corretoresAtivos: 5, novosCorretores: 0, integrada: true, novaNoPeríodo: false },
  { id: "imob17", nome: "Porto Seguro Imob.", iniciais: "PS", totalCorretores: 22, corretoresAtivos: 8, novosCorretores: 1, integrada: true, novaNoPeríodo: false },
  { id: "imob18", nome: "Habitat Imóveis", iniciais: "HI", totalCorretores: 10, corretoresAtivos: 3, novosCorretores: 0, integrada: false, novaNoPeríodo: false },
];

const imobiliariasMarcos: Imobiliaria[] = [
  { id: "imob19", nome: "Elite Imóveis", iniciais: "EI", totalCorretores: 38, corretoresAtivos: 32, novosCorretores: 7, integrada: true, novaNoPeríodo: false },
  { id: "imob20", nome: "Premium Realty", iniciais: "PR", totalCorretores: 26, corretoresAtivos: 22, novosCorretores: 4, integrada: true, novaNoPeríodo: true },
  { id: "imob21", nome: "Casa & Lar", iniciais: "CL", totalCorretores: 20, corretoresAtivos: 16, novosCorretores: 3, integrada: true, novaNoPeríodo: false },
  { id: "imob22", nome: "Invest Imóveis", iniciais: "II", totalCorretores: 15, corretoresAtivos: 12, novosCorretores: 2, integrada: true, novaNoPeríodo: false },
  { id: "imob23", nome: "Top House", iniciais: "TH", totalCorretores: 18, corretoresAtivos: 14, novosCorretores: 5, integrada: true, novaNoPeríodo: true },
  { id: "imob24", nome: "Rede Sul", iniciais: "RS", totalCorretores: 12, corretoresAtivos: 9, novosCorretores: 1, integrada: false, novaNoPeríodo: false },
  { id: "imob25", nome: "Central Negócios", iniciais: "CN", totalCorretores: 22, corretoresAtivos: 18, novosCorretores: 3, integrada: true, novaNoPeríodo: false },
];

export const executivos: Executivo[] = [
  {
    id: "exec1",
    nome: "Roberto Almeida",
    iniciais: "RA",
    cargo: "Executivo de Parcerias",
    gestorId: "gest1",
    status: "ativo",
    meta: { propostas: 20, corretoresAtivos: 80, imobiliarias: 8 },
    imobiliarias: imobiliariasRoberto,
    propostas: { total: 14, aceitas: 8, recusadas: 2, emAberto: 4 },
    acessosProdutos: 342,
    visitas: { realizadas: 18, corretoresAlcancados: 94 },
    eventos: [
      { id: "ev1", nome: "Workshop Lançamento Vita Residence", data: "2026-03-05", participantes: 32 },
      { id: "ev2", nome: "Treinamento CRM Integrado", data: "2026-03-12", participantes: 18 },
      { id: "ev3", nome: "Happy Hour Corretores Zona Sul", data: "2026-03-18", participantes: 45 },
    ],
    acoes: {
      compartilhamentos: 187,
      chamadasWhatsApp: 234,
      participacoesEventos: 95,
      integracoesImovel: 42,
      solicitacoesTabela: 67,
      propostasCriadas: 14,
      solicitacoesAutorizacao: 23,
      pontuacoes: 156,
    },
  },
  {
    id: "exec2",
    nome: "Ana Pereira",
    iniciais: "AP",
    cargo: "Executivo de Parcerias",
    gestorId: "gest1",
    status: "ativo",
    meta: { propostas: 25, corretoresAtivos: 100, imobiliarias: 7 },
    imobiliarias: imobiliariasAna,
    propostas: { total: 22, aceitas: 14, recusadas: 3, emAberto: 5 },
    acessosProdutos: 489,
    visitas: { realizadas: 24, corretoresAlcancados: 132 },
    eventos: [
      { id: "ev4", nome: "Café com Corretores Premium", data: "2026-03-03", participantes: 28 },
      { id: "ev5", nome: "Apresentação Novo Empreendimento", data: "2026-03-10", participantes: 55 },
      { id: "ev6", nome: "Networking Imobiliário", data: "2026-03-15", participantes: 40 },
      { id: "ev7", nome: "Workshop Técnico de Vendas", data: "2026-03-19", participantes: 22 },
    ],
    acoes: {
      compartilhamentos: 256,
      chamadasWhatsApp: 312,
      participacoesEventos: 145,
      integracoesImovel: 58,
      solicitacoesTabela: 89,
      propostasCriadas: 22,
      solicitacoesAutorizacao: 34,
      pontuacoes: 210,
    },
  },
  {
    id: "exec3",
    nome: "Carlos Mendes",
    iniciais: "CM",
    cargo: "Executivo de Parcerias",
    gestorId: "gest1",
    status: "ativo",
    meta: { propostas: 18, corretoresAtivos: 50, imobiliarias: 6 },
    imobiliarias: imobiliariasCarlos,
    propostas: { total: 7, aceitas: 3, recusadas: 2, emAberto: 2 },
    acessosProdutos: 156,
    visitas: { realizadas: 10, corretoresAlcancados: 38 },
    eventos: [
      { id: "ev8", nome: "Treinamento Básico", data: "2026-03-08", participantes: 12 },
    ],
    acoes: {
      compartilhamentos: 78,
      chamadasWhatsApp: 95,
      participacoesEventos: 12,
      integracoesImovel: 15,
      solicitacoesTabela: 28,
      propostasCriadas: 7,
      solicitacoesAutorizacao: 9,
      pontuacoes: 45,
    },
  },
  {
    id: "exec4",
    nome: "Juliana Souza",
    iniciais: "JS",
    cargo: "Executivo de Parcerias",
    gestorId: "gest1",
    status: "ativo",
    meta: { propostas: 15, corretoresAtivos: 35, imobiliarias: 5 },
    imobiliarias: imobiliariasJuliana,
    propostas: { total: 4, aceitas: 1, recusadas: 2, emAberto: 1 },
    acessosProdutos: 87,
    visitas: { realizadas: 6, corretoresAlcancados: 18 },
    eventos: [],
    acoes: {
      compartilhamentos: 34,
      chamadasWhatsApp: 42,
      participacoesEventos: 0,
      integracoesImovel: 5,
      solicitacoesTabela: 12,
      propostasCriadas: 4,
      solicitacoesAutorizacao: 3,
      pontuacoes: 18,
    },
  },
  {
    id: "exec5",
    nome: "Marcos Oliveira",
    iniciais: "MO",
    cargo: "Executivo de Parcerias",
    gestorId: "gest1",
    status: "ativo",
    meta: { propostas: 22, corretoresAtivos: 90, imobiliarias: 9 },
    imobiliarias: imobiliariasMarcos,
    propostas: { total: 24, aceitas: 16, recusadas: 3, emAberto: 5 },
    acessosProdutos: 567,
    visitas: { realizadas: 28, corretoresAlcancados: 156 },
    eventos: [
      { id: "ev9", nome: "Mega Evento Corretores SP", data: "2026-03-02", participantes: 85 },
      { id: "ev10", nome: "Treinamento Avançado de Vendas", data: "2026-03-09", participantes: 35 },
      { id: "ev11", nome: "Lançamento Projeto Marina Bay", data: "2026-03-14", participantes: 62 },
      { id: "ev12", nome: "Workshop Digital Marketing Imob.", data: "2026-03-17", participantes: 28 },
      { id: "ev13", nome: "Confraternização Q1 2026", data: "2026-03-20", participantes: 48 },
    ],
    acoes: {
      compartilhamentos: 345,
      chamadasWhatsApp: 410,
      participacoesEventos: 258,
      integracoesImovel: 72,
      solicitacoesTabela: 115,
      propostasCriadas: 24,
      solicitacoesAutorizacao: 45,
      pontuacoes: 298,
    },
  },
];

export const gestor: Gestor = {
  id: "gest1",
  nome: "Ricardo Ferreira",
  iniciais: "RF",
  cargo: "Gerente de Parcerias",
  status: "ativo",
  executivos: ["exec1", "exec2", "exec3", "exec4", "exec5"],
  meta: { propostas: 100, corretoresAtivos: 355, imobiliarias: 35 },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getCorretoresTotal(exec: Executivo): number {
  return exec.imobiliarias.reduce((sum, i) => sum + i.totalCorretores, 0);
}

export function getCorretoresAtivos(exec: Executivo): number {
  return exec.imobiliarias.reduce((sum, i) => sum + i.corretoresAtivos, 0);
}

export function getCorretoresInativos(exec: Executivo): number {
  return getCorretoresTotal(exec) - getCorretoresAtivos(exec);
}

export function getCorretoresNovos(exec: Executivo): number {
  return exec.imobiliarias.reduce((sum, i) => sum + i.novosCorretores, 0);
}

export function getImobiliariasIntegradas(exec: Executivo): number {
  return exec.imobiliarias.filter((i) => i.integrada).length;
}

export function getImobiliariasNaoIntegradas(exec: Executivo): number {
  return exec.imobiliarias.filter((i) => !i.integrada).length;
}

export function getImobiliariasNovas(exec: Executivo): number {
  return exec.imobiliarias.filter((i) => i.novaNoPeríodo).length;
}

export function getTotalEventosParticipantes(exec: Executivo): number {
  return exec.eventos.reduce((sum, e) => sum + e.participantes, 0);
}

export function getSemaforoColor(atual: number, meta: number): "verde" | "amarelo" | "vermelho" {
  const pct = meta > 0 ? (atual / meta) * 100 : 0;
  if (pct >= 80) return "verde";
  if (pct >= 60) return "amarelo";
  return "vermelho";
}

export function getPctAtingimento(atual: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.round((atual / meta) * 100);
}

// ============================================
// ALERTAS DO GESTOR
// ============================================

export function gerarAlertas(execs: Executivo[]): Alerta[] {
  const alertas: Alerta[] = [];
  let alertId = 1;

  execs.forEach((exec) => {
    const pctPropostas = getPctAtingimento(exec.propostas.total, exec.meta.propostas);
    const pctCorretores = getPctAtingimento(
      getCorretoresAtivos(exec),
      exec.meta.corretoresAtivos
    );
    const naoIntegradas = getImobiliariasNaoIntegradas(exec);

    if (pctPropostas < 60) {
      alertas.push({
        id: `alert${alertId++}`,
        tipo: "critico",
        titulo: `${exec.nome} abaixo de 60% da meta de propostas`,
        descricao: `Apenas ${exec.propostas.total} de ${exec.meta.propostas} propostas (${pctPropostas}%). Risco de não atingir a meta mensal.`,
        executivoId: exec.id,
      });
    } else if (pctPropostas < 80) {
      alertas.push({
        id: `alert${alertId++}`,
        tipo: "atencao",
        titulo: `${exec.nome} entre 60-79% da meta de propostas`,
        descricao: `${exec.propostas.total} de ${exec.meta.propostas} propostas (${pctPropostas}%). Necessita acelerar para atingir a meta.`,
        executivoId: exec.id,
      });
    }

    if (pctCorretores < 60) {
      alertas.push({
        id: `alert${alertId++}`,
        tipo: "critico",
        titulo: `${exec.nome}: corretores ativos abaixo do esperado`,
        descricao: `Apenas ${getCorretoresAtivos(exec)} de ${exec.meta.corretoresAtivos} corretores ativos (${pctCorretores}%). Base de corretores pouco engajada.`,
        executivoId: exec.id,
      });
    }

    if (naoIntegradas >= 2) {
      alertas.push({
        id: `alert${alertId++}`,
        tipo: "atencao",
        titulo: `${exec.nome} com ${naoIntegradas} imobiliárias não integradas`,
        descricao: `Imobiliárias sem integração ao CRM reduzem rastreabilidade e perdem dados de engajamento.`,
        executivoId: exec.id,
      });
    }
  });

  return alertas.sort((a, b) => (a.tipo === "critico" ? -1 : 1) - (b.tipo === "critico" ? -1 : 1));
}
