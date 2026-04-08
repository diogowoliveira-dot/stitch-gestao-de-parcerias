"""
Montagem dos templates HTML aprovados com as variáveis substituídas.
Templates validados no DWV_CAMPAIGN_STUDIO_MASTER.md §6.
"""
from services.images import (
    prepare_logo,
    get_b64,
    encode_exec_photo,
    exec_placeholder_svg,
)


def _exec_foto(executivo: dict) -> str:
    if executivo.get("foto_b64"):
        return encode_exec_photo(executivo["foto_b64"])
    return exec_placeholder_svg(executivo["nome"])


def _stats_html_story(stats: dict | None) -> str:
    if not stats:
        return ""
    items = []
    for label, val in stats.items():
        items.append(
            f'<div class="stat-item">'
            f'<span class="stat-val">{val}</span>'
            f'<span class="stat-label">{label}</span>'
            f"</div>"
        )
    html_items = '<div class="stat-sep"></div>'.join(items)
    return f'<div class="stats-box">{html_items}</div>'


def _stats_html_post(stats: dict | None) -> str:
    if not stats:
        return ""
    items = []
    for label, val in stats.items():
        items.append(
            f'<div class="stat-item">'
            f'<span class="stat-val">{val}</span>'
            f'<span class="stat-label">{label}</span>'
            f"</div>"
        )
    html_items = '<div class="stat-sep"></div>'.join(items)
    return f'<div class="stats-box">{html_items}</div>'


