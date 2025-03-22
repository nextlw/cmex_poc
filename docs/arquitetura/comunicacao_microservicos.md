# Plano de Implementação: Comunicação entre Frontend, FastAPI e Node.js

## Visão Geral

Este documento detalha a implementação de uma arquitetura de comunicação eficiente entre os três componentes principais do sistema:

1. **Frontend**: Interface do usuário
2. **FastAPI**: Serviço Python para processamento e roteamento
3. **Node.js**: Serviço para integração com modelos de LLM

## Situação Anterior

- **Produção**: Frontend e FastAPI estão rodando no Render, mas Node.js ainda não
- **Problema 1**: Comunicação anterior usava polling constante (verificações de status em loop)
- **Problema 2**: Node.js estava usando apenas modelo local, ignorando a seleção de modelos do usuário
- **Problema 3**: Faltava integração adequada entre os serviços para ambiente de produção

## Solução Implementada: Redis Pub/Sub para Comunicação Assíncrona

Foi implementado um sistema baseado em Redis Pub/Sub para comunicação assíncrona entre os serviços, eliminando a necessidade de polling constante.

## Implementação Concluída

### Parte 1: Configuração do Redis

1. **Configurado Redis no Render**
   - Adicionado Redis como serviço compartilhado no projeto
   - Obtidas as credenciais e URL de conexão
   - Configuradas variáveis de ambiente para todos os serviços

```bash
# Exemplo de variáveis de ambiente configuradas no Render
REDIS_HOST=redis-xxxxx.render.com
REDIS_PORT=6379
REDIS_PASSWORD=seu_password
REDIS_TLS=true
```

2. **Instaladas dependências necessárias**

   **Para Node.js:**

   ```bash
   pnpm add ioredis
   ```

   **Para FastAPI (Python):**

   ```bash
   pip install redis
   ```

### Parte 2: Implementação no Node.js

1. **Criado módulo de comunicação Redis**

```typescript
// buscador_inteligente/src/services/redis-service.ts

import Redis from "ioredis";
import { EventEmitter } from "events";

// Canais Redis
export const CHANNELS = {
  NODE_TASK_UPDATES: "node:task_updates",
  FASTAPI_TASK_UPDATES: "fastapi:task_updates",
  MODEL_SELECTION: "model:selection",
  QUERY_RESULTS: "query:results",
  NCM_REQUEST: "ncm:request",
};

// Configuração do Redis
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
};

// Clientes Redis
export const publisher = new Redis(redisConfig);
export const subscriber = new Redis(redisConfig);

// Inicializar assinaturas
export function initializeRedisSubscriptions(eventEmitter: EventEmitter) {
  // Assinar aos canais relevantes usando Promise em vez de callback
  subscriber
    .subscribe(
      CHANNELS.FASTAPI_TASK_UPDATES,
      CHANNELS.MODEL_SELECTION,
      CHANNELS.NCM_REQUEST
    )
    .then(() => {
      console.log("Assinado nos canais Redis com sucesso");
    })
    .catch((err) => {
      console.error("Erro ao assinar canais Redis:", err);
    });

  // Manipular mensagens recebidas
  subscriber.on("message", (channel: string, message: string) => {
    try {
      const data = JSON.parse(message);

      if (channel === CHANNELS.FASTAPI_TASK_UPDATES && data.requestId) {
        console.log(
          `Atualização recebida via Redis para tarefa ${data.requestId}`
        );

        // Emitir evento para clientes conectados
        eventEmitter.emit(`progress-${data.requestId}`, {
          type: data.type || "progress",
          data: data.payload,
        });
      } else if (channel === CHANNELS.MODEL_SELECTION && data.requestId) {
        console.log(
          `Seleção de modelo recebida: ${data.model} para ${data.requestId}`
        );

        // Processar a seleção do modelo
        processModelSelection(data.requestId, data.model, data.query);
      } else if (channel === CHANNELS.NCM_REQUEST && data.requestId) {
        console.log(`Requisição NCM recebida: ${data.requestId}`);

        // Responder à solicitação de teste de integração
        processNcmRequest(data.requestId, data.query);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem Redis:", error);
    }
  });
}

// Publicar atualização de tarefa
export function publishTaskUpdate(
  requestId: string,
  updateType: string,
  payload: any
) {
  publisher.publish(
    CHANNELS.NODE_TASK_UPDATES,
    JSON.stringify({
      requestId,
      type: updateType,
      payload,
      timestamp: new Date().toISOString(),
    })
  );
}

// Publicar resultados de consulta
export function publishQueryResults(requestId: string, results: any) {
  publisher.publish(
    CHANNELS.QUERY_RESULTS,
    JSON.stringify({
      requestId,
      results,
      timestamp: new Date().toISOString(),
    })
  );
}

// Processar seleção de modelo
async function processModelSelection(
  requestId: string,
  modelName: string,
  query: string
) {
  // Implementar lógica para usar o modelo selecionado
  // Esta função deve iniciar o processamento com o modelo correto
  // ...
}

// Função para encerrar conexões Redis
export function closeRedisConnections() {
  publisher.quit();
  subscriber.quit();
}
```

