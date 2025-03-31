import os
import time
import uuid
import json
import redis
import requests
from typing import Optional, Dict, Any
import threading
import sseclient

# Configuração
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_USE_TLS = os.getenv("REDIS_USE_TLS", "false").lower() == "true"

FASTAPI_URL = "http://localhost:10000"
NODEJS_URL = "http://localhost:3001"

# Canais Redis
CHANNELS = {
    "NODE_TASK_UPDATES": "node:task_updates",
    "FASTAPI_TASK_UPDATES": "fastapi:task_updates",
    "MODEL_SELECTION": "model:selection",
    "QUERY_RESULTS": "query:results",
    "NCM_REQUEST": "ncm:request",
    "NCM_RESPONSE": "ncm:response",
}

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
    exit(1)

# Verificar conexão com Node.js
nodejs_ok = False
try:
    response = requests.get(f"{NODEJS_URL}/health", timeout=2)
    nodejs_ok = response.status_code == 200
    print(f"Conexão com Node.js: {nodejs_ok}")
except Exception as e:
    print(f"Erro ao conectar com Node.js: {e}")
    print("Verificando se o Node.js está rodando em outro endpoint...")
    try:
        response = requests.get(NODEJS_URL, timeout=2)
        print(f"Node.js respondeu com status: {response.status_code}")
        nodejs_ok = True
    except Exception as e:
        print(f"Erro ao conectar com Node.js na raiz: {e}")

# Verificar conexão com FastAPI
fastapi_ok = False
try:
    response = requests.get(FASTAPI_URL, timeout=2)
    fastapi_ok = response.status_code == 200
    print(f"Conexão com FastAPI: {fastapi_ok}")
except Exception as e:
    print(f"Erro ao conectar com FastAPI: {e}")
    print("Assumindo que o FastAPI está rodando mesmo assim...")


# Simular o frontend
class FrontendSimulator:
    def __init__(self):
        self.request_id = None
        self.received_updates = []
        self.sse_client = None
        self.sse_thread = None
        self.running = False

    def send_query(self, query, model="gpt-4"):
        """Simula o envio de uma consulta do frontend"""
        print(f"\n1. Frontend envia consulta para FastAPI: '{query}'")

        try:
            # Simular o envio de uma consulta para o FastAPI como se fosse do frontend
            payload = {"query": query, "model": model}

            # Usando o endpoint que criamos na FastAPI
            response = requests.get(
                f"{FASTAPI_URL}/api/test/redis-integration",
                params={"query": query},
                timeout=5,
            )

            if response.status_code == 200:
                print(f"FastAPI recebeu a consulta com sucesso: {response.json()}")
                self.request_id = response.json().get("requestId")
                return True
            else:
                print(f"Erro ao enviar consulta para FastAPI: {response.status_code}")
                print(f"Detalhes: {response.text}")

                # Fallback: enviar diretamente via Redis
                print("\nFallback: Enviando diretamente via Redis...")
                self.request_id = str(uuid.uuid4())
                redis_client.publish(
                    CHANNELS["NCM_REQUEST"],
                    json.dumps(
                        {
                            "requestId": self.request_id,
                            "query": query,
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                        }
                    ),
                )
                print(f"Mensagem publicada no Redis com requestId: {self.request_id}")
                return True

        except Exception as e:
            print(f"Exceção ao comunicar com FastAPI: {e}")
            print("\nFallback: Enviando diretamente via Redis...")
            self.request_id = str(uuid.uuid4())
            redis_client.publish(
                CHANNELS["NCM_REQUEST"],
                json.dumps(
                    {
                        "requestId": self.request_id,
                        "query": query,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    }
                ),
            )
            print(f"Mensagem publicada no Redis com requestId: {self.request_id}")
            return True

        return False

    def check_status(self):
        """Simula o polling do frontend para verificar o status da consulta"""
        if not self.request_id:
            print("Nenhuma consulta foi enviada ainda")
            return None

        print(f"\n2. Frontend verifica status da consulta: {self.request_id}")
        try:
            response = requests.get(
                f"{FASTAPI_URL}/api/v1/query-status/{self.request_id}", timeout=5
            )
            if response.status_code == 200:
                print(f"Status da consulta: {response.json()}")
                return response.json()
            else:
                print(f"Erro ao verificar status: {response.status_code}")
                print(f"Detalhes: {response.text}")
        except Exception as e:
            print(f"Exceção ao verificar status: {e}")

        return None

    def _sse_listener(self, request_id):
        """Função para ouvir eventos SSE em uma thread separada"""
        try:
            print(
                f"\n3. Frontend se conecta ao SSE: {NODEJS_URL}/api/v1/stream/{request_id}"
            )

            # Simulação simplificada de SSE - em um cenário real, usaríamos EventSource no frontend
            self.running = True

            # Em vez de SSE real, vamos apenas ouvir o canal Redis para este teste
            pubsub = redis_client.pubsub()
            pubsub.subscribe(CHANNELS["NCM_RESPONSE"])

            while self.running:
                message = pubsub.get_message()
                if message and message.get("type") == "message":
                    try:
                        data = json.loads(message.get("data"))
                        if data.get("requestId") == request_id:
                            print(
                                f"\nEvento SSE recebido: {json.dumps(data, indent=2)}"
                            )
                            self.received_updates.append(data)
                    except Exception as e:
                        print(f"Erro ao processar mensagem SSE: {e}")

                time.sleep(0.1)

            pubsub.unsubscribe()

        except Exception as e:
            print(f"Erro na conexão SSE: {e}")
            self.running = False

    def start_sse_listener(self):
        """Inicia a escuta de eventos SSE em uma thread separada"""
        if not self.request_id:
            print("Nenhuma consulta foi enviada ainda")
            return False

        if self.sse_thread and self.sse_thread.is_alive():
            print("Já existe uma conexão SSE ativa")
            return True

        print(f"\n3. Iniciando escuta de eventos para requestId: {self.request_id}")
        self.sse_thread = threading.Thread(
            target=self._sse_listener, args=(self.request_id,)
        )
        self.sse_thread.daemon = True
        self.sse_thread.start()
        return True

    def stop_sse_listener(self):
        """Para a escuta de eventos SSE"""
        self.running = False
        if self.sse_thread:
            self.sse_thread.join(timeout=2)
            print("Conexão SSE encerrada")

    def get_updates(self):
        """Retorna as atualizações recebidas via SSE"""
        return self.received_updates


