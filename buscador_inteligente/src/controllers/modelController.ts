import { Request, Response, NextFunction } from "express";
import { TokenTracker } from "../utils/token-tracker";
import { ActionTracker } from "../utils/action-tracker";
import { getResponse } from "../agent";
import { AnswerAction, TrackerContext } from "../types";
import {
  publishTaskUpdate,
  publishQueryResults,
} from "../services/redis-service";

// Funções importadas do server.ts (precisamos ter acesso a estas funções)
// Essas funções devem estar disponíveis no escopo global ou serem importadas
// Imagine que elas estão declaradas como externas para este exemplo
declare function saveQueryMetadata(
  requestId: string,
  metadata: any
): Promise<void>;
declare function updateQueryStatus(
  requestId: string,
  status: string
): Promise<void>;

// Interface para requisições personalizadas
interface ModelRequest extends Request {
  body: {
    query?: string;
    model?: string;
    requestId?: string;
    message?: string;
    [key: string]: any;
  };
}

// Mapa para rastrear contextos
const trackers = new Map<string, TrackerContext>();

// Mapa para armazenar saídas da LLM
const llmOutputsByRequest = new Map<string, any[]>();

// Função para iniciar processamento com modelo específico
async function startProcessingWithModel(
  requestId: string,
  query: string,
  modelName: string
) {
  // Criar contexto de rastreamento
  const tokenTracker = new TokenTracker();
  const actionTracker = new ActionTracker({ requestId });

  const context: TrackerContext = {
    tokenTracker,
    actionTracker,
    outputs: [],
  };

  // Registrar o contexto
  trackers.set(requestId, context);

  // Inicializar saídas da LLM
  llmOutputsByRequest.set(requestId, []);

  // Configurar listeners para rastreamento
  context.actionTracker.on("action", () => {
    // Enviar atualizações via Redis
    publishTaskUpdate(requestId, "tracker_update", {
      state: context.actionTracker.getState(),
      tokenUsage: context.tokenTracker.getTotalUsage(),
    });
  });

  // Iniciar processamento em background
  setTimeout(async () => {
    try {
      // Chamar getResponse com os parâmetros corretos
      const responseResult = await getResponse(
        query,
        10_000_000,
        10,
        {
          tokenTracker,
          actionTracker,
        },
        requestId
      );

      // Publicar resultados
      publishQueryResults(requestId, responseResult);

      // Acessar properties corretamente
      let title = query.substring(0, 50);
      let summary = "";

      // Verificar se é uma AnswerAction
      if (responseResult.result && responseResult.result.action === "answer") {
        const answerAction = responseResult.result as AnswerAction;
        summary = answerAction.answer;
      }

      // Salvar metadados da consulta
      await saveQueryMetadata(requestId, {
        title,
        originalQuestion: query,
        timestamp: new Date().toISOString(),
        status: "completed",
        summary,
        promptCount: Object.keys(tokenTracker.getUsageByModel() || {}).length,
        question: query,
      });

      // Atualizar status
      await updateQueryStatus(requestId, "completed");
    } catch (error) {
      console.error(`Erro ao processar consulta ${requestId}:`, error);

      // Publicar erro
      publishTaskUpdate(requestId, "error", {
        message: "Erro ao processar consulta",
        error: String(error),
      });

      // Atualizar status
      await updateQueryStatus(requestId, "error");
    }
  }, 0);

  return context;
}

// Função para processar chat com modelo específico
async function processChat(message: string, modelName: string) {
  const requestId = `chat-${Date.now()}`;

  // Exemplo simples (ajuste conforme a implementação real):
  const tokenTracker = new TokenTracker();
  const actionTracker = new ActionTracker({ requestId });

  try {
    // Chamar getResponse com os parâmetros corretos
    const responseResult = await getResponse(
      message,
      10_000_000,
      10,
      {
        tokenTracker,
        actionTracker,
      },
      requestId
    );

    // Extrair a resposta corretamente
    let answer = "";

    // Verificar se é uma AnswerAction
    if (responseResult.result && responseResult.result.action === "answer") {
      const answerAction = responseResult.result as AnswerAction;
      answer = answerAction.answer;
    }

    return answer || "Não foi possível processar a mensagem";
  } catch (error) {
    console.error("Erro ao processar chat:", error);
    throw error;
  }
}

// Handler para processar requisição com modelo específico
export async function processWithModelHandler(
  req: ModelRequest,
  res: Response
): Promise<void> {
  try {
    const { query, model, requestId } = req.body;

    if (!query || !model || !requestId) {
      res.status(400).json({ error: "Parâmetros incompletos" });
      return;
    }

    console.log(`Processando consulta com modelo ${model} para ${requestId}`);

    // Iniciar processamento com o modelo selecionado
    const context = await startProcessingWithModel(requestId, query, model);

    res.status(200).json({
      success: true,
      message: "Processamento iniciado",
      requestId,
    });
  } catch (error) {
    console.error("Erro ao processar consulta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Handler para processar chat direto
export async function chatHandler(
  req: ModelRequest,
  res: Response
): Promise<void> {
  try {
    const { message, model } = req.body;

    if (!message) {
      res.status(400).json({ error: "Mensagem não fornecida" });
      return;
    }

    // Usar o modelo especificado ou padrão
    const modelToUse = model || "gpt4";

    // Processar mensagem com o modelo selecionado
    const response = await processChat(message, modelToUse);

    res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Erro ao processar mensagem de chat:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// Roteador principal para modelos
export async function modelRouter(
  req: ModelRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const path = req.path;

  try {
    if (path === "/process-with-model" && req.method === "POST") {
      await processWithModelHandler(req, res);
    } else if (path === "/chat" && req.method === "POST") {
      await chatHandler(req, res);
    } else {
      next(); // Passa para o próximo middleware se não for uma rota reconhecida
    }
  } catch (error) {
    console.error("Erro no modelRouter:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
