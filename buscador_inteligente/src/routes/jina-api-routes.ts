import { Router, Request, Response, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { getResponse } from "../agent";
import { TokenTracker } from "../utils/token-tracker";
import { ActionTracker } from "../utils/action-tracker";
import { StepAction, AnswerAction, VisitAction } from "../types/globalTypes";

/**
 * Tipos específicos para compatibilidade com a API do Jina UI
 */
interface ChatCompletionRequest {
  messages: Array<{
    role: string;
    content: string | Array<any>;
  }>;
  stream?: boolean;
  reasoning_effort?: "low" | "medium" | "high";
  max_completion_tokens?: number;
  budget_tokens?: number;
  max_attempts?: number;
  max_returned_urls?: number;
  no_direct_answer?: boolean;
  boost_hostnames?: string[];
  bad_hostnames?: string[];
  only_hostnames?: string[];
  response_format?: {
    json_schema?: any;
  };
  model?: string;
}

interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      type?: string;
      annotations?: any[];
    };
    logprobs: null;
    finish_reason: string;
  }>;
  usage?: any;
  visitedURLs?: string[];
  readURLs?: string[];
  numURLs?: number;
}

interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      type?: string;
      url?: string;
      annotations?: any[];
    };
    logprobs: null;
    finish_reason: string | null;
  }>;
  usage?: any;
  visitedURLs?: string[];
  readURLs?: string[];
  numURLs?: number;
}

interface TrackerContext {
  tokenTracker: TokenTracker;
  actionTracker: ActionTracker;
  outputs?: Array<{ step: number; rawResponseText: string }>;
}

/**
 * Interface para controlar o estado de streaming
 */
interface StreamingState {
  isEmitting: boolean;
  currentlyStreaming: boolean;
  remainingContent: string;
  processingQueue: boolean;
  currentGenerator: AsyncGenerator<string, void, unknown> | null;
  queue: Array<{
    type: "text" | "end";
    content: string;
    resolve: () => void;
  }>;
}

/**
 * Utilitários para streaming natural do texto
 */
async function* streamTextNaturally(
  text: string,
  streamingState: StreamingState
) {
  const chunks = splitTextIntoChunks(text);
  let burstMode = false;
  let consecutiveShortItems = 0;

  for (const chunk of chunks) {
    if (!streamingState.currentlyStreaming) {
      yield chunks.slice(chunks.indexOf(chunk)).join("");
      return;
    }

    const delay = calculateDelay(chunk, burstMode);

    if (getEffectiveLength(chunk) <= 3 && chunk.trim().length > 0) {
      consecutiveShortItems++;
      if (consecutiveShortItems >= 3) {
        burstMode = true;
      }
    } else {
      consecutiveShortItems = 0;
      burstMode = false;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    yield chunk;
  }
}

function splitTextIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  let currentChunk = "";
  let inURL = false;

  const pushCurrentChunk = () => {
    if (currentChunk) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1] || "";

    // URL detection
    if (char === "h" && text.slice(i, i + 8).match(/https?:\/\//)) {
      pushCurrentChunk();
      inURL = true;
    }

    if (inURL) {
      currentChunk += char;
      if (/[\s\])}"']/.test(nextChar) || i === text.length - 1) {
        pushCurrentChunk();
        inURL = false;
      }
      continue;
    }

    // CJK character detection
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(char)) {
      pushCurrentChunk();
      chunks.push(char);
      continue;
    }

    // Whitespace handling
    if (/\s/.test(char)) {
      pushCurrentChunk();
      chunks.push(char);
      continue;
    }

    // Regular word building
    currentChunk += char;

    // Break on punctuation
    if (/[.!?,;:]/.test(nextChar)) {
      pushCurrentChunk();
    }
  }

  pushCurrentChunk();
  return chunks.filter((chunk) => chunk !== "");
}

