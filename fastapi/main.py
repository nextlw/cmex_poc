from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Adiciona o diretório app ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importa a aplicação FastAPI do módulo app.main
from app.main import app as fastapi_app

# Reexporta a aplicação
app = fastapi_app

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direciona para o módulo app.main
# Em vez de tentar incluir um router que não existe,
# vamos apenas criar um endpoint básico para teste
@app.get("/")
def read_root():
    return {"message": "Redirecionando para a API principal na rota /api"}

@app.get("/api")
def read_api_root():
    return {"message": "API de Busca Inteligente está funcionando!"} 