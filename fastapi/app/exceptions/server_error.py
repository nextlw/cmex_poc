# Bibliotecas
from fastapi import Request
from fastapi.responses import JSONResponse
from ..models.error import Erro, ErrorDetail


# Handler do erro
async def internal_server_error_handler(request: Request, exc: Exception):
    # Detalhamento do erro
    error_detail = ErrorDetail(
        loc=["server", "internal_error"],
        msg="Ocorreu um erro inesperado no servidor",
        type="error.internal_server_error",
        ctx=None,
    )

    # Criar o erro no padrão estabelecido
    erro = Erro(
        status_code=500,
        errors=[error_detail],
        message="Erro interno no servidor",
        error_type="internal_server_error",
    )

    # Retornar o erro no formato desejado
    return JSONResponse(
        status_code=erro.status_code, 
        content=erro.model_dump()
    )
