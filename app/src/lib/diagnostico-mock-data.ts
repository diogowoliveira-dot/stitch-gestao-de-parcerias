// ============================================
// DIAGNÓSTICO COMERCIAL - DATA MODELS
// ============================================

export type DiagUserRole = 'admin' | 'consultor';

export interface DiagUser {
  id: string;
  nome: string;
  email: string;
  role: DiagUserRole;
  status: 'ativo' | 'inativo';
  senha: string;
  avatar?: string;
  dataCriacao: string;
  ultimoAcesso?: string;
}

export interface CargoData {
  id: string;
  nome: string;
  existe: boolean;
  acumulaFuncao?: string;
  personalizado?: boolean;
  tarefas: string[];
  metricas: string[];
  ferramentas: string[];
  subordinadosDe: string | null;
  subordinados: string[];
}

export interface DiagnosticoData {
  id: string;
  empresa: {
    nome: string;
    cidade: string;
    estado: string;
  };
  cargos: CargoData[];
  ferramentasGerais: string[];
  problemasIdentificados: string[];
  dataCriacao: string;
  criadoPor: string;
  status: 'rascunho' | 'completo';
}

// ============================================
// TAREFAS PRÉ-DEFINIDAS
// ============================================
export const TAREFAS_PREDEFINIDAS = [
  'Visitas a corretores / imobiliárias',
  'Treinamentos de produto',
  'Captação de novos corretores',
  'Distribuição de tabelas e materiais',
  'Atualização de preços',
  'Atendimento via WhatsApp',
  'Aprovação de propostas',
  'Relatórios para diretoria',
  'Gestão de campanhas',
  'Definição de metas',
];

// ============================================
// MÉTRICAS PRÉ-DEFINIDAS
// ============================================
export const METRICAS_PREDEFINIDAS = [
  'VGV mensal',
  'Número de propostas',
  'Número de corretores ativos',
  'Taxa de conversão',
  'Número de visitas realizadas',
  'Engajamento da base',
  'Número de novos corretores captados',
];

// ============================================
// FERRAMENTAS PRÉ-DEFINIDAS
// ============================================
export const FERRAMENTAS_PREDEFINIDAS = [
  'E-mail marketing (ferramenta genérica)',
  'CRM interno (focado em contratos)',
  'Planilhas Excel / Google Sheets',
  'Google Drive / Intranet',
  'WhatsApp pessoal',
  'Ferramenta não oficial de disparo em massa',
  'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)',
];

// ============================================
// PROBLEMAS AUTOMÁTICOS POR FERRAMENTA
// ============================================
export const PROBLEMAS_POR_FERRAMENTA: Record<string, string> = {
  'E-mail marketing (ferramenta genérica)': 'Disparos sem rastreamento de abertura — impossível saber quem engajou',
  'CRM interno (focado em contratos)': 'CRM focado em contrato, não em corretor — sem perfil de engajamento da base',
  'Planilhas Excel / Google Sheets': 'Dados descentralizados e desatualizados — sem visão de carteira em tempo real',
  'Google Drive / Intranet': 'Materiais compartilhados sem rastreamento — ninguém sabe quem acessou o quê',
  'WhatsApp pessoal': 'Histórico de relacionamento some quando o executivo sai — risco de perda de carteira',
  'Ferramenta não oficial de disparo em massa': 'Risco real de banimento do número — operação em risco',
  'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)': 'Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta',
};

// ============================================
// CARGOS PADRÃO
// ============================================
export const CARGOS_PADRAO = [
  { id: 'cargo_diretor_comercial', nome: 'Diretor Comercial', nivel: 1 },
  { id: 'cargo_diretor_parceria', nome: 'Diretor de Parceria', nivel: 2 },
  { id: 'cargo_gerente_parceria', nome: 'Gerente de Parceria', nivel: 3 },
  { id: 'cargo_executivo_parceria', nome: 'Executivo de Parceria', nivel: 4 },
  { id: 'cargo_coordenador_comercial', nome: 'Coordenador Comercial', nivel: 3 },
  { id: 'cargo_supervisor_vendas', nome: 'Supervisor de Vendas', nivel: 3 },
  { id: 'cargo_assistente_comercial', nome: 'Assistente Comercial', nivel: 5 },
];

