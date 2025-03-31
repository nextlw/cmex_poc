import { Router, Request, Response, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { getResponse } from "../agent";
import { TokenTracker } from "../utils/token-tracker";
import { ActionTracker } from "../utils/action-tracker";
import { StepAction, AnswerAction, VisitAction } from "../types/globalTypes";
import {
  Reference,
  TrackerContext,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  URLAnnotation,
  TokenUsageData,
  ChatMessage,
  ContentPart,
  URLCitation,
} from "../types";
import { ChatCompletionRequestSchema } from "../schemas/ui-api-schema";

/**
 * Tipos específicos para compatibilidade com a API do Jina UI
 */
// interface ChatCompletionRequest { ... } // REMOVER
// interface ChatCompletionResponse { ... } // REMOVER
// interface ChatCompletionChunk { ... } // REMOVER
// interface TrackerContext { ... } // REMOVER (usar o importado)

/**
 * Interface para controlar o estado de streaming
 */
// interface StreamingState { ... } // REMOVER

/**
 * Utilitários para streaming natural do texto
 */
// async function* streamTextNaturally( ... ) // REMOVER
// function splitTextIntoChunks( ... ) // REMOVER
// function calculateDelay( ... ) // REMOVER
// function getEffectiveLength( ... ) // REMOVER

/**
 * Processa a fila de geração de texto do streaming
 */
// async function processQueue( ... ) // REMOVER

/**
 * Completa qualquer streaming em andamento
 */
// async function completeCurrentStreaming( ... ) // REMOVER

/**
 * Converte o nível de esforço para orçamento de tokens
 */
function getTokenBudgetAndMaxAttempts(
  reasoningEffort?: "low" | "medium" | "high",
  maxCompletionTokens?: number
): { tokenBudget: number; maxBadAttempts: number } {
  // Valores padrão
  let tokenBudget = 100000;
  let maxBadAttempts = 3;

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

  if (maxCompletionTokens) {
    tokenBudget = maxCompletionTokens;
  }

  return { tokenBudget, maxBadAttempts };
}

/**
 * Finaliza o streaming de forma adequada, enviando o evento [DONE]
 */
// function finalizeStreamingResponse( ... ) // REMOVER

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
  let body: z.infer<typeof ChatCompletionRequestSchema>;

  try {
    body = ChatCompletionRequestSchema.parse(req.body);
    console.log("[chat/completions] Requisição validada com sucesso pelo Zod.");
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[chat/completions] Erro de validação Zod:", error.errors);
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({
        error: "Requisição inválida",
        details: formattedErrors,
      });
    } else {
      console.error("[chat/completions] Erro inesperado na validação:", error);
      return res
        .status(500)
        .json({ error: "Erro interno do servidor ao validar a requisição" });
    }
  }

  console.log("[chat/completions] Detalhes da Requisição Validada:", {
    model: body.model,
    stream: body.stream,
    messageCount: body.messages.length,
    hasAuth: !!req.headers.authorization,
    requestId: Date.now().toString(),
  });

  const lastMessage = body.messages[body.messages.length - 1];

  body.messages = body.messages?.filter((message: ChatMessage) => {
    if (message.role === "assistant") {
      if (typeof message.content === "string") {
        message.content = (message.content as string)
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .trim();
        return message.content !== "";
      } else if (Array.isArray(message.content)) {
        message.content.forEach((content: ContentPart) => {
          if (content.type === "text") {
            content.text = (content.text as string)
              .replace(/<think>[\s\S]*?<\/think>/g, "")
              .trim();
          }
        });
        message.content = message.content.filter(
          (content: ContentPart) =>
            !(content.type === "text" && content.text === "")
        );
        return message.content.length > 0;
      }
      return true;
    } else if (message.role === "user" && Array.isArray(message.content)) {
      return true;
    } else if (message.role === "system") {
      if (Array.isArray(message.content)) {
        message.content = message.content
          .map((content: ContentPart) =>
            content.type === "text" ? content.text : ""
          )
          .join(" ")
          .trim();
      }
      return (
        typeof message.content === "string" && message.content.trim() !== ""
      );
    }
    return true;
  });

  let { tokenBudget, maxBadAttempts } = getTokenBudgetAndMaxAttempts(
    body.reasoning_effort,
    body.max_tokens
  );

  if (body.budget_tokens) {
    tokenBudget = body.budget_tokens;
  }
  if (body.max_attempts) {
    maxBadAttempts = body.max_attempts;
  }

  const requestId = uuidv4();
  const created = Math.floor(Date.now() / 1000);
  const model = body.model || "agent";
  const context: TrackerContext = {
    tokenTracker: new TokenTracker(),
    actionTracker: new ActionTracker({ requestId }),
    outputs: [],
  };

  if (body.stream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const initialChunk: ChatCompletionChunk = {
      id: requestId,
      object: "chat.completion.chunk",
      created,
      model,
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

    const actionListener = (step: StepAction) => {
      if (res.writableEnded) {
        console.warn(
          `[${requestId}] Conexão encerrada, pulando escrita do chunk.`
        );
        return;
      }

      try {
        if (step.think) {
          const thinkChunk: ChatCompletionChunk = {
            id: requestId,
            object: "chat.completion.chunk",
            created,
            model,
            system_fingerprint: "fp_" + requestId,
            choices: [
              {
                index: 0,
                delta: { content: step.think + " ", type: "think" },
                logprobs: null,
                finish_reason: null,
              },
            ],
          };
          console.log(
            `[DEBUG ${requestId}] Enviando think: ${step.think.substring(
              0,
              50
            )}...`
          );
          res.write(`data: ${JSON.stringify(thinkChunk)}\n\n`);
        }

        if (step.action === "visit") {
          const visitStep = step as VisitAction;
          (visitStep.URLTargets as string[])?.forEach((url) => {
            if (url) {
              const urlChunk: ChatCompletionChunk = {
                id: requestId,
                object: "chat.completion.chunk",
                created,
                model,
                system_fingerprint: "fp_" + requestId,
                choices: [
                  {
                    index: 0,
                    delta: { url: String(url), type: "think" },
                    logprobs: null,
                    finish_reason: null,
                  },
                ],
              };
              console.log(`[DEBUG ${requestId}] Enviando URL: ${url}`);
              res.write(`data: ${JSON.stringify(urlChunk)}\n\n`);
            }
          });
        }
      } catch (error) {
        console.error(
          `[${requestId}] Erro ao escrever chunk no listener:`,
          error
        );
      }
    };

    context.actionTracker.on("action", actionListener);

    res.on("finish", () => {
      console.log(`[${requestId}] Conexão 'finish'`);
      context.actionTracker.removeListener("action", actionListener);
    });
    res.on("close", () => {
      console.log(`[${requestId}] Conexão 'close'`);
      context.actionTracker.removeListener("action", actionListener);
      if (!res.writableEnded) {
        res.end();
      }
    });
  }

  try {
    let lastContent: string = "";
    const lastMsgContent = lastMessage.content;
    if (typeof lastMsgContent === "string") {
      lastContent = lastMsgContent;
    } else if (Array.isArray(lastMsgContent)) {
      const textParts = lastMsgContent.filter(
        (part): part is { type: "text"; text: string } => part.type === "text"
      );
      lastContent = textParts.map((part) => part.text).join("\n");
    }

    console.log(
      `[${requestId}] Processando consulta: ${lastContent.substring(0, 100)}...`
    );

    const { result: finalStepUntyped, context: agentContext } =
      await getResponse(
        lastContent,
        tokenBudget,
        maxBadAttempts,
        context,
        requestId
      );

    if (finalStepUntyped.action !== "answer") {
      throw new Error(
        `Passo final inesperado: ${finalStepUntyped.action}. Esperado 'answer'.`
      );
    }
    const finalStep = finalStepUntyped as AnswerAction;

    const finalAnswer = finalStep.answer;

    const annotations: URLAnnotation[] =
      finalStep.references?.map((ref: Reference) => ({
        type: "url_citation",
        url_citation: {
          title: ref.title || "",
          exactQuote: ref.exactQuote,
          url: ref.url,
          dateTime: ref.dateTime || "",
        },
      })) || [];

    const rawTokenCount = agentContext.tokenTracker.getTotalUsage();
    const usage: TokenUsageData = {
      promptTokens: Math.floor(rawTokenCount / 2),
      completionTokens: Math.ceil(rawTokenCount / 2),
      totalTokens: rawTokenCount,
    };

    const visitedURLs: string[] = [];
    const readURLs: string[] = [];
    const allURLsList: string[] = [];

    if (body.stream) {
      if (res.writableEnded) {
        console.warn(
          `[${requestId}] Conexão encerrada antes de enviar chunks finais.`
        );
        return;
      }
      try {
        const closeThinkChunk: ChatCompletionChunk = {
          id: requestId,
          object: "chat.completion.chunk",
          created,
          model,
          system_fingerprint: "fp_" + requestId,
          choices: [
            {
              index: 0,
              delta: {
                content: `</think>\n\n`,
                type: "think",
              },
              logprobs: null,
              finish_reason: "thinking_end",
            },
          ],
          usage,
          visitedURLs,
          readURLs,
          numURLs: allURLsList?.length ?? 0,
        };
        console.log(`[DEBUG ${requestId}] Enviando </think>`);
        res.write(`data: ${JSON.stringify(closeThinkChunk)}\n\n`);

        const finalChunk: ChatCompletionChunk = {
          id: requestId,
          object: "chat.completion.chunk",
          created,
          model,
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
          visitedURLs,
          readURLs,
          numURLs: allURLsList?.length ?? 0,
        };
        console.log(
          `[DEBUG ${requestId}] Enviando resposta final: ${finalAnswer.substring(
            0,
            100
          )}...`
        );
        res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);

        console.log(`[DEBUG ${requestId}] Enviando [DONE]`);
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (error) {
        console.error(`[${requestId}] Erro ao escrever chunks finais:`, error);
        if (!res.writableEnded) {
          res.end();
        }
      }
    } else {
      const response: ChatCompletionResponse = {
        id: requestId,
        object: "chat.completion",
        created,
        model,
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
        visitedURLs,
        readURLs,
        numURLs: allURLsList?.length ?? 0,
      };
      console.log(
        `[DEBUG ${requestId}] Enviando resposta completa (não-stream).`
      );
      res.json(response);
    }
  } catch (error: any) {
    console.error(`[${requestId}] Erro principal:`, error);
    const errorMessage = error?.message || "Ocorreu um erro interno";
    const rawTokenCount = context.tokenTracker.getTotalUsage();
    const usage: TokenUsageData = {
      promptTokens: Math.floor(rawTokenCount / 2),
      completionTokens: 0,
      totalTokens: rawTokenCount,
    };

    if (body.stream && res.headersSent && !res.writableEnded) {
      try {
        const closeThinkErrorChunk: ChatCompletionChunk = {
          id: requestId,
          object: "chat.completion.chunk",
          created,
          model,
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
        res.write(`data: ${JSON.stringify(closeThinkErrorChunk)}\n\n`);

        const errorChunk: ChatCompletionChunk = {
          id: requestId,
          object: "chat.completion.chunk",
          created,
          model,
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

        res.write("data: [DONE]\n\n");
        res.end();
      } catch (writeError) {
        console.error(
          `[${requestId}] Erro ao escrever chunk de erro na stream:`,
          writeError
        );
        if (!res.writableEnded) res.end();
      }
    } else if (!res.headersSent) {
      const response: ChatCompletionResponse = {
        id: requestId,
        object: "chat.completion",
        created,
        model,
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
    } else {
      console.warn(
        `[${requestId}] Stream já finalizada, não é possível enviar erro.`
      );
      if (!res.writableEnded) res.end();
    }
  } finally {
    context.actionTracker.removeAllListeners("action");
  }
}) as RequestHandler);

export default router;
