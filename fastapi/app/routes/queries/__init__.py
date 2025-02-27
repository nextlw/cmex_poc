# Bibliotecas
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import time
import httpx
import json
import asyncio  # Importar asyncio no início do arquivo

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

# Função para validar a sugestão de NCM usando DeepResearch
async def validar_com_deepresearch(consulta: str, modelo: str, sugestao_ncm: list):
    try:
        # Endpoint da API Node.js para DeepResearch
        url = "http://localhost:3000/api/v1/query"
        
        # Extrai as informações para validação
        ncm_sugerido = sugestao_ncm[0].get("ncm", "") if sugestao_ncm else ""
        descricao = sugestao_ncm[0].get("descricao", "") if sugestao_ncm else ""
        
        # Prepara a pergunta para o DeepResearch com instruções detalhadas
        pergunta = f"""
        Valide se o NCM {ncm_sugerido} ({descricao}) está correto para o produto: {consulta}.
        
        Durante sua análise, informe cada etapa que está realizando:
        1. Quais fontes oficiais você está consultando
        2. Quais tabelas ou regras está verificando
        3. Se encontrou menções deste produto com esta NCM
        
        Finalize sua resposta com 'confirmado', 'negado' ou 'sugestão alternativa' seguido pela justificativa detalhada.
        """
        
        # Dados para a requisição incluindo o modelo selecionado e o nome do produto
        payload = {
            "q": pergunta,
            "modelo": modelo,
            "maxBadAttempt": 3,
            "productName": consulta,
            "ncmCode": ncm_sugerido,
            "returnPartialResults": True
        }
        
        print(f"[DeepResearch] Iniciando validação para: {consulta}")
        print(f"[DeepResearch] Payload: {payload}")
        
        async with httpx.AsyncClient() as client:
            # Faz a requisição para iniciar a validação - Removendo o timeout
            response = await client.post(url, json=payload)
            data = response.json()
            
            # Obtém o requestId para acompanhar o progresso
            request_id = data.get("requestId")
            
            print(f"[DeepResearch] Request ID: {request_id}")
            
            if not request_id:
                print("[DeepResearch] Falha ao obter requestId")
                return {
                    "status": "erro",
                    "mensagem": "Falha ao iniciar validação DeepResearch",
                    "sugestao_original": sugestao_ncm
                }
            
            # Adiciona o requestId e status inicial à sugestão
            for item in sugestao_ncm:
                item["validacao_deepresearch"] = {
                    "status": "pendente",
                    "mensagem": "Análise em andamento...",
                    "requestId": request_id,
                    "cor": "azul"
                }
            
            return sugestao_ncm
            
    except Exception as e:
        print(f"Erro no DeepResearch: {str(e)}")
        # Em caso de erro, retorna a sugestão original com indicação de erro
        for item in sugestao_ncm:
            item["validacao_deepresearch"] = {
                "status": "erro",
                "mensagem": f"Erro ao processar DeepResearch: {str(e)}",
                "cor": "cinza"
            }
        
        return sugestao_ncm


