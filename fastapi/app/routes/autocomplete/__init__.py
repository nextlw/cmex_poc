# Bibliotecas
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import time

# Schemas
from ...schemas.autocomplete import ConsultaAutocomplete

# Cria um router para o endpoint /queries
autocomplete_router = APIRouter()

# POST /api/autocomplete
@autocomplete_router.post("/autocomplete")
async def post_queries(consulta_produto: ConsultaAutocomplete, request: Request):
    # Por enquanto, retorna uma lista vazia
    # TODO: Implementar a lógica de autocomplete sem depender do Supabase
    return {
        "data": []
    }