function calculateDelay(chunk: string, burstMode: boolean): number {
  const trimmedChunk = chunk.trim();

  // Handle whitespace
  if (trimmedChunk.length === 0) {
    return Math.random() * 20 + 10;
  }

  // Special handling for URLs
  if (chunk.match(/^https?:\/\//)) {
    return Math.random() * 50 + 10; // Slower typing for URLs
  }

  // Special handling for CJK characters
  if (/^[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]$/.test(chunk)) {
    return Math.random() * 25 + 10; // Longer delay for individual CJK characters
  }

  // Base delay calculation
  let baseDelay;
  if (burstMode) {
    baseDelay = Math.random() * 30 + 10;
  } else {
    const effectiveLength = getEffectiveLength(chunk);
    const perCharacterDelay = Math.max(10, 40 - effectiveLength * 2);
    baseDelay = Math.random() * perCharacterDelay + 10;
  }

  // Add variance based on chunk characteristics
  if (/[A-Z]/.test(chunk[0])) {
    baseDelay += Math.random() * 20 + 10;
  }

  if (/[^a-zA-Z\s]/.test(chunk)) {
    baseDelay += Math.random() * 30 + 10;
  }

  // Add pauses for punctuation
  if (/[.!?]$/.test(chunk)) {
    baseDelay += Math.random() * 200 + 10;
  } else if (/[,;:]$/.test(chunk)) {
    baseDelay += Math.random() * 100 + 10;
  }

  return baseDelay;
}

function getEffectiveLength(chunk: string): number {
  const cjkCount = (
    chunk.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []
  ).length;
  const regularCount = chunk.length - cjkCount;
  return regularCount + cjkCount * 2;
}

/**
 * Processa a fila de geração de texto do streaming
 */
async function processQueue(
  streamingState: StreamingState,
  res: Response,
  requestId: string,
  created: number,
  model: string
) {
  if (streamingState.processingQueue) {
    return;
  }

  streamingState.processingQueue = true;

  try {
    // Verifica se a conexão ainda está aberta
    if (res.writableEnded) {
      console.log(
        `Conexão encerrada, interrompendo processamento da fila para requestId=${requestId}`
      );
      streamingState.processingQueue = false;
      return;
    }

    while (streamingState.queue.length > 0) {
      // Verifica novamente se a conexão ainda está aberta
      if (res.writableEnded) {
        console.log(
          `Conexão encerrada durante processamento da fila para requestId=${requestId}`
        );
        break;
      }

      const item = streamingState.queue.shift();
      if (!item) continue;

      try {
        if (item.type === "text") {
          // Para texto, pode haver múltiplos chunks
          const generator = streamTextNaturally(item.content, streamingState);

          for await (const chunk of generator) {
            // Verifica a cada iteração se a conexão ainda está aberta
            if (res.writableEnded) {
              console.log(
                `Conexão encerrada durante streaming de texto para requestId=${requestId}`
              );
              break;
            }

            try {
              const chatChunk: ChatCompletionChunk = {
                id: requestId,
                object: "chat.completion.chunk",
                created,
                model,
                system_fingerprint: "fp_" + requestId,
                choices: [
                  {
                    index: 0,
                    delta: {
                      content: chunk,
                      type: "think",
                    },
                    logprobs: null,
                    finish_reason: null,
                  },
                ],
              };

              console.log(
                `[DEBUG] Enviando chunk: ${JSON.stringify(chatChunk)}`
              );
              res.write(`data: ${JSON.stringify(chatChunk)}\n\n`);
            } catch (error) {
              console.error(
                `Erro ao escrever chunk de texto para requestId=${requestId}:`,
                error
              );
              break;
            }
          }
        } else if (item.type === "end") {
          // Finaliza o streaming adequadamente
          finalizeStreamingResponse(
            res,
            streamingState,
            requestId,
            created,
            model
          );
          return; // Encerra o processamento após finalizar
        }
      } catch (error) {
        console.error(
          `Erro ao processar item da fila para requestId=${requestId}:`,
          error
        );
        // Continua processando outros itens, não quebra o loop
      }
    }

    // Se chegou até aqui sem encontrar um item 'end', reseta o processamento para permitir novos itens
    streamingState.processingQueue = false;
  } catch (error) {
    console.error(
      `Erro fatal no processamento da fila para requestId=${requestId}:`,
      error
    );
    streamingState.processingQueue = false;

    // Tenta finalizar o streaming mesmo após erro fatal
    try {
      if (!res.writableEnded) {
        finalizeStreamingResponse(
          res,
          streamingState,
          requestId,
          created,
          model
        );
      }
    } catch (e) {
      console.error(
        `Falha ao tentar finalizar streaming após erro fatal para requestId=${requestId}:`,
        e
      );
    }
  }
}

/**
 * Completa qualquer streaming em andamento
 */
async function completeCurrentStreaming(
  streamingState: StreamingState,
  res: Response,
  requestId: string,
  created: number,
  model: string
) {
  try {
    // Verifica se a conexão ainda está aberta
    if (res.writableEnded) {
      console.log("Conexão encerrada, não é possível completar o streaming");
      return;
    }

    // Envia qualquer conteúdo restante
    if (streamingState.isEmitting && streamingState.remainingContent) {
      const chunk: ChatCompletionChunk = {
        id: requestId,
        object: "chat.completion.chunk",
        created,
        model,
        system_fingerprint: "fp_" + requestId,
        choices: [
          {
            index: 0,
            delta: {
              content: streamingState.remainingContent,
              type: "think",
            },
            logprobs: null,
            finish_reason: null,
          },
        ],
      };

      try {
        console.log(`[DEBUG] Enviando chunk: ${JSON.stringify(chunk)}`);
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      } catch (error) {
        console.error("Erro ao escrever conteúdo restante:", error);
      }
    }

    // Aguardar a conclusão de todos os itens na fila com timeout
    const maxWaitTime = 5000; // 5 segundos
    const startTime = Date.now();

    while (streamingState.queue.length > 0) {
      // Verifica se passou do tempo máximo de espera
      if (Date.now() - startTime > maxWaitTime) {
        console.log(
          "Tempo máximo de espera excedido, interrompendo aguardo da fila"
        );
        break;
      }

      // Verifica se a conexão ainda está aberta
      if (res.writableEnded) {
        console.log("Conexão encerrada durante aguardo da fila");
        break;
      }

      await new Promise<boolean>((resolve) => {
        const checkInterval = setInterval(() => {
          // Se a fila estiver vazia ou a conexão encerrada, resolver a Promise
          if (streamingState.queue.length === 0 || res.writableEnded) {
            clearInterval(checkInterval);
            resolve(true);
          }

          // Se passar do tempo máximo, também resolver
          if (Date.now() - startTime > maxWaitTime) {
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
      });
    }
  } catch (error) {
    console.error("Erro ao completar streaming:", error);
  }
}

/**
 * Converte o nível de esforço para orçamento de tokens
 */
function getTokenBudgetAndMaxAttempts(
  reasoningEffort?: string,
  maxCompletionTokens?: number
): { tokenBudget: number; maxBadAttempts: number } {
  // Valores padrão
  let tokenBudget = 100000;
  let maxBadAttempts = 3;

  // Ajustar com base no esforço de raciocínio
  if (reasoningEffort === "low") {
    tokenBudget = 50000;
    maxBadAttempts = 1;
  } else if (reasoningEffort === "medium") {
    tokenBudget = 150000;
    maxBadAttempts = 3;
  } else if (reasoningEffort === "high") {
    tokenBudget = 250000;
    maxBadAttempts = 5;
  }

  // Usar o valor max_completion_tokens se estiver definido
  if (maxCompletionTokens) {
    tokenBudget = maxCompletionTokens;
  }

  return { tokenBudget, maxBadAttempts };
}

/**
 * Finaliza o streaming de forma adequada, enviando o evento [DONE]
 */
function finalizeStreamingResponse(
  res: Response,
  streamingState: StreamingState,
  requestId: string,
  created: number,
  model: string
) {
  try {
    // Verifica se a conexão ainda está aberta
    if (res.writableEnded) {
      console.log(`Conexão já encerrada para requestId=${requestId}`);
      return;
    }

    // Conclui o último chunk com finish_reason
    const finalChunk: ChatCompletionChunk = {
      id: requestId,
      object: "chat.completion.chunk",
      created,
      model,
      system_fingerprint: "fp_" + requestId,
      choices: [
        {
          index: 0,
          delta: {},
          logprobs: null,
          finish_reason: "stop",
        },
      ],
    };

    try {
      console.log(`[DEBUG] Enviando chunk: ${JSON.stringify(finalChunk)}`);
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      // Envia o evento [DONE] para indicar fim do streaming
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error(
        `Erro ao finalizar streaming para requestId=${requestId}:`,
        error
      );
      // Tenta encerrar a resposta mesmo após erro
      try {
        if (!res.writableEnded) {
          res.end();
        }
      } catch (e) {
        // Ignora erros ao tentar encerrar novamente
      }
    }

    // Reseta o estado de streaming
    streamingState.isEmitting = false;
    streamingState.processingQueue = false;
    streamingState.queue = [];
    streamingState.remainingContent = "";
  } catch (error) {
    console.error(
      `Erro fatal ao finalizar streaming para requestId=${requestId}:`,
      error
    );
    try {
      if (!res.writableEnded) {
        res.end();
      }
    } catch (e) {
      // Ignora erros ao tentar encerrar novamente
    }
  }
}

// Criar router
const router = Router();

// Adicionar middleware para autenticação opcional
const secret = process.env.JINA_API_SECRET;

if (secret) {
  router.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ") ||
      authHeader.split(" ")[1] !== secret
    ) {
      console.log("[chat/completions] Requisição não autorizada");
      res.status(401).json({ error: "Não autorizado" });
      return;
    }
    return next();
  });
}

/**
 * @swagger
 * /v1/chat/completions:
 *   post:
 *     tags:
 *       - JinaUI
 *     summary: Solicita uma nova completação de chat
 *     description: Endpoint compatível com Jina UI para obter respostas de chat com suporte a streaming
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChatCompletionRequest"
 *     responses:
 *       "200":
 *         description: Resposta de chat gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ChatCompletionResponse"
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Stream de eventos contendo chunks de resposta (quando stream=true)
 *       "400":
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Descrição do erro
 *       "401":
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Erro de autenticação
 *       "500":
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Descrição do erro
 */
router.post("/chat/completions", (async (req: Request, res: Response) => {
  // Verificar autenticação apenas se o segredo estiver definido
  if (secret) {
    const authHeader = req.headers.authorization;
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ") ||
      authHeader.split(" ")[1] !== secret
    ) {
      console.log("[chat/completions] Requisição não autorizada");
      res.status(401).json({ error: "Não autorizado" });
      return;
    }
  }

  // Log de detalhes da requisição
  console.log("[chat/completions] Requisição:", {
    model: req.body.model,
    stream: req.body.stream,
    messageCount: req.body.messages?.length,
    hasAuth: !!req.headers.authorization,
    requestId: Date.now().toString(),
  });

  const body = req.body as ChatCompletionRequest;
  if (!body.messages?.length) {
    return res.status(400).json({
      error: "O array de mensagens é obrigatório e não deve estar vazio",
    });
  }
  const lastMessage = body.messages[body.messages.length - 1];
  if (lastMessage.role !== "user") {
    return res
      .status(400)
      .json({ error: "A última mensagem deve ser do usuário" });
  }

  // Limpar <think> de todas as mensagens do assistente
  body.messages = body.messages?.filter((message) => {
    if (message.role === "assistant") {
      if (typeof message.content === "string") {
        message.content = (message.content as string)
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .trim();
        return message.content !== "";
      } else if (Array.isArray(message.content)) {
        message.content.forEach((content: any) => {
          if (content.type === "text") {
            content.text = (content.text as string)
              .replace(/<think>[\s\S]*?<\/think>/g, "")
              .trim();
          }
        });
        message.content = message.content.filter(
          (content: any) => !(content.type === "text" && content.text === "")
        );
        return message.content.length > 0;
      }
      return true;
    } else if (message.role === "user" && Array.isArray(message.content)) {
      message.content = message.content.map((content: any) => {
        if (content.type === "image_url") {
          return {
            type: "image",
            image: content.image_url?.url || "",
          };
        }
        return content;
      });
      return true;
    } else if (message.role === "system") {
      if (Array.isArray(message.content)) {
        message.content = message.content
          .map((content: any) => `${content.text || content}`)
          .join(" ");
      }
      return true;
    }
    return true;
  });

  let { tokenBudget, maxBadAttempts } = getTokenBudgetAndMaxAttempts(
    body.reasoning_effort,
    body.max_completion_tokens
  );

  if (body.budget_tokens) {
    tokenBudget = body.budget_tokens;
  }
  if (body.max_attempts) {
    maxBadAttempts = body.max_attempts;
  }

  const requestId = Date.now().toString();
  const created = Math.floor(Date.now() / 1000);
  const context: TrackerContext = {
    tokenTracker: new TokenTracker(),
    actionTracker: new ActionTracker({ requestId }),
    outputs: [],
  };

  // Configuração do estado de streaming
  const streamingState: StreamingState = {
    isEmitting: false,
    currentlyStreaming: false,
    remainingContent: "",
    processingQueue: false,
    currentGenerator: null,
    queue: [],
  };

  if (body.stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Enviar chunk inicial com tag think de abertura
    const initialChunk: ChatCompletionChunk = {
      id: requestId,
      object: "chat.completion.chunk",
      created,
      model: body.model || "agent",
      system_fingerprint: "fp_" + requestId,
      choices: [
        {
          index: 0,
          delta: { role: "assistant", content: "<think>", type: "think" },
          logprobs: null,
          finish_reason: null,
        },
      ],
    };
    res.write(`data: ${JSON.stringify(initialChunk)}\n\n`);

    // Configurar listener de progresso com limpeza
    const actionListener = async (step: StepAction) => {
      // Adicionar conteúdo à fila para etapas de pensamento e resposta final
      if (step.action === "visit") {
        // Emitir cada URL na ação de visita no campo de URL
        (step as VisitAction).URLTargets.forEach((url) => {
          const chunk: ChatCompletionChunk = {
            id: requestId,
            object: "chat.completion.chunk",
            created,
            model: body.model || "agent",
            system_fingerprint: "fp_" + requestId,
            choices: [
              {
                index: 0,
                delta: { type: "think", url: String(url) },
                logprobs: null,
                finish_reason: null,
              },
            ],
          };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        });
      }

      if (step.think) {
        // Se não terminar com um espaço, adicione um
        const content = step.think + " ";
        await new Promise<void>((resolve) => {
          streamingState.queue.push({
            type: "text",
            content,
            resolve,
          });
          // Uma única chamada para processar a fila é suficiente
          processQueue(
            streamingState,
            res,
            requestId,
            created,
            body.model || "agent"
          );
        });
      }
    };

    context.actionTracker.on("action", actionListener);

    // Garantir a limpeza do código
    res.on("finish", () => {
      streamingState.currentlyStreaming = false;
      streamingState.currentGenerator = null;
      streamingState.remainingContent = "";
      context.actionTracker.removeListener("action", actionListener);
    });
  }

  try {
    const lastContent = lastMessage.content as string;
    console.log("Processando consulta:", lastContent);

    // Criar um contexto compatível com a função getResponse
    const agentContext: Partial<TrackerContext> = {
      tokenTracker: context.tokenTracker,
      actionTracker: context.actionTracker,
      outputs: [], // Array vazio do tipo correto
    };

    // Usar getResponse para obter resposta real em vez de simulação
    const response = await getResponse(
      lastContent,
      tokenBudget,
      maxBadAttempts,
      agentContext,
      requestId
    );

    const finalStep = response.result;

    // URLs para a resposta
    const visitedURLs: string[] = [];
    const readURLs: string[] = [];
    const allURLs: string[] = [...visitedURLs];

    // Extrair a resposta do resultado
    let finalAnswer = "";
    let annotations = undefined;

    if (finalStep.action === "answer") {
      finalAnswer = (finalStep as AnswerAction).answer;

      // Extrair URLs das referências, se existirem
      if ((finalStep as AnswerAction).references) {
        (finalStep as AnswerAction).references.forEach((ref) => {
          if (ref.url) {
            visitedURLs.push(ref.url);
            readURLs.push(ref.url);
            if (!allURLs.includes(ref.url)) {
              allURLs.push(ref.url);
            }
          }
        });
      }
    } else {
      finalAnswer = "Resposta processada para a consulta: " + lastContent;
    }

    // Rastrear uso de tokens
    context.tokenTracker.trackUsage(
      "chat-api",
      context.tokenTracker.getTotalUsage()
    );

    // Preparar objeto de uso de tokens
    const usage = {
      prompt_tokens: context.tokenTracker.getTotalUsage() / 2,
      completion_tokens: context.tokenTracker.getTotalUsage() / 2,
      total_tokens: context.tokenTracker.getTotalUsage(),
    };

    if (body.stream) {
      // Completar qualquer streaming em andamento antes de enviar resposta final
      await completeCurrentStreaming(
        streamingState,
        res,
        requestId,
        created,
        body.model || "agent"
      );

      // Enviar tag think de fechamento
      const closeThinkChunk: ChatCompletionChunk = {
        id: requestId,
        object: "chat.completion.chunk",
        created,
        model: body.model || "agent",
        system_fingerprint: "fp_" + requestId,
        choices: [
          {
            index: 0,
            delta: { content: `</think>\n\n`, type: "think" },
            logprobs: null,
            finish_reason: "thinking_end",
          },
        ],
      };
      res.write(`data: ${JSON.stringify(closeThinkChunk)}\n\n`);

      // Após o conteúdo ser totalmente transmitido, enviar o chunk final
      const finalChunk: ChatCompletionChunk = {
        id: requestId,
        object: "chat.completion.chunk",
        created,
        model: body.model || "agent",
        system_fingerprint: "fp_" + requestId,
        choices: [
          {
            index: 0,
            delta: {
              content: finalAnswer,
              type: "text",
              annotations,
            },
            logprobs: null,
            finish_reason: "stop",
          },
        ],
        usage,
        visitedURLs: visitedURLs || [],
        readURLs: readURLs || [],
        numURLs: allURLs ? allURLs.length : 0,
      };
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.end();
    } else {
      // Para respostas não-streaming, enviar resposta completa
      const response: ChatCompletionResponse = {
        id: requestId,
        object: "chat.completion",
        created,
        model: body.model || "agent",
        system_fingerprint: "fp_" + requestId,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: finalAnswer,
              type: "text",
              annotations,
            },
            logprobs: null,
            finish_reason: "stop",
          },
        ],
        usage,
        visitedURLs: visitedURLs || [],
        readURLs: readURLs || [],
        numURLs: allURLs ? allURLs.length : 0,
      };

      // Log da resposta final
      console.log("[chat/completions] Resposta:", {
        id: response.id,
        status: 200,
        contentLength: response.choices[0].message.content.length,
        usage: response.usage,
      });

      res.json(response);
    }
  } catch (error: any) {
    // Log de detalhes do erro
    console.error("[chat/completions] Erro:", {
      message: error?.message || "Ocorreu um erro",
      stack: error?.stack,
      type: error?.constructor?.name,
      requestId,
    });

    // Limpar listeners de eventos
    context.actionTracker.removeAllListeners("action");

    // Obter uso de tokens no formato da API OpenAI
    const usage = {
      prompt_tokens: context.tokenTracker.getTotalUsage() / 2,
      completion_tokens: 0,
      total_tokens: context.tokenTracker.getTotalUsage(),
    };

    if (body.stream && res.headersSent) {
      try {
        // Para respostas de streaming que já começaram, enviar erro como chunk
        // Primeiro enviar tag think de fechamento
        const closeThinkChunk: ChatCompletionChunk = {
          id: requestId,
          object: "chat.completion.chunk",
          created,
          model: body.model || "agent",
          system_fingerprint: "fp_" + requestId,
          choices: [
            {
              index: 0,
              delta: { content: "</think>", type: "think" },
              logprobs: null,
              finish_reason: "error",
            },
          ],
          usage,
        };

        // Verifica se a conexão ainda está aberta
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(closeThinkChunk)}\n\n`);

          const errorMessage = error?.message || "Ocorreu um erro";
          const errorChunk: ChatCompletionChunk = {
            id: requestId,
            object: "chat.completion.chunk",
            created,
            model: body.model || "agent",
            system_fingerprint: "fp_" + requestId,
            choices: [
              {
                index: 0,
                delta: { content: errorMessage, type: "error" },
                logprobs: null,
                finish_reason: "error",
              },
            ],
            usage,
          };
          res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);

          // Finaliza adequadamente o streaming
          finalizeStreamingResponse(
            res,
            streamingState,
            requestId,
            created,
            body.model || "agent"
          );
        }
      } catch (finalizeError) {
        console.error(
          `Erro ao finalizar streaming após erro para requestId=${requestId}:`,
          finalizeError
        );
        // Tenta encerrar a resposta diretamente se ainda não estiver fechada
        if (!res.writableEnded) {
          try {
            res.end();
          } catch (e) {
            // Ignora erros ao tentar encerrar
          }
        }
      }
    } else {
      // Para respostas não-streaming ou ainda não iniciadas, enviar erro como JSON
      const errorMessage = error?.message || "Ocorreu um erro";
      const response: ChatCompletionResponse = {
        id: requestId,
        object: "chat.completion",
        created,
        model: body.model || "agent",
        system_fingerprint: "fp_" + requestId,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: `Erro: ${errorMessage}`,
              type: "error",
            },
            logprobs: null,
            finish_reason: "error",
          },
        ],
        usage,
      };
      res.status(500).json(response);
    }
  }
}) as RequestHandler);

export default router;
