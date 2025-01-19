# Bibliotecas
from pydantic import BaseModel, Field
from typing import List, Union, Dict, Optional, Any


# Detalhes do erro (validação ou outros tipos)
class ErrorDetail(BaseModel):
    loc: List[Union[str, int]] = Field(
        ..., description="Localização do campo ou recurso que causou o erro"
    )
    msg: str = Field(..., description="Mensagem descritiva do erro")
    type: str = Field(..., description="Tipo do erro (ex: 'value_error.missing')")
    ctx: Optional[Dict[str, Any]] = Field(
        None, description="Contexto adicional do erro (opcional)"
    )


# Tipagem genérica de erro
class Erro(BaseModel):
    status_code: int = Field(..., description="Código HTTP do erro")
    errors: List[ErrorDetail] = Field(..., description="Lista de erros detalhados")
    message: Optional[str] = Field(
        None, description="Detalhes adicionais sobre o erro (opcional)"
    )
    error_type: Optional[str] = Field(
        None,
        description="Tipo geral do erro (ex: 'validation', 'authentication', 'server')",
    )
