# Bibliotecas
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Tipagem
class ErrorDetail(BaseModel):
    loc: List[str] = Field(..., description="Localização do campo que causou o erro")
    msg: str = Field(..., description="Mensagem de erro")
    type: str = Field(..., description="Tipo de erro")
    ctx: Optional[Dict[str, Any]] = Field(None, description="Contexto adicional do erro (opcional)")

class Erro(BaseModel):
    status_code: int = Field(..., description="Código HTTP do erro")
    errors: List[ErrorDetail] = Field(..., description="Lista de erros detalhados")
    message: Optional[str] = Field(None, description="Detalhes adicionais sobre o erro (opcional)")
