"""Edição conversacional de peças via Anthropic API — validado no MASTER §5.4"""
import anthropic

client = anthropic.Anthropic()


def aplicar_edicao(html_atual: str, mensagem: str, formato: str) -> str:
    """
    Interpreta pedido em linguagem natural e modifica o HTML da peça.
    Dimensões preservadas: story=1080×1920, post=1080×1080.
    """
    prompt = f"""
Você é um editor de HTML para peças de marketing imobiliário ({formato}).

Aplique APENAS a seguinte alteração ao HTML: {mensagem}

Exemplos de como interpretar pedidos:
- "aumenta a logo do empreendimento" → aumentar height da .logo-org em ~30%
- "muda o CTA para vermelho" → alterar background-color do .cta
- "o nome do executivo está pequeno" → aumentar font-size do .exec-name para 28-32px
- "troca o headline" → substituir texto dentro de .headline
- "aumenta a foto do executivo" → aumentar width/height do .exec-foto
- "muda a paleta para azul e branco" → alterar variáveis CSS --gold e usos diretos
- "remove o subtítulo" → adicionar display:none no .subtitle ou .tagline
- "centraliza o bloco do executivo" → alterar justify-content

Regras:
- Retorne APENAS o HTML completo modificado, sem explicações
- Mantenha todas as imagens em base64 intactas
- Aplique SOMENTE o que foi pedido, não mude mais nada
- Preserve dimensões: story=1080×1920, post=1080×1080

HTML atual:
{html_atual}
"""
    response = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}],
    )
    html = response.content[0].text
    if "```html" in html:
        html = html.split("```html")[1].split("```")[0].strip()
    return html
