import { telefoneMask } from "./visitas-types";

// ============================================
// IMPORTAÇÃO DE LISTA DE IMOBILIÁRIAS
// ============================================
// Lê .xlsx ou .csv, deixa o executivo confirmar de que coluna vem cada campo
// e converte os endereços em coordenadas (Nominatim/OpenStreetMap), já que o
// sistema é baseado em mapa e toda imobiliária precisa de um pin.

export interface Planilha {
  cabecalho: string[];
  linhas: string[][];
  /** Nome da aba lida (xlsx) */
  aba?: string;
}

/** Campos que a importação sabe preencher */
export type CampoImport =
  | "nome"
  | "endereco"
  | "responsavel"
  | "telefone"
  | "email"
  | "bairro"
  | "cidade"
  | "uf"
  | "cep";

export const CAMPOS: {
  id: CampoImport;
  label: string;
  obrigatorio?: boolean;
  ajuda?: string;
}[] = [
  { id: "nome", label: "Nome da imobiliária", obrigatorio: true },
  { id: "endereco", label: "Endereço", ajuda: "rua e número" },
  { id: "responsavel", label: "Responsável" },
  { id: "telefone", label: "Telefone" },
  { id: "email", label: "E-mail" },
  { id: "bairro", label: "Bairro" },
  { id: "cidade", label: "Cidade" },
  { id: "uf", label: "Estado / UF" },
  { id: "cep", label: "CEP" },
];

/** Palavras que identificam cada campo no cabeçalho da planilha */
const SINONIMOS: Record<CampoImport, string[]> = {
  nome: ["nome", "imobiliaria", "empresa", "razao social", "cliente", "parceiro", "loja"],
  endereco: ["endereco", "logradouro", "rua", "av", "avenida", "local", "localizacao"],
  responsavel: ["responsavel", "contato", "gerente", "diretor", "proprietario", "corretor", "nome do contato"],
  telefone: ["telefone", "celular", "fone", "whatsapp", "tel", "contato telefonico"],
  email: ["email", "e mail", "correio eletronico"],
  bairro: ["bairro", "distrito", "regiao"],
  cidade: ["cidade", "municipio", "localidade"],
  uf: ["uf", "estado", "sigla"],
  cep: ["cep", "codigo postal"],
};

// ——————————————————————————————————————————
// LEITURA DO ARQUIVO
// ——————————————————————————————————————————

function texto(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  return String(v).trim();
}

/** Divide uma linha de CSV respeitando aspas */
function linhaCSV(linha: string, sep: string): string[] {
  const saida: string[] = [];
  let atual = "";
  let entreAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (entreAspas) {
      if (c === '"') {
        if (linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else entreAspas = false;
      } else atual += c;
    } else if (c === '"') {
      entreAspas = true;
    } else if (c === sep) {
      saida.push(atual.trim());
      atual = "";
    } else atual += c;
  }
  saida.push(atual.trim());
  return saida;
}