def build_story(
    copy: dict,
    executivo: dict,
    briefing: dict,
    b64_logo_sp: str,
    b64_logo_org: str,
    b64_img_produto: str,
) -> str:
    c = copy["story"]
    exec_foto = _exec_foto(executivo)
    cargo_linha = f"{executivo['cargo']} · {briefing['cliente']}"
    stats_html = _stats_html_story(briefing.get("stats"))
    whatsapp = executivo.get("whatsapp", "")
    email = executivo.get("email", "")

    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{{--gold:#C9A96E;--dark:#0A0A0A;--white:#FFFFFF;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:1080px;height:1920px;overflow:hidden;background:var(--dark);font-family:'Syne',sans-serif;}}
.story{{width:1080px;height:1920px;position:relative;overflow:hidden;}}
.bg{{position:absolute;top:0;left:0;width:100%;height:1060px;object-fit:cover;object-position:center top;}}
.overlay{{position:absolute;top:0;left:0;width:100%;height:1060px;background:linear-gradient(to bottom,rgba(10,10,10,.1) 0%,rgba(10,10,10,.05) 35%,rgba(10,10,10,.85) 80%,rgba(10,10,10,1) 100%);}}
.logo-sp{{position:absolute;top:72px;left:72px;height:52px;z-index:10;}}
.tag{{position:absolute;top:72px;right:72px;background:var(--gold);color:var(--dark);font-size:22px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;padding:12px 28px;z-index:10;}}
.content{{position:absolute;bottom:0;left:0;width:100%;height:920px;background:var(--dark);padding:44px 72px 56px;display:flex;flex-direction:column;justify-content:space-between;}}
.divider{{width:80px;height:3px;background:var(--gold);margin-bottom:28px;}}
.logo-org{{height:150px;object-fit:contain;object-position:left center;margin-bottom:20px;}}
.tagline{{font-family:'Playfair Display',serif;font-style:italic;font-size:28px;color:var(--gold);margin-bottom:12px;line-height:1.3;}}
.headline{{font-family:'Playfair Display',serif;font-size:88px;font-weight:900;color:var(--white);line-height:1.0;white-space:nowrap;margin-bottom:8px;}}
.headline span{{color:var(--gold);}}
.subtitle{{font-size:22px;font-weight:400;color:rgba(255,255,255,.45);letter-spacing:.08em;text-transform:uppercase;margin-bottom:28px;}}
.stats-box{{display:flex;align-items:stretch;justify-content:space-between;width:100%;padding:28px 0;background:rgba(201,169,110,.06);border-top:1px solid rgba(201,169,110,.2);border-bottom:1px solid rgba(201,169,110,.2);margin-bottom:28px;}}
.stat-item{{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:6px;}}
.stat-sep{{width:1px;background:rgba(201,169,110,.2);}}
.stat-val{{font-family:'Playfair Display',serif;font-size:48px;font-weight:700;color:var(--gold);line-height:1;}}
.stat-label{{font-size:17px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.1em;text-transform:uppercase;}}
.exec-block{{display:flex;align-items:center;gap:20px;padding:24px 32px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.2);border-radius:4px;}}
.exec-foto{{width:96px;height:96px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid var(--gold);flex-shrink:0;}}
.exec-divider{{width:1px;height:80px;background:rgba(201,169,110,.25);flex-shrink:0;}}
.exec-info{{display:flex;flex-direction:column;gap:4px;}}
.exec-name{{font-size:26px;font-weight:800;color:var(--white);}}
.exec-role{{font-size:15px;color:rgba(255,255,255,.4);}}
.exec-contacts{{display:flex;align-items:center;gap:20px;margin-top:6px;}}
.exec-contact{{font-size:20px;font-weight:700;color:var(--gold);}}
</style></head><body><div class="story">
<img class="bg" src="{b64_img_produto}"/>
<div class="overlay"></div>
<img class="logo-sp" src="{b64_logo_sp}"/>
<div class="tag">{c['tag']}</div>
<div class="content">
  <div>
    <div class="divider"></div>
    <img class="logo-org" src="{b64_logo_org}"/>
    <div class="tagline">{c['tagline']}</div>
    <div class="headline">{c['headline_parte1']} <span>{c['headline_parte2']}</span></div>
    <div class="subtitle">{c['subtitulo']}</div>
  </div>
  <div>
    {stats_html}
    <div class="exec-block">
      <img class="exec-foto" src="{exec_foto}"/>
      <div class="exec-divider"></div>
      <div class="exec-info">
        <span class="exec-name">{executivo['nome']}</span>
        <span class="exec-role">{cargo_linha}</span>
        <div class="exec-contacts">
          <span class="exec-contact">{whatsapp}</span>
          <span class="exec-contact">{email}</span>
        </div>
      </div>
    </div>
  </div>
</div>
</div></body></html>"""


def build_post(
    copy: dict,
    executivo: dict,
    briefing: dict,
    b64_logo_sp: str,
    b64_logo_org: str,
    b64_img_produto: str,
) -> str:
    c = copy["post"]
    exec_foto = _exec_foto(executivo)
    cargo_linha = f"{executivo['cargo']} · {briefing['cliente']}"
    stats_html = _stats_html_post(briefing.get("stats"))
    whatsapp = executivo.get("whatsapp", "")
    email = executivo.get("email", "")

    # headline com destaque
    headline_full = c["headline"]
    destaque = c.get("destaque", "")
    if destaque and destaque in headline_full:
        headline_html = headline_full.replace(destaque, f"<span>{destaque}</span>", 1)
    else:
        headline_html = headline_full

    return f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
:root{{--gold:#C9A96E;--dark:#0A0A0A;--white:#FFFFFF;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{width:1080px;height:1080px;overflow:hidden;background:var(--dark);font-family:'Syne',sans-serif;}}
.post{{width:1080px;height:1080px;position:relative;overflow:hidden;}}
.bg{{position:absolute;top:0;left:0;width:100%;height:540px;object-fit:cover;object-position:center 30%;}}
.overlay{{position:absolute;top:0;left:0;width:100%;height:540px;background:linear-gradient(to bottom,rgba(10,10,10,.1) 0%,rgba(10,10,10,.6) 70%,rgba(10,10,10,1) 100%);}}
.logo-sp{{position:absolute;top:32px;left:40px;height:36px;z-index:10;}}
.tag{{position:absolute;top:32px;right:40px;background:var(--gold);color:var(--dark);font-size:15px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;padding:8px 20px;z-index:10;}}
.content{{position:absolute;bottom:0;left:0;width:100%;height:560px;background:var(--dark);padding:22px 48px 26px;display:flex;flex-direction:column;justify-content:space-between;}}
.logo-org{{height:110px;object-fit:contain;object-position:left bottom;margin-bottom:8px;}}
.headline{{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:var(--white);line-height:1.0;white-space:nowrap;margin-bottom:5px;}}
.headline span{{color:var(--gold);}}
.sub{{font-size:16px;color:rgba(255,255,255,.45);letter-spacing:.06em;text-transform:uppercase;margin-bottom:14px;}}
.stats-box{{display:flex;align-items:stretch;justify-content:space-between;width:100%;padding:18px 0;background:rgba(201,169,110,.06);border-top:1px solid rgba(201,169,110,.2);border-bottom:1px solid rgba(201,169,110,.2);margin-bottom:16px;}}
.stat-item{{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:3px;}}
.stat-sep{{width:1px;background:rgba(201,169,110,.2);}}
.stat-val{{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:var(--gold);line-height:1;}}
.stat-label{{font-size:12px;font-weight:600;color:rgba(255,255,255,.35);letter-spacing:.08em;text-transform:uppercase;}}
.exec-block{{display:flex;align-items:center;gap:18px;padding:16px 24px;background:rgba(255,255,255,.04);border:1px solid rgba(201,169,110,.2);border-radius:4px;}}
.exec-foto{{width:72px;height:72px;border-radius:50%;object-fit:cover;object-position:center top;border:2px solid var(--gold);flex-shrink:0;}}
.exec-divider{{width:1px;height:58px;background:rgba(201,169,110,.25);flex-shrink:0;}}
.exec-name{{font-size:20px;font-weight:800;color:var(--white);}}
.exec-role{{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px;}}
.exec-contacts{{display:flex;align-items:center;gap:16px;margin-top:5px;}}
.exec-contact{{font-size:15px;font-weight:700;color:var(--gold);}}
.cta{{background:var(--gold);color:var(--dark);font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:12px 22px;white-space:nowrap;align-self:center;flex-shrink:0;}}
</style></head><body><div class="post">
<img class="bg" src="{b64_img_produto}"/>
<div class="overlay"></div>
<img class="logo-sp" src="{b64_logo_sp}"/>
<div class="tag">{c['tag']}</div>
<div class="content">
  <div>
    <img class="logo-org" src="{b64_logo_org}"/>
    <div class="headline">{headline_html}</div>
    <div class="sub">{c['subtitulo']}</div>
    {stats_html}
  </div>
  <div class="exec-block">
    <img class="exec-foto" src="{exec_foto}"/>
    <div class="exec-divider"></div>
    <div style="flex:1;">
      <div class="exec-name">{executivo['nome']}</div>
      <div class="exec-role">{cargo_linha}</div>
      <div class="exec-contacts">
        <span class="exec-contact">{whatsapp}</span>
        <span class="exec-contact">{email}</span>
      </div>
    </div>
    <div class="cta">Quero<br>saber mais</div>
  </div>
</div>
</div></body></html>"""


def build_email(
    copy: dict,
    executivo: dict,
    briefing: dict,
    b64_logo_sp: str,
    b64_logo_org: str,
    b64_img_produto: str,
) -> str:
    c = copy["email"]
    de = c["destaque_evento"]
    exec_foto = _exec_foto(executivo)
    cargo_linha = f"{executivo['cargo']} · {briefing['cliente']}"
    whatsapp_raw = (executivo.get("whatsapp") or "").replace("+", "").replace(" ", "").replace("-", "")
    cta_link = f"https://api.whatsapp.com/send?phone={whatsapp_raw}&text=Quero+confirmar+minha+presen%C3%A7a"

    return f"""<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>{briefing['empreendimento']} | {c['assunto']}</title></head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede8;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0A0A0A;max-width:600px;width:100%;">

  <tr><td align="center" style="padding:36px 40px 28px;">
    <img src="{b64_logo_sp}" height="44" alt="Sunprime" style="display:block;">
  </td></tr>

  <tr><td style="padding:0;">
    <img src="{b64_img_produto}" width="600" alt="{briefing['empreendimento']}" style="display:block;width:100%;max-width:600px;">
  </td></tr>

  <tr><td align="left" style="padding:36px 48px 0;">
    <img src="{b64_logo_org}" height="64" alt="{briefing['empreendimento']}" style="display:block;">
  </td></tr>

  <tr><td style="padding:24px 48px 36px;">
    <h1 style="margin:0 0 20px;font-size:30px;line-height:1.2;color:#FFFFFF;font-weight:700;font-family:Georgia,serif;">
      {c['headline']}
    </h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(255,255,255,0.65);font-family:Arial,sans-serif;">
      {c['paragrafo_1']}
    </p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(255,255,255,0.65);font-family:Arial,sans-serif;">
      {c['paragrafo_2']}
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:28px 0;padding:24px 28px;background:rgba(201,169,110,0.08);border-left:3px solid #C9A96E;">
      <tr><td>
        <p style="margin:0 0 4px;font-size:12px;color:#C9A96E;letter-spacing:.15em;text-transform:uppercase;font-family:Arial,sans-serif;">{de['label']}</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#FFFFFF;font-family:Georgia,serif;">{de['data_hora']}</p>
        <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif;">{de['local']}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 32px;font-size:16px;line-height:1.75;color:rgba(255,255,255,0.65);font-family:Arial,sans-serif;">
      {c['paragrafo_3']}
    </p>

    <table cellpadding="0" cellspacing="0">
      <tr><td style="background:#C9A96E;border-radius:4px;">
        <a href="{cta_link}"
           style="display:block;padding:16px 40px;font-size:16px;font-weight:700;color:#0A0A0A;text-decoration:none;letter-spacing:.04em;font-family:Arial,sans-serif;">
          {c['cta_texto']}
        </a>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:0;"></td></tr>

  <tr><td style="padding:28px 48px;">
    <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.35);letter-spacing:.1em;text-transform:uppercase;font-family:Arial,sans-serif;">Fale diretamente com o responsável</p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:18px;vertical-align:middle;">
          <img src="{exec_foto}" width="60" height="60"
            style="display:block;border-radius:50%;border:2px solid #C9A96E;object-fit:cover;"
            alt="{executivo['nome']}">
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:17px;font-weight:700;color:#FFFFFF;font-family:Georgia,serif;">{executivo['nome']}</p>
          <p style="margin:3px 0 0;font-size:13px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">{cargo_linha}</p>
          <p style="margin:8px 0 2px;font-size:14px;color:#C9A96E;font-family:Arial,sans-serif;">{executivo.get('whatsapp', '')}</p>
          <p style="margin:0;font-size:14px;color:#C9A96E;font-family:Arial,sans-serif;">{executivo.get('email', '')}</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:20px 48px 28px;background:rgba(0,0,0,0.3);">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <img src="{b64_logo_org}" height="28" alt="{briefing['cliente']}" style="display:block;opacity:0.6;">
        </td>
        <td align="right" style="font-size:11px;color:rgba(255,255,255,0.25);font-family:Arial,sans-serif;vertical-align:middle;">
          {briefing['cliente'].lower().replace(' ', '')}.com.br
        </td>
      </tr>
    </table>
  </td></tr>

</table>
</td></tr></table>
</body></html>"""
