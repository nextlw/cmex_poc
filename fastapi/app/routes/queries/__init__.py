# Bibliotecas
from fastapi import APIRouter, Request, HTTPException, Depends, Query, Header
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
from ...config import supabase, SETTINGS

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
    "qwen2.5-7b-instruct-1m": obter_sugestoes_qwen,
}

# Função para receber requisições diretas (POST)
@queries_router.post("/queries")
async def direct_queries(request: Request):
    try:
        # Recebe a requisição como JSON
        data = await request.json()
        print("[DEBUG DIRECT] Requisição recebida diretamente no endpoint de queries:", data)
        
        # Tenta extrair os campos necessários (suporta tanto inglês quanto português)
        consulta = data.get('consulta') or data.get('query', '')
        modelo_original = data.get('modelo') or data.get('model', 'qwen2.5-7b-instruct-1m')
        
        # Força o uso do modelo local
        modelo = "qwen2.5-7b-instruct-1m"
        
        # Gera um objeto ConsultaProduto
        consulta_produto = ConsultaProduto(
            consulta=consulta,
            modelo=modelo,
            autocomplete=data.get('autocomplete', False),
            useDeepResearch=data.get('useDeepResearch', False),
            estadoOrigem=data.get('estadoOrigem', 'Não informado'),
            operacao=data.get('operacao', None),
            regimeTributario=data.get('regimeTributario', None),
            tributacao=data.get('tributacao', None)
        )
        
        print("[DEBUG] Dados formatados para validação:", {
            "consulta": consulta_produto.consulta,
            "modelo": consulta_produto.modelo
        })
        
        print(f"[DEBUG] Modelo solicitado: {modelo_original}, mas usando modelo local: {modelo}")
        
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

            # Seleciona a função a ser executada de acordo com o modelo (sempre local)
            funcao_escolhida = funcoes_modelos.get(consulta_produto.modelo)

            # Verifica se o modelo escolhido é válido
            if not funcao_escolhida:
                print(f"[ERROR] Modelo {consulta_produto.modelo} não encontrado, tentando fallback")
                # Se não encontrar o modelo, tenta usar o qwen como fallback
                funcao_escolhida = funcoes_modelos.get("qwen2.5-7b-instruct-1m")
                
                if not funcao_escolhida:
                    return JSONResponse(
                        status_code=200,
                        content=[{
                            "ncm": "00.00.00.00",
                            "descricao": f"Modelo não disponível. Resposta de fallback para: {consulta}",
                            "atributos": ["Atributo placeholder"],
                            "atributos_tipi": [],
                            "valores_de_impostos": {"ipi": "0%", "icms": {}, "pis": "1.65%", "cofins": "7.6%"},
                            "classificacao_tributaria": {
                                "ipi_entrada": "0",
                                "ipi_saida": "0",
                                "pis_entrada": "0",
                                "pis_saida": "0",
                                "cofins_entrada": "0",
                                "cofins_saida": "0",
                                "cst_entrada": "0",
                                "cst_saida": "0"
                            }
                        }]
                    )

            # Executa a função de IA
            try:
                sugestao_ncm = await funcao_escolhida(consulta_produto)
            except Exception as e:
                print(f"[ERROR] Erro ao obter sugestões do modelo {consulta_produto.modelo}: {str(e)}")
                # Fallback em caso de erro
                return JSONResponse(
                    status_code=200,
                    content=[{
                        "ncm": "00.00.00.00",
                        "descricao": f"Erro ao processar modelo. Resposta de fallback para: {consulta}",
                        "atributos": ["Atributo placeholder"],
                        "atributos_tipi": [],
                        "valores_de_impostos": {"ipi": "0%", "icms": {}, "pis": "1.65%", "cofins": "7.6%"},
                        "classificacao_tributaria": {
                            "ipi_entrada": "0",
                            "ipi_saida": "0",
                            "pis_entrada": "0",
                            "pis_saida": "0",
                            "cofins_entrada": "0",
                            "cofins_saida": "0",
                            "cst_entrada": "0",
                            "cst_saida": "0"
                        }
                    }]
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
                    modelo=modelo_original,  # Registra o modelo original solicitado
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

            print("[DEBUG] Modelo local usado com sucesso")
            return sugestao_ncm
        except Exception as e:
            print(f"[ERROR] Erro ao usar modelo local: {str(e)}")
            # Se falhar, devolve uma resposta de fallback
            return JSONResponse(
                status_code=200,
                content=[{
                    "ncm": "00.00.00.00",
                    "descricao": f"Erro geral. Resposta de fallback para: {consulta}",
                    "atributos": ["Atributo placeholder"],
                    "atributos_tipi": [],
                    "valores_de_impostos": {"ipi": "0%", "icms": {}, "pis": "1.65%", "cofins": "7.6%"},
                    "classificacao_tributaria": {
                        "ipi_entrada": "0",
                        "ipi_saida": "0",
                        "pis_entrada": "0",
                        "pis_saida": "0",
                        "cofins_entrada": "0",
                        "cofins_saida": "0",
                        "cst_entrada": "0",
                        "cst_saida": "0"
                    }
                }]
            )
    except Exception as e:
        print(f"[ERROR] Erro ao processar requisição direta: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=200, # Retornamos 200 mesmo com erro para o cliente não falhar
            content=[{
                "ncm": "00.00.00.00",
                "descricao": f"Erro de servidor. Resposta de fallback para: {str(e)}",
                "atributos": ["Erro no processamento do servidor"],
                "atributos_tipi": [],
                "valores_de_impostos": {"ipi": "0%", "icms": {}, "pis": "1.65%", "cofins": "7.6%"},
                "classificacao_tributaria": {
                    "ipi_entrada": "0",
                    "ipi_saida": "0",
                    "pis_entrada": "0",
                    "pis_saida": "0",
                    "cofins_entrada": "0",
                    "cofins_saida": "0",
                    "cst_entrada": "0",
                    "cst_saida": "0"
                }
            }]
        )

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
async def get_task_status(request_id: str, request: Request):
    """Endpoint para verificar o status atual de uma tarefa DeepResearch."""
    # Adiciona cabeçalhos CORS para permitir acesso cross-origin
    headers = {
        "Access-Control-Allow-Origin": "*",  # Permite qualquer origem
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    
    # Se for uma requisição OPTIONS (preflight), retorna apenas os cabeçalhos
    if request.method == "OPTIONS":
        return JSONResponse(content={}, headers=headers)
        
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
                        "modelo": task_data.get("model", ""),
                    }
                    
                    # Adiciona detalhes da pesquisa se disponíveis
                    if "researchDetails" in task_data:
                        response_data["researchDetails"] = task_data["researchDetails"]
                    
                    # Adiciona informações parciais se disponíveis
                    if "partialInfo" in task_data:
                        response_data["partialInfo"] = task_data["partialInfo"]
                    
                    # Adiciona status de validação se disponível
                    if "validationStatus" in task_data:
                        response_data["validationStatus"] = task_data["validationStatus"]
                    
                    # Retorna a resposta com cabeçalhos CORS
                    return JSONResponse(content=response_data, headers=headers)
                
                # Se o status code não for 200, propaga o erro
                return JSONResponse(
                    content={"error": f"Erro ao verificar status: {task_response.status_code}"},
                    status_code=task_response.status_code,
                    headers=headers
                )
                
            except httpx.RequestError as e:
                # Erro na requisição HTTP
                return JSONResponse(
                    content={"error": f"Erro na comunicação com o serviço: {str(e)}"},
                    status_code=502,
                    headers=headers
                )
    
    except Exception as e:
        # Erro geral
        return JSONResponse(
            content={"error": f"Erro interno: {str(e)}"},
            status_code=500,
            headers=headers
        )

# POST /api/cancel
@queries_router.post("/cancel")
async def cancel_process(request: Request):
    """
    Endpoint para cancelar um processo em andamento.
    Esta rota é chamada pelo botão de cancelamento e deve interromper qualquer processamento pendente.
    """
    try:
        # Extrair dados da requisição
        data = await request.json()
        
        if not data.get("requestId"):
            return JSONResponse(
                status_code=400,
                content={"error": "ID da requisição é obrigatório"}
            )
            
        request_id = data.get("requestId")
        print(f"[Cancelamento] Solicitação para cancelar requestId: {request_id}")
        
        # Atualizar o status no Supabase se possível
        try:
            # Busca se existe uma pesquisa com este requestId
            res = supabase.table("pesquisas").select("*").eq("id", request_id).execute()
            
            if res.data and len(res.data) > 0:
                # Atualiza o status para cancelado
                supabase.table("pesquisas").update({
                    "status": "cancelled", 
                    "comentarios": {"motivo": "Cancelado pelo usuário"}
                }).eq("id", request_id).execute()
                
                print(f"[Cancelamento] Pesquisa {request_id} marcada como cancelada no Supabase")
        except Exception as e:
            print(f"[Cancelamento] Erro ao atualizar Supabase: {str(e)}")
            # Não interrompe o fluxo se falhar
        
        # Sinaliza para o Node.js que deve cancelar o processo (via trash-query)
        try:
            # Usa o httpx para fazer uma requisição ao serviço Node.js
            async with httpx.AsyncClient() as client:
                node_response = await client.post(
                    "http://localhost:3000/api/v1/cancel",
                    json={"requestId": request_id},
                    timeout=3.0  # Timeout curto, pois apenas precisa iniciar o processo de cancelamento
                )
                
                if node_response.status_code == 200:
                    print(f"[Cancelamento] Solicitação de cancelamento enviada ao Node.js com sucesso")
                else:
                    print(f"[Cancelamento] Falha ao solicitar cancelamento ao Node.js: {node_response.status_code}")
                    # Tenta a abordagem alternativa - trash-query
                    trash_response = await client.post(
                        "http://localhost:3000/api/v1/trash-query",
                        json={"id": request_id},
                        timeout=3.0
                    )
                    print(f"[Cancelamento] Resultado trash-query: {trash_response.status_code}")
        except Exception as e:
            print(f"[Cancelamento] Erro ao comunicar com Node.js: {str(e)}")
            # Não interrompe o fluxo se falhar
            
        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "Solicitação de cancelamento recebida"}
        )
        
    except Exception as e:
        print(f"[Cancelamento] Erro ao processar cancelamento: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Erro ao processar cancelamento: {str(e)}"}
        )