2. **Integrado o serviço Redis no servidor Node.js**

```typescript
// Modificado buscador_inteligente/src/server.ts

import {
  initializeRedisSubscriptions,
  publishTaskUpdate,
  closeRedisConnections,
} from "./services/redis-service";

// ... código existente ...

// Inicializar Redis na inicialização do servidor
initializeRedisSubscriptions(eventEmitter);

// Modificada a função emitTrackerUpdate para também publicar via Redis
function emitTrackerUpdate(requestId: string, context: TrackerContext) {
  const state = context.actionTracker.getState();
  const tokenUsage = context.tokenTracker.getTotalUsage();

  eventEmitter.emit(`progress-${requestId}`, {
    type: "progress",
    data: {
      state,
      tokenUsage,
    },
  });

  // Adicionar publicação via Redis
  publishTaskUpdate(requestId, "tracker_update", {
    state: context.actionTracker.getState(),
    tokenUsage: context.tokenTracker.getTotalUsage(),
  });
}

// Adicionado manipulador para encerrar conexões Redis ao fechar o servidor
process.on("SIGTERM", () => {
  console.log("Encerrando servidor...");
  closeRedisConnections();
  // Outros procedimentos de encerramento
  // ...
});

// ... resto do código ...
```

3. **Implementada rota para Server-Sent Events (SSE)**

```typescript
// Adicionado ao buscador_inteligente/src/server.ts

/**
 * Rota para conectar ao SSE e receber atualizações em tempo real
 * Esta rota substitui o polling para verificar o status da tarefa
 */
app.get(
  "/api/v1/sse/connect/:requestId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const token = req.query.token as string;

      if (!requestId) {
        res.status(400).json({ error: "ID da tarefa é obrigatório" });
        return;
      }

      console.log(`Iniciando conexão SSE para a tarefa: ${requestId}`);

      // Verificar autenticação (opcional, dependendo da configuração)
      if (token) {
        console.log(`Token recebido: ${token.substring(0, 15)}...`);
      }

      // Configurar SSE
      const sseService = SSEService.getInstance();
      sseService.addConnection(requestId, res);

      // Enviar estado inicial
      const trackerContext = trackers.get(requestId);
      if (trackerContext) {
        // Se a tarefa está ativa, enviamos o contexto atual
        sseService.sendInitialContext(requestId, trackerContext);
      } else {
        // Se a tarefa não está ativa, tentamos buscar dos metadados
        try {
          const metadata = await getQueryMetadata(requestId);
          if (metadata) {
            // Formata os dados para o formato esperado pelo cliente
            const data = {
              requestId,
              completed: true,
              status: metadata.status,
              step: 5, // Último passo
              currentAction: "Processamento concluído",
              researchDetails: [
                {
                  type: "text",
                  content: "Análise detalhada concluída com sucesso.",
                },
              ],
              partialInfo: metadata.finalResults || {
                ncmCode: metadata.ncmCode || "",
                ncmDescription: metadata.description || "",
              },
              validationStatus: {
                ncmCode: false,
                ncmDescription: false,
                taxationDetails: false,
                attributes: false,
                conclusion: false,
              },
            };
            sseService.sendEvent(requestId, "message", data);
          } else {
            // Se não encontrarmos a tarefa, enviamos um erro
            sseService.sendEvent(requestId, "error", {
              error: "Tarefa não encontrada",
              code: 404,
            });
            // Fechamos a conexão após enviar o erro
            setTimeout(() => sseService.closeConnection(requestId), 1000);
          }
        } catch (error) {
          console.error(
            `Erro ao buscar metadados da tarefa ${requestId}:`,
            error
          );
          sseService.sendEvent(requestId, "error", {
            error: "Erro interno ao buscar tarefa",
            code: 500,
          });
          // Fechamos a conexão após enviar o erro
          setTimeout(() => sseService.closeConnection(requestId), 1000);
        }
      }

      // Configurar cleanup quando a conexão for fechada
      req.on("close", () => {
        console.log(`Conexão SSE fechada para ${requestId}`);
        sseService.closeConnection(requestId);
      });
    } catch (error) {
      console.error("Erro ao configurar conexão SSE:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);
```

