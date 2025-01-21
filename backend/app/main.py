# Bibliotecas
import os
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .routes.historico import historico_router
from .routes.queries import queries_router
from app.middlewares.auth_middleware import AuthMiddleware
from app.exceptions import *
from .config import SETTINGS

# Inicializa uma instância do FastAPI.
# Todas as rotas com prefixo /api
app = FastAPI(root_path="/api")


# Configurações do endpoint raiz /api
@app.get("/")
@app.head("/")
async def root():
    """Rota raiz para verificar se a API está disponível"""
    return JSONResponse(
        status_code=200,
        content={"message": "A API está funcionando :)"},
    )


# Configurações de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=SETTINGS.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware de autenticação
app.add_middleware(AuthMiddleware)


# Handlers globais de erro
app.add_exception_handler(404, not_found_handler)
app.add_exception_handler(405, method_not_allowed_handler)
app.add_exception_handler(422, validation_exception_handler)


# Adicionando especificamente o handler para RequestValidationError
@app.exception_handler(RequestValidationError)
async def custom_validation_error_handler(
    request: Request, exc: RequestValidationError
):
    return await validation_exception_handler(request, exc)


# Inclui os roteadores no app
app.include_router(historico_router)
app.include_router(queries_router)


# Roda o servidor
if __name__ == "__main__":
    
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=10000)

    # python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 10000
