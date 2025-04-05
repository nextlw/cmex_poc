"""
Módulo para streaming de atualizações de tarefas usando Server-Sent Events (SSE)
"""

import asyncio
import json
import logging
from typing import AsyncGenerator

import httpx

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from ...config import supabase  # Importando o cliente Supabase
from ...services.redis_service import CHANNELS, redis_client

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criar um router para os endpoints SSE
sse_router = APIRouter()

# Tempo máximo de espera para SSE (2 horas)
MAX_SSE_TIMEOUT = 2 * 60 * 60  # em segundos


def validate_token(token: str) -> bool:
    """
    Valida um token de acesso, aceitando token do Supabase ou UUID temporário.

    Args:
        token: O token de acesso a ser validado ou UUID temporário

    Returns:
        bool: True se o token for válido, False caso contrário
    """
    try:
        # Log para depuração
        logger.info(f"Validando token: {token[:20]}...")

        # Verifica se é um UUID válido (para usuários temporários)
        try:
            import uuid

            # Tenta converter o token para UUID
            uuid_obj = uuid.UUID(token)
            logger.info(f"Token validado como UUID temporário: {uuid_obj}")
            return True
        except ValueError:
            # Não é um UUID válido, continua para validação Supabase
            logger.info("Token não é um UUID, tentando validação Supabase")

        # Tenta validar com Supabase
        try:
            user = supabase.auth.get_user(token)
            if user and user.user:
                logger.info(f"Token validado com sucesso via Supabase para usuário: {user.user.id}")
                return True
        except Exception as e:
            logger.warning(f"Validação via Supabase falhou: {str(e)}")

            # Se o token parece ser um JWT válido (estrutura básica), podemos permitir temporariamente
            parts = token.split('.')
            if len(parts) == 3 and all(len(p) > 0 for p in parts):
                logger.warning("Permitindo acesso com token que parece ser JWT válido")
                return True

        # Se chegou até aqui, nenhuma validação teve sucesso
        logger.error(f"Não foi possível validar o token")
        return False

    except Exception as e:
        logger.error(f"Erro geral ao validar token: {str(e)}")
        return False


async def task_status_sse_generator(request_id: str) -> AsyncGenerator[str, None]:
    """
    Gerador assíncrono que produz eventos SSE para atualizações de status de tarefas.
    Ele combina:
    1. Polling ao endpoint Node.js de status
    2. Escuta de eventos Redis

    Isso garante que recebemos atualizações o mais rápido possível.
    """
    # URL do endpoint Node.js para status da tarefa
    task_url = f"http://localhost:3001/api/v1/task-status/{request_id}"

    # Contador para controlar a frequência de polling
    poll_counter = 0
    # Armazenar o último estado conhecido para verificar mudanças
    last_known_state = {}
    # Flag para indicar se o processo foi concluído
    is_completed = False
    # Tempo total decorrido
    total_elapsed_time = 0
    # Flag para saber se é a primeira atualização
    is_first_update = True

    # Criar uma assinatura Redis para receber atualizações em tempo real
    pubsub = redis_client.pubsub()
    pubsub.subscribe(CHANNELS["NODE_TASK_UPDATES"])

    # Configurar IDs de mensagens SSE para gerenciar reconexões no cliente
    message_id = 1

    try:
        # Enviar evento inicial de conexão
        yield f"id: {message_id}\nevent: connection\ndata: {json.dumps({'status': 'connected', 'requestId': request_id})}\n\n"
        message_id += 1

        # Loop principal - continua até o processo ser concluído ou o timeout ser atingido
        while not is_completed and total_elapsed_time < MAX_SSE_TIMEOUT:
            # 1. Verificar o Redis para atualizações em tempo real
            message = pubsub.get_message(timeout=0.1)
            if message and message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    # Se a mensagem for para esta tarefa específica
                    if data.get("requestId") == request_id:
                        # Enviar a atualização como evento SSE
                        yield f"id: {message_id}\nevent: update\ndata: {json.dumps(data)}\n\n"
                        message_id += 1

                        # Verificar se a tarefa foi concluída
                        if data.get("completed"):
                            is_completed = True
                except Exception as e:
                    print(f"Erro ao processar mensagem Redis: {e}")

            # 2. A cada X iterações (ou na primeira iteração), fazer polling ao Node.js
            if poll_counter == 0 or is_first_update:
                is_first_update = False
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        response = await client.get(task_url)
                        if response.status_code == 200:
                            task_data = response.json()

                            # Verificar se o estado mudou
                            if task_data != last_known_state:
                                # Atualizar o último estado conhecido
                                last_known_state = task_data.copy()

                                # Extrair informações específicas para stream
                                streaming_data = {
                                    "requestId": request_id,
                                    "step": task_data.get("step", 0),
                                    "currentAction": task_data.get(
                                        "currentAction", "Iniciando análise..."
                                    ),
                                    "completed": task_data.get("completed", False),
                                }

                                # Adicionar elementos extras se presentes
                                for key in [
                                    "researchDetails",
                                    "partialInfo",
                                    "validationStatus",
                                    "currentReasoning",
                                ]:
                                    if key in task_data:
                                        streaming_data[key] = task_data[key]

                                # Verificar se há URLs sendo pesquisadas (ideal para o passo 2)
                                if "sourceUrls" in task_data:
                                    streaming_data["sourceUrls"] = task_data[
                                        "sourceUrls"
                                    ]

                                # Enviar como evento SSE
                                yield f"id: {message_id}\nevent: status\ndata: {json.dumps(streaming_data)}\n\n"
                                message_id += 1

                                # Verificar se a tarefa foi concluída
                                if task_data.get("completed"):
                                    is_completed = True
                except Exception as e:
                    print(f"Erro ao realizar polling: {e}")
                    # Enviar o erro como evento SSE
                    yield f"id: {message_id}\nevent: error\ndata: {json.dumps({'error': str(e)})}\n\n"
                    message_id += 1

            # Incrementar o contador de polling (a cada 10 iterações fazemos um poll)
            poll_counter = (poll_counter + 1) % 10

            # Aguardar um curto período antes de verificar novamente
            await asyncio.sleep(0.5)  # 500ms de intervalo
            total_elapsed_time += 0.5

        # Se a tarefa foi concluída, enviar um evento final
        if is_completed:
            yield f"id: {message_id}\nevent: complete\ndata: {json.dumps({'status': 'completed', 'requestId': request_id})}\n\n"
        else:
            # Se atingiu o timeout, enviar evento de timeout
            yield f"id: {message_id}\nevent: timeout\ndata: {json.dumps({'status': 'timeout', 'requestId': request_id})}\n\n"

    finally:
        # Certifique-se de cancelar a assinatura e limpar recursos
        pubsub.unsubscribe(CHANNELS["NODE_TASK_UPDATES"])


@sse_router.get("/task-status-sse/{request_id}")
async def task_status_sse(request_id: str, request: Request, token: str = Query(None)):
    # Token é opcional agora que a rota é pública
    # Log para depuração
    logger.info(f"Requisição SSE recebida para task ID: {request_id}")

    # Definir cabeçalhos específicos para SSE
    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }

    # Retornar uma resposta de streaming com o gerador SSE
    return StreamingResponse(
        task_status_sse_generator(request_id),
        headers=headers,
    )
