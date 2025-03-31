import Redis from "ioredis";
import { EventEmitter } from "events";

// Canais Redis
export const CHANNELS = {
  NODE_TASK_UPDATES: "node:task_updates",
  FASTAPI_TASK_UPDATES: "fastapi:task_updates",
  MODEL_SELECTION: "model:selection",
  QUERY_RESULTS: "query:results",
  NCM_REQUEST: "ncm:request",
  NCM_RESPONSE: "ncm:response",
};

// Configuração do Redis
// Usando a porta 6378 conforme configurado no sistema CMEX
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379, // Será 6378 quando definido no .env
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
};

// Clientes Redis
export const publisher = new Redis(redisConfig);
export const subscriber = new Redis(redisConfig);

// Inicializar assinaturas
export function initializeRedisSubscriptions(eventEmitter: EventEmitter) {
  console.log(
    `Assinado nos canais Redis com sucesso em ${redisConfig.host}:${redisConfig.port}`
  );

  // Assinar aos canais relevantes usando Promise em vez de callback
  subscriber
    .subscribe(
      CHANNELS.FASTAPI_TASK_UPDATES,
      CHANNELS.MODEL_SELECTION,
      CHANNELS.NCM_REQUEST
    )
    .then(() => {
      // Mensagem já exibida acima
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
  console.log(
    `Iniciando processamento para ${requestId} com modelo ${modelName}`
  );

  // Aqui você deve implementar a lógica para iniciar o processamento
  // com o modelo selecionado, integrando com seu sistema existente

  // Exemplo:
  // const result = await startProcessingWithModel(requestId, query, modelName);
  // publishQueryResults(requestId, result);
}

// Processar requisição NCM (para teste de integração)
async function processNcmRequest(requestId: string, query: string) {
  console.log(`Processando requisição NCM: ${requestId} - Query: ${query}`);

  // Simular processamento
  setTimeout(() => {
    // Enviar resposta
    publisher.publish(
      CHANNELS.NCM_RESPONSE,
      JSON.stringify({
        requestId,
        response: `Resposta do Node.js para query: ${query}`,
        timestamp: new Date().toISOString(),
      })
    );
    console.log(`Resposta enviada para ${requestId}`);
  }, 1000); // Atraso de 1 segundo para simular processamento
}

// Função para encerrar conexões Redis
export function closeRedisConnections() {
  try {
    if (publisher && publisher.status === "ready") {
      publisher
        .quit()
        .catch((err) => console.error("Erro ao fechar publisher Redis:", err));
    }

    if (subscriber && subscriber.status === "ready") {
      subscriber
        .quit()
        .catch((err) => console.error("Erro ao fechar subscriber Redis:", err));
    }

    console.log("Conexões Redis encerradas com sucesso");
  } catch (error) {
    console.error("Erro ao encerrar conexões Redis:", error);
  }
}
