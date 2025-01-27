# Bibliotecas
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


# Tipagem
class RegistroPesquisas(BaseModel):
    id_usuario: str
    id_produto: Optional[str] = None
    modelo: str
    consulta: str
    resultado: Optional[List[Dict]] = None
    duracao_da_query: Optional[float] = None
    avaliado_em: Optional[datetime] = None
    avaliacao: Optional[bool] = None
    comentarios: Optional[Dict] = None
    # criado_em: datetime -> preenchido automaticamente no Supabase

    class Config:
        from_attributes = True
