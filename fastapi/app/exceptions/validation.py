# Bibliotecas
from fastapi import Request
from fastapi.responses import JSONResponse
from ..models.error import Erro, ErrorDetail
from fastapi.exceptions import RequestValidationError


# Handler do erro
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Transformar os detalhes do erro do FastAPI para o modelo personalizado
    erros = [
        ErrorDetail(
            loc=error["loc"], 
            msg=error["msg"], 
            type=error["type"], 
            ctx=error.get("ctx")
        )
        for error in exc.errors()
    ]

    erro = Erro(
        status_code=422, 
        errors=erros, 
        message="Erro de validação nos dados enviados",
        error_type="validation"
    )

    # Retornar como resposta JSON
    return JSONResponse(status_code=erro.status_code, content=erro.model_dump())
