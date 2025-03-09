# Plano de Implementação: Comunicação entre Frontend, FastAPI e Node.js

## Visão Geral

Este documento detalha a implementação de uma arquitetura de comunicação eficiente entre os três componentes principais do sistema:

1. **Frontend**: Interface do usuário
2. **FastAPI**: Serviço Python para processamento e roteamento
3. **Node.js**: Serviço para integração com modelos de LLM

## Situação Atual

- **Produção**: Frontend e FastAPI estão rodando no Render, mas Node.js ainda não
- **Problema 1**: Comunicação atual usa polling constante (verificações de status em loop)
- **Problema 2**: Node.js está usando apenas modelo local, ignorando a seleção de modelos do usuário
- **Problema 3**: Falta integração adequada entre os serviços para ambiente de produção

## Solução Proposta: Redis Pub/Sub para Comunicação em Produção

Vamos implementar um sistema baseado em Redis Pub/Sub para comunicação assíncrona entre os serviços, eliminando a necessidade de polling constante.

## TODO: Implementação Passo a Passo

### Parte 1: Configuração do Redis

1. **Configurar Redis no Render**
   - Adicionar Redis como add-on no projeto Render
   - Obter as credenciais e URL de conexão
   - Configurar variáveis de ambiente para todos os serviços

```bash
# Exemplo de variáveis de ambiente a serem configuradas no Render
REDIS_HOST=redis-xxxxx.render.com
REDIS_PORT=6379
REDIS_PASSWORD=seu_password
REDIS_TLS=true
```

2. **Instalar dependências necessárias**

   **Para Node.js:**

   ```bash
   pnpm add ioredis
   ```

   **Para FastAPI (Python):**

   ```bash
   pip install redis
   ```

### Parte 2: Implementação no Node.js

1. **Criar módulo de comunicação Redis**

```typescript
// buscador_inteligente/src/services/redis-service.ts

import Redis from "ioredis";
import { ServerLog } from "../server";

// Canais Redis
export const CHANNELS = {
  NODE_TASK_UPDATES: "node:task_updates",
  FASTAPI_TASK_UPDATES: "fastapi:task_updates",
  MODEL_SELECTION: "model:selection",
  QUERY_RESULTS: "query:results",
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
export function initializeRedisSubscriptions(eventEmitter: any) {
  // Assinar aos canais relevantes
  subscriber.subscribe(
    CHANNELS.FASTAPI_TASK_UPDATES,
    CHANNELS.MODEL_SELECTION,
    (err) => {
      if (err) {
        console.error("Erro ao assinar canais Redis:", err);
        return;
      }
      console.log("Assinado nos canais Redis com sucesso");
    }
  );

  // Manipular mensagens recebidas
  subscriber.on("message", (channel, message) => {
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

2. **Integrar o serviço Redis no servidor Node.js**

```typescript
// Modificar buscador_inteligente/src/server.ts

import {
  initializeRedisSubscriptions,
  publishTaskUpdate,
  closeRedisConnections,
  CHANNELS,
} from "./services/redis-service";

// ... código existente ...

// Inicializar Redis na inicialização do servidor
initializeRedisSubscriptions(eventEmitter);

// Modificar a função emitTrackerUpdate para também publicar via Redis
function emitTrackerUpdate(requestId: string, context: TrackerContext) {
  // Código existente para emitir via WebSocket
  // ...

  // Adicionar publicação via Redis
  publishTaskUpdate(requestId, "tracker_update", {
    state: context.actionTracker.getState(),
    tokenUsage: context.tokenTracker.getTotalUsage(),
  });
}

// Modificar a função captureLLMOutput para também publicar via Redis
function captureLLMOutput(requestId: string, type: string, data: any) {
  // Código existente
  // ...

  // Adicionar publicação via Redis
  publishTaskUpdate(requestId, "llm_output", {
    type,
    data,
  });
}

// Adicionar manipulador para encerrar conexões Redis ao fechar o servidor
process.on("SIGTERM", () => {
  console.log("Encerrando servidor...");
  closeRedisConnections();
  // Outros procedimentos de encerramento
  // ...
});

// ... resto do código ...
```

3. **Implementar rota para receber seleção de modelo**

```typescript
// Adicionar ao buscador_inteligente/src/server.ts

// ... código existente ...

