"""Geração de copy via Anthropic API — validado no MASTER §5.3"""
import json
import anthropic

client = anthropic.Anthropic()


def gerar_copy(briefing: dict, executivo: dict) -> dict:
    prompt = f"""
Você é um copywriter de campanhas imobiliárias de alto padrão.

Briefing:
- Tipo: {briefing['tipo']}
- Cliente/Incorporadora: {briefing['cliente']}
- Empreendimento: {briefing['empreendimento']}
- Mensagem principal: {briefing.get('copy_base', '')}
- Data/local evento: {briefing.get('data_evento', '')}

Executivo que assina: {executivo['nome']}

Gere copy em 3 formatos. Retorne APENAS JSON válido:
{{
  "story": {{
    "tagline": "frase curta e elegante sobre o produto",
    "headline_parte1": "Você está",
    "headline_parte2": "convidado.",
    "subtitulo": "Lançamento exclusivo · Corretores · DATA · HORA",
    "tag": "Evento"
  }},
  "post": {{
    "headline": "frase principal sem destaque",
    "destaque": "palavra ou trecho em destaque (cor primária)",
    "subtitulo": "Produto · Local · Data",
    "tag": "Pré-lançamento"
  }},
  "email": {{
    "assunto": "máx 55 chars",
    "pre_header": "máx 90 chars",
    "headline": "título do email",
    "paragrafo_1": "abertura com gancho",
    "paragrafo_2": "desenvolvimento",
    "paragrafo_3": "urgência/exclusividade",
    "cta_texto": "Confirmar presença",
    "destaque_evento": {{
      "label": "Evento de lançamento",
      "data_hora": "02 de abril · 19h00",
      "local": "Meia Praia · Itapema / SC"
    }}
  }}
}}

Regras:
- Tom: direto, confiante, sem exageros. Alto padrão imobiliário.
- NUNCA use: "incrível", "imperdível", "oportunidade única", "sonho realizado"
- Headline do story em linha única (white-space: nowrap)
- Todos os textos em português
"""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
