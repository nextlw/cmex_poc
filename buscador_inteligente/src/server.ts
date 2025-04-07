/* eslint-disable no-console */
import express, {
  Request,
  Response,
  NextFunction,
  Application,
  RequestHandler,
} from "express";
import cors from "cors";
import { EventEmitter } from "events";
import { getResponse } from "./agent";
import {
  StepAction,
  TrackerContext,
  AnswerAction,
  StreamMessage,
} from "./types/globalTypes";
import fs from "fs/promises";
import path from "path";
import { TokenTracker } from "./utils/token-tracker";
import { ActionTracker } from "./utils/action-tracker";
import swaggerUi from "swagger-ui-express";
import { specs } from "./swagger";
import chokidar from "chokidar";
import { Server as WebSocketServer, WebSocket } from "ws";
import http from "http";
import { QuerySession } from "./types/globalTypes";
import { ensureModelClientInitialized } from "./agent";
import { ncmRouter } from "./controllers/ncm";
import { processarDeepResearch } from "./controllers/deepResearchNCM";
import { modelRouter } from "./controllers/modelController";
import figlet from "figlet";
import jinaApiRoutes from "./routes/jina-api-routes";

// Sobrescrever console.log antes de qualquer outra parte do código para filtrar todas as mensagens
const originalConsoleLog = console.log;
const capturedMessages = {
  modelStatus: "",
  redisConnection: "",
  serverRunning: "",
};

console.log = function (...args) {
  // Converte os argumentos para string para facilitar a verificação
  const logMessage = args.join(" ");

  // Captura mensagens específicas para mostrar após o banner
  if (logMessage.includes("Modelos inicializados")) {
    // Não capturamos nem exibimos esta mensagem
    return;
  }
  if (logMessage.includes("Assinado nos canais Redis com sucesso")) {
    capturedMessages.redisConnection = logMessage;
    return; // Não exibe agora
  }
  if (logMessage.includes("Servidor rodando na porta")) {
    capturedMessages.serverRunning = logMessage;
    return; // Não exibe agora
  }

  // Continua filtrando logs indesejados
  if (
    logMessage.includes("Modelo registrado:") ||
    logMessage.includes("Configuration Summary:") ||
    logMessage.includes("Endpoint local") ||
    (logMessage.includes("Modo de modelo:") && !logMessage.includes("eL.ia"))
  ) {
    return; // Não exibe estes logs
  }

  // Exibe o restante dos logs normalmente
  originalConsoleLog.apply(console, args);
};

// Exibe o banner eL.ia no início da aplicação com linhas de separação
console.log("\n" + "=".repeat(80) + "\n");

// ASCII art da nave espacial
const spaceshipArt = `
     /\\
    /  \\
   |    |
  /|    |\\
 / |    | \\
/__|____|__\\
   /    \\
  /      \\
`;

figlet.text(
  "eL.ia",
  {
    font: "Larry 3D",
    horizontalLayout: "full",
    verticalLayout: "default",
    width: 80,
    whitespaceBreak: false,
  },
  (err: Error | null, result?: string) => {
    if (err) {
      console.log("Algo deu errado ao gerar o banner...");
      console.dir(err);
      return;
    }

    if (result) {
      // Adiciona a nave ao final de cada linha do logo
      const logoLines = result.split("\n");
      const spaceshipLines = spaceshipArt.split("\n");

      // Calcula a largura do logo para posicionar a nave
      const logoWidth = Math.max(...logoLines.map((line) => line.length));

      // Calcula a largura total da arte (logo + nave)
      const totalArtWidth =
        logoWidth +
        Math.max(...spaceshipLines.map((line) => line.trim().length)) +
        2;

      // Calcula o padding para centralizar na tela de 80 caracteres
      const sidePadding = Math.floor((80 - totalArtWidth) / 2);

      // Combina o logo e a nave
      const combinedLines = logoLines.map((line, index) => {
        // Preenche a linha do logo até a largura máxima
        const paddedLine = line.padEnd(logoWidth);
        // Adiciona a linha correspondente da nave (se existir)
        if (index < spaceshipLines.length && spaceshipLines[index]) {
          // Adiciona padding à esquerda para centralizar a arte completa
          return (
            " ".repeat(sidePadding) + paddedLine + "  " + spaceshipLines[index]
          );
        }
        // Se não há linha correspondente da nave, apenas centraliza a linha do logo
        return " ".repeat(sidePadding) + paddedLine;
      });

      // Exibe o resultado combinado
      console.log(combinedLines.join("\n"));

      // Adiciona a frase centralizada
      const subtitle = "Seu buscador inteligente";
      const padding = Math.floor((80 - subtitle.length) / 2);
      console.log("\n" + " ".repeat(padding) + subtitle + "\n");

      // Linha de separação inferior
      console.log("=".repeat(80) + "\n");

      // Arte ASCII de botões com os dizeres solicitados
      const buttons = [
        "┌────────────┐ ┌─────────┐ ┌─────────────┐ ┌────────────┐",
        "│    Busque   │ │   Use   │ │ Codefique  │ │   Acesse   │",
        "└────────────┘ └─────────┘ └─────────────┘ └────────────┘",
      ];

      // Centraliza e exibe os botões
      buttons.forEach((line) => {
        const centerPadding = Math.floor((80 - line.length) / 2);
        originalConsoleLog(" ".repeat(centerPadding) + line);
      });

      // Adiciona uma linha em branco após os botões
      originalConsoleLog("");

      // Exibe apenas as mensagens relevantes capturadas
      if (capturedMessages.redisConnection) {
        // Centraliza a mensagem de conexão Redis
        const redisMsg = capturedMessages.redisConnection;
        const centerPadding = Math.floor((80 - redisMsg.length) / 2);
        originalConsoleLog(" ".repeat(centerPadding) + redisMsg);
      }
      if (capturedMessages.serverRunning) {
        // Centraliza a mensagem de servidor rodando
        const serverMsg = capturedMessages.serverRunning;
        const centerPadding = Math.floor((80 - serverMsg.length) / 2);
        originalConsoleLog(" ".repeat(centerPadding) + serverMsg);
      }
    }
  }
);

// Importar serviço Redis
import {
  initializeRedisSubscriptions,
  publishTaskUpdate,
  publishQueryResults,
  closeRedisConnections,
} from "./services/redis-service";

import { SSEService } from "./services/sse-service";
import { DeepResearchService } from "./services/deep-research-service";
import { v4 as uuidv4 } from "uuid";
import deepResearchRoutes from "./routes/deep-research-routes";