# POST /api/queries
@queries_router.post("/queries")
async def post_queries(consulta_produto: ConsultaProduto, request: Request):
    try:
        # Inicia o timer
        start_time = time.perf_counter()

        # Verifica se o usuário existe em request.state
        if not hasattr(request.state, 'user') or not request.state.user or not request.state.user.id:
            # Usuário não autenticado - criar um ID temporário para testes
            user_id = "guest-" + str(int(time.time()))
            print(f"Usuário não autenticado. Usando ID temporário: {user_id}")
        else:
            user_id = request.state.user.id

        # Seleciona a função a ser executada de acordo com o modelo
        funcao_escolhida = funcoes_modelos.get(consulta_produto.modelo)

        # Verifica se o modelo escolhido é válido
        if not funcao_escolhida:
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
            return JSONResponse(status_code=error.status_code, content=error.model_dump())

        # Executa a função de IA
        try:
            sugestao_ncm = await funcao_escolhida(consulta_produto)
        except Exception as e:
            print(f"Erro ao obter sugestões do modelo {consulta_produto.modelo}: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Erro ao processar o modelo: {str(e)}"}
            )

        # Se DeepResearch está ativado, inicia a validação
        if consulta_produto.useDeepResearch and sugestao_ncm:
            print(f"DeepResearch ativado para consulta: {consulta_produto.consulta}")
            try:
                sugestao_ncm = await validar_com_deepresearch(
                    consulta_produto.consulta,
                    consulta_produto.modelo,
                    sugestao_ncm
                )
            except Exception as e:
                print(f"Erro ao validar com DeepResearch: {str(e)}")
                for item in sugestao_ncm:
                    item["validacao_deepresearch"] = {
                        "status": "erro",
                        "mensagem": f"Erro na validação DeepResearch: {str(e)}",
                        "cor": "cinza"
                    }

        # Finaliza o timer
        end_time = time.perf_counter()
        elapsed_time = end_time - start_time

        # Monta o registro que será adicionado na tabela do Supabase
        try:
            novo_registro_pesquisas = RegistroPesquisas(
                id_usuario=user_id,
                id_produto=None,
                modelo=consulta_produto.modelo,
                consulta=consulta_produto.consulta,
                resultado=sugestao_ncm,
                duracao_da_query=elapsed_time,
                autocomplete=consulta_produto.autocomplete,
                useDeepResearch=consulta_produto.useDeepResearch
            ).model_dump()

            # Tenta salvar mas não impede o fluxo se falhar
            try:
                await supabase.table("pesquisas").insert(novo_registro_pesquisas).execute()
            except Exception as e:
                print(f"Erro ao salvar pesquisa no Supabase: {str(e)}")
                # Não interrompe o fluxo
        except Exception as e:
            print(f"Erro ao preparar registro de pesquisa: {str(e)}")
            # Não interrompe o fluxo

        return sugestao_ncm

    except Exception as e:
        print(f"Erro ao processar consulta: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Erro ao processar consulta: {str(e)}"}
        )


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

# GET /api/task-status/{request_id}
@queries_router.get("/task-status/{request_id}")
async def get_task_status(request_id: str):
    """Endpoint para verificar o status atual de uma tarefa DeepResearch."""
    try:
        # Endpoint da API Node.js para verificar o status da tarefa
        task_url = f"http://localhost:3000/api/v1/task-status/{request_id}"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Faz a requisição com timeout para evitar bloqueios
                task_response = await client.get(task_url)
                
                if task_response.status_code == 200:
                    task_data = task_response.json()
                    
                    # Mapeia a resposta do Node.js para o formato esperado pelo frontend
                    response_data = {
                        "requestId": request_id,
                        "step": task_data.get("step", 0),
                        "currentAction": task_data.get("currentAction", "Iniciando análise..."),
                        "completed": task_data.get("completed", False),
                        "modelo": task_data.get("model", "")
                    }
                    
                    return JSONResponse(content=response_data)
                else:
                    # Resposta padrão caso não consiga obter o status
                    return JSONResponse(content={
                        "requestId": request_id,
                        "step": 0,
                        "currentAction": f"Aguardando início da análise... (HTTP {task_response.status_code})",
                        "completed": False
                    })
            except httpx.ConnectError:
                # Caso o serviço Node.js esteja indisponível
                return JSONResponse(content={
                    "requestId": request_id,
                    "step": 0,
                    "currentAction": "Serviço DeepResearch indisponível no momento. Tente novamente mais tarde.",
                    "completed": False,
                    "error": "connect_error"
                })
            except httpx.TimeoutException:
                # Caso a requisição demore muito
                return JSONResponse(content={
                    "requestId": request_id,
                    "step": 0, 
                    "currentAction": "Tempo limite excedido. O serviço está sobrecarregado.",
                    "completed": False,
                    "error": "timeout"
                })
    
    except Exception as e:
        print(f"[DeepResearch] Erro ao verificar status da tarefa: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=200, # Retornamos 200 com mensagem de erro para evitar falhas no cliente
            content={
                "requestId": request_id,
                "step": 0,
                "currentAction": f"Erro ao verificar status: {str(e)}",
                "completed": False,
                "error": "internal_error"
            }
        )
