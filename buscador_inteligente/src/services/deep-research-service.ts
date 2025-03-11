import { EventEmitter } from "events";
import axios from "axios";
import { ModelService, ModelConfig } from "./model-service";
import { SSEService } from "./sse-service";
import { TokenTracker } from "../utils/token-tracker";
import { ServerLog } from "../types/globalTypes";
import { v4 as uuidv4 } from "uuid";

// Definindo enumeration para ModelProvider
export enum ModelProvider {
  LOCAL = "local",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
}

// Função auxiliar para publicar no Redis (simulada)
async function publishToRedis(channel: string, message: string): Promise<void> {
  try {
    console.log(
      `[Redis] Publicando em ${channel}: ${message.substring(0, 50)}...`
    );
    // Aqui seria a integração real com Redis
  } catch (error) {
    console.error(`Erro ao publicar no Redis: ${error}`);
  }
}

// Tipos para pesquisa profunda
export interface DeepResearchRequest {
  query: string;
  requestId: string;
  context?: any;
  options?: DeepResearchOptions;
}

export interface DeepResearchOptions {
  maxSteps?: number;
  modelProvider?: ModelProvider;
  modelName?: string;
  searchProvider?: string;
  includeReferences?: boolean;
  timeoutMs?: number;
  autoSelectModel?: boolean;
  useCache?: boolean;
}

export interface DeepResearchResult {
  requestId: string;
  answer: string;
  steps: DeepResearchStep[];
  searchResults?: any[];
  references?: any[];
  tokenUsage?: any;
  modelUsed?: string;
  timeElapsed?: number;
  status: DeepResearchStatus;
}

export interface DeepResearchStep {
  id: string;
  type: "search" | "analysis" | "validation" | "answer" | "error";
  content: any;
  timestamp: string;
}

export type DeepResearchStatus = "in_progress" | "completed" | "error";

export enum DeepResearchEvent {
  STEP_STARTED = "step:started",
  STEP_COMPLETED = "step:completed",
  STEP_ERROR = "step:error",
  RESEARCH_STARTED = "research:started",
  RESEARCH_COMPLETED = "research:completed",
  RESEARCH_ERROR = "research:error",
  MODEL_SELECTED = "model:selected",
  TOKEN_USAGE = "token:usage",
  LOG = "log",
}

/**
 * Serviço para realizar pesquisas profunda
 */
export class DeepResearchService extends EventEmitter {
  private static instance: DeepResearchService;
  private modelService: ModelService;
  private sseService: SSEService;
  private tokenTracker: TokenTracker;
  private activeResearches: Map<string, DeepResearchResult>;
  private logger: (log: ServerLog) => void;
  private fastApiUrl: string;

  private constructor() {
    super();
    this.tokenTracker = new TokenTracker();
    // Configurando o logger com bind para garantir o contexto correto
    this.logger = this.defaultLogger.bind(this);

    // Criando instância do ModelService e usando uma função auxiliar para compatibilidade
    this.modelService = new ModelService(
      this.tokenTracker,
      (logData: ServerLog) => {
        this.logger(logData);
      }
    );
    this.sseService = SSEService.getInstance();
    this.activeResearches = new Map();
    this.fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";

    // Configurar listeners para eventos do modelo
    this.setupModelListeners();
  }

  /**
   * Obtém a instância singleton do serviço
   */
  public static getInstance(): DeepResearchService {
    if (!DeepResearchService.instance) {
      DeepResearchService.instance = new DeepResearchService();
    }
    return DeepResearchService.instance;
  }

  /**
   * Configura listeners para eventos do ModelService
   */
  private setupModelListeners(): void {
    // TODO: Configurar listeners específicos para eventos do modelo, se necessário
  }