/**
 * Interface para armazenar logs do servidor.
 */
interface ServerLog {
  timestamp: string;
  message: string;
  level: "log" | "error" | "warn" | "info";
  context: {
    pid: number;
    env: string;
    requestId?: string;
  };
}

/**
 * Tamanho máximo do array de logs para evitar crescimento ilimitado.
 */
const MAX_LOGS = 10000;

/**
 * Array para armazenar os logs do servidor.
 */
const serverLogs: ServerLog[] = [];

/**
 * EventEmitter para logs em tempo real.
 */
const logEventEmitter = new EventEmitter();

/**
 * Sobrescreve os métodos do console para capturar logs.
 */
(["log", "error", "warn", "info"] as const).forEach((method) => {
  const originalMethod = console[method] as (...args: any[]) => void;
  console[method] = (...args: any[]) => {
    const message = args
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      )
      .join(" ");
    const logEntry: ServerLog = {
      timestamp: new Date().toISOString(),
      message: message.trim(),
      level: method as "log" | "error" | "warn" | "info",
      context: {
        pid: process.pid,
        env: process.env.NODE_ENV || "development",
      },
    };
    // Limitar o tamanho do array de logs para evitar crescimento ilimitado
    if (serverLogs.length >= MAX_LOGS) {
      serverLogs.shift(); // Remove o log mais antigo
    }
    serverLogs.push(logEntry);
    logEventEmitter.emit("new-log", logEntry);
    originalMethod.apply(console, args);
  };
});

/**
 * Aplicação Express.
 */
const app: express.Application = express();
/**
 * Porta da aplicação.
 * Usando a variável de ambiente NODE_PORT do .env ou PORT diretamente,
 * com fallback para 3001.
 */
const port = 3001;

/**
 * Middleware de CORS.
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend
      "http://localhost:3001", // Node/Next
      "http://localhost:3000", // Node alternativo
      "http://localhost:3003", // Admin Panel
      "http://localhost:8080", // UI-Jina
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
/**
 * Middleware de JSON.
 */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Importar e registrar o roteador de API Jina
app.use("/v1", jinaApiRoutes);

// Middleware para adicionar o campo 'definitive' em requisições para /api/v1/query
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "POST" && req.path === "/api/v1/query" && req.body) {
    // Adiciona o campo 'definitive' se não existir
    if (!req.body.definitive) {
      req.body.definitive = true;
      console.log("Middleware: Campo definitive adicionado à requisição");
    }
  }
  next();
});

// Adicionar a rota de trash-query aqui
app.post("/api/v1/trash-query", async (req: Request, res: Response) => {
  console.log("Recebida requisição POST para /api/v1/trash-query:", req.body);
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: "ID da query é obrigatório" });
      return;
    }

    // Define os caminhos
    const queriesDir = path.join(process.cwd(), "queries");
    const trashDir = path.join(process.cwd(), "trash");
    const queryPath = path.join(queriesDir, id.toString());
    const trashPath = path.join(trashDir, id.toString());
    const taskPath = path.join(process.cwd(), "tasks", `${id.toString()}.json`);
    const trashTaskPath = path.join(trashDir, "tasks");

    console.log("Caminhos configurados:", {
      queriesDir,
      trashDir,
      queryPath,
      trashPath,
      taskPath,
      trashTaskPath,
    });

    // Verifica se a pasta da query existe
    try {
      await fs.access(queryPath);
    } catch {
      res.status(404).json({ error: "Query não encontrada" });
      return;
    }

    // Cria diretórios de lixeira se não existirem
    await fs.mkdir(trashDir, { recursive: true });
    await fs.mkdir(trashTaskPath, { recursive: true });

    // Verifica se o diretório de destino na lixeira já existe
    try {
      await fs.access(trashPath);
      console.log(
        `Diretório de destino já existe na lixeira: ${trashPath}, removendo-o primeiro`
      );
      // Se existir, remove-o completamente antes de mover
      await fs.rm(trashPath, { recursive: true, force: true });
    } catch (error) {
      // Se o diretório não existe, isso é esperado e não é um erro
      console.log(
        `Diretório de destino não existe na lixeira, prosseguindo normalmente`
      );
    }

    // Move a pasta da query para a lixeira
    await fs.rename(queryPath, trashPath);

    // Move o arquivo de task se existir
    // Tratamento melhorado: apenas registra quando o arquivo não existe, sem afetar o fluxo
    try {
      await fs.access(taskPath);
      // Verifica se já existe um arquivo com o mesmo nome na lixeira
      const trashTaskFilePath = path.join(
        trashTaskPath,
        `${id.toString()}.json`
      );
      try {
        await fs.access(trashTaskFilePath);
        // Se existir, remove-o antes de mover o novo
        await fs.unlink(trashTaskFilePath);
      } catch {
        // Se não existir, prossegue normalmente
      }
      await fs.rename(taskPath, trashTaskFilePath);
    } catch (error) {
      console.log(
        "Aviso: Arquivo de task não encontrado:",
        taskPath,
        "Continuando exclusão normalmente."
      );
      // Não trata como erro, apenas como aviso
    }

    res.json({
      success: true,
      message: "Query movida para a lixeira com sucesso",
    });
  } catch (error) {
    console.error("Erro ao mover query para a lixeira:", error);
    res.status(500).json({ error: "Erro interno ao processar a requisição" });
  }
}) as RequestHandler;

/**
 * EventEmitter.
 */
const eventEmitter = new EventEmitter();

// Inicializar Redis na inicialização do servidor
initializeRedisSubscriptions(eventEmitter);

/**
 * Interface de resposta de stream.
 */
interface StreamResponse extends Response {
  write: (chunk: string) => boolean;
}

/**
 * Interface de saída da LLM.
 */
interface LLMOutput {
  timestamp: string;
  type: string;
  data: any;
}

/**
 * Mapa para armazenar as saídas da LLM por requisição.
 */
const llmOutputsByRequest = new Map<string, LLMOutput[]>();

/**
 * Função para capturar saídas da LLM.
 * @param requestId ID da requisição.
 * @param type Tipo da saída.
 * @param data Dados da saída.
 */
function captureLLMOutput(requestId: string, type: string, data: any) {
  const outputs = llmOutputsByRequest.get(requestId);
  if (outputs) {
    outputs.push({
      timestamp: new Date().toISOString(),
      type,
      data,
    });
  }

  // Adicionar publicação via Redis
  publishTaskUpdate(requestId, "llm_output", {
    type,
    data,
  });
}

