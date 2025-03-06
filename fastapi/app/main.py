# Bibliotecas
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Configurações do projeto
from .config import SETTINGS

# Middlewares e handlers de erros
from app.middlewares.auth_middleware import AuthMiddleware
from app.exceptions import *

# Routers
from .routes.queries import queries_router
from .routes.autocomplete import autocomplete_router

# Inicializa uma instância do FastAPI.
# Todas as rotas com prefixo /api
app = FastAPI(
    title=SETTINGS.PROJECT_NAME, openapi_url=f"{SETTINGS.API_V1_STR}/openapi.json"
)

# Configurações de CORS - Permitindo TODOS os origens para teste
app.add_middleware(
    CORSMiddleware,
    allow_origins=SETTINGS.BACKEND_CORS_ORIGINS,  # Usando as origens definidas nas configurações
    allow_credentials=True,
    allow_methods=SETTINGS.CORS_ALLOW_METHODS,  # Usando os métodos definidos nas configurações
    allow_headers=SETTINGS.CORS_ALLOW_HEADERS,  # Usando os headers definidos nas configurações
    expose_headers=SETTINGS.CORS_EXPOSE_HEADERS,  # Usando os headers de exposição definidos nas configurações
    max_age=SETTINGS.CORS_MAX_AGE,  # Usando o tempo máximo definido nas configurações
)

# Middleware para aumentar o timeout das respostas
@app.middleware("http")
async def add_timeout_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Keep-Alive"] = "timeout=600"  # 10 minutos
    return response

# Middleware de autenticação
app.add_middleware(AuthMiddleware)


# Configurações do endpoint raiz /api
@app.get("/")
@app.head("/")
async def root():
    """Rota raiz para verificar se a API está disponível"""
    return JSONResponse(
        status_code=200,
        content={"message": "A API está funcionando :)"},
    )


# Handlers globais de erro
app.add_exception_handler(404, not_found_handler)
app.add_exception_handler(405, method_not_allowed_handler)
app.add_exception_handler(422, validation_exception_handler)
app.add_exception_handler(500, internal_server_error_handler)


# Adicionando especificamente o handler para RequestValidationError
@app.exception_handler(RequestValidationError)
async def custom_validation_error_handler(
    request: Request, exc: RequestValidationError
):
    return await validation_exception_handler(request, exc)


# Inclui os roteadores no app
app.include_router(queries_router, prefix=SETTINGS.API_V1_STR)
app.include_router(autocomplete_router, prefix=SETTINGS.API_V1_STR)

# Roda o servidor
if __name__ == "__main__":

    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=10000)

    # python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 10000