  /**
   * Inicia uma pesquisa profunda
   */
  public async startResearch(request: DeepResearchRequest): Promise<string> {
    const { query, requestId, options = {} } = request;

    // Configurações padrão
    const defaultOptions: DeepResearchOptions = {
      maxSteps: 5,
      includeReferences: true,
      timeoutMs: 60000 * 2, // 2 minutos
      autoSelectModel: true,
      useCache: true,
    };

    // Mesclar opções
    const researchOptions = { ...defaultOptions, ...options };

    // Inicializar resultado
    const newResearch: DeepResearchResult = {
      requestId,
      answer: "",
      steps: [],
      status: "in_progress",
      modelUsed: researchOptions.modelName || "auto",
      timeElapsed: 0,
    };

    this.activeResearches.set(requestId, newResearch);

    // Emitir evento de início
    this.emit(DeepResearchEvent.RESEARCH_STARTED, {
      requestId,
      query,
      options: researchOptions,
    });

    // Enviar notificação SSE
    this.sseService.sendEvent(requestId, "message", {
      type: "progress",
      data: {
        action: "research_started",
        query,
        message: `Iniciando pesquisa profunda para: "${query}"`,
      },
    });

    // Enviar para fila de processamento assíncrono
    setImmediate(() => {
      this.processDeepResearch(requestId, query, researchOptions).catch(
        (error) => {
          this.log(
            "error",
            `Erro ao processar pesquisa profunda: ${error.message}`,
            { requestId, error }
          );
          this.completeResearchWithError(requestId, error as Error);
        }
      );
    });

    return requestId;
  }

  /**
   * Processa a pesquisa profunda de forma assíncrona
   */
  private async processDeepResearch(
    requestId: string,
    query: string,
    options: DeepResearchOptions
  ): Promise<void> {
    const startTime = Date.now();
    try {
      // Se autoSelectModel estiver ativado, selecionar modelo baseado na complexidade da consulta
      if (options.autoSelectModel && !options.modelName) {
        const selectedModel = await this.selectAppropriateModel(query);
        options.modelName = selectedModel.name;
        options.modelProvider = selectedModel.provider;

        this.emit(DeepResearchEvent.MODEL_SELECTED, {
          requestId,
          model: options.modelName,
          provider: options.modelProvider,
          reason: selectedModel.reason,
        });

        this.sseService.sendEvent(requestId, "message", {
          type: "progress",
          data: {
            action: "model_selected",
            model: options.modelName,
            provider: options.modelProvider,
            reason: selectedModel.reason,
            message: `Modelo selecionado: ${options.modelName} (${selectedModel.reason})`,
          },
        });

        // Atualizar o modelo usado na pesquisa
        const research = this.activeResearches.get(requestId);
        if (research) {
          research.modelUsed = options.modelName;
        }
      }

      // Passo 1: Obter resultados rápidos do FastAPI
      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "search",
        content: { query, message: "Obtendo resultados iniciais..." },
        timestamp: new Date().toISOString(),
      });