// Rota para processar consulta com modelo específico
app.post("/api/v1/process-with-model", async (req, res) => {
  try {
    const { query, model, requestId } = req.body;

    if (!query || !model || !requestId) {
      return res.status(400).json({ error: "Parâmetros incompletos" });
    }

    // Iniciar processamento com o modelo selecionado
    // Esta função deve ser implementada para usar o modelo correto
    const context = await startProcessingWithModel(requestId, query, model);

    return res.status(200).json({
      success: true,
      message: "Processamento iniciado",
      requestId,
    });
  } catch (error) {
    console.error("Erro ao processar consulta:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Função para iniciar processamento com modelo específico
async function startProcessingWithModel(
  requestId: string,
  query: string,
  modelName: string
) {
  // Implementar lógica para usar o modelo selecionado
  // Esta função deve iniciar o processamento com o modelo correto
  // ...
}

// ... resto do código ...
```

### Parte 3: Implementação no FastAPI

1. **Criar serviço Redis para FastAPI**

```python
# fastapi/app/services/redis_service.py

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
                        # ...

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
```

2. **Integrar o serviço Redis no FastAPI**

```python
# Modificar fastapi/app/main.py

from fastapi import FastAPI, Request, BackgroundTasks
from app.services.redis_service import (
    start_redis_listener,
    publish_model_selection,
    get_task_updates,
    get_query_results
)
import uuid
from datetime import datetime

# ... código existente ...

# Iniciar listener Redis na inicialização
@app.on_event("startup")
async def startup_event():
    start_redis_listener()
    # Outros procedimentos de inicialização
    # ...

# Modificar rota de consulta para usar Redis
@app.post("/api/v1/query")
async def process_query(request: Request):
    try:
        data = await request.json()
        query = data.get("query")
        model = data.get("model", "default")

        if not query:
            return {"error": "Consulta não fornecida"}

        # Gerar ID de requisição único
        request_id = str(uuid.uuid4())

        # Publicar seleção de modelo via Redis
        publish_model_selection(request_id, model, query)

        return {
            "success": True,
            "message": "Consulta enviada para processamento",
            "requestId": request_id
        }
    except Exception as e:
        return {"error": str(e)}

# Rota para verificar status da consulta
@app.get("/api/v1/query-status/{request_id}")
async def get_query_status(request_id: str):
    updates = get_task_updates(request_id)
    results = get_query_results(request_id)

    if results:
        return {
            "status": "completed",
            "results": results
        }

    if not updates.get("updates"):
        return {
            "status": "not_found",
            "message": "Consulta não encontrada"
        }

    return {
        "status": "in_progress",
        "updates": updates.get("updates", [])[-5:]  # Retornar apenas as 5 últimas atualizações
    }

# ... resto do código ...
```

### Parte 4: Implementação no Frontend

1. **Atualizar o serviço de API no frontend**

```typescript
// frontend/src/services/api.ts

import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";
const NODE_API_URL =
  process.env.REACT_APP_NODE_API_URL || "http://localhost:3000";

// Função para enviar consulta
export async function sendQuery(query: string, model: string) {
  try {
    const response = await axios.post(`${API_URL}/api/v1/query`, {
      query,
      model,
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar consulta:", error);
    throw error;
  }
}

// Função para verificar status da consulta
export async function checkQueryStatus(requestId: string) {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/query-status/${requestId}`
    );
    return response.data;
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    throw error;
  }
}

// Função para configurar SSE (Server-Sent Events)
export function setupSSE(requestId: string, onMessage: (data: any) => void) {
  const eventSource = new EventSource(
    `${NODE_API_URL}/api/v1/stream/${requestId}`
  );

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Erro ao processar evento SSE:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("Erro na conexão SSE:", error);
    eventSource.close();
  };

  return {
    close: () => eventSource.close(),
  };
}

// Função para chat direto com o Node.js
export async function sendChatMessage(message: string, model: string) {
  try {
    const response = await axios.post(`${NODE_API_URL}/api/v1/chat`, {
      message,
      model,
    });

    return response.data;
  } catch (error) {
    console.error("Erro ao enviar mensagem de chat:", error);
    throw error;
  }
}
```

2. **Atualizar o componente de pesquisa**

```typescript
// frontend/src/components/Search.tsx

import React, { useState, useEffect } from "react";
import { sendQuery, checkQueryStatus, setupSSE } from "../services/api";

const Search = () => {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("gpt4");
  const [requestId, setRequestId] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState("");

  // Limpar SSE ao desmontar componente
  useEffect(() => {
    let sseConnection = null;

    if (requestId) {
      sseConnection = setupSSE(requestId, (data) => {
        if (data.type === "progress") {
          setUpdates((prev) => [...prev, data]);
        } else if (data.type === "result") {
          setResults(data.data);
          setLoading(false);
        } else if (data.type === "error") {
          setError(data.message || "Erro ao processar consulta");
          setLoading(false);
        }
      });
    }

    return () => {
      if (sseConnection) {
        sseConnection.close();
      }
    };
  }, [requestId]);

  // Verificar status periodicamente (fallback para SSE)
  useEffect(() => {
    let interval = null;

    if (requestId && loading) {
      interval = setInterval(async () => {
        try {
          const status = await checkQueryStatus(requestId);

          if (status.status === "completed") {
            setResults(status.results);
            setLoading(false);
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      }, 3000); // Verificar a cada 3 segundos
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [requestId, loading]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults(null);
    setUpdates([]);
    setError("");

    try {
      const response = await sendQuery(query, model);

      if (response.success && response.requestId) {
        setRequestId(response.requestId);
      } else {
        setError(response.error || "Erro ao iniciar consulta");
        setLoading(false);
      }
    } catch (error) {
      setError("Erro ao conectar ao servidor");
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="model-select"
        >
          <option value="gpt4">GPT-4</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="local">Modelo Local</option>
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite sua consulta..."
          className="query-input"
        />

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="search-button"
        >
          {loading ? "Pesquisando..." : "Pesquisar"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((updates.length / 10) * 100, 90)}%` }}
            />
          </div>
          <div className="updates-container">
            {updates.slice(-3).map((update, index) => (
              <div key={index} className="update-item">
                {update.data.message || JSON.stringify(update.data)}
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="results-container">
          {/* Renderizar resultados aqui */}
        </div>
      )}
    </div>
  );
};

export default Search;
```

### Parte 5: Configuração para Produção no Render

1. **Configurar serviço Node.js no Render**

```yaml
# render.yaml (ou configuração manual no dashboard do Render)
services:
  - type: web
    name: buscador-node
    env: node
    buildCommand: cd buscador_inteligente && pnpm install && pnpm build
    startCommand: cd buscador_inteligente && pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: REDIS_HOST
        fromService:
          type: redis
          name: buscador-redis
          property: host
      - key: REDIS_PORT
        fromService:
          type: redis
          name: buscador-redis
          property: port
      - key: REDIS_PASSWORD
        fromService:
          type: redis
          name: buscador-redis
          property: password
      - key: REDIS_TLS
        value: true
      # Outras variáveis de ambiente necessárias
      # ...

  # Serviço Redis
  - type: redis
    name: buscador-redis
    ipAllowList: []
    plan: free
```

2. **Atualizar variáveis de ambiente no FastAPI e Frontend**

Para o FastAPI, adicionar:

```
REDIS_HOST=...
REDIS_PORT=...
REDIS_PASSWORD=...
REDIS_TLS=true
NODE_API_URL=https://buscador-node.onrender.com
```

Para o Frontend, adicionar:

```
REACT_APP_API_URL=https://buscador-fastapi.onrender.com
REACT_APP_NODE_API_URL=https://buscador-node.onrender.com
```

### Parte 6: Implementação do Chat Direto com Node.js

1. **Adicionar rota de chat no Node.js**

```typescript
// Adicionar ao buscador_inteligente/src/server.ts

// ... código existente ...

// Rota para chat direto
app.post("/api/v1/chat", async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem não fornecida" });
    }

    // Usar o modelo especificado ou padrão
    const modelToUse = model || "gpt4";

    // Processar mensagem com o modelo selecionado
    const response = await processChat(message, modelToUse);

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Erro ao processar mensagem de chat:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Função para processar chat com modelo específico
async function processChat(message: string, modelName: string) {
  // Implementar lógica para usar o modelo selecionado
  // Esta função deve processar a mensagem com o modelo correto
  // ...
}

// ... resto do código ...
```

2. **Implementar componente de chat no frontend**

```typescript
// frontend/src/components/Chat.tsx

import React, { useState } from "react";
import { sendChatMessage } from "../services/api";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [model, setModel] = useState("gpt4");
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Adicionar mensagem do usuário à conversa
    const userMessage = { role: "user", content: message };
    setConversation((prev) => [...prev, userMessage]);

    // Limpar input e mostrar loading
    setMessage("");
    setLoading(true);

    try {
      // Enviar mensagem diretamente para o Node.js
      const response = await sendChatMessage(message, model);

      if (response.success) {
        // Adicionar resposta à conversa
        setConversation((prev) => [
          ...prev,
          { role: "assistant", content: response.response },
        ]);
      } else {
        // Adicionar mensagem de erro
        setConversation((prev) => [
          ...prev,
          { role: "system", content: "Erro ao processar mensagem" },
        ]);
      }
    } catch (error) {
      // Adicionar mensagem de erro
      setConversation((prev) => [
        ...prev,
        { role: "system", content: "Erro ao conectar ao servidor" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="model-select"
        >
          <option value="gpt4">GPT-4</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="local">Modelo Local</option>
        </select>
      </div>

      <div className="chat-messages">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.role === "user" ? "user-message" : "assistant-message"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="message assistant-message loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          disabled={loading}
        />

        <button
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};

export default Chat;
```

## Considerações Finais

### Benefícios da Implementação

1. **Eliminação do polling**: Comunicação eficiente via Redis Pub/Sub
2. **Suporte a modelos de mercado**: Roteamento adequado para modelos selecionados pelo usuário
3. **Preparação para produção**: Configuração completa para deploy no Render
4. **Separação de responsabilidades**: FastAPI para roteamento, Node.js para processamento de LLM

### Próximos Passos

1. **Monitoramento**: Implementar métricas e logs para acompanhar o desempenho
2. **Escalabilidade**: Configurar auto-scaling para os serviços no Render
3. **Fallback**: Implementar mecanismos de fallback caso o Redis ou algum serviço fique indisponível
4. **Segurança**: Adicionar autenticação e autorização para as APIs

### Observações Importantes

- Certifique-se de que todas as variáveis de ambiente estejam configuradas corretamente
- Teste a comunicação entre os serviços em ambiente de desenvolvimento antes de implantar em produção
- Implemente tratamento de erros robusto em todos os componentes
- Considere adicionar um sistema de cache para reduzir a carga nos modelos LLM
  </rewritten_file>
