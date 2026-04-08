# DWV Campaign Studio — Master Reference

> Este arquivo é a referência única para o Claude Code construir o DWV Campaign Studio.
> Leia do início ao fim antes de escrever qualquer linha de código.

---

## 1. O QUE É O SISTEMA

Software web para geração e **edição conversacional** de campanhas imobiliárias.

A operadora:
1. Preenche um briefing (cliente, executivo, tipo de campanha)
2. O sistema gera automaticamente: **Story 1080×1920**, **Post 1080×1080** e **E-mail HTML**
3. Ela vê o resultado e refina por chat: "aumenta a logo", "muda o CTA para vermelho", "o nome do executivo está pequeno"
4. O sistema aplica a mudança e regenera — igual ao que acontece numa conversa com o Claude

---

## 2. STACK TÉCNICA

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend / API | FastAPI (Python) |
| Geração de imagens | Playwright + Chromium → PNG |
| IA conversacional | Anthropic API (claude-sonnet-4-5) |
| Banco de dados | PostgreSQL (Supabase) |
| Storage de arquivos | Supabase Storage |
| Deploy frontend | Vercel |
| Deploy backend | Railway ou Render |
| Autenticação | Supabase Auth |

---

## 3. ARQUITETURA

```
Frontend (Next.js)
  /login
  /dashboard          → lista campanhas recentes
  /executivos         → CRUD executivos com upload de foto
  /campanha/nova      → briefing → geração → chat+preview
  /campanha/[id]      → edição conversacional de campanha existente

Backend (FastAPI)
  POST /campaign/generate    → gera story + post + email
  POST /campaign/edit        → aplica edição por prompt
  GET  /campaign/{id}/files  → URLs dos arquivos gerados
  CRUD /executivos           → gerencia perfis

Supabase
  Auth · PostgreSQL · Storage (fotos, PNGs gerados)

Anthropic API
  Gera copy (copy-writer)
  Interpreta pedidos de edição e modifica HTML
```

---

## 4. MODELO DE DADOS (PostgreSQL)

```sql
CREATE TABLE executivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT DEFAULT 'Executivo de Parcerias',
  regiao TEXT,
  whatsapp TEXT,
  email TEXT,
  foto_b64 TEXT,        -- base64 da foto, salvo no upload
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users,
  executivo_id UUID REFERENCES executivos,
  tipo TEXT,            -- lancamento / case / educativo / evento
  cliente TEXT,
  empreendimento TEXT,
  briefing JSONB,
  copy JSONB,
  status TEXT DEFAULT 'rascunho',
  criada_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES campanhas,
  formato TEXT,         -- story / post / email
  versao INTEGER DEFAULT 1,
  html TEXT,            -- HTML fonte completo com base64 embutido
  arquivo_url TEXT,     -- URL do PNG/HTML no Supabase Storage
  is_atual BOOLEAN DEFAULT TRUE,
  criada_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id UUID REFERENCES campanhas,
  formato TEXT,         -- story / post / email / geral
  role TEXT,            -- user / assistant
  conteudo TEXT,
  criada_em TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. CÓDIGO PYTHON VALIDADO

Todo este código foi testado e aprovado. Use exatamente estes padrões.

### 5.1 Conversão HTML → PNG (Playwright)

```python
from playwright.sync_api import sync_playwright
from uuid import uuid4
import os

def html_to_png(html: str, width: int, height: int, output_path: str):
    tmp_path = f"/tmp/render_{uuid4()}.html"
    with open(tmp_path, "w") as f:
        f.write(html)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(f"file://{tmp_path}")
        page.wait_for_timeout(3000)  # CRÍTICO: aguarda Google Fonts
        page.screenshot(path=output_path, full_page=False)
        browser.close()
    os.remove(tmp_path)
```

### 5.2 Utilitários de imagem

```python
import urllib.request, base64, numpy as np, io
from PIL import Image

headers = {'User-Agent': 'Mozilla/5.0'}

def get_b64(url: str, mime: str) -> str:
    """Baixa imagem e retorna data URI base64."""
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as r:
        return f"data:{mime};base64," + base64.b64encode(r.read()).decode()