function lerCSV(conteudo: string): Planilha {
  const limpo = conteudo.replace(/^﻿/, "");
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return { cabecalho: [], linhas: [] };

  // Excel brasileiro exporta com ponto e vírgula
  const primeira = linhas[0];
  const sep =
    (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const todas = linhas.map((l) => linhaCSV(l, sep));
  return { cabecalho: todas[0], linhas: todas.slice(1) };
}

export async function lerPlanilha(arquivo: File): Promise<Planilha> {
  const nome = arquivo.name.toLowerCase();

  if (nome.endsWith(".csv") || nome.endsWith(".txt")) {
    return lerCSV(await arquivo.text());
  }

  if (nome.endsWith(".xls")) {
    throw new Error(
      "Formato .xls antigo não é suportado. Salve como .xlsx ou CSV e tente de novo."
    );
  }

  const { default: readXlsxFile } = await import("read-excel-file/browser");
  const abas = await readXlsxFile(arquivo);
  const aba = abas.find((s) => s.data.some((l) => l.some((c) => texto(c) !== "")));
  if (!aba) throw new Error("A planilha está vazia.");

  const dados = aba.data.map((l) => l.map(texto));
  // pula linhas em branco no topo até achar o cabeçalho
  const iCabecalho = dados.findIndex((l) => l.filter(Boolean).length >= 1);
  if (iCabecalho === -1) throw new Error("A planilha está vazia.");

  return {
    cabecalho: dados[iCabecalho],
    linhas: dados.slice(iCabecalho + 1).filter((l) => l.some((c) => c !== "")),
    aba: aba.sheet,
  };
}

// ——————————————————————————————————————————
// DETECÇÃO AUTOMÁTICA DAS COLUNAS
// ——————————————————————————————————————————

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mapa campo → índice da coluna (-1 = não usar) */
export type MapaColunas = Record<CampoImport, number>;

export function detectarColunas(cabecalho: string[]): MapaColunas {
  const normalizados = cabecalho.map(normalizar);
  const mapa = Object.fromEntries(
    CAMPOS.map((c) => [c.id, -1])
  ) as MapaColunas;
  const usadas = new Set<number>();

  (Object.keys(SINONIMOS) as CampoImport[]).forEach((campo) => {
    // 1º passo: cabeçalho idêntico a um sinônimo
    let idx = normalizados.findIndex(
      (h, i) => !usadas.has(i) && SINONIMOS[campo].includes(h)
    );
    // 2º passo: cabeçalho que contém o sinônimo
    if (idx === -1) {
      idx = normalizados.findIndex(
        (h, i) =>
          !usadas.has(i) &&
          h.length > 0 &&
          SINONIMOS[campo].some((s) => h.includes(s))
      );
    }
    if (idx !== -1) {
      mapa[campo] = idx;
      usadas.add(idx);
    }
  });

  // Sem cabeçalho reconhecível: assume nome na 1ª coluna e endereço na 2ª
  if (mapa.nome === -1 && cabecalho.length > 0) mapa.nome = 0;
  if (mapa.endereco === -1 && mapa.nome !== 1 && cabecalho.length > 1)
    mapa.endereco = 1;

  return mapa;
}

// ——————————————————————————————————————————
// LINHAS NORMALIZADAS
// ——————————————————————————————————————————

export type StatusLinha = "ok" | "sem_local" | "duplicada" | "invalida";

export interface LinhaImport {
  indice: number;
  nome: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  email: string;
  /** Texto completo usado na busca de coordenadas */
  consulta: string;
  lat: number | null;
  lng: number | null;
  enderecoEncontrado: string;
  status: StatusLinha;
  incluir: boolean;
}

function celula(linha: string[], idx: number): string {
  return idx >= 0 && idx < linha.length ? (linha[idx] ?? "").trim() : "";
}

export function montarLinhas(
  planilha: Planilha,
  mapa: MapaColunas,
  nomesExistentes: string[]
): LinhaImport[] {
  const jaCadastradas = new Set(nomesExistentes.map((n) => normalizar(n)));

  return planilha.linhas.map((l, i) => {
    const nome = celula(l, mapa.nome);
    const endereco = celula(l, mapa.endereco);
    const bairro = celula(l, mapa.bairro);
    const cidade = celula(l, mapa.cidade);
    const uf = celula(l, mapa.uf);
    const cep = celula(l, mapa.cep);

    // endereço mostrado no cadastro
    const enderecoCompleto = [endereco, bairro, cidade, uf]
      .filter(Boolean)
      .join(" — ");

    // consulta enviada à busca de coordenadas
    const consulta = [endereco, bairro, cidade, uf, cep, "Brasil"]
      .filter(Boolean)
      .join(", ");

    const duplicada = nome !== "" && jaCadastradas.has(normalizar(nome));
    const status: StatusLinha = !nome
      ? "invalida"
      : duplicada
        ? "duplicada"
        : "sem_local";

    return {
      indice: i,
      nome,
      endereco: enderecoCompleto,
      responsavel: celula(l, mapa.responsavel),
      telefone: telefoneMask(celula(l, mapa.telefone)),
      email: celula(l, mapa.email),
      consulta: endereco || bairro || cidade || cep ? consulta : "",
      lat: null,
      lng: null,
      enderecoEncontrado: "",
      status,
      incluir: status !== "invalida" && status !== "duplicada",
    };
  });
}

// ——————————————————————————————————————————
// GEOCODIFICAÇÃO (endereço → coordenadas)
// ——————————————————————————————————————————

export interface Coordenada {
  lat: number;
  lng: number;
  enderecoEncontrado: string;
}

/**
 * Passa por /api/visitas/geocodificar, que envia o User-Agent exigido pela
 * política do Nominatim e serializa as chamadas (1 por segundo).
 * `perto` prioriza resultados na região onde o executivo atua.
 */
export async function geocodificar(
  consulta: string,
  perto?: { lat: number; lng: number } | null
): Promise<Coordenada | null> {
  if (!consulta.trim()) return null;

  const params = new URLSearchParams({ q: consulta });
  if (perto) {
    const d = 0.6; // ~60 km de raio de preferência
    params.set(
      "viewbox",
      `${perto.lng - d},${perto.lat + d},${perto.lng + d},${perto.lat - d}`
    );
  }

  try {
    const res = await fetch(`/api/visitas/geocodificar?${params}`);
    if (!res.ok) return null;
    const d = await res.json();
    if (!d?.encontrado) return null;
    return {
      lat: Number(d.lat),
      lng: Number(d.lng),
      enderecoEncontrado: String(d.endereco || d.enderecoCompleto || ""),
    };
  } catch {
    return null;
  }
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function geocodificarLote(
  linhas: LinhaImport[],
  opts: {
    perto?: { lat: number; lng: number } | null;
    onProgresso?: (feitas: number, total: number) => void;
    cancelado?: () => boolean;
  } = {}
): Promise<LinhaImport[]> {
  const alvo = linhas.filter((l) => l.status !== "invalida" && l.consulta);
  const resultado = [...linhas];
  let feitas = 0;

  for (const linha of alvo) {
    if (opts.cancelado?.()) break;

    const coord = await geocodificar(linha.consulta, opts.perto);
    const i = resultado.findIndex((l) => l.indice === linha.indice);
    if (i !== -1 && coord) {
      resultado[i] = {
        ...resultado[i],
        lat: coord.lat,
        lng: coord.lng,
        enderecoEncontrado: coord.enderecoEncontrado,
        status: resultado[i].status === "duplicada" ? "duplicada" : "ok",
      };
    }

    feitas++;
    opts.onProgresso?.(feitas, alvo.length);
    if (feitas < alvo.length) await espera(1100); // política de uso do Nominatim
  }

  return resultado;
}

// ——————————————————————————————————————————
// MODELO DE PLANILHA
// ——————————————————————————————————————————

export const MODELO_CSV = [
  "Nome;Endereço;Responsável;Telefone;E-mail;Bairro;Cidade;UF",
  "Lopes Imóveis;Rua Esteves Júnior, 696;Marina Duarte;(48) 99812-4477;marina@lopesimoveis.com.br;Centro;Florianópolis;SC",
  "Prime Negócios Imobiliários;Av. Rio Branco, 404;Rafael Antunes;(48) 99640-1122;rafael@primeimob.com.br;Centro;Florianópolis;SC",
].join("\n");

export function baixarModelo() {
  const blob = new Blob(["﻿" + MODELO_CSV], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo-imobiliarias.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
