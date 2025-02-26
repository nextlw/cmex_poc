# Bibliotecas
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from ..models.error import Erro, ErrorDetail

async def method_not_allowed_handler(request: Request, exc: StarletteHTTPException):
    # Detalhamento do erro
    error_detail = ErrorDetail(
        loc=["path", "method_not_allowed"],  # Localização genérica para "método não permitido"
        msg="Método não permitido",
        type="error.method_not_allowed",
        ctx=None
    )

    # Criar o erro no padrão estabelecido
    erro = Erro(
        status_code=405,
        errors=[error_detail],
        message="Método HTTP não permitido para esta URL",
        error_type="method_not_allowed"
    )

    # Retornar o erro no formato desejado
    return JSONResponse(status_code=erro.status_code, content=erro.model_dump())