/**
 * Cria um emitter de progresso.
 * @param requestId ID da requisição.
 * @param budget Orçamento.
 * @param context Contexto.
 */
function createProgressEmitter(
  requestId: string,
  budget: number | undefined,
  context: TrackerContext
) {
  return () => {
    const state = context.actionTracker.getState();
    const budgetInfo = {
      used: context.tokenTracker.getTotalUsage().totalTokens,
      total: budget || 1_000_000,
      percentage: (
        (context.tokenTracker.getTotalUsage().totalTokens /
          (budget || 1_000_000)) *
        100
      ).toFixed(2),
    };

    eventEmitter.emit(`progress-${requestId}`, {
      type: "progress",
      data: { ...state.thisStep, totalStep: state.totalStep },
      step: state.totalStep,
      budget: budgetInfo,
      trackers: {
        tokenUsage: context.tokenTracker.getTotalUsage().totalTokens,
        actionState: context.actionTracker.getState(),
      },
    });
  };
}

/**
 * Limpa o contexto da requisição.
 * @param requestId ID da requisição.
 */
function cleanup(requestId: string) {
  const context = trackers.get(requestId);
  if (context) {
    context.actionTracker.removeAllListeners();
    context.tokenTracker.removeAllListeners();
    trackers.delete(requestId);
  }
}

/**
 * Emite o update do rastreador.
 * @param requestId ID da requisição.
 * @param context Contexto do rastreador.
 */
function emitTrackerUpdate(requestId: string, context: TrackerContext) {
  const state = context.actionTracker.getState();
  const tokenUsage = context.tokenTracker.getTotalUsage().totalTokens;

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
    tokenUsage: context.tokenTracker.getTotalUsage().totalTokens,
  });
}

/**
 * Armazena os rastreadores para cada requisição.
 */
const trackers = new Map<string, TrackerContext>();

/**
 * @swagger
 * components:
 *   schemas:
 *     Query:
 *       type: object
 *       required:
 *         - q
 *       properties:
 *         q:
 *           type: string
 *           description: A pergunta a ser respondida
 *         budget:
 *           type: number
 *           description: Orçamento de tokens
 *         maxBadAttempt:
 *           type: number
 *           description: Número máximo de tentativas ruins
 */

/**
 * @swagger
 * /api/v1/query:
 *   post:
 *     summary: Envia uma pergunta para ser respondida
 *     tags: [Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Query'
 *     responses:
 *       200:
 *         description: ID da requisição gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 */

/**
 * Função para salvar metadados da query
 */
