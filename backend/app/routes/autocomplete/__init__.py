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
    
    # Inicia o timer
    start_time = time.perf_counter()
    
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
    
    # Compila os resultados em um só
    dados = [item for d in res_select_pesquisas.data for item in d["resultado"]]
    
    # Finaliza o timer
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    
    # Monta o registro que será adicionado na tabela do Supabase
    novo_registro_pesquisas = RegistroPesquisas(
        id_usuario=request.state.user.id,
        id_produto=None,  # TODO:
        modelo="Autocomplete",
        consulta=consulta_produto.consulta,
        resultado=dados,
        duracao_da_query=elapsed_time,
        autocomplete=True
    ).model_dump()

    # Salva a consulta na DB de pesquisas
    res_insert_pesquisas = (
        supabase.table("pesquisas").insert(novo_registro_pesquisas).execute()
    )
    
    return res_select_pesquisas