def make_white_logo(url: str) -> str:
    """Converte logo escura para branca, preservando transparência."""
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as r:
        data = r.read()
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    arr = np.array(img)
    arr[:,:,0] = 255; arr[:,:,1] = 255; arr[:,:,2] = 255
    buf = io.BytesIO()
    Image.fromarray(arr, "RGBA").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

def encode_exec_photo(foto_b64: str) -> str:
    """Recorta quadrado centrado no rosto, redimensiona para 300x300px."""
    header, data = foto_b64.split(",", 1)
    img = Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
    w, h = img.size
    size = min(w, h)
    left = (w - size) // 2
    top = max(0, int(h * 0.02))
    img = img.crop((left, top, left + size, top + size)).resize((300, 300), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

def exec_placeholder_svg(nome: str, cor_hex: str = "#E8392A") -> str:
    """Gera placeholder SVG com iniciais quando não há foto."""
    iniciais = "".join(p[0].upper() for p in nome.strip().split()[:2])
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
      <circle cx="60" cy="60" r="60" fill="{cor_hex}"/>
      <text x="60" y="75" text-anchor="middle" font-family="Arial"
            font-size="40" font-weight="bold" fill="white">{iniciais}</text>
    </svg>'''
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()

def inspect_logo_color(url: str) -> bool:
    """Retorna True se a logo for escura (deve ser convertida para branca)."""
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as r:
        img = Image.open(io.BytesIO(r.read())).convert("RGBA")
    arr = np.array(img)
    opaque = arr[arr[:,:,3] > 128]
    if len(opaque) == 0:
        return False
    return float(opaque[:, :3].mean()) < 128
```

### 5.3 Geração de copy (Anthropic API)

```python
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
        messages=[{"role": "user", "content": prompt}]
    )
    import json
    text = response.content[0].text
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
```

### 5.4 Edição conversacional (Anthropic API)

```python
def aplicar_edicao(html_atual: str, mensagem: str, formato: str) -> str:
    """Interpreta pedido em linguagem natural e modifica o HTML."""
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
        messages=[{"role": "user", "content": prompt}]
    )
    html = response.content[0].text
    if "```html" in html:
        html = html.split("```html")[1].split("```")[0].strip()
    return html
```

---

## 6. TEMPLATES HTML APROVADOS

Estes templates foram aprovados visualmente. Use-os como base obrigatória.
As variáveis em {MAIUSCULAS} devem ser substituídas pelo código Python.

### 6.1 Story (1080×1920px)

```html
<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--gold:#C9A96E;--dark:#0A0A0A;--white:#FFFFFF;}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;overflow:hidden;background:var(--dark);font-family:'Syne',sans-serif;}
.story{width:1080px;height:1920px;position:relative;overflow:hidden;}
.bg{position:absolute;top:0;left:0;width:100%;height:1060px;object-fit:cover;object-position:center top;}
.overlay{position:absolute;top:0;left:0;width:100%;height:1060px;background:linear-gradient(to bottom,rgba(10,10,10,.1) 0%,rgba(10,10,10,.05) 35%,rgba(10,10,10,.85) 80%,rgba(10,10,10,1) 100%);}
.logo-sp{position:absolute;top:72px;left:72px;height:52px;z-index:10;}
.tag{position:absolute;top:72px;right:72px;background:var(--gold);color:var(--dark);font-size:22px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;padding:12px 28px;z-index:10;}
.content{position:absolute;bottom:0;left:0;width:100%;height:920px;background:var(--dark);padding:44px 72px 56px;display:flex;flex-direction:column;justify-content:space-between;}
.divider{width:80px;height:3px;background:var(--gold);margin-bottom:28px;}
.logo-org{height:150px;object-fit:contain;object-position:left center;margin-bottom:20px;}
.tagline{font-family:'Playfair Display',serif;font-style:italic;font-size:28px;color:var(--gold);margin-bottom:12px;line-height:1.3;}
.headline{font-family:'Playfair Display',serif;font-size:88px;font-weight:900;color:var(--white);line-height:1.0;white-space:nowrap;margin-bottom:8px;}
.headline span{color:var(--gold);}
.subtitle{font-size:22px;font-weight:400;color:rgba(255,255,255,.45);letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px;}

/* STATS — centralizados, largura total */
.stats-box{display:flex;align-items:stretch;justify-content:space-between;width:100%;padding:28px 0;background:rgba(201,169,110,.06);border-top:1px solid rgba(201,169,110,.2);border-bottom:1px solid rgba(201,169,110,.2);margin-bottom:28px;}
.stat-item{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:6px;}
.stat-sep{width:1px;background:rgba(201,169,110,.2);}
.stat-val{font-family:'Playfair Display',serif;font-size:48px;font-weight:700;color:var(--gold);line-height:1;}
.stat-label{font-size:17px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.1em;text-transform:uppercase;}

/* EXEC */
.exec-block{display:flex;align-items:center;gap:20px;padding:24px 32px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.2);border-radius:4px;}
.exec-foto{width:96px;height:96px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--gold);flex-shrink:0;}
.exec-divider{width:1px;height:80px;background:rgba(201,169,110,.25);flex-shrink:0;}
.exec-info{display:flex;flex-direction:column;gap:4px;}
.exec-name{font-size:26px;font-weight:800;color:var(--white);}
.exec-role{font-size:15px;color:rgba(255,255,255,.4);}
.exec-contacts{display:flex;align-items:center;gap:20px;margin-top:6px;}
.exec-contact{font-size:20px;font-weight:700;color:var(--gold);}
</style></head><body><div class="story">
<img class="bg" src="{BASE64_PLACEHOLDER}"/>
<div class="overlay"></div>
<img class="logo-sp" src="{BASE64_PLACEHOLDER}"/>
<div class="tag">Evento</div>
<div class="content">
  <div>
    <div class="divider"></div>
    <img class="logo-org" src="{BASE64_PLACEHOLDER}"/>
    <div class="tagline">A expressão do modernismo</div>
    <div class="headline">Você está <span>convidado.</span></div>
    <div class="subtitle">Lançamento exclusivo · Corretores · 02 ABR · 19h00</div>
  </div>
  <div>
    <div class="stats-box">
      <div class="stat-item"><span class="stat-val">50</span><span class="stat-label">Pavimentos</span></div>
      <div class="stat-sep"></div>
      <div class="stat-item"><span class="stat-val">82</span><span class="stat-label">Unidades</span></div>
      <div class="stat-sep"></div>
      <div class="stat-item"><span class="stat-val">4</span><span class="stat-label">Suítes</span></div>
      <div class="stat-sep"></div>
      <div class="stat-item"><span class="stat-val">360°</span><span class="stat-label">Vista</span></div>
    </div>
    <div class="exec-block">
      <img class="exec-foto" src="{BASE64_PLACEHOLDER}"/>
      <div class="exec-divider"></div>
      <div class="exec-info">
        <span class="exec-name">Diogo Westphal</span>
        <span class="exec-role">Executivo de Parcerias · Sunprime</span>
        <div class="exec-contacts">
          <span class="exec-contact">+55 47 99999-0003</span>
          <span class="exec-contact">diogo@dwvapp.com.br</span>
        </div>
      </div>
    </div>
  </div>
</div>
</div></body></html>
```

### 6.2 Post Instagram (1080×1080px)

```html
<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--gold:#C9A96E;--dark:#0A0A0A;--white:#FFFFFF;}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1080px;overflow:hidden;background:var(--dark);font-family:'Syne',sans-serif;}
.post{width:1080px;height:1080px;position:relative;overflow:hidden;}
.bg{position:absolute;top:0;left:0;width:100%;height:540px;object-fit:cover;object-position:center 30%;}
.overlay{position:absolute;top:0;left:0;width:100%;height:540px;background:linear-gradient(to bottom,rgba(10,10,10,.1) 0%,rgba(10,10,10,.6) 70%,rgba(10,10,10,1) 100%);}
.logo-sp{position:absolute;top:32px;left:40px;height:36px;z-index:10;}
.tag{position:absolute;top:32px;right:40px;background:var(--gold);color:var(--dark);font-size:15px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;padding:8px 20px;z-index:10;}
.content{position:absolute;bottom:0;left:0;width:100%;height:560px;background:var(--dark);padding:22px 48px 26px;display:flex;flex-direction:column;justify-content:space-between;}
.logo-org{height:110px;object-fit:contain;object-position:left bottom;margin-bottom:8px;}
.headline{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--white);line-height:1.0;white-space:nowrap;margin-bottom:5px;}
.headline span{color:var(--gold);}
.sub{font-size:16px;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px;}

/* STATS — largura total, centralizados */
.stats-box{display:flex;align-items:stretch;justify-content:space-between;width:100%;padding:18px 0;background:rgba(201,169,110,.06);border-top:1px solid rgba(201,169,110,.2);border-bottom:1px solid rgba(201,169,110,.2);margin-bottom:16px;}
.stat-item{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:3px;}
.stat-sep{width:1px;background:rgba(201,169,110,.2);}
.stat-val{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:var(--gold);line-height:1;}
.stat-label{font-size:12px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:.08em;text-transform:uppercase;}

/* EXEC */
.exec-block{display:flex;align-items:center;gap:18px;padding:16px 24px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.2);border-radius:4px;}
.exec-foto{width:72px;height:72px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid var(--gold);flex-shrink:0;}
.exec-divider{width:1px;height:58px;background:rgba(201,169,110,.25);flex-shrink:0;}
.exec-name{font-size:20px;font-weight:800;color:var(--white);}
.exec-role{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;}
.exec-contacts{display:flex;align-items:center;gap:16px;margin-top:5px;}
.exec-contact{font-size:15px;font-weight:700;color:var(--gold);}
.cta{background:var(--gold);color:var(--dark);font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:12px 22px;white-space:nowrap;align-self:center;flex-shrink:0;}
</style></head><body><div class="post">
<img class="bg" src="{BASE64_PLACEHOLDER}"/>
<div class="overlay"></div>
<img class="logo-sp" src="{BASE64_PLACEHOLDER}"/>
<div class="tag">Pré-lançamento</div>
<div class="content">
  <div>
    <img class="logo-org" src="{BASE64_PLACEHOLDER}"/>
    <div class="headline">O modernismo chegou em <span>Itapema.</span></div>
    <div class="sub">Orgânica · Meia Praia · 02 de abril</div>
    <div class="stats-box">
      <div class="stat-item"><span class="stat-val">50</span><span class="stat-label">Pavimentos</span></div>
      <div class="stat-sep"></div>
      <div class="stat-item"><span class="stat-val">82</span><span class="stat-label">Unidades</span></div>
      <div class="stat-sep"></div>
      <div class="stat-item"><span class="stat-val">4</span><span class="stat-label">Suítes</span></div>
      <div class="stat-sep"></div>
      <div class="stat-item"><span class="stat-val">360°</span><span class="stat-label">Vista</span></div>
    </div>
  </div>
  <div class="exec-block">
    <img class="exec-foto" src="{BASE64_PLACEHOLDER}"/>
    <div class="exec-divider"></div>
    <div style="flex:1;">
      <div class="exec-name">Diogo Westphal</div>
      <div class="exec-role">Executivo de Parcerias · Sunprime</div>
      <div class="exec-contacts">
        <span class="exec-contact">+55 47 99999-0003</span>
        <span class="exec-contact">diogo@dwvapp.com.br</span>
      </div>
    </div>
    <div class="cta">Quero<br>saber mais</div>
  </div>
</div>
</div></body></html>
```

### 6.3 E-mail Marketing (HTML)

```html
<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Orgânica | Pré-lançamento exclusivo · 02 de abril</title></head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede8;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0A0A0A;max-width:600px;width:100%;">

  <!-- HEADER logo Sunprime -->
  <tr><td align="center" style="padding:36px 40px 28px;">
    <img src="{BASE64_PLACEHOLDER}" height="44" alt="Sunprime" style="display:block;">
  </td></tr>

  <!-- BANNER -->
  <tr><td style="padding:0;">
    <img src="{BASE64_PLACEHOLDER}" width="600" alt="Orgânica" style="display:block;width:100%;max-width:600px;">
  </td></tr>

  <!-- LOGO ORGÂNICA -->
  <tr><td align="left" style="padding:36px 48px 0;">
    <img src="{BASE64_PLACEHOLDER}" height="64" alt="Orgânica" style="display:block;">
  </td></tr>

  <!-- CORPO -->
  <tr><td style="padding:24px 48px 36px;">
    <h1 style="margin:0 0 20px;font-size:30px;line-height:1.2;color:#FFFFFF;font-weight:700;font-family:Georgia,serif;">
      Um convite exclusivo para você ser o primeiro a conhecer.
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(255,255,255,0.65);font-family:Arial,sans-serif;">
      O Orgânica é um dos projetos mais aguardados de Itapema — 50 pavimentos com vista 360°, assinatura de Leonardo Zanatta (Forbes Under 30) e paisagismo do Escritório Burle Marx.
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(255,255,255,0.65);font-family:Arial,sans-serif;">
      Antes da abertura ao mercado, estamos convidando corretores selecionados para conhecer o produto em primeira mão — com toda a estrutura para fechar negócio com seus clientes.
    </p>

    <!-- Destaque evento -->
    <table cellpadding="0" cellspacing="0" style="margin:28px 0;padding:24px 28px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;color:#C9A96E;letter-spacing:.15em;text-transform:uppercase;font-family:Arial,sans-serif;">Evento de lançamento</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;font-family:Georgia,serif;">02 de abril · 19h00</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">Meia Praia · Itapema / SC · Exclusivo para corretores</p>
      </td></tr>
    </table>

    <p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:rgba(255,255,255,0.65);font-family:Arial,sans-serif;">
      Vagas limitadas. Confirme sua presença pelo botão abaixo.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:#C9A96E;border-radius:4px;">
        <a href="https://api.whatsapp.com/send?phone=5547999990003&text=Quero+confirmar+minha+presen%C3%A7a+no+evento+Org%C3%A2nica"
           style="display:block;padding:16px 40px;font-size:16px;font-weight:700;color:#0A0A0A;text-decoration:none;letter-spacing:.04em;font-family:Arial,sans-serif;">
          Confirmar presença
        </a>
      </td></tr>
    </table>
  </td></tr>

  <!-- DIVISOR -->
  <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;"></td></tr>

  <!-- ASSINATURA EXECUTIVO -->
  <tr><td style="padding:28px 48px;">
    <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;font-family:Arial,sans-serif;">Fale diretamente com o responsável</p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:18px;vertical-align:middle;">
          <img src="{BASE64_PLACEHOLDER}" width="60" height="60"
            style="display:block;border-radius:50%;border:2px solid #C9A96E;object-fit:cover;"
            alt="Diogo Westphal">
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:17px;font-weight:700;color:#FFFFFF;font-family:Georgia,serif;">Diogo Westphal</p>
          <p style="margin:3px 0 0;font-size:13px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">Executivo de Parcerias · Sunprime</p>
          <p style="margin:8px 0 2px;font-size:14px;color:#C9A96E;font-family:Arial,sans-serif;">+55 47 99999-0003</p>
          <p style="margin:0;font-size:14px;color:#C9A96E;font-family:Arial,sans-serif;">diogo@dwvapp.com.br</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- FOOTER SUNPRIME -->
  <tr><td style="padding:20px 48px 28px;background:rgba(0,0,0,0.3);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <img src="{BASE64_PLACEHOLDER}" height="28" alt="Sunprime" style="display:block;opacity:0.6;">
        </td>
        <td align="right" style="font-size:11px;color:rgba(255,255,255,0.25);font-family:Arial,sans-serif;vertical-align:middle;">
          sunprime.com.br
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr></table>
</body></html>
```

---

## 7. REGRAS DE NEGÓCIO CRÍTICAS

### 7.1 Imagens
- **NUNCA** use URLs externas em `src` de `<img>` no HTML que será renderizado pelo Playwright
- Sempre baixar e converter para base64 antes de montar o HTML
- Logo escura em fundo escuro → usar `make_white_logo()`
- Foto do executivo → sempre passar por `encode_exec_photo()` para recortar o rosto
- Sem foto → usar `exec_placeholder_svg()`

### 7.2 Cargo do executivo nas peças
- Sempre: `{cargo} · {nome_da_incorporadora}` → ex: "Executivo de Parcerias · Sunprime"
- **Nunca** referenciar DWV nas peças de campanha
- O campo `cargo` no banco é o cargo base — concatenar com a incorporadora na hora de montar

### 7.3 Rodapé do e-mail
- Sempre logo + site da **incorporadora cliente**
- Nunca logo DWV no rodapé

### 7.4 Contatos do executivo
- Telefone **E** e-mail devem aparecer na mesma linha no bloco de assinatura

### 7.5 Stats do empreendimento
- Centralizados de margem a margem (`flex:1` em cada item)
- Separadores verticais entre cada dado
- Fundo sutil com borda na cor primária

### 7.6 Headline
- Sempre em **linha única** (`white-space: nowrap`)
- Ajustar font-size se o texto for longo

### 7.7 Playwright
- `wait_for_timeout(3000)` é **obrigatório** — não reduzir (aguarda Google Fonts)
- Salvar HTML em arquivo temporário, nunca usar `page.set_content()`

### 7.8 Palavras proibidas na copy
"incrível", "imperdível", "oportunidade única", "sonho realizado"

---

## 8. TAMANHOS MÍNIMOS OBRIGATÓRIOS

| Elemento | Story | Post | E-mail |
|---|---|---|---|
| Logo incorporadora | 52px | 36px | 44px |
| Logo empreendimento | **150px** | **110px** | 64px |
| Foto executivo | **96px** | **72px** | 60px |
| Nome executivo | 26px bold | 20px bold | 17px bold |
| Contato executivo | 20px | 15px | 14px |

---

## 9. FLUXO DE GERAÇÃO

```
1. Receber briefing (tipo, cliente, empreendimento, executivo_id, url_site)
2. Buscar executivo no banco → carregar foto_b64
3. Se url_site fornecida → web_fetch para coletar logos e imagens
4. Baixar e converter todas as imagens para base64
5. Chamar gerar_copy() → receber copy para story, post e email
6. Montar HTML do story (usando template 6.1)
7. Montar HTML do post (usando template 6.2)
8. Montar HTML do email (usando template 6.3)
9. html_to_png(story_html, 1080, 1920) → story.png
10. html_to_png(post_html, 1080, 1080) → post.png
11. Salvar story.png, post.png, email.html no Supabase Storage
12. Salvar HTMLs completos na tabela `pecas` (para edição futura)
13. Retornar URLs dos arquivos para o frontend
```

---

## 10. FLUXO DE EDIÇÃO CONVERSACIONAL

```
1. Operadora envia mensagem: "aumenta a logo do empreendimento"
2. Backend recebe: campanha_id, formato (story/post/email), mensagem
3. Buscar HTML atual da peça na tabela `pecas`
4. Chamar aplicar_edicao(html_atual, mensagem, formato)
5. Receber HTML modificado
6. Se formato = story → html_to_png(novo_html, 1080, 1920)
7. Se formato = post  → html_to_png(novo_html, 1080, 1080)
8. Salvar nova versão na tabela `pecas` (incrementar versao)
9. Upload do novo PNG para Supabase Storage
10. Retornar URL do novo arquivo para o frontend atualizar o preview
```

---

## 11. TELAS DO SISTEMA

### /login
- E-mail + senha via Supabase Auth

### /dashboard
- Lista de campanhas recentes (nome, data, status)
- Botão "Nova campanha"
- Link para /executivos

### /executivos
- Lista com busca por nome/região
- Card por executivo: foto (ou iniciais), nome, cargo, status ativo/inativo
- Formulário: nome, cargo, WhatsApp, e-mail, região, upload de foto
- Upload de foto: FileReader → base64 → salvar no campo foto_b64 do banco
- Ativar/desativar sem apagar

### /campanha/nova
Passo 1 — Briefing:
```
Tipo:          [lançamento ▼]
Incorporadora: [Sunprime        ]
Empreendimento:[Orgânica        ]
URL do site:   [sunprime.com.br ]  → coleta logos automaticamente
Executivo:     [Diogo Westphal ▼]
Mensagem base: [textarea        ]
Data do evento:[02/04  19:00    ]  (visível só se tipo = evento)
Stats:         [50 Pavimentos] [82 Unidades] [4 Suítes] [360° Vista]
               (campo dinâmico — adicionar/remover)
[Gerar campanha →]
```

Passo 2 — Chat + Preview:
- Layout dividido: chat (esquerda) + preview em abas story/post/email (direita)
- Spinner enquanto gera
- Cada aba mostra a imagem PNG ou HTML renderizado
- Botão de download por peça
- Campo de chat para refinamentos

### /campanha/[id]
- Mesmo layout de chat + preview
- Histórico de mensagens persistido
- Dropdown para selecionar qual peça está editando (story / post / email)

---

## 12. IDENTIDADE VISUAL DO SISTEMA

A interface do próprio software usa a identidade DWV:
- Fundo: `#080808`
- Vermelho DWV: `#E8392A`
- Branco: `#FFFFFF`
- Logo DWV: `https://site.dwvapp.com.br/wp-content/uploads/2025/07/cropped-cropped-Prancheta-1@2x-8.png`

---

## 13. ESTRUTURA DE PASTAS

```
dwv-campaign-studio/
├── frontend/                    # Next.js 14
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── executivos/page.tsx
│   │   └── campanha/
│   │       ├── nova/page.tsx
│   │       └── [id]/page.tsx
│   ├── components/
│   │   ├── ChatPanel.tsx        # chat + envio de mensagens
│   │   ├── PreviewPanel.tsx     # abas story/post/email + download
│   │   ├── BriefingForm.tsx     # formulário de briefing
│   │   ├── ExecutivoCard.tsx    # card de executivo
│   │   └── StatsInput.tsx      # campo dinâmico de stats
│   └── lib/api.ts               # chamadas ao backend
│
├── backend/                     # FastAPI
│   ├── main.py
│   ├── routers/
│   │   ├── campanhas.py
│   │   └── executivos.py
│   ├── services/
│   │   ├── generator.py         # monta HTMLs com base nos templates
│   │   ├── playwright_render.py # html_to_png()
│   │   ├── image_utils.py       # get_b64, make_white_logo, encode_exec_photo
│   │   ├── copy_writer.py       # gerar_copy() via Anthropic API
│   │   └── editor.py            # aplicar_edicao() via Anthropic API
│   ├── templates/
│   │   ├── story.html           # template validado seção 6.1
│   │   ├── post.html            # template validado seção 6.2
│   │   └── email.html           # template validado seção 6.3
│   └── models/schemas.py
│
└── supabase/
    └── migrations/001_initial.sql
```

---

## 14. PROMPT DE PARTIDA PARA O CLAUDE CODE

Cole este prompt ao abrir o projeto no Claude Code:

```
Leia o arquivo DWV_CAMPAIGN_STUDIO_MASTER.md do início ao fim antes de escrever qualquer código.

Quero construir o DWV Campaign Studio conforme especificado. O arquivo contém:
- Arquitetura completa
- Código Python testado e aprovado (use exatamente esses padrões)
- Templates HTML validados visualmente (não invente layout — use os da seção 6)
- Regras de negócio críticas
- Estrutura de pastas

Comece criando a estrutura de pastas e o ambiente de desenvolvimento.
Instale as dependências necessárias.
Em seguida, implemente o backend (FastAPI) com os serviços de geração.
Depois implemente o frontend (Next.js).
Por fim, configure Supabase e variáveis de ambiente.
```

---

## 15. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Backend
BACKEND_URL=http://localhost:8000
```