async function saveQueryMetadata(
  requestId: string,
  metadata: {
    title: string;
    originalQuestion: string;
    timestamp: string;
    status: "completed" | "error" | "in_progress" | "cancelled";
    summary?: string;
    promptCount: number;
    question: string;
  }
) {
  const queryPath = path.join(process.cwd(), "queries", requestId);
  const queriesPath = path.join(queryPath, "queries.json");

  try {
    // Cria o diretório se ele não existir
    await fs.mkdir(queryPath, { recursive: true });
    // Salva o arquivo de metadados
    await fs.writeFile(queriesPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error("Erro ao salvar metadados da query:", error);
    throw error; // Repassa o erro para ser tratado em outro lugar
  }
}

// Adicione um novo tipo para os status possíveis
type QueryStatus =
  | "in_progress"
  | "processing"
  | "completed"
  | "error"
  | "cancelled";

// Função para atualizar o status sem substituir outros dados
async function updateQueryStatus(requestId: string, status: QueryStatus) {
  try {
    const queryPath = path.join(
      process.cwd(),
      "queries",
      requestId,
      "queries.json"
    );
    const existingData = await fs
      .readFile(queryPath, "utf-8")
      .then(JSON.parse)
      .catch(() => ({}));

    await fs.writeFile(
      queryPath,
      JSON.stringify(
        {
          ...existingData,
          status,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      )
    );

    // Emite o evento de atualização de status
    eventEmitter.emit(`progress-${requestId}`, {
      type: "status",
      data: { status },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
  }
}

/**
 * Função para obter metadados da query
 */
async function getQueryMetadata(requestId: string) {
  const queryPath = path.join(process.cwd(), "queries", requestId);
  const queriesPath = path.join(queryPath, "queries.json");

  try {
    // Verifica se o arquivo existe
    await fs.access(queriesPath);
    // Lê e retorna os metadados
    const data = await fs.readFile(queriesPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler metadados da query:", error);
    return null; // Retorna null se os metadados não existirem
  }
}

/**
 * Registrar middleware para manipular corpo de requisições de query
 */
app.use("/api/v1/query", (req, res, next) => {
  if (req.method === "POST" && req.body) {
    // Adicionar campo definitive se não existir
    if (req.body.definitive === undefined) {
      req.body.definitive = true;
      console.log(
        "Middleware: Campo 'definitive' adicionado automaticamente:",
        req.body
      );
    }
  }
  next();
});

/**
 * Rota de requisição de query.
 */
app.post("/api/v1/query", (async (req: Request, res: Response) => {
  console.log("Recebida requisição POST:", req.body);
  try {
    const question = req.body.q;
    const budget = req.body.budget;
    const maxBadAttempt = req.body.maxBadAttempt;
    const modelName = req.body.modelo; // Captura o modelo do corpo da requisição

    console.log("Modelo solicitado:", modelName);

    // Validação do parâmetro obrigatório "q"
    if (!question || typeof question !== "string" || question.trim() === "") {
      return res
        .status(400)
        .json({ error: 'Parâmetro "q" (question) é obrigatório' });
    }

    console.log("Processando pergunta:", question);

    // Inicializa as saídas para essa requisição
    const requestId = Date.now().toString();
    llmOutputsByRequest.set(requestId, []);

    // Cria novos rastreadores para esta requisição
    const context: TrackerContext = {
      tokenTracker: new TokenTracker(),
      actionTracker: new ActionTracker({ requestId }),
      outputs: [],
    };
    trackers.set(requestId, context);

    // Configura os listeners imediatamente para ambos os rastreadores
    context.actionTracker.on("action", () =>
      emitTrackerUpdate(requestId, context)
    );
    // context.tokenTracker.on('usage', () => emitTrackerUpdate(requestId, context));

    // Salva os metadados iniciais
    await saveQueryMetadata(requestId, {
      title: "Processando consulta...",
      originalQuestion: question,
      timestamp: new Date().toISOString(),
      status: "in_progress",
      promptCount: 0,
      question: question,
    });

    // Retorna o ID da requisição
    console.log("Enviando resposta:", { requestId });
    res.json({ requestId });

    try {
      // Inicializa com status in_progress
      await updateQueryStatus(requestId, "in_progress");

      // Atualiza para processing quando começa
      await updateQueryStatus(requestId, "processing");

      // Se um modelo foi especificado, inicializa o cliente com esse modelo
      if (modelName) {
        ensureModelClientInitialized(modelName);
      }

      // Obtém o resultado da resposta
      const { result } = await getResponse(
        question,
        budget,
        maxBadAttempt,
        context,
        requestId
      );

      // Atualiza para completed ao finalizar com sucesso
      await updateQueryStatus(requestId, "completed");

      // Gera um título descritivo usando o LLM
      const title = await generateQueryTitle(question, result);

      // Atualiza os metadados com o título e status
      await saveQueryMetadata(requestId, {
        title,
        originalQuestion: question,
        timestamp: new Date().toISOString(),
        status: "completed",
        summary:
          result.action === "answer" ? result.answer : JSON.stringify(result),
        promptCount: 0,
        question: question,
      });

      // Capture a resposta final
      captureLLMOutput(requestId, "final_answer", result);

      // Cria um emitter de progresso
      const emitProgress = createProgressEmitter(requestId, budget, context);
      // Configura o listener do rastreador de ações
      context.actionTracker.on("action", emitProgress);
      // Armazena o resultado da tarefa
      await storeTaskResult(requestId, result);
      // Emite o resultado da resposta
      if (result.action === "answer") {
        const answerResult = result as AnswerAction;
        eventEmitter.emit(`progress-${requestId}`, {
          type: "answer",
          data: {
            answer: answerResult.answer,
            think: answerResult.think,
            references: answerResult.references,
            reasoning: answerResult.accumulatedReasoning,
          },
          trackers: {
            tokenUsage: context.tokenTracker.getTotalUsage().totalTokens,
            actionState: context.actionTracker.getState(),
          },
        });
      }
      cleanup(requestId);
    } catch (error: any) {
      // Atualiza para error em caso de falha
      await updateQueryStatus(requestId, "error");

      // Atualiza os metadados com status de erro
      await saveQueryMetadata(requestId, {
        title: "Erro na consulta",
        originalQuestion: question,
        timestamp: new Date().toISOString(),
        status: "error",
        promptCount: 0,
        question: question,
      });

      // Capture o erro
      captureLLMOutput(requestId, "error", error?.message || "Unknown error");

      // Emite o erro
      eventEmitter.emit(`progress-${requestId}`, {
        type: "error",
        data: error?.message || "Unknown error",
        status: 500,
        trackers: {
          tokenUsage: context.tokenTracker.getTotalUsage().totalTokens,
          actionState: context.actionTracker.getState(),
        },
      });
      cleanup(requestId);
    }
  } catch (error) {
    console.error("Erro detalhado no servidor:", error);
    console.error(
      "Stack trace:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}) as RequestHandler);

// Inicializar serviço SSE
const sseService = SSEService.getInstance();

/**
 * Rota de requisição de stream.
 */
app.get("/api/v1/stream/:requestId", (async (
  req: Request,
  res: StreamResponse
) => {
  const requestId = req.params.requestId;
  const context = trackers.get(requestId);

  // Usar o serviço SSE para gerenciar a conexão
  sseService.addConnection(requestId, res);

  // Configurar listener para eventos de progresso
  const listener = (data: StreamMessage) => {
    sseService.sendStreamMessage(requestId, data);
  };

  eventEmitter.on(`progress-${requestId}`, listener);

  // Remover listener quando a conexão for fechada
  req.on("close", () => {
    eventEmitter.removeListener(`progress-${requestId}`, listener);
  });

  // Enviar contexto inicial
  sseService.sendInitialContext(requestId, context);

  // Enviar logs antigos associados a este requestId
  const recentLogs = serverLogs
    .filter(
      (log) =>
        log.context?.requestId !== undefined &&
        log.context.requestId === requestId
    )
    .slice(-20);

  if (recentLogs.length > 0) {
    sseService.sendLogs(requestId, recentLogs);
  }
}) as RequestHandler);

/**
 * Armazena o resultado da tarefa.
 * @param requestId ID da requisição.
 * @param result Resultado da tarefa.
 */
async function storeTaskResult(requestId: string, result: StepAction) {
  try {
    // Obtém o diretório das tarefas
    const taskDir = path.join(process.cwd(), "tasks");
    // Cria o diretório das tarefas
    await fs.mkdir(taskDir, { recursive: true });
    // Armazena o resultado da tarefa
    await fs.writeFile(
      path.join(taskDir, `${requestId}.json`),
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    // Emite o erro
    console.error("Task storage failed:", error);
    // Lança um erro
    throw new Error("Failed to store task result");
  }
}

/**
 * @swagger
 * /api/v1/task/{requestId}:
 *   get:
 *     summary: Obtém o resultado de uma tarefa específica
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da requisição
 *     responses:
 *       200:
 *         description: Resultado da tarefa
 *       404:
 *         description: Tarefa não encontrada
 */

/**
 * Rota de requisição de tarefa.
 */
app.get("/api/v1/task/:requestId", (async (req: Request, res: Response) => {
  try {
    const taskPath = path.join(
      process.cwd(),
      "tasks",
      `${req.params.requestId}.json`
    );
    const taskData = await fs.readFile(taskPath, "utf-8");
    const result = JSON.parse(taskData);

    // Formatar de acordo com o tipo de ação
    let formattedResult;
    switch (result.action) {
      case "search":
        formattedResult = {
          action: "search",
          think: result.think,
          searchQuery: result.searchQuery,
        };
        break;

      case "answer":
        formattedResult = {
          action: "answer",
          think: result.think,
          answer: result.answer,
          references: result.references.map((ref: any) => ({
            exactQuote: ref.exactQuote,
            url: ref.url,
          })),
        };
        break;

      case "reflect":
        formattedResult = {
          action: "reflect",
          think: result.think,
          questionsToAnswer: result.questionsToAnswer,
        };
        break;

      default:
        formattedResult = {
          ...result,
          think: result.think || "No thinking process available",
        };
    }

    // Garantir que think está presente em todas as respostas
    if (!formattedResult.think) {
      formattedResult.think = "No thinking process available";
    }

    res.json(formattedResult);
  } catch (error) {
    res.status(404).json({ error: "Task not found" });
  }
}) as RequestHandler);

/**
 * @swagger
 * /api/v1/outputs:
 *   get:
 *     summary: Obtém todas as saídas da LLM
 *     tags: [Outputs]
 *     responses:
 *       200:
 *         description: Lista de todas as saídas da LLM
 */

/**
 * Adicione uma nova rota para obter as saídas da LLM
 */
app.get("/api/v1/outputs", (_req: Request, res: Response) => {
  const allOutputs: Record<string, LLMOutput[]> = {};
  llmOutputsByRequest.forEach((outputs, requestId) => {
    allOutputs[requestId] = outputs;
  });
  res.json(allOutputs);
});

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: Documentação da API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Documentação da API
 */

// Adicione a rota do Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * Interface para armazenar conteúdos dos prompts.
 */
interface PromptContent {
  filename: string;
  content: string;
}

/**
 * Array para armazenar os conteúdos dos prompts.
 */
const promptContents: PromptContent[] = [];

/**
 * Função para monitorar o diretório de prompts e capturar novos arquivos.
 */
function monitorPromptDirectory() {
  const promptsDir = path.join(__dirname, "prompt"); // caminho dos prompts

  const watcher = chokidar.watch(promptsDir, {
    persistent: true,
    ignoreInitial: false,
    depth: 0,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher.on("add", async (filePath) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const filename = path.basename(filePath);
      promptContents.push({ filename, content });
      console.log(`Novo prompt adicionado: ${filename}`);
    } catch (error) {
      console.error("Erro ao ler o arquivo de prompt:", error);
    }
  });

  watcher.on("error", (error) => {
    console.error("Erro no watcher de prompts:", error);
  });
}

// Iniciar o monitoramento do diretório de prompts
monitorPromptDirectory();

/**
 * @swagger
 * /api/v1/logs:
 *   get:
 *     summary: Obtém todos os logs do servidor e conteúdos dos prompts
 *     tags: [Logs]
 *     responses:
 *       '200':
 *         description: Logs do servidor e conteúdos dos prompts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   description: Array principal de logs (obrigatório)
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       message:
 *                         type: string
 *                       level:
 *                         type: string
 *                         enum: [log, error, warn, info]
 *                 serverLogs:
 *                   type: array
 *                   description: Mesmo conteúdo de logs, mantido para compatibilidade
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       message:
 *                         type: string
 *                       level:
 *                         type: string
 *                         enum: [log, error, warn, info]
 *                 promptContents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       content:
 *                         type: string
 *               required:
 *                 - logs
 *                 - serverLogs
 */

/**
 * Rota para obter todos os logs e conteúdos dos prompts.
 */
app.get("/api/v1/logs", (req: Request, res: Response) => {
  const { level, since, limit = "100" } = req.query;
  let filteredLogs = [...serverLogs];

  if (level) {
    filteredLogs = filteredLogs.filter((log) => log.level === level);
  }

  if (since) {
    const sinceDate = new Date(since as string);
    filteredLogs = filteredLogs.filter(
      (log) => new Date(log.timestamp) >= sinceDate
    );
  }

  res.json({
    logs: filteredLogs.slice(-Number(limit)),
    count: filteredLogs.length,
    total: serverLogs.length,
  });
});

/**
 * Implementar rota SSE para logs em tempo real
 */
app.get("/api/v1/logs/stream", (req: Request, res: Response) => {
  const requestId = `logs-${Date.now()}`;

  // Usar o serviço SSE para gerenciar a conexão
  sseService.addConnection(requestId, res);

  // Enviar últimos 50 logs ao conectar
  const recentLogs = serverLogs.slice(-50);
  if (recentLogs.length > 0) {
    sseService.sendLogs(requestId, recentLogs);
  }

  // Handler para novos logs
  const logHandler = (log: ServerLog) => {
    sseService.sendEvent(requestId, "log", log);
  };

  logEventEmitter.on("new-log", logHandler);

  // Remove listener ao fechar conexão
  req.on("close", () => {
    logEventEmitter.off("new-log", logHandler);
    sseService.closeConnection(requestId);
  });
});

/**
 * @swagger
 * /api/v1/queries:
 *   get:
 *     summary: Lista todas as queries realizadas
 *     tags: [Queries]
 *     responses:
 *       200:
 *         description: Lista de todas as queries com seus resultados
 */

// Adicionar nova rota para buscar o conhecimento
app.get("/api/v1/knowledge/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(
      __dirname,
      "..",
      "queries",
      id,
      "knowledge.json"
    );
    const data = await fs.readFile(filePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar conhecimento" });
  }
});

app.get("/api/v1/queries", async (req: Request, res: Response) => {
  try {
    const queriesDir = path.join(process.cwd(), "queries");
    const queryDirs = await fs.readdir(queriesDir);

    const queries = await Promise.all(
      queryDirs.map(async (queryId) => {
        try {
          const queryPath = path.join(queriesDir, queryId);
          const stats = await fs.stat(queryPath);

          if (!stats.isDirectory()) return null;

          // Tenta carregar a sessão primeiro
          const sessionPath = path.join(queryPath, "session.json");
          try {
            const sessionData = await fs.readFile(sessionPath, "utf-8");
            const session: QuerySession = JSON.parse(sessionData);
            return {
              id: queryId,
              title: session.question,
              timestamp: session.timestamp,
              status: session.status,
              question: session.question,
              summary: session.summary,
              metadata: session.metadata,
              stepCount: session.steps.length,
            };
          } catch {
            // Se não encontrar a sessão, usa o formato antigo
            const queriesPath = path.join(queryPath, "queries.json");
            const queriesContent = await fs
              .readFile(queriesPath, "utf-8")
              .catch(() => "{}");
            const metadata = JSON.parse(queriesContent);

            return {
              id: queryId,
              title: metadata.title || "Consulta sem título",
              timestamp:
                metadata.timestamp || new Date(parseInt(queryId)).toISOString(),
              status: metadata.status || "completed",
              question: metadata.originalQuestion,
              summary: metadata.summary,
            };
          }
        } catch (error) {
          console.error(`Erro ao processar query ${queryId}:`, error);
          return null;
        }
      })
    );

    const validQueries = queries
      .filter((query) => query !== null)
      .sort(
        (a, b) =>
          new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime()
      );

    res.json({
      total: validQueries.length,
      queries: validQueries,
    });
  } catch (error) {
    console.error("Erro ao listar queries:", error);
    res.status(500).json({ error: "Erro ao listar queries" });
  }
});

/**
 * @swagger
 * /api/v1/queries/:queryId/prompts/:promptFile:
 *   get:
 *     summary: Obtém o conteúdo de um prompt específico
 *     tags: [Queries]
 *     parameters:
 *       - in: path
 *         name: queryId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da query
 *       - in: path
 *         name: promptFile
 *         schema:
 *           type: string
 *         required: true
 *         description: Nome do prompt
 *     responses:
 *       200:
 *         description: Conteúdo do prompt
 *       404:
 *         description: Prompt não encontrado
 */
app.get(
  "/api/v1/queries/:queryId/prompts/:promptFile",
  async (req: Request, res: Response) => {
    try {
      const { queryId, promptFile } = req.params;
      const promptPath = path.join(
        process.cwd(),
        "queries",
        queryId,
        promptFile
      );

      const content = await fs.readFile(promptPath, "utf-8");
      res.json({ content });
    } catch (error) {
      res.status(404).json({ error: "Prompt não encontrado" });
    }
  }
);

/**
 * Função para gerar um título descritivo para a query usando o LLM
 */
async function generateQueryTitle(
  question: string,
  result: any
): Promise<string> {
  const answer = result?.answer || result?.data?.answer || "";
  return `${question.slice(0, 30)}${
    answer ? ` - ${answer.slice(0, 20)}...` : ""
  }`;
}

/**
 * Função para manter conexão WebSocket ativa
 */
function heartbeat(this: any) {
  this.isAlive = true;
}

/**
 * Cria servidor HTTP
 */
const server = http.createServer(app);

/**
 * Configurar WebSocket Server
 */
const wss = new WebSocketServer({ server });

interface CustomWebSocket extends WebSocket {
  isAlive: boolean;
  terminate: () => void;
  ping: () => void;
  on: (event: string, listener: (...args: any[]) => void) => this;
}

// Atualizar o handler de conexão
wss.on("connection", (ws: CustomWebSocket) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);
});

// Atualizar o interval checker
const interval = setInterval(() => {
  wss.clients.forEach((ws: WebSocket) => {
    const customWs = ws as unknown as CustomWebSocket;
    if (customWs.isAlive === false) return customWs.terminate();
    customWs.isAlive = false;
    customWs.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});

/**
 * Iniciar servidor
 */
server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

/**
 * Exporta a aplicação.
 */
export default app;

// Rota para salvar uma sessão
app.post("/api/v1/queries/:requestId", async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const session: QuerySession = req.body;

    // Cria o diretório da query se não existir
    const queryDir = path.join(process.cwd(), "queries", requestId);
    await fs.mkdir(queryDir, { recursive: true });

    // Salva os dados da sessão
    await fs.writeFile(
      path.join(queryDir, "session.json"),
      JSON.stringify(session, null, 2)
    );

    // Salva os metadados da query (mantém compatibilidade com o código existente)
    await saveQueryMetadata(requestId, {
      title: session.question,
      originalQuestion: session.question,
      timestamp: session.timestamp,
      status: session.status,
      summary: session.summary,
      promptCount: session.steps.length,
      question: session.question,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);
    res.status(500).json({ error: "Erro ao salvar sessão" });
  }
});

// Rota para carregar uma sessão
app.get(
  "/api/v1/queries/:requestId/session",
  async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const sessionPath = path.join(
        process.cwd(),
        "queries",
        requestId,
        "session.json"
      );

      const sessionData = await fs.readFile(sessionPath, "utf-8");
      const session: QuerySession = JSON.parse(sessionData);

      res.json(session);
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
      res.status(404).json({ error: "Sessão não encontrada" });
    }
  }
);

// Rota para atualizar metadados de uma sessão
app.patch("/api/v1/queries/:requestId", async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const updates = req.body;

    // Cria o diretório da query se não existir
    const queryDir = path.join(process.cwd(), "queries", requestId);
    await fs.mkdir(queryDir, { recursive: true });

    // Carrega os metadados existentes ou cria novos
    const metadataPath = path.join(queryDir, "queries.json");
    let metadata = {};

    try {
      const existingData = await fs.readFile(metadataPath, "utf-8");
      metadata = JSON.parse(existingData);
    } catch (error) {
      // Se o arquivo não existir, cria um objeto vazio
      console.log(`Criando novos metadados para ${requestId}`);
    }

    // Atualiza os metadados com os novos valores
    const updatedMetadata = {
      ...metadata,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    // Salva os metadados atualizados
    await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));

    res.json({ success: true, metadata: updatedMetadata });
  } catch (error) {
    console.error("Erro ao atualizar metadados da sessão:", error);
    res.status(500).json({ error: "Erro ao atualizar metadados da sessão" });
  }
});

/**
 * Rota para verificar o status de uma tarefa.
 * Esta rota é importante para acompanhar o progresso de análises do DeepResearch
 */
app.get(
  "/api/v1/task-status/:requestId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;

      if (!requestId) {
        res.status(400).json({ error: "ID da tarefa é obrigatório" });
        return;
      }

      console.log(`Verificando status da tarefa: ${requestId}`);

      // Verifica se temos rastreadores para esta requisição
      const trackerContext = trackers.get(requestId);

      if (!trackerContext) {
        // Verifica metadados salvos para determinar o status final
        try {
          const metadata = await getQueryMetadata(requestId);
          if (metadata) {
            // A tarefa existe mas não está mais em processamento ativo
            res.json({
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
              // Adiciona informações finais, se disponíveis
              partialInfo: metadata.finalResults || {
                ncmCode: metadata.ncmCode || "",
                ncmDescription: metadata.description || "",
              },
              // Todos os campos já validados
              validationStatus: {
                ncmCode: false,
                ncmDescription: false,
                taxationDetails: false,
                attributes: false,
                conclusion: false,
              },
            });
            return;
          } else {
            res.status(404).json({ error: "Tarefa não encontrada" });
            return;
          }
        } catch (error) {
          console.error(
            `Erro ao buscar metadados da tarefa ${requestId}:`,
            error
          );
          res.status(404).json({ error: "Tarefa não encontrada" });
          return;
        }
      }

      // Obtém informações atuais
      const { actionTracker } = trackerContext;

      // Determina o passo atual baseado nas ações registradas
      const currentState = actionTracker.getState();
      const actions: string[] = []; // Não conseguimos acessar diretamente o histórico

      // Usamos o estado atual para inferir o progresso
      const step = Math.min(currentState.totalStep, 5);
      let currentAction = "Iniciando análise...";

      // Se temos um estado atual, podemos usar sua descrição
      if (currentState.thisStep && currentState.thisStep.think) {
        currentAction = currentState.thisStep.think.substring(0, 100);
      }

      // Lógica para gerar os detalhes da pesquisa com base nos passos
      const researchDetails = generateResearchDetails(step, currentState);

      // Preparando informações parciais com base no progresso atual
      // Extrair dados do estado atual, mensagens e análises anteriores
      const extractedInfo = extractPartialInfo(
        currentState,
        step,
        researchDetails
      );

      // Status de validação baseado no passo atual
      const validationStatus = {
        // Passo 1-2: Validando NCM
        ncmCode: step <= 2,
        // Passo 2-3: Validando descrição
        ncmDescription: step <= 3,
        // Passo 3-4: Validando tributação
        taxationDetails: step <= 4,
        // Passo 4-5: Validando atributos
        attributes: step <= 5,
        // Passo 5: Validando conclusão
        conclusion: step <= 5,
      };

      // Prepara resposta com o status atual
      const response = {
        requestId,
        completed: false, // Em processamento
        step,
        currentAction,
        researchDetails,
        // Adiciona as informações parciais extraídas
        partialInfo: extractedInfo,
        // Adiciona o status de validação
        validationStatus,
      };

      res.json(response);
      return;
    } catch (error) {
      console.error("Erro ao verificar status da tarefa:", error);
      res.status(500).json({
        error: "Erro interno ao verificar status da tarefa",
        researchDetails: [
          {
            type: "text",
            content: `Erro interno: ${error}`,
          },
        ],
      });
      return;
    }
  }
);

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
        // Lógica de validação do token se necessário
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
              // Adiciona informações finais, se disponíveis
              partialInfo: metadata.finalResults || {
                ncmCode: metadata.ncmCode || "",
                ncmDescription: metadata.description || "",
              },
              // Todos os campos já validados
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

/**
 * Rota para consulta de NCM
 */
app.post("/api/v1/ncm", (req, res, next) => {
  ncmRouter(req, res, next).catch(next);
});

// Middleware para processamento DeepResearch
app.use("/api/v1/ncm", processarDeepResearch);

/**
 * Mapa para armazenar as tarefas completadas e seus timestamps
 * Isso permite limpar periodicamente tarefas antigas
 */
const completedTasks = new Map<string, number>();

/**
 * Mapa para armazenar os resultados das tarefas
 */
const taskResults = new Map<string, any>();

/**
 * Limpa tarefas concluídas antigas (mais de 2 horas)
 */
function cleanupCompletedTasks() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000; // 2 horas em milissegundos

  for (const [requestId, timestamp] of completedTasks.entries()) {
    if (timestamp < twoHoursAgo) {
      // Remove do mapa de tarefas concluídas
      completedTasks.delete(requestId);

      // Remove também dos outros mapas/caches se existirem
      taskResults.delete(requestId);
      llmOutputsByRequest.delete(requestId);
      trackers.delete(requestId);

      console.log(`Limpeza: Tarefa ${requestId} removida por inatividade.`);
    }
  }
}

