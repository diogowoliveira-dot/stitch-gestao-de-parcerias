// ============================================
// DATA MODELS
// ============================================

export type UserRole = 'admin' | 'vendedor';
export type PartnerType = 'cliente' | 'corretor' | 'consultor';
export type ReferralStatus = 'em_negociacao' | 'fechada' | 'recusada';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  status: 'ativo' | 'inativo';
  senha: string;
}

export interface Vendedor {
  id: string;
  userId: string;
  nome: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  dataCadastro: string;
}

export interface Parceiro {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  empresa: string;
  tipo: PartnerType;
  vendedorId: string;
  status: 'ativo' | 'inativo';
  dataCadastro: string;
}

export interface Indicacao {
  id: string;
  parceiroId: string;
  empresaIndicada: string;
  contatoNome: string;
  contatoTelefone: string;
  contatoEmail: string;
  status: ReferralStatus;
  valorComissao: number;
  dataIndicacao: string;
  observacoes: string;
}

// ============================================
// COMMISSION VALUE
// ============================================
export const COMISSAO_POR_INDICACAO = 2000;

// ============================================
// MOCK USERS
// ============================================
export const initialUsers: User[] = [
  { id: 'u1', nome: 'Administrador', email: 'admin@dwv.com', role: 'admin', status: 'ativo', senha: 'admin123' },
  { id: 'u2', nome: 'Roberto Almeida', email: 'roberto@dwv.com', role: 'vendedor', status: 'ativo', senha: '123456' },
  { id: 'u3', nome: 'Ana Pereira', email: 'ana@dwv.com', role: 'vendedor', status: 'ativo', senha: '123456' },
  { id: 'u4', nome: 'Carlos Mendes', email: 'carlos@dwv.com', role: 'vendedor', status: 'ativo', senha: '123456' },
  { id: 'u5', nome: 'Juliana Souza', email: 'juliana@dwv.com', role: 'vendedor', status: 'inativo', senha: '123456' },
];

// ============================================
// MOCK VENDEDORES (linked to users)
// ============================================
export const initialVendedores: Vendedor[] = [
  { id: 'v1', userId: 'u2', nome: 'Roberto Almeida', email: 'roberto@dwv.com', telefone: '(11) 99999-1111', status: 'ativo', dataCadastro: '2024-01-05' },
  { id: 'v2', userId: 'u3', nome: 'Ana Pereira', email: 'ana@dwv.com', telefone: '(11) 99999-2222', status: 'ativo', dataCadastro: '2024-01-10' },
  { id: 'v3', userId: 'u4', nome: 'Carlos Mendes', email: 'carlos@dwv.com', telefone: '(11) 99999-3333', status: 'ativo', dataCadastro: '2024-02-01' },
  { id: 'v4', userId: 'u5', nome: 'Juliana Souza', email: 'juliana@dwv.com', telefone: '(11) 99999-4444', status: 'inativo', dataCadastro: '2024-01-15' },
];

// ============================================
// MOCK PARCEIROS
// ============================================
export const initialParceiros: Parceiro[] = [
  // Roberto's partners
  { id: 'p1', nome: 'João Silva', telefone: '(11) 98765-0001', email: 'joao.silva@email.com', empresa: 'Silva Imóveis', tipo: 'corretor', vendedorId: 'v1', status: 'ativo', dataCadastro: '2024-01-15' },
  { id: 'p2', nome: 'Maria Fernanda', telefone: '(11) 98765-0002', email: 'maria.f@empresa.com', empresa: 'MF Consultoria', tipo: 'consultor', vendedorId: 'v1', status: 'ativo', dataCadastro: '2024-02-01' },
  { id: 'p3', nome: 'Pedro Santos', telefone: '(11) 98765-0003', email: 'pedro@construtora.com', empresa: 'Construtora Santos', tipo: 'cliente', vendedorId: 'v1', status: 'ativo', dataCadastro: '2024-02-10' },
  // Ana's partners
  { id: 'p4', nome: 'Luciana Costa', telefone: '(21) 98765-0004', email: 'luciana@prime.com', empresa: 'Prime Negócios', tipo: 'consultor', vendedorId: 'v2', status: 'ativo', dataCadastro: '2024-01-20' },
  { id: 'p5', nome: 'Fernando Lima', telefone: '(21) 98765-0005', email: 'fernando@lima.com', empresa: 'Lima Corretagem', tipo: 'corretor', vendedorId: 'v2', status: 'ativo', dataCadastro: '2024-02-05' },
  { id: 'p6', nome: 'Carla Rodrigues', telefone: '(21) 98765-0006', email: 'carla@rodrigues.com', empresa: 'Rodrigues & Cia', tipo: 'cliente', vendedorId: 'v2', status: 'inativo', dataCadastro: '2024-01-25' },
  // Carlos's partners
  { id: 'p7', nome: 'Ricardo Oliveira', telefone: '(41) 98765-0007', email: 'ricardo@oliveira.com', empresa: 'Oliveira Invest', tipo: 'consultor', vendedorId: 'v3', status: 'ativo', dataCadastro: '2024-02-15' },
  { id: 'p8', nome: 'Beatriz Almeida', telefone: '(41) 98765-0008', email: 'beatriz@almeida.com', empresa: 'BA Imobiliária', tipo: 'corretor', vendedorId: 'v3', status: 'ativo', dataCadastro: '2024-02-20' },
  // Juliana's partners (inactive vendedor)
  { id: 'p9', nome: 'Thiago Martins', telefone: '(51) 98765-0009', email: 'thiago@martins.com', empresa: 'Martins Group', tipo: 'cliente', vendedorId: 'v4', status: 'ativo', dataCadastro: '2024-01-18' },
  { id: 'p10', nome: 'Daniela Neves', telefone: '(51) 98765-0010', email: 'daniela@neves.com', empresa: 'Neves Corretor', tipo: 'corretor', vendedorId: 'v4', status: 'ativo', dataCadastro: '2024-01-22' },
];