      const initialResults = await this.getInitialResults(query);

      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "search",
        content: {
          query,
          results: initialResults.results,
          message: `Encontrados ${initialResults.results.length} resultados iniciais.`,
        },
        timestamp: new Date().toISOString(),
      });

      // Passo 2: Análise profunda com modelo selecionado
      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "analysis",
        content: {
          message: "Analisando resultados com modelo de IA...",
          model: options.modelName,
        },
        timestamp: new Date().toISOString(),
      });

      const analysisResults = await this.analyzeResults(
        query,
        initialResults.results,
        options
      );

      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "analysis",
        content: {
          analysis: analysisResults.analysis,
          message: "Análise concluída.",
        },
        timestamp: new Date().toISOString(),
      });

      // Passo 3: Validação e enriquecimento dos resultados
      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "validation",
        content: { message: "Validando e enriquecendo resultados..." },
        timestamp: new Date().toISOString(),
      });

      const validationResults = await this.validateResults(
        query,
        analysisResults,
        options
      );

      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "validation",
        content: {
          validation: validationResults.validation,
          confidence: validationResults.confidence,
          message: `Validação concluída com confiança de ${validationResults.confidence}%.`,
        },
        timestamp: new Date().toISOString(),
      });

      // Passo 4: Gerar resposta final
      await this.addResearchStep(requestId, {
        id: uuidv4(),
        type: "answer",
        content: { message: "Gerando resposta final..." },
        timestamp: new Date().toISOString(),
      });

      const finalAnswer = await this.generateFinalAnswer(
        query,
        initialResults.results,
        analysisResults,
        validationResults,
        options
      );

      // Atualizar resultado final
      const research = this.activeResearches.get(requestId);
      if (research) {
        research.answer = finalAnswer.answer;
        research.references = finalAnswer.references;
        research.status = "completed";
        research.timeElapsed = Date.now() - startTime;
        research.tokenUsage = this.getTokenUsage(requestId);

        // Adicionar passo final
        research.steps.push({
          id: uuidv4(),
          type: "answer",
          content: {
            answer: finalAnswer.answer,
            references: finalAnswer.references,
            message: "Pesquisa concluída com sucesso.",
          },
          timestamp: new Date().toISOString(),
        });

        // Enviar resultado final via SSE
        this.sseService.sendEvent(requestId, "message", {
          type: "answer",
          data: {
            action: "answer",
            answer: finalAnswer.answer,
            references: finalAnswer.references,
            message: "Pesquisa concluída com sucesso.",
          },
          trackers: {
            tokenUsage: this.getTokenUsage(requestId),
            timeElapsed: research.timeElapsed,
          },
        });

        // Emitir evento de conclusão
        this.emit(DeepResearchEvent.RESEARCH_COMPLETED, research);

        // Publicar resultado no Redis para outros serviços
        await publishToRedis(
          `research:completed:${requestId}`,
          JSON.stringify(research)
        );
      }
    } catch (error) {
      this.completeResearchWithError(requestId, error as Error);
    }
  }

  /**
   * Adiciona um passo à pesquisa e envia atualização via SSE
   */
  private async addResearchStep(
    requestId: string,
    step: DeepResearchStep
  ): Promise<void> {
    const research = this.activeResearches.get(requestId);
    if (research) {
      research.steps.push(step);

      // Emitir evento de passo
      this.emit(DeepResearchEvent.STEP_COMPLETED, { requestId, step });

      // Enviar atualização via SSE
      this.sseService.sendEvent(requestId, "message", {
        type: "progress",
        data: {
          action: `step_${step.type}`,
          step: {
            id: step.id,
            type: step.type,
            content: step.content,
            timestamp: step.timestamp,
          },
          message: step.content.message,
        },
        trackers: {
          tokenUsage: this.getTokenUsage(requestId),
          stepCount: research.steps.length,
        },
      });
    }
  }

  /**
   * Obtém resultados iniciais do FastAPI
   */
  private async getInitialResults(query: string): Promise<{ results: any[] }> {
    try {
      const response = await axios.post(
        `${this.fastApiUrl}/api/v1/ncm/search`,
        {
          query,
        }
      );

      return {
        results: response.data.results || [],
      };
    } catch (error) {
      const err = error as Error;
      this.log("error", `Erro ao obter resultados iniciais: ${err.message}`, {
        query,
        error: err,
      });
      throw new Error(`Falha ao obter resultados iniciais: ${err.message}`);
    }
  }

  /**
   * Analisa os resultados usando o modelo selecionado
   */
  private async analyzeResults(
    query: string,
    results: any[],
    options: DeepResearchOptions
  ): Promise<{ analysis: any }> {
    // Em implementação real, aqui usaríamos o ModelService para analisar os resultados
    // Por enquanto, retornamos um resultado simulado
    return {
      analysis: {
        relevantResults: results.slice(0, 3),
        keyInsights: ["Insight 1", "Insight 2"],
        confidence: 85,
      },
    };
  }

  /**
   * Valida e enriquece os resultados com o FastAPI
   */
  private async validateResults(
    query: string,
    analysisResults: { analysis: any },
    options: DeepResearchOptions
  ): Promise<{ validation: any; confidence: number }> {
    try {
      const response = await axios.post(
        `${this.fastApiUrl}/api/v1/ncm/validate`,
        {
          query,
          analysis: analysisResults.analysis,
        }
      );

      return {
        validation: response.data.validation || {},
        confidence: response.data.confidence || 0,
      };
    } catch (error) {
      const err = error as Error;
      this.log("error", `Erro ao validar resultados: ${err.message}`, {
        query,
        error: err,
      });
      // Fallback para não interromper o fluxo
      return {
        validation: { status: "error", message: err.message },
        confidence: 50,
      };
    }
  }

  /**
   * Gera a resposta final com base em todos os dados coletados
   */
  private async generateFinalAnswer(
    query: string,
    initialResults: any[],
    analysisResults: { analysis: any },
    validationResults: { validation: any; confidence: number },
    options: DeepResearchOptions
  ): Promise<{ answer: string; references: any[] }> {
    // Em implementação real, aqui usaríamos o ModelService para gerar a resposta final
    // Por enquanto, retornamos um resultado simulado
    return {
      answer: `Resposta para a consulta: "${query}"\n\nCom base na análise dos resultados, concluímos que...`,
      references: initialResults.slice(0, 3).map((result) => ({
        title: result.title || "Referência",
        url: result.url || "#",
        excerpt: result.excerpt || "Trecho do resultado",
      })),
    };
  }

  /**
   * Seleciona o modelo mais apropriado para a consulta
   */
  private async selectAppropriateModel(query: string): Promise<{
    name: string;
    provider: ModelProvider;
    reason: string;
  }> {
    // Análise de complexidade da consulta
    const isComplex =
      query.length > 100 ||
      query.includes("complexo") ||
      query.includes("detalhado") ||
      query.includes("explique") ||
      query.includes("compare");

    const isNCM =
      query.includes("NCM") ||
      query.includes("classificação") ||
      /\d{4}\.\d{2}\.\d{2}/.test(query); // Regex para formato NCM

    // Selecionar modelo baseado na complexidade
    if (isComplex || isNCM) {
      // Para consultas complexas ou sobre NCM, usar modelo mais poderoso
      return {
        name: "gpt-4",
        provider: ModelProvider.OPENAI,
        reason: isNCM
          ? "Consulta sobre NCM requer precisão"
          : "Consulta complexa",
      };
    } else {
      // Para consultas simples, usar modelo local
      return {
        name: "qwen2.5-7b-instruct-1m",
        provider: ModelProvider.LOCAL,
        reason: "Consulta de complexidade padrão",
      };
    }
  }

  /**
   * Completa a pesquisa com erro
   */
  private completeResearchWithError(requestId: string, error: Error): void {
    const research = this.activeResearches.get(requestId);
    if (research) {
      research.status = "error";
      research.timeElapsed = Date.now() - (research.timeElapsed || Date.now());

      // Adicionar passo de erro
      research.steps.push({
        id: uuidv4(),
        type: "error",
        content: {
          error: error.message || "Erro desconhecido",
          stack: error.stack,
          message: `Erro: ${error.message || "Erro desconhecido"}`,
        },
        timestamp: new Date().toISOString(),
      });

      // Enviar erro via SSE
      this.sseService.sendEvent(requestId, "message", {
        type: "error",
        data: {
          action: "research_error",
          error: error.message || "Erro desconhecido",
          message: `Erro ao processar pesquisa: ${
            error.message || "Erro desconhecido"
          }`,
        },
      });

      // Emitir evento de erro
      this.emit(DeepResearchEvent.RESEARCH_ERROR, { requestId, error });
    }
  }

  /**
   * Obtém o resultado de uma pesquisa
   */
  public getResearchResult(requestId: string): DeepResearchResult | null {
    return this.activeResearches.get(requestId) || null;
  }

  /**
   * Cancela uma pesquisa em andamento
   */
  public cancelResearch(requestId: string): boolean {
    const research = this.activeResearches.get(requestId);
    if (research && research.status === "in_progress") {
      research.status = "error";

      // Adicionar passo de cancelamento
      research.steps.push({
        id: uuidv4(),
        type: "error",
        content: {
          error: "Pesquisa cancelada pelo usuário",
          message: "Pesquisa cancelada pelo usuário",
        },
        timestamp: new Date().toISOString(),
      });

      // Enviar cancelamento via SSE
      this.sseService.sendEvent(requestId, "message", {
        type: "error",
        data: {
          action: "research_cancelled",
          error: "Pesquisa cancelada pelo usuário",
          message: "Pesquisa cancelada pelo usuário",
        },
      });

      return true;
    }
    return false;
  }

  /**
   * Logger padrão
   */
  private defaultLogger(log: ServerLog): void {
    const { level, message, timestamp, context } = log;
    console[level](`[${timestamp}] ${message}`, context);
  }

  /**
   * Método de logging
   */
  private log(
    level: "log" | "error" | "warn" | "info",
    message: string,
    context?: Record<string, any>
  ): void {
    const log: ServerLog = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        pid: process.pid,
        env: process.env.NODE_ENV || "development",
      },
    };

    this.logger(log);
    this.emit(DeepResearchEvent.LOG, log);
  }

  /**
   * Helper para obter o uso de tokens para um requestId
   */
  private getTokenUsage(requestId: string): any {
    // Implementação simples para uso de tokens
    return {
      prompt: 0,
      completion: 0,
      total: 0,
    };
  }
}