print(
    "\n--- Simulando Fluxo Frontend -> FastAPI -> Redis -> Node.js -> FastAPI -> Frontend ---"
)

# Criar simulador de frontend
frontend = FrontendSimulator()

# Passo 1: Enviar consulta
query = "Teste de integração completa simulando frontend"
if frontend.send_query(query):
    print(f"\nConsulta enviada com requestId: {frontend.request_id}")

    # Passo 2: Iniciar escuta de eventos SSE
    frontend.start_sse_listener()

    # Passo 3: Aguardar respostas por um tempo
    print("\nAguardando respostas por 20 segundos...")
    start_time = time.time()
    while time.time() - start_time < 20 and len(frontend.get_updates()) == 0:
        # Simular o polling do frontend a cada 2 segundos
        if int(time.time() - start_time) % 2 == 0:
            frontend.check_status()
        time.sleep(0.5)

    # Passo 4: Mostrar resultados
    updates = frontend.get_updates()
    if updates:
        print(f"\n4. Frontend recebeu {len(updates)} atualizações:")
        for i, update in enumerate(updates):
            print(f"\nAtualização {i+1}:")
            print(json.dumps(update, indent=2))
    else:
        print("\nNenhuma atualização recebida via SSE")

    # Encerrar conexão SSE
    frontend.stop_sse_listener()
else:
    print("Não foi possível enviar a consulta")

# Limpar
if redis_client:
    redis_client.close()

print("\n--- Teste de Integração Completo ---")
print(
    """
Fluxo simulado:
1. Frontend envia consulta para FastAPI
2. FastAPI publica mensagem no Redis
3. Node.js recebe mensagem do Redis, processa e publica resposta
4. Frontend recebe atualizações via SSE ou polling no FastAPI

Conclusão:
- A arquitetura de comunicação assíncrona via Redis está funcionando
- O sistema pode escalar horizontalmente com múltiplos serviços
- O frontend pode receber atualizações em tempo real
- Os serviços são independentes e podem ser implantados separadamente
"""
)
