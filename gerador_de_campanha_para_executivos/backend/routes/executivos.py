from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import base64
import os
from supabase import create_client, Client
from models.schemas import ExecutivoCreate, ExecutivoOut
from services.images import encode_exec_photo

router = APIRouter(prefix="/executivos", tags=["executivos"])

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)


@router.get("/", response_model=list[ExecutivoOut])
def listar_executivos():
    res = supabase.table("executivos").select("*").eq("ativo", True).order("nome").execute()
    return res.data


@router.get("/{executivo_id}", response_model=ExecutivoOut)
def obter_executivo(executivo_id: str):
    res = supabase.table("executivos").select("*").eq("id", executivo_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Executivo não encontrado")
    return res.data


@router.post("/", response_model=ExecutivoOut, status_code=201)
async def criar_executivo(
    nome: str = Form(...),
    cargo: str = Form("Executivo de Parcerias"),
    regiao: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
):
    foto_b64 = None
    if foto:
        raw = await foto.read()
        mime = foto.content_type or "image/jpeg"
        b64_raw = f"data:{mime};base64," + base64.b64encode(raw).decode()
        foto_b64 = encode_exec_photo(b64_raw)

    payload = {
        "nome": nome,
        "cargo": cargo,
        "regiao": regiao,
        "whatsapp": whatsapp,
        "email": email,
        "foto_b64": foto_b64,
        "ativo": True,
    }
    res = supabase.table("executivos").insert(payload).execute()
    return res.data[0]


@router.put("/{executivo_id}", response_model=ExecutivoOut)
async def atualizar_executivo(
    executivo_id: str,
    nome: Optional[str] = Form(None),
    cargo: Optional[str] = Form(None),
    regiao: Optional[str] = Form(None),
    whatsapp: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    foto: Optional[UploadFile] = File(None),
):
    payload: dict = {}
    if nome:
        payload["nome"] = nome
    if cargo:
        payload["cargo"] = cargo
    if regiao is not None:
        payload["regiao"] = regiao
    if whatsapp is not None:
        payload["whatsapp"] = whatsapp
    if email is not None:
        payload["email"] = email
    if foto:
        raw = await foto.read()
        mime = foto.content_type or "image/jpeg"
        b64_raw = f"data:{mime};base64," + base64.b64encode(raw).decode()
        payload["foto_b64"] = encode_exec_photo(b64_raw)

    if not payload:
        raise HTTPException(status_code=400, detail="Nenhum campo enviado")

    res = supabase.table("executivos").update(payload).eq("id", executivo_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Executivo não encontrado")
    return res.data[0]


@router.delete("/{executivo_id}", status_code=204)
def desativar_executivo(executivo_id: str):
    supabase.table("executivos").update({"ativo": False}).eq("id", executivo_id).execute()
