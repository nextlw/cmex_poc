/* eslint-disable no-console */
import express, {Request, Response, RequestHandler} from 'express';
import cors from 'cors';
import {EventEmitter} from 'events';
import {getResponse} from './agent';
import {StepAction, StreamMessage, TrackerContext, AnswerAction} from './types';
import fs from 'fs/promises';
import path from 'path';
import {TokenTracker} from "./utils/token-tracker";
import {ActionTracker} from "./utils/action-tracker";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';
import chokidar from 'chokidar';
import { Server as WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { QuerySession } from './types/session';

/**
 * Interface para armazenar logs do servidor.
 */
interface ServerLog {
  timestamp: string;
  message: string;
  level: 'log' | 'error' | 'warn' | 'info';
  context: {
    pid: number;
    env: string;
    requestId?: string;
  };
}

/**
 * Tamanho máximo do array de logs para evitar crescimento ilimitado.
 */
const MAX_LOGS = 1000;

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
(['log', 'error', 'warn', 'info'] as const).forEach((method) => {
  const originalMethod = (console[method] as (...args: any[]) => void);
  console[method] = (...args: any[]) => {
    const message = args
      .map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      .join(' ');
    const logEntry: ServerLog = {
      timestamp: new Date().toISOString(),
      message: message.trim(),
      level: method as 'log' | 'error' | 'warn' | 'info',
      context: {
        pid: process.pid,
        env: process.env.NODE_ENV || 'development'
      }
    };
    // Limitar o tamanho do array de logs para evitar crescimento ilimitado
    if (serverLogs.length >= MAX_LOGS) {
      serverLogs.shift(); // Remove o log mais antigo
    }
    serverLogs.push(logEntry);
    logEventEmitter.emit('new-log', logEntry);
    originalMethod.apply(console, args);
  };
});

/**
 * Aplicação Express.
 */
const app = express();
/**
 * Porta da aplicação.
 */
const port = process.env.PORT || 3000;

/**
 * Middleware de CORS.
 */
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Adicione a origem do seu frontend
  methods: ['GET', 'POST'],
  credentials: true
}));
/**
 * Middleware de JSON.
 */
app.use(express.json());

// Adicionar a rota de trash-query aqui
app.post('/api/v1/trash-query', async (req: Request, res: Response) => {
  console.log('Recebida requisição POST para /api/v1/trash-query:', req.body);
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: 'ID da query é obrigatório' });
      return;
    }

    // Define os caminhos
    const queriesDir = path.join(process.cwd(), 'queries');
    const trashDir = path.join(process.cwd(), 'trash');
    const queryPath = path.join(queriesDir, id.toString());
    const trashPath = path.join(trashDir, id.toString());
    const taskPath = path.join(process.cwd(), 'tasks', `${id.toString()}.json`);
    const trashTaskPath = path.join(trashDir, 'tasks');

    console.log('Caminhos configurados:', {
      queriesDir,
      trashDir,
      queryPath,
      trashPath,
      taskPath,
      trashTaskPath
    });

    // Verifica se a pasta da query existe
    try {
      await fs.access(queryPath);
    } catch {
      res.status(404).json({ error: 'Query não encontrada' });
      return;
    }

    // Cria diretórios de lixeira se não existirem
    await fs.mkdir(trashDir, { recursive: true });
    await fs.mkdir(trashTaskPath, { recursive: true });

    // Move a pasta da query para a lixeira
    await fs.rename(queryPath, trashPath);

    // Move o arquivo de task se existir
    try {
      await fs.access(taskPath);
      await fs.rename(taskPath, path.join(trashTaskPath, `${id.toString()}.json`));
    } catch (error) {
      console.log('Arquivo de task não encontrado:', taskPath);
    }

    res.json({ success: true, message: 'Query movida para a lixeira com sucesso' });
  } catch (error) {
    console.error('Erro ao mover query para a lixeira:', error);
    res.status(500).json({ error: 'Erro interno ao processar a requisição' });
  }
}) as RequestHandler;

/**
 * EventEmitter.
 */
const eventEmitter = new EventEmitter();

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
      data
    });
  }
}

/**
 * Cria um emitter de progresso.
 * @param requestId ID da requisição.
 * @param budget Orçamento.
 * @param context Contexto.
 */
