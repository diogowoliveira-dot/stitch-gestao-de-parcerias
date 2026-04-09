import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SPARKPOST_ENDPOINT = "https://api.sparkpost.com/api/v1/transmissions";
const FROM_EMAIL = "noreply@mail.dwvapp.com.br";
const FROM_NAME = "DWV Diagnóstico";

// POST /api/diagnostico/admin/test-email
// Testa a configuração do SparkPost enviando um e-mail de diagnóstico
// Body: { userId: string } — deve ser master para usar
export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  // Apenas master pode usar este endpoint
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true, nome: true } });
  if (!caller || caller.role !== "master") {
    return NextResponse.json({ error: "Apenas o usuário master pode usar este endpoint" }, { status: 403 });
  }

  const apiKey = process.env.SPARKPOST_API_KEY;

  // Diagnóstico de configuração
  const diagnostics = {
    SPARKPOST_API_KEY: apiKey ? `configurada (${apiKey.length} chars, começa com: ${apiKey.substring(0, 8)}...)` : "NÃO CONFIGURADA ⚠️",
    FROM_EMAIL,
    endpoint: SPARKPOST_ENDPOINT,
    emailDestino: caller.email,
  };

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      erro: "SPARKPOST_API_KEY não configurada",
      diagnostics,
      solucao: "Adicione SPARKPOST_API_KEY em Vercel → Project Settings → Environment Variables",
    }, { status: 500 });
  }

  // Tenta enviar um e-mail de teste
  const html = `
    <div style="font-family:sans-serif;max-width:400px;margin:40px auto;padding:24px;background:#111;color:#fff;border-radius:12px">
      <h2 style="color:#ec1313;margin:0 0 16px">✅ Teste de E-mail — DWV</h2>
      <p style="color:rgba(255,255,255,0.7)">Este é um e-mail de diagnóstico enviado por <strong>${caller.nome}</strong>.</p>
      <p style="color:rgba(255,255,255,0.5);font-size:12px">Se você recebeu este e-mail, o SparkPost está funcionando corretamente.</p>
    </div>`;

  try {
    const res = await fetch(SPARKPOST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        recipients: [{ address: { email: caller.email, name: caller.nome } }],
        content: { from: { name: FROM_NAME, email: FROM_EMAIL }, subject: "Teste de E-mail — DWV Diagnóstico", html },
      }),
    });

    const responseText = await res.text();
    let responseJson: unknown;
    try { responseJson = JSON.parse(responseText); } catch { responseJson = responseText; }

    if (!res.ok) {
      console.error("[test-email] SparkPost falhou:", responseText);
      return NextResponse.json({
        ok: false,
        httpStatus: res.status,
        erro: responseText,
        diagnostics,
        interpretacao: interpretSparkPostError(res.status, responseText),
      }, { status: 200 }); // 200 para que o frontend possa ler o body
    }

    return NextResponse.json({
      ok: true,
      mensagem: `E-mail de teste enviado para ${caller.email}`,
      sparkpostResponse: responseJson,
      diagnostics,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, erro: msg, diagnostics }, { status: 200 });
  }
}

function interpretSparkPostError(status: number, body: string): string {
  if (status === 403 || body.includes("Unauthorized") || body.includes("1200")) {
    return "API Key inválida ou sem permissão de envio. Verifique SPARKPOST_API_KEY no Vercel.";
  }
  if (status === 422 || body.includes("sending domain") || body.includes("not a verified")) {
    return `Domínio de envio '${FROM_EMAIL}' não está verificado no SparkPost. Verifique em app.sparkpost.com → Sending Domains.`;
  }
  if (status === 400) {
    return "Requisição malformada para o SparkPost. Verifique o formato da chamada.";
  }
  if (status === 429) {
    return "Rate limit do SparkPost atingido. Tente novamente em alguns minutos.";
  }
  return `Erro HTTP ${status} do SparkPost. Verifique o campo 'erro' para detalhes.`;
}
