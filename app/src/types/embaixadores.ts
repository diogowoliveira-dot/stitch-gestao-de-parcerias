// src/types/embaixadores.ts
// Field names match Prisma camelCase convention

export type UF =
  | 'AC'|'AL'|'AP'|'AM'|'BA'|'CE'|'DF'|'ES'|'GO'|'MA'
  | 'MT'|'MS'|'MG'|'PA'|'PB'|'PR'|'PE'|'PI'|'RJ'|'RN'
  | 'RS'|'RO'|'RR'|'SC'|'SP'|'SE'|'TO'

export interface Embaixador {
  id: string
  nome: string
  email: string
  uf: UF
  meta: string
  periodo: string
  photoUrl: string | null
  grafanaUid: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
  diagnosticosCount?: number
}

export interface EmbaixadorMetrica {
  id: string
  embaixadorId: string
  competencia: string            // 'YYYY-MM-DDTHH:mm:ssZ' (DateTime from Prisma)
  corretoresTotal: number
  corretoresNovos: number
  imobCadastradas: number
  imobCadastradasNovas: number
  imobIntegradas: number
  imobIntegradasNovas: number
  incorporadoras: number
  incorporadorasNovas: number
  acessosTotais: number
  createdAt: string
}

export interface EmbaixadorComMetricas extends Embaixador {
  metricas: EmbaixadorMetrica[]
}

// Formulário de criação/edição
export interface EmbaixadorFormData {
  nome: string
  email: string
  uf: UF
  meta: string
  periodo: string
}

// Dados agregados calculados pelo frontend
export interface PeriodStats {
  corretoresTotal: number
  corretoresNovos: number
  imobCadastradas: number
  imobCadastradasNovas: number
  imobIntegradas: number
  imobIntegradasNovas: number
  incorporadoras: number
  incorporadorasNovas: number
  acessosTotais: number
  months: number
}