// ============================================
// MOCK USERS
// ============================================
export const diagInitialUsers: DiagUser[] = [
  {
    id: 'du1',
    nome: 'Admin DWV',
    email: 'admin@dwv.com',
    role: 'admin',
    status: 'ativo',
    senha: '123',
    dataCriacao: '2024-01-01',
    ultimoAcesso: '2026-03-13',
  },
  {
    id: 'du2',
    nome: 'Roberto Almeida',
    email: 'roberto@dwv.com',
    role: 'consultor',
    status: 'ativo',
    senha: '123456',
    dataCriacao: '2024-01-10',
    ultimoAcesso: '2026-03-12',
  },
  {
    id: 'du3',
    nome: 'Ana Pereira',
    email: 'ana@dwv.com',
    role: 'consultor',
    status: 'ativo',
    senha: '123456',
    dataCriacao: '2024-02-01',
    ultimoAcesso: '2026-03-10',
  },
  {
    id: 'du4',
    nome: 'Carlos Mendes',
    email: 'carlos@dwv.com',
    role: 'consultor',
    status: 'inativo',
    senha: '123456',
    dataCriacao: '2024-02-15',
  },
];

// ============================================
// MOCK DIAGNÓSTICOS
// ============================================
export const diagInitialDiagnosticos: DiagnosticoData[] = [
  // ── Diagnóstico 1: Estrutura COMPLETA (todos os cargos) ──
  {
    id: 'diag1',
    empresa: { nome: 'MRV Engenharia', cidade: 'Belo Horizonte', estado: 'MG' },
    cargos: [
      {
        id: 'cargo_diretor_comercial',
        nome: 'Diretor Comercial',
        existe: true,
        tarefas: ['Definição de metas', 'Relatórios para diretoria', 'Gestão de campanhas'],
        metricas: ['VGV mensal', 'Número de propostas', 'Taxa de conversão'],
        ferramentas: ['Planilhas Excel / Google Sheets', 'WhatsApp pessoal', 'Google Drive / Intranet'],
        subordinadosDe: null,
        subordinados: ['cargo_diretor_parceria'],
      },
      {
        id: 'cargo_diretor_parceria',
        nome: 'Diretor de Parceria',
        existe: true,
        tarefas: ['Gestão de campanhas', 'Definição de metas', 'Relatórios para diretoria'],
        metricas: ['VGV mensal', 'Engajamento da base', 'Número de corretores ativos'],
        ferramentas: ['CRM interno (focado em contratos)', 'Planilhas Excel / Google Sheets', 'E-mail marketing (ferramenta genérica)'],
        subordinadosDe: 'cargo_diretor_comercial',
        subordinados: ['cargo_gerente_parceria'],
      },
      {
        id: 'cargo_gerente_parceria',
        nome: 'Gerente de Parceria',
        existe: true,
        tarefas: ['Aprovação de propostas', 'Gestão de campanhas', 'Relatórios para diretoria', 'Treinamentos de produto'],
        metricas: ['Número de corretores ativos', 'Taxa de conversão', 'Número de propostas'],
        ferramentas: ['CRM interno (focado em contratos)', 'E-mail marketing (ferramenta genérica)', 'WhatsApp pessoal', 'Planilhas Excel / Google Sheets'],
        subordinadosDe: 'cargo_diretor_parceria',
        subordinados: ['cargo_executivo_parceria', 'cargo_assistente_comercial'],
      },
      {
        id: 'cargo_executivo_parceria',
        nome: 'Executivo de Parceria',
        existe: true,
        tarefas: ['Visitas a corretores / imobiliárias', 'Captação de novos corretores', 'Atendimento via WhatsApp', 'Distribuição de tabelas e materiais', 'Treinamentos de produto'],
        metricas: ['Número de visitas realizadas', 'Número de novos corretores captados', 'Engajamento da base'],
        ferramentas: ['WhatsApp pessoal', 'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)', 'Ferramenta não oficial de disparo em massa', 'Google Drive / Intranet'],
        subordinadosDe: 'cargo_gerente_parceria',
        subordinados: [],
      },
      {
        id: 'cargo_assistente_comercial',
        nome: 'Assistente Comercial',
        existe: true,
        tarefas: ['Distribuição de tabelas e materiais', 'Atualização de preços', 'Atendimento via WhatsApp'],
        metricas: ['Engajamento da base'],
        ferramentas: ['WhatsApp pessoal', 'Planilhas Excel / Google Sheets', 'Google Drive / Intranet'],
        subordinadosDe: 'cargo_gerente_parceria',
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      'Planilhas Excel / Google Sheets',
      'WhatsApp pessoal',
      'CRM interno (focado em contratos)',
      'E-mail marketing (ferramenta genérica)',
      'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)',
      'Ferramenta não oficial de disparo em massa',
      'Google Drive / Intranet',
    ],
    problemasIdentificados: [
      'Dados descentralizados e desatualizados — sem visão de carteira em tempo real',
      'Histórico de relacionamento some quando o executivo sai — risco de perda de carteira',
      'CRM focado em contrato, não em corretor — sem perfil de engajamento da base',
      'Disparos sem rastreamento de abertura — impossível saber quem engajou',
      'Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta',
      'Risco real de banimento do número — operação em risco',
      'Materiais compartilhados sem rastreamento — ninguém sabe quem acessou o quê',
      'Estrutura com alto grau de fragmentação operacional',
    ],
    dataCriacao: '2026-03-10',
    criadoPor: 'du2',
    status: 'completo',
  },

  // ── Diagnóstico 2: Sem gerência (Diretor + Executivos) ──
  {
    id: 'diag2',
    empresa: { nome: 'Cyrela Brazil Realty', cidade: 'São Paulo', estado: 'SP' },
    cargos: [
      {
        id: 'cargo_diretor_parceria',
        nome: 'Diretor de Parceria',
        existe: true,
        tarefas: ['Definição de metas', 'Aprovação de propostas', 'Relatórios para diretoria', 'Gestão de campanhas'],
        metricas: ['VGV mensal', 'Número de propostas', 'Taxa de conversão'],
        ferramentas: ['Planilhas Excel / Google Sheets', 'CRM interno (focado em contratos)', 'WhatsApp pessoal'],
        subordinadosDe: null,
        subordinados: ['cargo_executivo_parceria'],
      },
      {
        id: 'cargo_executivo_parceria',
        nome: 'Executivo de Parceria',
        existe: true,
        tarefas: ['Visitas a corretores / imobiliárias', 'Captação de novos corretores', 'Atendimento via WhatsApp', 'Treinamentos de produto'],
        metricas: ['Número de visitas realizadas', 'Número de novos corretores captados'],
        ferramentas: ['WhatsApp pessoal', 'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)', 'E-mail marketing (ferramenta genérica)'],
        subordinadosDe: 'cargo_diretor_parceria',
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      'Planilhas Excel / Google Sheets',
      'CRM interno (focado em contratos)',
      'WhatsApp pessoal',
      'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)',
      'E-mail marketing (ferramenta genérica)',
    ],
    problemasIdentificados: [
      'Dados descentralizados e desatualizados — sem visão de carteira em tempo real',
      'Histórico de relacionamento some quando o executivo sai — risco de perda de carteira',
      'CRM focado em contrato, não em corretor — sem perfil de engajamento da base',
      'Disparos sem rastreamento de abertura — impossível saber quem engajou',
      'Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta',
      'Estrutura com alto grau de fragmentação operacional',
    ],
    dataCriacao: '2026-03-08',
    criadoPor: 'du3',
    status: 'completo',
  },

  // ── Diagnóstico 3: Só executivos (estrutura mínima) ──
  {
    id: 'diag3',
    empresa: { nome: 'Tenda Construtora', cidade: 'Rio de Janeiro', estado: 'RJ' },
    cargos: [
      {
        id: 'cargo_executivo_parceria',
        nome: 'Executivo de Parceria',
        existe: true,
        tarefas: ['Visitas a corretores / imobiliárias', 'Captação de novos corretores', 'Atendimento via WhatsApp', 'Distribuição de tabelas e materiais'],
        metricas: ['Número de visitas realizadas', 'Número de novos corretores captados', 'Engajamento da base'],
        ferramentas: ['WhatsApp pessoal', 'Planilhas Excel / Google Sheets', 'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)'],
        subordinadosDe: null,
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      'WhatsApp pessoal',
      'Planilhas Excel / Google Sheets',
      'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)',
    ],
    problemasIdentificados: [
      'Histórico de relacionamento some quando o executivo sai — risco de perda de carteira',
      'Dados descentralizados e desatualizados — sem visão de carteira em tempo real',
      'Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta',
    ],
    dataCriacao: '2026-03-05',
    criadoPor: 'du2',
    status: 'completo',
  },

  // ── Diagnóstico 4: Com cargos alternativos (Coordenador + Supervisor) ──
  {
    id: 'diag4',
    empresa: { nome: 'Direcional Engenharia', cidade: 'Goiânia', estado: 'GO' },
    cargos: [
      {
        id: 'cargo_diretor_comercial',
        nome: 'Diretor Comercial',
        existe: true,
        tarefas: ['Definição de metas', 'Relatórios para diretoria'],
        metricas: ['VGV mensal', 'Taxa de conversão'],
        ferramentas: ['Planilhas Excel / Google Sheets', 'Google Drive / Intranet'],
        subordinadosDe: null,
        subordinados: ['cargo_coordenador_comercial', 'cargo_supervisor_vendas'],
      },
      {
        id: 'cargo_coordenador_comercial',
        nome: 'Coordenador Comercial',
        existe: true,
        tarefas: ['Gestão de campanhas', 'Aprovação de propostas', 'Treinamentos de produto'],
        metricas: ['Número de propostas', 'Número de corretores ativos'],
        ferramentas: ['CRM interno (focado em contratos)', 'E-mail marketing (ferramenta genérica)', 'WhatsApp pessoal'],
        subordinadosDe: 'cargo_diretor_comercial',
        subordinados: ['cargo_executivo_parceria'],
      },
      {
        id: 'cargo_supervisor_vendas',
        nome: 'Supervisor de Vendas',
        existe: true,
        tarefas: ['Treinamentos de produto', 'Gestão de campanhas', 'Relatórios para diretoria'],
        metricas: ['Engajamento da base', 'Taxa de conversão'],
        ferramentas: ['WhatsApp pessoal', 'Planilhas Excel / Google Sheets'],
        subordinadosDe: 'cargo_diretor_comercial',
        subordinados: ['cargo_executivo_parceria'],
      },
      {
        id: 'cargo_executivo_parceria',
        nome: 'Executivo de Parceria',
        existe: true,
        tarefas: ['Visitas a corretores / imobiliárias', 'Captação de novos corretores', 'Atendimento via WhatsApp', 'Distribuição de tabelas e materiais'],
        metricas: ['Número de visitas realizadas', 'Número de novos corretores captados'],
        ferramentas: ['WhatsApp pessoal', 'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)', 'Ferramenta não oficial de disparo em massa'],
        subordinadosDe: 'cargo_coordenador_comercial',
        subordinados: [],
      },
      {
        id: 'cargo_assistente_comercial',
        nome: 'Assistente Comercial',
        existe: true,
        tarefas: ['Atualização de preços', 'Distribuição de tabelas e materiais', 'Atendimento via WhatsApp'],
        metricas: ['Engajamento da base'],
        ferramentas: ['WhatsApp pessoal', 'Google Drive / Intranet', 'Planilhas Excel / Google Sheets'],
        subordinadosDe: 'cargo_coordenador_comercial',
        subordinados: [],
      },
    ],
    ferramentasGerais: [
      'Planilhas Excel / Google Sheets',
      'WhatsApp pessoal',
      'CRM interno (focado em contratos)',
      'E-mail marketing (ferramenta genérica)',
      'Recebimento de propostas em canais variados (WhatsApp, e-mail, físico)',
      'Ferramenta não oficial de disparo em massa',
      'Google Drive / Intranet',
    ],
    problemasIdentificados: [
      'Dados descentralizados e desatualizados — sem visão de carteira em tempo real',
      'Histórico de relacionamento some quando o executivo sai — risco de perda de carteira',
      'CRM focado em contrato, não em corretor — sem perfil de engajamento da base',
      'Disparos sem rastreamento de abertura — impossível saber quem engajou',
      'Sem rastreamento por executivo — gerente não sabe de onde veio cada proposta',
      'Risco real de banimento do número — operação em risco',
      'Materiais compartilhados sem rastreamento — ninguém sabe quem acessou o quê',
      'Estrutura com alto grau de fragmentação operacional',
    ],
    dataCriacao: '2026-03-01',
    criadoPor: 'du3',
    status: 'completo',
  },

  // ── Diagnóstico 5: Rascunho incompleto ──
  {
    id: 'diag5',
    empresa: { nome: 'Even Construtora', cidade: 'São Paulo', estado: 'SP' },
    cargos: [
      {
        id: 'cargo_gerente_parceria',
        nome: 'Gerente de Parceria',
        existe: true,
        tarefas: ['Aprovação de propostas'],
        metricas: ['Número de propostas'],
        ferramentas: ['CRM interno (focado em contratos)'],
        subordinadosDe: null,
        subordinados: ['cargo_executivo_parceria'],
      },
      {
        id: 'cargo_executivo_parceria',
        nome: 'Executivo de Parceria',
        existe: true,
        tarefas: ['Visitas a corretores / imobiliárias', 'Atendimento via WhatsApp'],
        metricas: ['Número de visitas realizadas'],
        ferramentas: ['WhatsApp pessoal'],
        subordinadosDe: 'cargo_gerente_parceria',
        subordinados: [],
      },
    ],
    ferramentasGerais: ['CRM interno (focado em contratos)', 'WhatsApp pessoal'],
    problemasIdentificados: [
      'CRM focado em contrato, não em corretor — sem perfil de engajamento da base',
      'Histórico de relacionamento some quando o executivo sai — risco de perda de carteira',
    ],
    dataCriacao: '2026-03-12',
    criadoPor: 'du2',
    status: 'rascunho',
  },
];
