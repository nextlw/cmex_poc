from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ncm_validation

app = FastAPI(title="API de Busca Inteligente")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(ncm_validation.router) 