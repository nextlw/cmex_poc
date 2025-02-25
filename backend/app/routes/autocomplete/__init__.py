# Bibliotecas
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import time

# Utils
from ...config import supabase

# Schemas
from ...schemas.autocomplete import ConsultaAutocomplete
from ...schemas.pesquisas import RegistroPesquisas

# Cria um router para o endpoint /queries
autocomplete_router = APIRouter()

# POST /api/queries
@autocomplete_router.post("/autocomplete")
async def post_queries(consulta_produto: ConsultaAutocomplete, request: Request):

    # Buscar pesquisas recentes com o termo de consulta
    res_select_pesquisas = (
        supabase.table("pesquisas")
        .select("*")
        .ilike("consulta", f"%{consulta_produto.consulta}%")
        .eq("autocomplete", False)
        .order("criado_em", desc=True)
        .limit(5)
        .execute()
    )
    
    return res_select_pesquisas
