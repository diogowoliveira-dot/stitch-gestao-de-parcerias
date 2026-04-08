import os
import uuid
from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from models.schemas import CampanhaCreate, EditRequest, EditResponse
from services.copy_gen import gerar_copy
from services.templates import build_story, build_post, build_email
from services.render import render_story, render_post
from services.images import prepare_logo, get_b64
from services.edit import aplicar_edicao

router = APIRouter(prefix="/campaign", tags=["campaigns"])

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

LOGO_SP_URL = os.environ.get("LOGO_SUNPRIME_URL", "")
STORAGE_BUCKET = os.environ.get("SUPABASE_BUCKET", "campanhas")


def _upload_file(local_path: str, dest_path: str) -> str:
    with open(local_path, "rb") as f:
        supabase.storage.from_(STORAGE_BUCKET).upload(dest_path, f, {"content-type": "image/png"})
    res = supabase.storage.from_(STORAGE_BUCKET).get_public_url(dest_path)
    return res


def _upload_html(html: str, dest_path: str) -> str:
    supabase.storage.from_(STORAGE_BUCKET).upload(
        dest_path, html.encode(), {"content-type": "text/html"}
    )
    return supabase.storage.from_(STORAGE_BUCKET).get_public_url(dest_path)


@router.post("/generate")
def gerar_campanha(payload: CampanhaCreate):
    # 1. Busca executivo
    exec_res = (
        supabase.table("executivos")
        .select("*")
        .eq("id", payload.executivo_id)
        .single()
        .execute()
    )
    if not exec_res.data:
        raise HTTPException(status_code=404, detail="Executivo não encontrado")
    executivo = exec_res.data
    briefing = payload.briefing.model_dump()

    # 2. Gera copy com IA
    copy = gerar_copy(briefing, executivo)

    # 3. Prepara imagens em base64
    b64_logo_sp = prepare_logo(LOGO_SP_URL) if LOGO_SP_URL else ""
    b64_logo_org = prepare_logo(briefing["url_logo_incorporadora"]) if briefing.get("url_logo_incorporadora") else ""
    b64_img = get_b64(briefing["url_imagem_produto"], "image/jpeg") if briefing.get("url_imagem_produto") else ""

    # 4. Monta HTMLs
    html_story = build_story(copy, executivo, briefing, b64_logo_sp, b64_logo_org, b64_img)
    html_post = build_post(copy, executivo, briefing, b64_logo_sp, b64_logo_org, b64_img)
    html_email = build_email(copy, executivo, briefing, b64_logo_sp, b64_logo_org, b64_img)

    # 5. Cria campanha no banco
    campanha_res = supabase.table("campanhas").insert({
        "executivo_id": payload.executivo_id,
        "tipo": briefing["tipo"],
        "cliente": briefing["cliente"],
        "empreendimento": briefing["empreendimento"],
        "briefing": briefing,
        "copy": copy,
        "status": "rascunho",
    }).execute()
    campanha_id = campanha_res.data[0]["id"]

    pecas = []
    for formato, html in [("story", html_story), ("post", html_post), ("email", html_email)]:
        # Upload HTML
        html_path = f"{campanha_id}/{formato}_v1.html"
        html_url = _upload_html(html, html_path)

        png_url = None
        if formato in ("story", "post"):
            tmp_png = f"/tmp/{uuid.uuid4()}.png"
            try:
                if formato == "story":
                    render_story(html, tmp_png)
                else:
                    render_post(html, tmp_png)
                png_path = f"{campanha_id}/{formato}_v1.png"
                png_url = _upload_file(tmp_png, png_path)
            finally:
                if os.path.exists(tmp_png):
                    os.remove(tmp_png)

        peca_res = supabase.table("pecas").insert({
            "campanha_id": campanha_id,
            "formato": formato,
            "versao": 1,
            "html": html,
            "arquivo_url": png_url or html_url,
            "is_atual": True,
        }).execute()
        pecas.append({
            "formato": formato,
            "html": html,
            "arquivo_url": png_url or html_url,
            "id": peca_res.data[0]["id"],
        })

    return {"campanha_id": campanha_id, "pecas": pecas, "copy": copy}


@router.post("/edit", response_model=EditResponse)
def editar_peca(payload: EditRequest):
    # Busca peça atual
    peca_res = (
        supabase.table("pecas")
        .select("*")
        .eq("campanha_id", payload.campanha_id)
        .eq("formato", payload.formato)
        .eq("is_atual", True)
        .single()
        .execute()
    )
    if not peca_res.data:
        raise HTTPException(status_code=404, detail="Peça não encontrada")
    peca = peca_res.data

    # Salva mensagem do usuário
    supabase.table("mensagens").insert({
        "campanha_id": payload.campanha_id,
        "formato": payload.formato,
        "role": "user",
        "conteudo": payload.mensagem,
    }).execute()

    # Aplica edição com IA
    novo_html = aplicar_edicao(peca["html"], payload.mensagem, payload.formato)

    nova_versao = peca["versao"] + 1
    campanha_id = payload.campanha_id
    formato = payload.formato

    # Upload do novo HTML
    html_path = f"{campanha_id}/{formato}_v{nova_versao}.html"
    _upload_html(novo_html, html_path)

    png_url = None
    if formato in ("story", "post"):
        tmp_png = f"/tmp/{uuid.uuid4()}.png"
        try:
            if formato == "story":
                render_story(novo_html, tmp_png)
            else:
                render_post(novo_html, tmp_png)
            png_path = f"{campanha_id}/{formato}_v{nova_versao}.png"
            png_url = _upload_file(tmp_png, png_path)
        finally:
            if os.path.exists(tmp_png):
                os.remove(tmp_png)

    arquivo_url = png_url or html_path

    # Desativa versão anterior
    supabase.table("pecas").update({"is_atual": False}).eq("id", peca["id"]).execute()

    # Insere nova versão
    supabase.table("pecas").insert({
        "campanha_id": campanha_id,
        "formato": formato,
        "versao": nova_versao,
        "html": novo_html,
        "arquivo_url": arquivo_url,
        "is_atual": True,
    }).execute()

    # Salva resposta do assistente
    supabase.table("mensagens").insert({
        "campanha_id": campanha_id,
        "formato": formato,
        "role": "assistant",
        "conteudo": f"Alteração aplicada: {payload.mensagem}",
    }).execute()

    return EditResponse(html=novo_html, arquivo_url=arquivo_url)


@router.get("/{campanha_id}/files")
def arquivos_campanha(campanha_id: str):
    res = (
        supabase.table("pecas")
        .select("formato, versao, arquivo_url, html, is_atual")
        .eq("campanha_id", campanha_id)
        .eq("is_atual", True)
        .execute()
    )
    return res.data


@router.get("/{campanha_id}/mensagens")
def mensagens_campanha(campanha_id: str, formato: str = "geral"):
    res = (
        supabase.table("mensagens")
        .select("*")
        .eq("campanha_id", campanha_id)
        .eq("formato", formato)
        .order("criada_em")
        .execute()
    )
    return res.data


@router.get("/")
def listar_campanhas():
    res = (
        supabase.table("campanhas")
        .select("id, tipo, cliente, empreendimento, status, criada_em, executivos(nome)")
        .order("criada_em", desc=True)
        .limit(50)
        .execute()
    )
    return res.data