// ============================================
// MOCK INDICAÇÕES
// ============================================
export const initialIndicacoes: Indicacao[] = [
  // From João Silva (p1 - Roberto's partner)
  { id: 'i1', parceiroId: 'p1', empresaIndicada: 'Construtora Alpha', contatoNome: 'José Mendes', contatoTelefone: '(11) 91111-0001', contatoEmail: 'jose@alpha.com', status: 'fechada', valorComissao: 2000, dataIndicacao: '2024-01-20', observacoes: 'Cliente fechou contrato de obra' },
  { id: 'i2', parceiroId: 'p1', empresaIndicada: 'Grupo Beta Industrial', contatoNome: 'Ana Torres', contatoTelefone: '(11) 91111-0002', contatoEmail: 'ana@beta.com', status: 'em_negociacao', valorComissao: 2000, dataIndicacao: '2024-02-15', observacoes: 'Aguardando proposta' },
  { id: 'i3', parceiroId: 'p1', empresaIndicada: 'Investimentos Gamma', contatoNome: 'Pedro Lima', contatoTelefone: '(21) 91111-0003', contatoEmail: 'pedro@gamma.com', status: 'recusada', valorComissao: 2000, dataIndicacao: '2024-02-20', observacoes: 'Não houve interesse' },
  // From Maria Fernanda (p2 - Roberto's partner)
  { id: 'i4', parceiroId: 'p2', empresaIndicada: 'Tech Solutions', contatoNome: 'Rafael Costa', contatoTelefone: '(48) 91111-0004', contatoEmail: 'rafael@tech.com', status: 'em_negociacao', valorComissao: 2000, dataIndicacao: '2024-02-10', observacoes: 'Reunião agendada para próxima semana' },
  { id: 'i5', parceiroId: 'p2', empresaIndicada: 'Construtora Horizonte', contatoNome: 'Marcos Souza', contatoTelefone: '(11) 91111-0005', contatoEmail: 'marcos@horizonte.com', status: 'fechada', valorComissao: 2000, dataIndicacao: '2024-01-25', observacoes: 'Contrato assinado' },
  // From Luciana Costa (p4 - Ana's partner)
  { id: 'i6', parceiroId: 'p4', empresaIndicada: 'Imobiliária Central', contatoNome: 'Lucia Ferreira', contatoTelefone: '(41) 91111-0006', contatoEmail: 'lucia@central.com', status: 'em_negociacao', valorComissao: 2000, dataIndicacao: '2024-02-18', observacoes: 'Proposta enviada' },
  { id: 'i7', parceiroId: 'p4', empresaIndicada: 'Nova Empreend.', contatoNome: 'Thiago Martins', contatoTelefone: '(51) 91111-0007', contatoEmail: 'thiago@nova.com', status: 'fechada', valorComissao: 2000, dataIndicacao: '2024-01-30', observacoes: 'Fechamento concluído' },
  // From Fernando Lima (p5 - Ana's partner)
  { id: 'i8', parceiroId: 'p5', empresaIndicada: 'Grupo Investlar', contatoNome: 'Fernanda Dias', contatoTelefone: '(11) 91111-0008', contatoEmail: 'fernanda@investlar.com', status: 'em_negociacao', valorComissao: 2000, dataIndicacao: '2024-02-12', observacoes: 'Negociação avançada' },
  // From Ricardo Oliveira (p7 - Carlos's partner)
  { id: 'i9', parceiroId: 'p7', empresaIndicada: 'MaxBuild', contatoNome: 'Carla Neves', contatoTelefone: '(11) 91111-0009', contatoEmail: 'carla@maxbuild.com', status: 'em_negociacao', valorComissao: 2000, dataIndicacao: '2024-02-22', observacoes: 'Primeiro contato realizado' },
  { id: 'i10', parceiroId: 'p7', empresaIndicada: 'Habitat Urban', contatoNome: 'Diego Moraes', contatoTelefone: '(41) 91111-0010', contatoEmail: 'diego@habitat.com', status: 'fechada', valorComissao: 2000, dataIndicacao: '2024-02-05', observacoes: 'Contrato fechado com sucesso' },
  // From Thiago Martins (p9 - Juliana's partner - inactive vendedor)
  { id: 'i11', parceiroId: 'p9', empresaIndicada: 'Incorpora Mais', contatoNome: 'Bruno Campos', contatoTelefone: '(21) 91111-0011', contatoEmail: 'bruno@incorpora.com', status: 'em_negociacao', valorComissao: 2000, dataIndicacao: '2024-02-08', observacoes: 'Aguardando retorno' },
  { id: 'i12', parceiroId: 'p9', empresaIndicada: 'Empreend. Vitória', contatoNome: 'Sandra Rocha', contatoTelefone: '(31) 91111-0012', contatoEmail: 'sandra@vitoria.com', status: 'recusada', valorComissao: 2000, dataIndicacao: '2024-01-28', observacoes: 'Cliente optou por outra empresa' },
];