// Executa a limpeza a cada 30 minutos
setInterval(cleanupCompletedTasks, 30 * 60 * 1000);

// Adicionar manipulador para encerrar conexões Redis ao fechar o servidor
process.on("SIGTERM", async () => {
  console.log("Encerrando servidor... (SIGTERM)");
  try {
    // Encerra conexões Redis
    closeRedisConnections();

    // Espera um momento para as operações em andamento terminarem
    console.log("Aguardando operações em andamento...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Servidor encerrado com sucesso");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao encerrar servidor:", error);
    process.exit(1);
  }
});

process.on("SIGINT", async () => {
  console.log("Encerrando servidor... (SIGINT)");
  try {
    // Encerra conexões Redis
    closeRedisConnections();

    // Espera um momento para as operações em andamento terminarem
    console.log("Aguardando operações em andamento...");
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Servidor encerrado com sucesso");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao encerrar servidor:", error);
    process.exit(1);
  }
});

// Adicionar o modelRouter como middleware para processar as rotas relacionadas a modelos
// O código existente para as rotas /api/v1/process-with-model e /api/v1/chat
// deve ser removido, pois agora será tratado pelo modelRouter

// Adicionar nas configurações de middleware, próximo de onde outros roteadores são adicionados
app.use("/api/v1", async (req, res, next) => {
  // Passa para o modelRouter
  await modelRouter(req, res, next);
});