function createProgressEmitter(requestId: string, budget: number | undefined, context: TrackerContext) {
  return () => {
    const state = context.actionTracker.getState();
    const budgetInfo = {
      used: context.tokenTracker.getTotalUsage(),
      total: budget || 1_000_000,
      percentage: ((context.tokenTracker.getTotalUsage() / (budget || 1_000_000)) * 100).toFixed(2)
    };

    eventEmitter.emit(`progress-${requestId}`, {
      type: 'progress',
      data: {...state.thisStep, totalStep: state.totalStep},
      step: state.totalStep,
      budget: budgetInfo,
      trackers: {
        tokenUsage: context.tokenTracker.getTotalUsage(),
        actionState: context.actionTracker.getState()
      }
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
 * @param context Contexto.
 */
function emitTrackerUpdate(requestId: string, context: TrackerContext) {
  const trackerData = {
    tokenUsage: context.tokenTracker.getTotalUsage(),
    tokenBreakdown: context.tokenTracker.getUsageBreakdown(),
    actionState: context.actionTracker.getState().thisStep,
    step: context.actionTracker.getState().totalStep,
    badAttempts: context.actionTracker.getState().badAttempts,
    gaps: context.actionTracker.getState().gaps
  };

  // Inclua os outputs adicionais aqui
  const outputs = context.outputs || [];

  // Emite o evento incluindo os outputs
  eventEmitter.emit(`progress-${requestId}`, {
    type: 'progress',
    trackers: trackerData,
    outputs: outputs
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
async function saveQueryMetadata(requestId: string, metadata: {
  title: string;
  originalQuestion: string;
  timestamp: string;
  status: 'completed' | 'error' | 'in_progress';
  summary?: string;
  promptCount: number;
  question: string;
}) {
  const queryPath = path.join(process.cwd(), 'queries', requestId);
  const queriesPath = path.join(queryPath, 'queries.json');
  
  try {
    // Cria o diretório se ele não existir
    await fs.mkdir(queryPath, { recursive: true });
    // Salva o arquivo de metadados
    await fs.writeFile(queriesPath, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Erro ao salvar metadados da query:', error);
    throw error; // Repassa o erro para ser tratado em outro lugar
  }
}

// Adicione um novo tipo para os status possíveis
type QueryStatus = 'pending' | 'processing' | 'completed' | 'error';

// Função para atualizar o status sem substituir outros dados
async function updateQueryStatus(requestId: string, status: QueryStatus) {
  try {
    const queryPath = path.join(process.cwd(), 'queries', requestId, 'queries.json');
    const existingData = await fs.readFile(queryPath, 'utf-8')
      .then(JSON.parse)
      .catch(() => ({}));

    await fs.writeFile(queryPath, JSON.stringify({
      ...existingData,
      status,
      lastUpdated: new Date().toISOString()
    }, null, 2));

    // Emite o evento de atualização de status
    eventEmitter.emit(`progress-${requestId}`, {
      type: 'status',
      data: { status },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

/**
 * Rota de requisição de query.
 */
app.post('/api/v1/query', (async (req: Request, res: Response) => {
  console.log('Recebida requisição POST:', req.body);
  try {
    const question = req.body.q;
    const budget = req.body.budget;
    const maxBadAttempt = req.body.maxBadAttempt;
    
    // Validação do parâmetro obrigatório "q"
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ error: 'Parâmetro "q" (question) é obrigatório' });
    }
    
    console.log('Processando pergunta:', question);
    
    // Inicializa as saídas para essa requisição
    const requestId = Date.now().toString();
    llmOutputsByRequest.set(requestId, []);
    
    // Cria novos rastreadores para esta requisição
    const context: TrackerContext = {
      tokenTracker: new TokenTracker(),
      actionTracker: new ActionTracker({ requestId }),
      outputs: []
    };
    trackers.set(requestId, context);

    // Configura os listeners imediatamente para ambos os rastreadores
    context.actionTracker.on('action', () => emitTrackerUpdate(requestId, context));
    // context.tokenTracker.on('usage', () => emitTrackerUpdate(requestId, context));

    // Salva os metadados iniciais
    await saveQueryMetadata(requestId, {
      title: 'Processando consulta...',
      originalQuestion: question,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      promptCount: 0,
      question: question
    });

    // Retorna o ID da requisição
    console.log('Enviando resposta:', { requestId });
    res.json({requestId});

    try {
      // Inicializa com status pending
      await updateQueryStatus(requestId, 'pending');
      
      // Atualiza para processing quando começa
      await updateQueryStatus(requestId, 'processing');
      
      // Obtém o resultado da resposta
      const {result} = await getResponse(question, budget, maxBadAttempt, context, requestId);
      
      // Atualiza para completed ao finalizar com sucesso
      await updateQueryStatus(requestId, 'completed');
      
      // Gera um título descritivo usando o LLM
      const title = await generateQueryTitle(question, result);
      
      // Atualiza os metadados com o título e status
      await saveQueryMetadata(requestId, {
        title,
        originalQuestion: question,
        timestamp: new Date().toISOString(),
        status: 'completed',
        summary: result.action === 'answer' ? result.answer : JSON.stringify(result),
        promptCount: 0,
        question: question
      });
      
      // Capture a resposta final
      captureLLMOutput(requestId, 'final_answer', result);
      
      // Cria um emitter de progresso
      const emitProgress = createProgressEmitter(requestId, budget, context);
      // Configura o listener do rastreador de ações
      context.actionTracker.on('action', emitProgress);
      // Armazena o resultado da tarefa
      await storeTaskResult(requestId, result);
      // Emite o resultado da resposta
      if (result.action === 'answer') {
        const answerResult = result as AnswerAction;
        eventEmitter.emit(`progress-${requestId}`, {
          type: 'answer',
          data: {
            answer: answerResult.answer,
            think: answerResult.think,
            references: answerResult.references,
            reasoning: answerResult.accumulatedReasoning
          },
          trackers: {
            tokenUsage: context.tokenTracker.getTotalUsage(),
            actionState: context.actionTracker.getState()
          }
        });
      }
      cleanup(requestId);
    } catch (error: any) {
      // Atualiza para error em caso de falha
      await updateQueryStatus(requestId, 'error');
      
      // Atualiza os metadados com status de erro
      await saveQueryMetadata(requestId, {
        title: 'Erro na consulta',
        originalQuestion: question,
        timestamp: new Date().toISOString(),
        status: 'error',
        promptCount: 0,
        question: question
      });
      
      // Capture o erro
      captureLLMOutput(requestId, 'error', error?.message || 'Unknown error');
      
      // Emite o erro
      eventEmitter.emit(`progress-${requestId}`, {
        type: 'error',
        data: error?.message || 'Unknown error',
        status: 500,
        trackers: {
          tokenUsage: context.tokenTracker.getTotalUsage(),
          actionState: context.actionTracker.getState()
        }
      });
      cleanup(requestId);
    }
  } catch (error) {
    console.error('Erro detalhado no servidor:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}) as RequestHandler);

/**
 * Rota de requisição de stream.
 */
app.get('/api/v1/stream/:requestId', (async (req: Request, res: StreamResponse) => {
  const requestId = req.params.requestId;
  const context = trackers.get(requestId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const listener = (data: StreamMessage) => {
    let formattedData;
    if (typeof data.data === 'object' && 'action' in data.data) {
      const { action } = data.data;
      switch(action) {
        case 'search':
          formattedData = {
            type: 'search',
            data: {
              action: action,
              think: data.data.think,
              searchQuery: data.data.searchQuery,
              message: `Pesquisando informações para: "${data.data.searchQuery}"`,
              searchResults: data.data.searchResults || []
            },
            outputs: data.outputs || [],
            trackers: data.trackers
          };
          break;
        
        case 'answer':
          formattedData = {
            type: 'answer',
            data: {
              action: action,
              think: data.data.think,
              answer: data.data.answer,
              references: data.data.references,
              reasoning: data.data.reasoning || data.data.accumulatedReasoning
            },
            outputs: data.outputs || [],
            trackers: data.trackers
          };
          break;
        
        case 'reflect':
          formattedData = {
            type: 'reflect',
            data: {
              action: action,
              think: data.data.think,
              questionsToAnswer: data.data.questionsToAnswer,
              message: `Refletindo sobre: ${data.data.questionsToAnswer ? data.data.questionsToAnswer.join(', ') : 'a pergunta'}`
            },
            outputs: data.outputs || [],
            trackers: data.trackers
          };
          break;

        case 'visit':
          formattedData = {
            type: 'visit',
            data: {
              action: action,
              think: data.data.think,
              URLTargets: data.data.URLTargets,
              message: `Visitando URLs: ${data.data.URLTargets ? data.data.URLTargets.join(', ') : ''}`
            },
            outputs: data.outputs || [],
            trackers: data.trackers
          };
          break;
        
        default:
          formattedData = {
            type: 'progress',
            data: data.data,
            outputs: data.outputs || [],
            trackers: data.trackers
          };
      }
    } else {
      formattedData = {
        type: data.type || 'progress',
        data: data.data,
        outputs: data.outputs || [],
        trackers: data.trackers
      };
    }

    if (formattedData) {
      try {
        const jsonString = JSON.stringify(formattedData);
        console.log('Enviando dados SSE:', jsonString);
        res.write(`data: ${jsonString}\n\n`);
      } catch (error) {
        console.error('Erro ao serializar JSON:', error);
        const errorData = JSON.stringify({ 
          type: 'error', 
          data: { error: 'Erro ao processar dados' },
          trackers: null 
        });
        res.write(`data: ${errorData}\n\n`);
      }
    }
  };

  eventEmitter.on(`progress-${requestId}`, listener);

  req.on('close', () => {
    eventEmitter.removeListener(`progress-${requestId}`, listener);
  });

  const initialData = {
    type: 'connected',
    requestId,
    trackers: context ? {
      tokenUsage: context.tokenTracker.getTotalUsage(),
      actionState: context.actionTracker.getState()
    } : null
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // Envia logs antigos associados a este requestId
  const recentLogs = serverLogs
    .filter(log => log.context?.requestId !== undefined && log.context.requestId === requestId)
    .slice(-20);
  
  if (recentLogs.length > 0) {
    const logsData = {
      type: 'log',
      data: `Histórico de logs recentes (${recentLogs.length}):\n${recentLogs.map(log => 
        `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`).join('\n')}`,
      trackers: null
    };
    res.write(`data: ${JSON.stringify(logsData)}\n\n`);
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
    const taskDir = path.join(process.cwd(), 'tasks');
    // Cria o diretório das tarefas
    await fs.mkdir(taskDir, {recursive: true});
    // Armazena o resultado da tarefa
    await fs.writeFile(
      path.join(taskDir, `${requestId}.json`),
      JSON.stringify(result, null, 2)
    );
  } catch (error) {
    // Emite o erro
    console.error('Task storage failed:', error);
    // Lança um erro
    throw new Error('Failed to store task result');
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
app.get('/api/v1/task/:requestId', (async (req: Request, res: Response) => {
  try {
    const taskPath = path.join(process.cwd(), 'tasks', `${req.params.requestId}.json`);
    const taskData = await fs.readFile(taskPath, 'utf-8');
    const result = JSON.parse(taskData);

    // Formatar de acordo com o tipo de ação
    let formattedResult;
    switch(result.action) {
      case 'search':
        formattedResult = {
          action: 'search',
          think: result.think,
          searchQuery: result.searchQuery
        };
        break;
        
      case 'answer':
        formattedResult = {
          action: 'answer',
          think: result.think,
          answer: result.answer,
          references: result.references.map((ref: any) => ({
            exactQuote: ref.exactQuote,
            url: ref.url
          }))
        };
        break;
        
      case 'reflect':
        formattedResult = {
          action: 'reflect',
          think: result.think,
          questionsToAnswer: result.questionsToAnswer
        };
        break;
        
      default:
        formattedResult = {
          ...result,
          think: result.think || 'No thinking process available'
        };
    }

    // Garantir que think está presente em todas as respostas
    if (!formattedResult.think) {
      formattedResult.think = 'No thinking process available';
    }

    res.json(formattedResult);
  } catch (error) {
    res.status(404).json({error: 'Task not found'});
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
app.get('/api/v1/outputs', (_req: Request, res: Response) => {
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

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
  const promptsDir = path.join(__dirname, 'prompt'); // caminho dos prompts
  
  const watcher = chokidar.watch(promptsDir, {
    persistent: true,
    ignoreInitial: false,
    depth: 0,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher.on('add', async (filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const filename = path.basename(filePath);
      promptContents.push({ filename, content });
      console.log(`Novo prompt adicionado: ${filename}`);
    } catch (error) {
      console.error('Erro ao ler o arquivo de prompt:', error);
    }
  });

  watcher.on('error', (error) => {
    console.error('Erro no watcher de prompts:', error);
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
 *                 serverLogs:
 *                   type: array
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
 */
    
/**
 * Rota para obter todos os logs e conteúdos dos prompts.
 */
app.get('/api/v1/logs', (req: Request, res: Response) => {
  const { level, since, limit = '100' } = req.query;
  let filteredLogs = [...serverLogs];

  if (level) {
    filteredLogs = filteredLogs.filter(log => log.level === level);
  }
  
  if (since) {
    const sinceDate = new Date(since as string);
    filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate);
  }

  res.json({
    logs: filteredLogs.slice(-Number(limit)),
    count: filteredLogs.length,
    total: serverLogs.length
  });
});

/**
 * Implementar rota SSE para logs em tempo real
 */
app.get('/api/v1/logs/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Envia últimos 50 logs ao conectar
  const recentLogs = serverLogs.slice(-50);
  recentLogs.forEach(log => {
    res.write(`event: log\n`);
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  // Handler para novos logs
  const logHandler = (log: ServerLog) => {
    res.write(`event: log\n`);
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  };

  logEventEmitter.on('new-log', logHandler);

  // Remove listener ao fechar conexão
  req.on('close', () => {
    logEventEmitter.off('new-log', logHandler);
    res.end();
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
app.get('/api/v1/knowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(__dirname, '..', 'queries', id, 'knowledge.json');
    const data = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conhecimento' });
  }
});


app.get('/api/v1/queries', async (req: Request, res: Response) => {
  try {
    const queriesDir = path.join(process.cwd(), 'queries');
    const queryDirs = await fs.readdir(queriesDir);
    
    const queries = await Promise.all(
      queryDirs.map(async (queryId) => {
        try {
          const queryPath = path.join(queriesDir, queryId);
          const stats = await fs.stat(queryPath);
          
          if (!stats.isDirectory()) return null;
          
          // Tenta carregar a sessão primeiro
          const sessionPath = path.join(queryPath, 'session.json');
          try {
            const sessionData = await fs.readFile(sessionPath, 'utf-8');
            const session: QuerySession = JSON.parse(sessionData);
            return {
              id: queryId,
              title: session.question,
              timestamp: session.timestamp,
              status: session.status,
              question: session.question,
              summary: session.summary,
              metadata: session.metadata,
              stepCount: session.steps.length
            };
          } catch {
            // Se não encontrar a sessão, usa o formato antigo
            const queriesPath = path.join(queryPath, 'queries.json');
            const queriesContent = await fs.readFile(queriesPath, 'utf-8').catch(() => '{}');
            const metadata = JSON.parse(queriesContent);
            
            return {
              id: queryId,
              title: metadata.title || 'Consulta sem título',
              timestamp: metadata.timestamp || new Date(parseInt(queryId)).toISOString(),
              status: metadata.status || 'completed',
              question: metadata.originalQuestion,
              summary: metadata.summary
            };
          }
        } catch (error) {
          console.error(`Erro ao processar query ${queryId}:`, error);
          return null;
        }
      })
    );
    
    const validQueries = queries
      .filter(query => query !== null)
      .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());
    
    res.json({
      total: validQueries.length,
      queries: validQueries
    });
    
  } catch (error) {
    console.error('Erro ao listar queries:', error);
    res.status(500).json({ error: 'Erro ao listar queries' });
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
app.get('/api/v1/queries/:queryId/prompts/:promptFile', async (req: Request, res: Response) => {
  try {
    const { queryId, promptFile } = req.params;
    const promptPath = path.join(process.cwd(), 'queries', queryId, promptFile);
    
    const content = await fs.readFile(promptPath, 'utf-8');
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: 'Prompt não encontrado' });
  }
});

/**
 * Função para gerar um título descritivo para a query usando o LLM
 */
async function generateQueryTitle(question: string, result: any): Promise<string> {
  const answer = result?.answer || result?.data?.answer || '';
  return `${question.slice(0, 30)}${answer ? ` - ${answer.slice(0, 20)}...` : ''}`;
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
wss.on('connection', (ws: CustomWebSocket) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
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

wss.on('close', () => {
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
app.post('/api/v1/queries/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const session: QuerySession = req.body;
    
    // Cria o diretório da query se não existir
    const queryDir = path.join(process.cwd(), 'queries', requestId);
    await fs.mkdir(queryDir, { recursive: true });
    
    // Salva os dados da sessão
    await fs.writeFile(
      path.join(queryDir, 'session.json'),
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
      question: session.question
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    res.status(500).json({ error: 'Erro ao salvar sessão' });
  }
});

// Rota para carregar uma sessão
app.get('/api/v1/queries/:requestId/session', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const sessionPath = path.join(process.cwd(), 'queries', requestId, 'session.json');
    
    const sessionData = await fs.readFile(sessionPath, 'utf-8');
    const session: QuerySession = JSON.parse(sessionData);
    
    res.json(session);
  } catch (error) {
    console.error('Erro ao carregar sessão:', error);
    res.status(404).json({ error: 'Sessão não encontrada' });
  }
});
