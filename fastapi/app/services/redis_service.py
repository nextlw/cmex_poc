import os
import json
import redis
from threading import Thread
from datetime import datetime
from typing import Dict, Any, Optional

# Canais Redis
CHANNELS = {
    "NODE_TASK_UPDATES": "node:task_updates",
    "FASTAPI_TASK_UPDATES": "fastapi:task_updates",
    "MODEL_SELECTION": "model:selection",
    "QUERY_RESULTS": "query:results",
}

# Configuração do Redis
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_TLS = os.getenv("REDIS_TLS", "false").lower() == "true"

# Cache local para armazenar atualizações de tarefas
task_cache = {}

# Cliente Redis
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    ssl=REDIS_TLS,
    decode_responses=True
)

# Processar mensagens em thread separada
def redis_listener():
    pubsub = redis_client.pubsub()
    pubsub.subscribe(CHANNELS["NODE_TASK_UPDATES"], CHANNELS["QUERY_RESULTS"])
    
    for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data = json.loads(message["data"])
                request_id = data.get("requestId")
                
                if request_id:
                    # Atualizar cache local
                    if request_id not in task_cache:
                        task_cache[request_id] = {"updates": [], "results": None}
                    
                    channel = message["channel"]
                    
                    if channel == CHANNELS["NODE_TASK_UPDATES"]:
                        task_cache[request_id]["updates"].append(data)
                        print(f"Atualização via Redis: {request_id}")
                    
                    elif channel == CHANNELS["QUERY_RESULTS"]:
                        task_cache[request_id]["results"] = data.get("results")
                        print(f"Resultados recebidos para: {request_id}")
                        
                        # Limpar cache após um tempo ou implementar LRU cache
                        # TODO: Implementar limpeza de cache
                        
            except Exception as e:
                print(f"Erro ao processar mensagem Redis: {e}")

# Publicar seleção de modelo
def publish_model_selection(request_id: str, model: str, query: str):
    redis_client.publish(
        CHANNELS["MODEL_SELECTION"],
        json.dumps({
            "requestId": request_id,
            "model": model,
            "query": query,
            "timestamp": datetime.now().isoformat()
        })
    )

# Publicar atualizações de tarefas
def publish_task_update(request_id: str, update_type: str, payload: Any):
    redis_client.publish(
        CHANNELS["FASTAPI_TASK_UPDATES"],
        json.dumps({
            "requestId": request_id,
            "type": update_type,
            "payload": payload,
            "timestamp": datetime.now().isoformat()
        })
    )

# Obter atualizações de tarefas do cache
def get_task_updates(request_id: str) -> Dict[str, Any]:
    if request_id in task_cache:
        return task_cache[request_id]
    return {"updates": [], "results": None}

# Obter resultados de consulta
def get_query_results(request_id: str) -> Optional[Dict[str, Any]]:
    if request_id in task_cache and task_cache[request_id].get("results"):
        return task_cache[request_id]["results"]
    return None

# Iniciar thread de escuta
listener_thread = None

def start_redis_listener():
    global listener_thread
    if listener_thread is None or not listener_thread.is_alive():
        listener_thread = Thread(target=redis_listener, daemon=True)
        listener_thread.start()
        print("Listener Redis iniciado com sucesso") 