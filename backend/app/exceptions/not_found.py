# Bibliotecas
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from ..models.error import Erro, ErrorDetail


# Handler do erro
async def not_found_handler(request: Request, exc: StarletteHTTPException):
    # Detalhamento do erro
    error_detail = ErrorDetail(
        loc=["path", "not_found"],  # Localização genérica para "página não encontrada"
        msg="Página não encontrada",
        type="error.not_found",
        ctx=None,
    )

    # Criar o erro no padrão estabelecido
    erro = Erro(
        status_code=404,
        errors=[error_detail],
        message="Página solicitada não foi encontrada",
        error_type="not_found",
    )

    # Retornar o erro no formato desejado
    return JSONResponse(status_code=erro.status_code, content=erro.model_dump())
