from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ExecutivoBase(BaseModel):
    nome: str
    cargo: str = "Executivo de Parcerias"
    regiao: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    ativo: bool = True


class ExecutivoCreate(ExecutivoBase):
    foto_b64: Optional[str] = None


class ExecutivoOut(ExecutivoBase):
    id: UUID
    foto_b64: Optional[str] = None
    criado_em: datetime

    class Config:
        from_attributes = True


class BriefingPayload(BaseModel):
    tipo: str                          # lancamento / case / educativo / evento
    cliente: str                       # nome da incorporadora
    empreendimento: str
    copy_base: Optional[str] = None
    data_evento: Optional[str] = None
    url_imagem_produto: Optional[str] = None
    url_logo_incorporadora: Optional[str] = None
    stats: Optional[dict] = None       # {"pavimentos": 50, "unidades": 82, ...}


class CampanhaCreate(BaseModel):
    executivo_id: str
    briefing: BriefingPayload


class CampanhaOut(BaseModel):
    id: UUID
    executivo_id: UUID
    tipo: str
    cliente: str
    empreendimento: str
    status: str
    criada_em: datetime

    class Config:
        from_attributes = True


class EditRequest(BaseModel):
    campanha_id: str
    formato: str        # story / post / email
    mensagem: str       # pedido em linguagem natural


class EditResponse(BaseModel):
    html: str
    arquivo_url: Optional[str] = None


class MensagemCreate(BaseModel):
    campanha_id: str
    formato: str
    role: str
    conteudo: str
