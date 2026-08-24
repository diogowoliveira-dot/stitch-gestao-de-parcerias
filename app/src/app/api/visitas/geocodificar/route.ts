import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy do Nominatim (OpenStreetMap).
 *
 * A política de uso exige um User-Agent que identifique a aplicação — o
 * navegador não deixa definir esse cabeçalho, então as buscas de endereço
 * passam por aqui. Também serializa as chamadas para respeitar o limite de
 * 1 requisição por segundo.
 */

const BASE = "https://nominatim.openstreetmap.org";
const UA =
  process.env.NOMINATIM_USER_AGENT ??
  "DWV-RegistroDeVisitas/1.0 (+https://dwvapp.com.br)";

export const dynamic = "force-dynamic";

// Fila simples: garante o intervalo mínimo entre chamadas nesta instância
let ultimaChamada = 0;
let fila: Promise<unknown> = Promise.resolve();

function naVez<T>(fn: () => Promise<T>): Promise<T> {
  const proxima = fila.then(async () => {
    const espera = Math.max(0, 1050 - (Date.now() - ultimaChamada));
    if (espera > 0) await new Promise((r) => setTimeout(r, espera));
    ultimaChamada = Date.now();
    return fn();
  });
  // a fila nunca rejeita, senão trava as próximas
  fila = proxima.catch(() => undefined);
  return proxima;
}

async function nominatim(caminho: string, params: URLSearchParams) {
  const res = await fetch(`${BASE}/${caminho}?${params}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return res.json();
}

/** Monta "Rua, número — Bairro — Cidade — UF" a partir da resposta */
function enderecoCurto(a: Record<string, string> = {}): string {
  return [
    [a.road, a.house_number].filter(Boolean).join(", "),
    a.suburb || a.neighbourhood || "",
    a.city || a.town || a.village || a.municipality || "",
    a.state_code || a.state || "",
  ]
    .filter(Boolean)
    .join(" — ");
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q");
  const lat = sp.get("lat");
  const lng = sp.get("lng");

  try {
    // ——— Endereço → coordenadas ———
    if (q && q.trim()) {
      const params = new URLSearchParams({
        format: "jsonv2",
        q: q.trim(),
        limit: "1",
        addressdetails: "1",
        countrycodes: sp.get("pais") ?? "br",
        "accept-language": "pt-BR",
      });

      // prioriza resultados perto de onde o executivo atua
      const viewbox = sp.get("viewbox");
      if (viewbox) params.set("viewbox", viewbox);

      const dados = await naVez(() => nominatim("search", params));
      const primeiro = Array.isArray(dados) ? dados[0] : null;
      if (!primeiro?.lat || !primeiro?.lon) {
        return NextResponse.json({ encontrado: false });
      }
      return NextResponse.json({
        encontrado: true,
        lat: Number(primeiro.lat),
        lng: Number(primeiro.lon),
        endereco:
          enderecoCurto(primeiro.address) || String(primeiro.display_name ?? ""),
        enderecoCompleto: String(primeiro.display_name ?? ""),
      });
    }

    // ——— Coordenadas → endereço ———
    if (lat && lng) {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat,
        lon: lng,
        "accept-language": "pt-BR",
      });
      const dados = await naVez(() => nominatim("reverse", params));
      if (!dados?.address) return NextResponse.json({ encontrado: false });
      return NextResponse.json({
        encontrado: true,
        endereco: enderecoCurto(dados.address),
        enderecoCompleto: String(dados.display_name ?? ""),
      });
    }

    return NextResponse.json(
      { erro: "Informe q (endereço) ou lat e lng." },
      { status: 400 }
    );
  } catch (e) {
    console.error("[visitas/geocodificar]", e);
    return NextResponse.json({ encontrado: false, erro: (e as Error).message });
  }
}
