import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500 });
  }

  const { type, data } = await req.json();

  let prompt = "";

  switch (type) {
    case "atividades":
      prompt = `Analise as atividades descritas pelos cargos abaixo de incorporadoras brasileiras (canal de parcerias imobiliárias).
Agrupe e categorize as atividades, gerando percentuais aproximados.
Retorne APENAS um JSON válido com a estrutura:
{
  "categorias": [{"nome": "Visitas a imobiliárias", "percentual": 85}, ...],
  "insights": ["insight 1", "insight 2"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "kpis":
      prompt = `Analise os KPIs/métricas de resultado cobrados por cargo em incorporadoras brasileiras (canal de parcerias).
Agrupe os KPIs mais comuns e gere percentuais de frequência.
Retorne APENAS um JSON válido:
{
  "kpis": [{"nome": "VGV mensal", "percentual": 75, "cargos": ["Diretor", "Gerente"]}, ...],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "segmentacao":
      prompt = `Analise as respostas sobre segmentação de corretores em incorporadoras brasileiras.
Categorize os tipos de segmentação e gere insights.
Retorne APENAS um JSON válido:
{
  "tipos": [{"nome": "Por volume de vendas (Ouro/Prata/Bronze)", "percentual": 60}, ...],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "relatorios":
      prompt = `Analise as respostas descritivas sobre relatórios desejados por incorporadoras brasileiras para o canal de parcerias.
Categorize os tipos de relatório e gere insights.
Retorne APENAS um JSON válido:
{
  "relatorios": [{"nome": "Engajamento por corretor", "percentual": 70}, ...],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "crm":
      prompt = `Analise o uso de CRM pelas incorporadoras brasileiras no canal de parcerias.
Identifique os CRMs mais usados, limitações e insights.
Retorne APENAS um JSON válido:
{
  "crms": [{"nome": "CV CRM", "percentual": 30}, ...],
  "problemas": ["problema 1"],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "desafios":
      prompt = `Analise os textos descritivos sobre desafios de incorporadoras brasileiras no canal de parcerias.
Agrupe os temas recorrentes e gere insights estratégicos.
Retorne APENAS um JSON válido:
{
  "temas": [{"nome": "Falta de engajamento dos corretores", "percentual": 70, "exemplos": ["exemplo 1"]}, ...],
  "insights": ["insight estratégico 1", "insight 2"]
}

Dados (respostas de texto livre dos consultores):
${JSON.stringify(data)}`;
      break;

    case "expectativa":
      prompt = `Analise as expectativas para os próximos 12 meses descritas por incorporadoras brasileiras no canal de parcerias.
Identifique os temas de crescimento, preocupações e metas recorrentes.
Retorne APENAS um JSON válido:
{
  "temas": [{"nome": "Aumentar base de corretores ativos", "percentual": 60}, ...],
  "oportunidades": ["oportunidade 1"],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "observacoes":
      prompt = `Analise as observações gerais de consultores sobre incorporadoras brasileiras no canal de parcerias.
Extraia padrões, pontos críticos e recomendações recorrentes.
Retorne APENAS um JSON válido:
{
  "padroes": [{"nome": "Equipe comercial pequena", "percentual": 55}, ...],
  "pontosAtencao": ["ponto 1"],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    case "concorrente":
      prompt = `Analise as informações sobre concorrência descritas por incorporadoras brasileiras no canal de parcerias.
Identifique os principais concorrentes mencionados, dinâmicas de mercado e padrões.
Retorne APENAS um JSON válido:
{
  "concorrentes": [{"nome": "Incorporadora X", "mencoes": 5, "contexto": "Briga por corretores ativos"},...],
  "dinamicas": ["dinâmica de mercado 1"],
  "insights": ["insight 1"]
}

Dados:
${JSON.stringify(data)}`;
      break;

    default:
      return NextResponse.json({ error: "Tipo de análise não suportado" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "Erro na API de IA" }, { status: 500 });
    }

    const result = await response.json();
    const text = result.content[0]?.text || "{}";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI analyze error:", error);
    return NextResponse.json({ error: "Erro ao processar análise de IA" }, { status: 500 });
  }
}
