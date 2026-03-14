export const PIPEFY_API = "https://api.pipefy.com/graphql";
export const PIPEFY_TOKEN =
  "eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJQaXBlZnkiLCJpYXQiOjE3MzkzNjY0NzYsImp0aSI6ImUxZDAzODU2LWI4YmItNDkyYS1iZDQ2LTNjMDE2ZDcxNTc4MiIsInN1YiI6MzAyMDQ0MDUzLCJ1c2VyIjp7ImlkIjozMDIwNDQwNTMsImVtYWlsIjoiam9hb0Bkd3ZhcHAuY29tLmJyIn19.VLYhp6KZ-_G3qvTEWE7Yx_4QbzWzEnGD2KaLhvV7Wb4Q7wGzAckVlK61NV1oD0xvZr4jU6XGScS6uWZAJ09BbA";
export const PIPE_ID = "301656816";
export const REPORT_EMAIL = "diogowoliveira@gmail.com";

export async function pipefyQuery(query: string) {
  const res = await fetch(PIPEFY_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PIPEFY_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

// Phase IDs for targeted queries
export const PHASE_IDS = {
  leadsEmbaixador: "340930595",
  leadsSDR: "329073231",
  contato1: "333505932",
  contato2: "333505933",
  contato3: "333505934",
  nutricao: "337322779",
  resgate: "339349068",
  resgateEmbaixador: "340930689",
  emContato: "310985440",
  reuniaoAgendada: "310985441",
  noShow: "332675549",
  apresentacaoRealizada: "324825485",
  propostaEnviada: "323026981",
  fechadoFree: "342368285",
  fechadoEssencial: "332675950",
  fechadoPerformance: "332675975",
  fechadoAvancado: "332675990",
  operadoraParcerias: "333649696",
  agendamentoUpsell: "333195178",
  propostaUpsell: "332766215",
  fechadosTransferir: "310985442",
  naoFechado: "310985443",
  distrato: "332676411",
  churn: "311056137",
  semPerfil: "332676117",
  naoMexer: "328347351",
  arquivo: "334045711",
} as const;

// Phases considered as "won"
export const WON_PHASES = [
  PHASE_IDS.fechadoFree,
  PHASE_IDS.fechadoEssencial,
  PHASE_IDS.fechadoPerformance,
  PHASE_IDS.fechadoAvancado,
  PHASE_IDS.fechadosTransferir,
];

// Phases considered as "lost"
export const LOST_PHASES = [
  PHASE_IDS.naoFechado,
  PHASE_IDS.distrato,
  PHASE_IDS.churn,
  PHASE_IDS.semPerfil,
  PHASE_IDS.arquivo,
];

// State labels (purple)
export const STATE_LABELS = [
  "Goiás", "Minas Gerais", "São Paulo", "Santa Catarina",
  "Paraná", "Rio Grande do Sul", "Ceará", "Paraíba",
  "Pernambuco", "Espírito Santo", "Alagoas", "Rio de Janeiro", "Internacional",
];

// Normalize phase name (remove emojis/special chars) for matching
export function normalizePhase(name: string): string {
  return name.replace(/[^\w\sÀ-ÿ]/g, "").trim();
}

// Parse adhesion value from free text
export function parseAdhesionValue(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Categorize loss reason from observation text
export function categorizeLossReason(text: string): string {
  if (!text || text.trim().length < 3) return "Não informado";
  const lower = text.toLowerCase();

  if (/concorr|outra plataforma|orulo|cv\b|brain|vista\s*soft|hypnobox|apto\s*visual|app\s*corretores/i.test(lower))
    return "Concorrência";
  if (/pre[çc]o|valor|caro|or[çc]amento|custo|investimento alto|n[ãa]o tem verba|sem verba/i.test(lower))
    return "Preço / Orçamento";
  if (/sem retorno|n[ãa]o atend|n[ãa]o respond|contato sem sucesso|n[ãa]o retorn/i.test(lower))
    return "Sem Retorno";
  if (/momento|agora n[ãa]o|timing|mais adiante|n[ãa]o [eé] hora|postergar|adiar/i.test(lower))
    return "Timing / Momento";
  if (/perfil|n[ãa]o se encaixa|n[ãa]o faz sentido/i.test(lower))
    return "Sem Perfil";
  if (/inadimpl|n[ãa]o pagou|cobran[çc]a|d[ié]vida/i.test(lower))
    return "Inadimplência";
  if (/cancelamento|cancelou|distrato|rescis/i.test(lower))
    return "Cancelamento";
  if (/j[aá] (tem|possui|usa)|satisfeito com/i.test(lower))
    return "Já possui solução";
  if (/mudan[çc]a|saiu da empresa|trocou|n[ãa]o (est[aá]|trabalha) mais/i.test(lower))
    return "Mudança de contato";

  return "Outros";
}