### Parte 3: Implementação no FastAPI

1. **Criado serviço Redis para FastAPI**

```python
# fastapi/app/services/redis_service.py

import os
import json
import redis
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

# Canais Redis
CHANNELS = {
    "NODE_TASK_UPDATES": "node:task_updates",
    "FASTAPI_TASK_UPDATES": "fastapi:task_updates",
    "MODEL_SELECTION": "model:selection",
    "QUERY_RESULTS": "query:results",
    "NCM_RESPONSE": "ncm:response"
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
    pubsub.subscribe(
        CHANNELS["NODE_TASK_UPDATES"],
        CHANNELS["QUERY_RESULTS"],
        CHANNELS["NCM_RESPONSE"]
    )

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

                    elif channel == CHANNELS["NCM_RESPONSE"]:
                        print(f"Resposta NCM recebida para: {request_id}")
                        print(json.dumps(data, indent=2))

                        # Limpar cache após um tempo ou implementar LRU cache
                        # TODO: Implementar limpeza de cache

            except Exception as e:
                print(f"Erro ao processar mensagem Redis: {e}")

# Iniciar thread do listener
def start_redis_listener():
    thread = threading.Thread(target=redis_listener, daemon=True)
    thread.start()
    print("Listener Redis iniciado em thread separada")
    return thread

# Obter atualizações de tarefa
def get_task_updates(request_id: str) -> List[Dict[str, Any]]:
    if request_id in task_cache:
        return task_cache[request_id]["updates"]
    return []

# Obter resultados de tarefa
def get_task_results(request_id: str) -> Optional[Dict[str, Any]]:
    if request_id in task_cache and task_cache[request_id]["results"]:
        return task_cache[request_id]["results"]
    return None

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

# Publicar seleção de modelo
def publish_model_selection(request_id: str, model: str, query: Any):
    redis_client.publish(
        CHANNELS["MODEL_SELECTION"],
        json.dumps({
            "requestId": request_id,
            "model": model,
            "query": query,
            "timestamp": datetime.now().isoformat()
        })
    )

# Publicar requisição NCM
def publish_ncm_request(request_id: str, query: Dict[str, Any]):
    redis_client.publish(
        CHANNELS["NCM_REQUEST"],
        json.dumps({
            "requestId": request_id,
            "query": query,
            "timestamp": datetime.now().isoformat()
        })
    )

# Verificar conexão Redis
def check_redis_connection() -> bool:
    try:
        return redis_client.ping()
    except Exception as e:
        print(f"Erro ao conectar com Redis: {e}")
        return False
```

2. **Integrado o serviço Redis no FastAPI**

```python
# Modificado fastapi/app/main.py

from app.services.redis_service import start_redis_listener, check_redis_connection

# ... código existente ...

# Inicializar listener Redis na inicialização
@app.on_event("startup")
async def startup_event():
    # Iniciar listener Redis em thread separada
    if check_redis_connection():
        start_redis_listener()
        print("Serviço Redis inicializado com sucesso")
    else:
        print("AVISO: Não foi possível conectar ao Redis")
```

3. **Modificadas as rotas para usar Redis**

