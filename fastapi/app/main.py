# Bibliotecas
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
from datetime import datetime

# Configurações do projeto
from .config import SETTINGS

# Middlewares e handlers de erros
from app.middlewares.auth_middleware import AuthMiddleware
from app.exceptions import *

# Routers
from .routes.queries import queries_router
from .routes.autocomplete import autocomplete_router

# Serviço Redis
from app.services.redis_service import (
    start_redis_listener,
    publish_model_selection,
    get_task_updates,
    get_query_results
)

# Inicializa uma instância do FastAPI.
# Todas as rotas com prefixo /api
app = FastAPI(
    title=SETTINGS.PROJECT_NAME, 
    description="API para consulta e gerenciamento de NCM utilizando IA",
    version="1.0.0",
    openapi_url=f"{SETTINGS.API_V1_STR}/openapi.json",
    docs_url=f"{SETTINGS.API_V1_STR}/docs",
    redoc_url=f"{SETTINGS.API_V1_STR}/redoc"
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

# Iniciar listener Redis na inicialização
@app.on_event("startup")
async def startup_event():
    start_redis_listener()
    print("Serviço Redis inicializado com sucesso")

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


# Rota para processar consulta com modelo específico
@app.post(f"{SETTINGS.API_V1_STR}/query")
async def process_query(request: Request):
    try:
        data = await request.json()
        query = data.get("query")
        model = data.get("model", "default")
        
        if not query:
            return JSONResponse(
                status_code=400,
                content={"error": "Consulta não fornecida"}
            )
        
        # Gerar ID de requisição único
        request_id = str(uuid.uuid4())
        
        # Publicar seleção de modelo via Redis
        publish_model_selection(request_id, model, query)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Consulta enviada para processamento",
                "requestId": request_id
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Rota para verificar status da consulta
@app.get(f"{SETTINGS.API_V1_STR}/query-status/{{request_id}}")
async def get_query_status(request_id: str):
    updates = get_task_updates(request_id)
    results = get_query_results(request_id)
    
    if results:
        return JSONResponse(
            status_code=200,
            content={
                "status": "completed",
                "results": results
            }
        )
    
    if not updates.get("updates"):
        return JSONResponse(
            status_code=404,
            content={
                "status": "not_found",
                "message": "Consulta não encontrada"
            }
        )
    
    return JSONResponse(
        status_code=200,
        content={
            "status": "in_progress",
            "updates": updates.get("updates", [])[-5:]  # Retornar apenas as 5 últimas atualizações
        }
    )

# Inclui os roteadores no app
app.include_router(queries_router, prefix=SETTINGS.API_V1_STR)
app.include_router(autocomplete_router, prefix=SETTINGS.API_V1_STR)

# Roda o servidor
if __name__ == "__main__":

    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=10000)

    # python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 10000