// Inicializar o serviço de pesquisa profunda
const deepResearchService = DeepResearchService.getInstance();

// Rotas da API
app.use("/api/v1/deep-research", deepResearchRoutes);

/**
 * Função auxiliar para extrair informações parciais dos dados disponíveis
 */
function extractPartialInfo(
  currentState: any,
  step: number,
  researchDetails: any[]
): any {
  // Valor padrão para retorno
  const defaultInfo = {
    ncmCode: "",
    ncmDescription: "",
    taxationDetails: {
      ipi: "",
      icms: "",
      pis: "",
      cofins: "",
      importTax: "",
    },
    attributes: {},
  };

  try {
    // Procura por menções de NCM no texto
    const ncmRegex = /\b\d{4}\.\d{2}\.\d{2}\b/;
    const ncmMatch =
      currentState.thisStep?.think?.match(ncmRegex) ||
      currentState.accumulatedReasoning?.match(ncmRegex);

    if (ncmMatch) {
      defaultInfo.ncmCode = ncmMatch[0];
    }

    // Procura por descrições
    if (step >= 3) {
      // Extrai descrições de produtos dos detalhes da pesquisa
      for (const detail of researchDetails) {
        if (
          detail.content &&
          (detail.content.includes("descrição") ||
            detail.content.includes("Descrição"))
        ) {
          const description = detail.content
            .substring(detail.content.indexOf(":") + 1)
            .trim();
          if (description && description.length > 10) {
            defaultInfo.ncmDescription = description;
            break;
          }
        }
      }
    }

    // Extrai informações tributárias se estamos em um estágio avançado
    if (step >= 4) {
      // Procura por menções de IPI, ICMS, etc.
      for (const detail of researchDetails) {
        if (detail.content) {
          if (detail.content.includes("IPI")) {
            defaultInfo.taxationDetails.ipi = "Conforme tabela TIPI";
          }
          if (detail.content.includes("ICMS")) {
            defaultInfo.taxationDetails.icms =
              "Conforme regulamentação estadual";
          }
          if (detail.content.includes("PIS")) {
            defaultInfo.taxationDetails.pis = "Regime normal";
          }
          if (detail.content.includes("COFINS")) {
            defaultInfo.taxationDetails.cofins = "Regime normal";
          }
        }
      }
    }

    // Procura por atributos do produto
    if (step >= 5) {
      defaultInfo.attributes = {
        Composição: "Conforme especificação do produto",
        Finalidade: "Uso conforme descrição",
      };
    }

    return defaultInfo;
  } catch (error) {
    console.error("Erro ao extrair informações parciais:", error);
    return defaultInfo;
  }
}