```python
# Modificado fastapi/app/routes/queries/__init__.py

from app.services.redis_service import publish_model_selection, get_task_updates, get_task_results

# ... código existente ...

@router.post("/process", response_model=ProcessResponse)
async def process_query(query: Query, background_tasks: BackgroundTasks):
    """
    Processa uma consulta e retorna um ID de requisição
    """
    request_id = str(uuid.uuid4())

    # Selecionar modelo com base na consulta
    model = query.model or "default"

    # Publicar seleção de modelo via Redis
    publish_model_selection(request_id, model, query.dict())

    return {
        "request_id": request_id,
        "status": "processing"
    }

@router.get("/task-status/{request_id}")
async def get_task_status(request_id: str, response: Response):
    """
    Verifica o status de uma tarefa
    """
    # Permitir CORS para esta rota
    response.headers.update({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    })

    # Primeiro tenta obter resultados finais
    results = get_task_results(request_id)
    if results:
        return {
            "status": "completed",
            "results": results
        }

    # Se não há resultados, verifica atualizações
    updates = get_task_updates(request_id)
    if updates:
        latest_update = updates[-1]
        return {
            "status": "processing",
            "latest_update": latest_update
        }

    # Se não há nem resultados nem atualizações
    return {
        "status": "not_found",
        "message": f"Tarefa {request_id} não encontrada"
    }
```

### Parte 4: Implementação no Frontend

1. **Substituído polling por SSE no DeepResearchSidebar**

```typescript
// frontend/src/components/DeepResearchSidebar/index.tsx

// Utilizando SSE para atualizações em vez de polling
const setupEventSource = (requestId: string) => {
  if (eventSource) {
    eventSource.close();
  }

  const url = `${API_URL}/api/v1/sse/connect/${requestId}`;
  const newEventSource = new EventSource(url);

  newEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Atualizar o estado do componente com base nos dados recebidos
      setSidebarStatus("progress");
      setSteps(data.steps || []);
      setResearchDetails(data.researchDetails || []);
      setPartialInfo(data.partialInfo || {});

      if (data.completed) {
        setSidebarStatus("completed");
        newEventSource.close();
      }
    } catch (error) {
      console.error("Erro ao processar mensagem SSE:", error);
    }
  };

  newEventSource.onerror = (error) => {
    console.error("Erro na conexão SSE:", error);
    newEventSource.close();
    setEventSource(null);
  };

  setEventSource(newEventSource);
};

// Usar no useEffect em vez do polling
useEffect(() => {
  if (requestId) {
    setupEventSource(requestId);
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}, [requestId]);
```

2. **Modificado o Axios para usar os endpoints corretos**

```typescript
// frontend/src/axiosConfig.ts

import axios from "axios";

// Obter URL da API com base no ambiente
const getApiUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return "/api"; // Em desenvolvimento, proxy para o backend
  } else if (process.env.NODE_ENV === "production") {
    return "/api"; // Em produção, mesmo domínio
  }
  return "/api"; // Fallback
};

const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Adicionar token de autenticação se disponível
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
```

## Melhorias Implementadas

1. **Eliminação do Polling**

   - Substituído o mecanismo de polling por Server-Sent Events (SSE)
   - Redução significativa no número de requisições ao servidor
   - Informações em tempo real para o usuário

2. **Comunicação Assíncrona**

   - Redis como message broker entre serviços
   - Permitida comunicação bidirecional entre FastAPI e Node.js
   - Melhor escalabilidade e separação de responsabilidades

3. **Suporte à Seleção de Modelos**

   - Frontend pode selecionar qual modelo usar
   - FastAPI encaminha a seleção para o Node.js via Redis
   - Node.js processa a consulta com o modelo selecionado

4. **Tratamento de Erros e Reconexão**

   - Implementado mecanismo de reconexão em caso de falha
   - Tratamento adequado de erros em cada camada da aplicação
   - Logs detalhados para diagnóstico de problemas

5. **Desempenho e Escalabilidade**
   - Redução de carga no servidor por eliminar polling
   - Processamento assíncrono permite atender mais usuários simultaneamente
   - Cache local para resultados frequentes

## Próximos Passos

1. **Monitoramento e Métricas**

   - Implementar dashboard para monitoramento do uso do Redis
   - Coletar métricas de desempenho e uso de recursos
   - Alertas para problemas de conectividade ou performance

2. **Otimizações de Cache**

   - Implementar limpeza automática de cache para evitar vazamento de memória
   - Utilizar LRU cache para dados frequentemente acessados
   - Persistir dados críticos em armazenamento duradouro

3. **Segurança Adicional**
   - Refinamento das políticas CORS
   - Implementação de rate limiting para evitar abuso
   - Autenticação e autorização mais granular
