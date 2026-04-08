const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPutForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface Executivo {
  id: string;
  nome: string;
  cargo: string;
  regiao?: string;
  whatsapp?: string;
  email?: string;
  foto_b64?: string;
  ativo: boolean;
  criado_em: string;
}

export interface Campanha {
  id: string;
  tipo: string;
  cliente: string;
  empreendimento: string;
  status: string;
  criada_em: string;
  executivos?: { nome: string };
}

export interface Peca {
  formato: string;
  versao: number;
  arquivo_url: string;
  html: string;
  is_atual: boolean;
}

export interface GenerateResult {
  campanha_id: string;
  pecas: Array<{ formato: string; html: string; arquivo_url: string; id: string }>;
  copy: Record<string, unknown>;
}

export interface EditResult {
  html: string;
  arquivo_url?: string;
}