/**
 * Gera informações detalhadas sobre a pesquisa com base no estado atual do tracker
 * @param step O passo atual da pesquisa
 * @param currentState O estado atual do tracker
 * @returns Array de detalhes da pesquisa
 */
function generateResearchDetails(
  step: number,
  currentState: any
): Array<{ type: string; content: string; source?: string }> {
  const details: Array<{ type: string; content: string; source?: string }> = [];

  // Informações básicas baseadas no passo atual
  switch (step) {
    case 0:
      details.push({
        type: "question",
        content:
          "Iniciando análise detalhada do produto para identificar o NCM correto.",
      });
      break;
    case 1:
      details.push({
        type: "question",
        content: "Buscando informações sobre o produto em fontes oficiais.",
      });

      // Se houver busca, adiciona informações sobre ela
      if (currentState.thisStep && currentState.thisStep.searchQuery) {
        details.push({
          type: "link",
          content: `Consultando: "${currentState.thisStep.searchQuery}"`,
          source: "Busca web",
        });
      }
      break;
    case 2:
      details.push({
        type: "question",
        content:
          "Consultando legislação e tabelas NCM para encontrar a classificação correta.",
      });

      // Se houver referências, adiciona-as
      if (currentState.thisStep && currentState.thisStep.references) {
        currentState.thisStep.references.forEach((ref: any) => {
          if (ref.url && ref.url.includes("gov.br")) {
            details.push({
              type: "law",
              content: ref.exactQuote || "Consultando legislação fiscal",
              source: ref.url,
            });
          }
        });
      }
      break;
    case 3:
      details.push({
        type: "question",
        content:
          "Verificando jurisprudência e decisões administrativas relacionadas.",
      });

      // Adiciona informações de refletir
      if (currentState.thisStep && currentState.thisStep.questionsToAnswer) {
        currentState.thisStep.questionsToAnswer.forEach((question: string) => {
          details.push({
            type: "text",
            content: question,
          });
        });
      }
      break;
    case 4:
      details.push({
        type: "question",
        content:
          "Comparando características do produto com a classificação sugerida.",
      });
      break;
    case 5:
      details.push({
        type: "question",
        content: "Finalizando análise e preparando parecer detalhado.",
      });

      // Se houver uma resposta final
      if (currentState.thisStep && currentState.thisStep.answer) {
        details.push({
          type: "text",
          content:
            currentState.thisStep.answer.substring(0, 150) +
            (currentState.thisStep.answer.length > 150 ? "..." : ""),
        });
      }
      break;
  }

  // Se houver um processo de pensamento, adiciona-o também
  if (currentState.thisStep && currentState.thisStep.think) {
    const thinkProcess = currentState.thisStep.think;

    // Verifica se o texto contém URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = thinkProcess.match(urlPattern);

    if (urls && urls.length > 0) {
      // Para cada URL encontrada, adiciona um item do tipo link
      urls.forEach((url: string) => {
        if (!details.some((detail: any) => detail.source === url)) {
          details.push({
            type: "link",
            content: `Consultando fonte: ${new URL(url).hostname}`,
            source: url,
          });
        }
      });
    }

    // Adiciona trechos do processo de pensamento
    if (thinkProcess.length > 50) {
      const sentences = thinkProcess.split(". ");
      const maxSentences = Math.min(2, sentences.length);

      for (let i = 0; i < maxSentences; i++) {
        const sentence = sentences[i].trim();
        if (
          sentence.length > 20 &&
          !details.some((detail: any) => detail.content === sentence)
        ) {
          details.push({
            type: "text",
            content: sentence + ".",
          });
        }
      }
    }
  }

  return details;
}

