# Bibliotecas
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import time

# Utils
from .claude import obter_sugestoes_claude
from .gemini import obter_sugestoes_gemini
from .gpt import obter_sugestoes_gpt4
from .deepseek import obter_sugestoes_deepseek
from .qwen import obter_sugestoes_qwen
from ...config import supabase

# Schemas
from ...models.error import Erro, ErrorDetail
from ...models.schemas import ConsultaProduto
from ...schemas.pesquisas import RegistroPesquisas

# Cria um router para o endpoint /queries
queries_router = APIRouter()

# Define as funções a serem chamadas de acordo com o modelo recebido
funcoes_modelos = {
    "Nexcode-0.1-BETA": obter_sugestoes_gemini,
    "Nex-0.1-Pro-2024": obter_sugestoes_gpt4,
    "Nex-0.3-Preview-2024": obter_sugestoes_claude,
    "Nex-0.5-Preview-2025": obter_sugestoes_deepseek,
    "Qwen2.5-7b-instruct-1m": obter_sugestoes_qwen,
}


# POST /api/queries
@queries_router.post("/queries")
async def post_queries(consulta_produto: ConsultaProduto, request: Request):
    
    # Inicia o timer
    start_time = time.perf_counter()

    # TODO: GET /products
    # Verifica se o produto já existe no banco de dados
    from requests.models import Response

    produto = Response()
    produto.status_code = 500
    produto._content = b'{ "ncm" : "a", "descricao" : "b" }'

    # Verifica se o produto existe no banco de dados
    if produto.ok:

        # Monta o retorno da API com o produto encontrado
        sugestao_ncm = produto.json()
    else:

        # Seleciona a função a ser executada de acordo com o modelo
        funcao_escolhida = funcoes_modelos.get(consulta_produto.modelo)

        # Verifica se o modelo escolhido é válido
        if not funcao_escolhida:

            # Monta o erro
            error = Erro(
                status_code=400,
                errors=[
                    ErrorDetail(
                        loc=["body", "modelo"],
                        msg="Modelo não encontrado ou inválido.",
                        type="error.invalid_value",
                        ctx={"valor_fornecido": consulta_produto.modelo},
                    )
                ],
                message="Modelo inválido ou inválido.",
                error_type="invalid_value",
            )

            # Retorna o erro com o status e o conteúdo especificado
            return JSONResponse(
                status_code=error.status_code, content=error.model_dump()
            )

        # Executa a função de IA
        sugestao_ncm = await funcao_escolhida(consulta_produto)

    # TODO: validar o sugestao_ncm da função e retornar de acordo com o fluxo correto

    # TODO: Salvar na DB de produtos do supabase

    # TODO: validar com o William o formato de output das funções. Elas estão
    # retornando listas, mas acredito que deveria ser um SugerirNCM só
    
    # Finaliza o timer
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time

    # Monta o registro que será adicionado na tabela do Supabase
    novo_registro_pesquisas = RegistroPesquisas(
        id_usuario=request.state.user.id,
        id_produto=None,  # TODO:
        modelo=consulta_produto.modelo,
        consulta=consulta_produto.consulta,
        resultado=sugestao_ncm,  # TODO:
        duracao_da_query=elapsed_time,
        autocomplete=False
    ).model_dump()

    # Salva a consulta na DB de pesquisas
    res_sb_pesquisas = (
        supabase.table("pesquisas").insert(novo_registro_pesquisas).execute()
    )

    # Envia o resultado de volta para o frontend
    return sugestao_ncm


# GET /api/queries
@queries_router.get("/queries")
async def get_queries(request: Request):

    # Recupera o ID do usuário
    id_usuario = request.state.user.id

    # Importa o histórico de pesquisa do usuário
    res_sb_pesquisas = (
        supabase.table("pesquisas")
        .select("*")
        .eq("id_usuario", id_usuario)
        .order("criado_em", desc=True)
        .execute()
    )

    return res_sb_pesquisas
