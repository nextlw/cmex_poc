import os
import time
import uuid
import json
import redis
import requests
from typing import Optional, Dict, Any

# Configuração
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_USE_TLS = os.getenv("REDIS_USE_TLS", "false").lower() == "true"

FASTAPI_URL = "http://localhost:8080"
NODEJS_URL = "http://localhost:3001"

# Estabelecer conexão com Redis
print("Conectando ao Redis...")
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        ssl=REDIS_USE_TLS,
        decode_responses=True,
    )
    redis_client.ping()
    print("Conexão com Redis: OK")
except Exception as e:
    print(f"Erro ao conectar ao Redis: {e}")
    redis_client = None

# Verificar conexão com Node.js
nodejs_ok = False
try:
    response = requests.get(f"{NODEJS_URL}/health", timeout=2)
    nodejs_ok = response.status_code == 200
    print(f"Conexão com Node.js: {nodejs_ok}")
except Exception as e:
    print(f"Erro ao conectar com Node.js: {e}")

# Verificar conexão com FastAPI
fastapi_ok = False
try:
    response = requests.get(FASTAPI_URL, timeout=2)
    fastapi_ok = response.status_code == 200
    print(f"Conexão com FastAPI: {fastapi_ok}")
except Exception as e:
    print(f"Erro ao conectar com FastAPI: {e}")
    print("Assumindo que o FastAPI está rodando mesmo assim...")

if redis_client is not None:
    print("\n--- Testando comunicação Redis ---")

    # Inscrever-se no canal para receber mensagens do Node.js
    pubsub = redis_client.pubsub()
    print("Inscrevendo-se no canal do Node...")
    pubsub.subscribe("ncm:response")

    # Gerar ID único para a requisição
    request_id = str(uuid.uuid4())
    print(f"ID de requisição: {request_id}")

    # Preparar payload para enviar ao Node.js
    payload = {
        "requestId": request_id,
        "query": "Teste de comunicação entre FastAPI e Node.js",
    }

    print("\nEnviando mensagem para o Node via Redis...")
    redis_client.publish("ncm:request", json.dumps(payload))

    # Aguardar resposta
    print("\nAguardando resposta do Node (max 20 segundos)...")
    response_received = False
    start_time = time.time()

    while time.time() - start_time < 20:  # Aguardar até 20 segundos
        message = pubsub.get_message()
        if message:
            print(f"Recebido: {message.get('data')}")

            # Verificar se é a resposta para nossa requisição
            if message.get("type") == "message":
                try:
                    data = json.loads(message.get("data"))
                    if isinstance(data, dict) and data.get("requestId") == request_id:
                        print("\nResposta recebida do Node.js:")
                        print(json.dumps(data, indent=2))
                        response_received = True
                        break
                except:
                    pass

        time.sleep(0.1)

    if not response_received:
        print("Nenhuma resposta recebida do Node.js via Redis após 20 segundos")

    # Limpar
    pubsub.unsubscribe()
    redis_client.close()

print("\n--- Teste Concluído ---")