// Endpoints para modelos compatíveis com a API Jina
/**
 * @swagger
 * /v1/models:
 *   get:
 *     tags:
 *       - JinaUI
 *     summary: Lista os modelos disponíveis
 *     description: Retorna a lista de modelos disponíveis para uso com a API Jina
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       "200":
 *         description: Lista de modelos obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 object:
 *                   type: string
 *                   example: "list"
 *                   description: Tipo do objeto retornado
 *                 data:
 *                   type: array
 *                   description: Lista de modelos disponíveis
 *                   items:
 *                     $ref: "#/components/schemas/Model"
 */
app.get("/v1/models", (async (_req: Request, res: Response) => {
  const models = [
    {
      id: "jina-deepsearch-v1",
      object: "model",
      created: 1686935002,
      owned_by: "jina-ai",
    },
  ];

  res.json({
    object: "list",
    data: models,
  });
}) as RequestHandler);

/**
 * @swagger
 * /v1/models/{model}:
 *   get:
 *     tags:
 *       - JinaUI
 *     summary: Obtém informações de um modelo específico
 *     description: Retorna detalhes sobre um modelo específico pelo seu ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: model
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do modelo
 *         example: "jina-deepsearch-v1"
 *     responses:
 *       "200":
 *         description: Informações do modelo obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Model"
 *       "404":
 *         description: Modelo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Model 'model-id' not found"
 *                     type:
 *                       type: string
 *                       example: "invalid_request_error"
 *                     param:
 *                       type: string
 *                       nullable: true
 *                     code:
 *                       type: string
 *                       example: "model_not_found"
 */
app.get("/v1/models/:model", (async (req: Request, res: Response) => {
  const modelId = req.params.model;

  if (modelId === "jina-deepsearch-v1") {
    res.json({
      id: "jina-deepsearch-v1",
      object: "model",
      created: 1686935002,
      owned_by: "jina-ai",
    });
  } else {
    res.status(404).json({
      error: {
        message: `Model '${modelId}' not found`,
        type: "invalid_request_error",
        param: null,
        code: "model_not_found",
      },
    });
  }
}) as RequestHandler);

/**
 * @swagger
 * /v1/health:
 *   get:
 *     tags:
 *       - JinaUI
 *     summary: Verifica o status da API
 *     description: Endpoint para verificação de saúde do serviço
 *     responses:
 *       "200":
 *         description: Serviço está funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                   description: Status do serviço
 */
app.get("/v1/health", (req, res) => {
  res.json({ status: "ok" });
});
