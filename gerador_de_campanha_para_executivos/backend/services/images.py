"""Utilitários de imagem — validados no DWV_CAMPAIGN_STUDIO_MASTER.md §5.2"""
import urllib.request
import base64
import io
import numpy as np
from PIL import Image


_HEADERS = {"User-Agent": "Mozilla/5.0"}


def get_b64(url: str, mime: str) -> str:
    """Baixa imagem de uma URL e retorna data URI base64."""
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        return f"data:{mime};base64," + base64.b64encode(r.read()).decode()


def make_white_logo(url: str) -> str:
    """Converte logo escura para branca, preservando canal alpha."""
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req) as r:
        data = r.read()
    img = Image.open(io.BytesIO(data)).convert("RGBA")
    arr = np.array(img)
    arr[:, :, 0] = 255
    arr[:, :, 1] = 255
    arr[:, :, 2] = 255
    buf = io.BytesIO()
    Image.fromarray(arr, "RGBA").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def encode_exec_photo(foto_b64: str) -> str:
    """Recorta quadrado centrado no rosto, redimensiona para 300×300px."""
    header, data = foto_b64.split(",", 1)
    img = Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")
    w, h = img.size
    size = min(w, h)
    left = (w - size) // 2
    top = max(0, int(h * 0.02))
    img = img.crop((left, top, left + size, top + size)).resize(
        (300, 300), Image.LANCZOS
    )
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
    req = urllib.request.Request(url, headers=_HEADERS)
    with urllib.request.urlopen(req) as r:
        img = Image.open(io.BytesIO(r.read())).convert("RGBA")
    arr = np.array(img)
    opaque = arr[arr[:, :, 3] > 128]
    if len(opaque) == 0:
        return False
    return float(opaque[:, :3].mean()) < 128


def prepare_logo(url: str) -> str:
    """Baixa logo e converte para branca se necessário."""
    if inspect_logo_color(url):
        return make_white_logo(url)
    return get_b64(url, "image/png")
