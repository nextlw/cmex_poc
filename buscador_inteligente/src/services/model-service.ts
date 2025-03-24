import { EventEmitter } from "events";
import { TokenTracker } from "../utils/token-tracker";
import { ServerLog } from "../types/globalTypes";
import axios from "axios";

/**
 * NOTA: Idealmente estes tipos viriam do pacote compartilhado 'shared-types',
 * mas para evitar problemas de configuração durante o desenvolvimento, estamos
 * duplicando-os temporariamente.
 *
 * TODO: Substituir por importações do pacote shared-types quando a configuração estiver correta.
 */

/**
 * Tipos de provedores de modelos suportados
 */
export type ModelProvider = "openai" | "anthropic" | "google" | "local";

/**
 * Interface de configuração para modelos
 */
export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  displayName: string;
  description: string;
  apiKey?: string;
  baseUrl?: string;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
  maxContextLength: number;
  temperatureDefault: number;
  costPerInputToken: number;
  costPerOutputToken: number;
}

/**
 * Interface para mensagens de chat
 */
export interface ModelMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string; // Para mensagens de função
}

/**
 * Interface para requisições de completions
 */
export interface ModelRequest {
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  jsonMode?: boolean;
  stop?: string[];
  tools?: any[]; // Ferramentas disponíveis
  toolChoice?: "auto" | "none" | string;
}

/**
 * Interface para uso de tokens
 */
export interface ModelTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

/**
 * Interface para resposta de completion
 */
export interface ModelResponse {
  content: string;
  usage: ModelTokenUsage;
  model: string;
  finishReason?: string;
}

/**
 * Eventos emitidos pelo ModelService
 */
export enum ModelServiceEvent {
  RESPONSE_START = "response:start",
  RESPONSE_CHUNK = "response:chunk",
  RESPONSE_END = "response:end",
  RESPONSE_ERROR = "response:error",
  MODEL_SELECTED = "model:selected",
  MODEL_UNAVAILABLE = "model:unavailable",
  TOKEN_USAGE = "token:usage",
  LOG = "log",
}

/**
 * Classe principal para gerenciar modelos
 */
export class ModelService extends EventEmitter {
  private configs: Record<string, ModelConfig> = {};
  private tokenTracker: TokenTracker;
  private logger: (log: ServerLog) => void;

  constructor(tokenTracker: TokenTracker, logger?: (log: ServerLog) => void) {
    super();
    this.tokenTracker = tokenTracker;
    this.logger = logger || this.defaultLogger;
    this.initializeModels();
  }

  /**
   * Inicializa as configurações de modelos
   */
  private initializeModels(): void {
    // Modelo local
    this.registerModel({
      provider: "local",
      modelName: "local-model",
      displayName: "Local",
      description: "Modelo local executado no servidor",
      baseUrl: process.env.LOCAL_MODEL_URL || "http://localhost:8000/v1",
      supportsStreaming: true,
      supportsJsonMode: false,
      maxContextLength: 32000,
      temperatureDefault: 0.7,
      costPerInputToken: 0,
      costPerOutputToken: 0,
    });

    // OpenAI GPT-4
    if (process.env.OPENAI_API_KEY) {
      this.registerModel({
        provider: "openai",
        modelName: "gpt-4",
        displayName: "GPT-4",
        description: "Modelo GPT-4 da OpenAI",
        apiKey: process.env.OPENAI_API_KEY,
        supportsStreaming: true,
        supportsJsonMode: true,
        maxContextLength: 128000,
        temperatureDefault: 0.7,
        costPerInputToken: 0.00001,
        costPerOutputToken: 0.00003,
      });

      // OpenAI GPT-3.5 Turbo
      this.registerModel({
        provider: "openai",
        modelName: "gpt-3.5-turbo",
        displayName: "GPT-3.5",
        description: "Modelo GPT-3.5 Turbo da OpenAI",
        apiKey: process.env.OPENAI_API_KEY,
        supportsStreaming: true,
        supportsJsonMode: true,
        maxContextLength: 16385,
        temperatureDefault: 0.7,
        costPerInputToken: 0.000001,
        costPerOutputToken: 0.000002,
      });
    }

    // Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      this.registerModel({
        provider: "anthropic",
        modelName: "claude-3-opus-20240229",
        displayName: "Claude",
        description: "Modelo Claude 3 Opus da Anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY,
        supportsStreaming: true,
        supportsJsonMode: true,
        maxContextLength: 200000,
        temperatureDefault: 0.7,
        costPerInputToken: 0.00001,
        costPerOutputToken: 0.00003,
      });
    }

    // Google Gemini
    if (process.env.GOOGLE_API_KEY) {
      this.registerModel({
        provider: "google",
        modelName: "gemini-1.5-pro",
        displayName: "Gemini Pro",
        description: "Modelo Gemini 1.5 Pro do Google",
        apiKey: process.env.GOOGLE_API_KEY,
        supportsStreaming: true,
        supportsJsonMode: true,
        maxContextLength: 1000000,
        temperatureDefault: 0.7,
        costPerInputToken: 0.000005,
        costPerOutputToken: 0.000015,
      });
    }

    // Provável linha que exibe a mensagem de inicialização
    // this.log("info", `Modelos inicializados`, {
    //   count: Object.keys(this.configs).length,
    // });
  }

  /**
   * Registra um novo modelo no serviço
   */
  public registerModel(config: ModelConfig): void {
    this.configs[config.modelName] = config;
    // Não exibir mensagens individuais de registro de modelos
    // Apenas armazenar para contagem final
  }

  /**
   * Seleciona o melhor modelo com base na consulta
   */
  public selectModel(query: string, requestedModel?: string): string {
    // Se um modelo específico for solicitado e estiver disponível, use-o
    if (requestedModel) {
      // Converte o valor do header select para nome interno do modelo se necessário
      const modelName = headerSelectToModelName(requestedModel);

      if (this.isModelAvailable(modelName)) {
        this.emit(ModelServiceEvent.MODEL_SELECTED, {
          model: modelName,
          displayName: requestedModel,
          reason: "requested",
        });
        return modelName;
      }
    }

    // Análise básica da consulta
    const queryLength = query.length;
    const hasCode =
      /código|programação|api|framework|função|class|método/i.test(query);
    const isNcm =
      /ncm|classificação fiscal|imposto|tributação|mercadoria/i.test(query);
    const isComplex = /analisar|comparar|avaliar|diferenças|implicações/i.test(
      query
    );

    // Lógica de seleção
    let selectedModel: string;

    if (hasCode && this.isModelAvailable("gpt-4")) {
      selectedModel = "gpt-4";
    } else if (isNcm && this.isModelAvailable("claude-3-opus-20240229")) {
      selectedModel = "claude-3-opus-20240229";
    } else if (queryLength > 1000 && this.isModelAvailable("gemini-1.5-pro")) {
      selectedModel = "gemini-1.5-pro";
    } else if (isComplex && this.isModelAvailable("gpt-4")) {
      selectedModel = "gpt-4";
    } else if (this.isModelAvailable("gpt-3.5-turbo")) {
      selectedModel = "gpt-3.5-turbo";
    } else {
      // Fallback para modelo local
      selectedModel = "local-model";
    }

    const displayName = modelNameToHeaderSelect(selectedModel);
    this.emit(ModelServiceEvent.MODEL_SELECTED, {
      model: selectedModel,
      displayName,
      reason: "auto-selected",
      factors: { hasCode, isNcm, isComplex, queryLength },
    });

    return selectedModel;
  }

  /**
   * Verifica se um modelo está disponível
   */
  private isModelAvailable(modelName: string): boolean {
    return !!this.configs[modelName];
  }

  /**
   * Obtém a configuração de um modelo
   */
  public getModelConfig(modelName: string): ModelConfig | null {
    return this.configs[modelName] || null;
  }

  /**
   * Lista todos os modelos disponíveis
   */
  public getAvailableModels(): string[] {
    return Object.keys(this.configs);
  }

  /**
   * Obtém todos os modelos disponíveis com informações para o frontend
   */
  public getAvailableModelsInfo(): Array<{
    name: string;
    displayName: string;
  }> {
    return Object.values(this.configs).map((config) => ({
      name: config.modelName,
      displayName: config.displayName,
    }));
  }

  /**
   * Função de logging padrão
   */
  private defaultLogger(log: ServerLog): void {
    const { level, message, context, timestamp } = log;
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
    this.emit(ModelServiceEvent.LOG, log);
  }

  // TODO: Implementar métodos de geração de respostas na próxima etapa
  // getCompletion
  // getStreamingCompletion
}

// Instância singleton
let modelServiceInstance: ModelService | null = null;

/**
 * Obtém a instância do ModelService
 */
export function getModelService(
  tokenTracker?: TokenTracker,
  logger?: (log: ServerLog) => void
): ModelService {
  if (!modelServiceInstance) {
    modelServiceInstance = new ModelService(
      tokenTracker || new TokenTracker(),
      logger
    );
  }
  return modelServiceInstance;
}

/**
 * Transforma o valor do Header select para o nome do modelo interno
 * Esta função mapeia os nomes de exibição usados no componente Header para os nomes internos dos modelos
 */
export function headerSelectToModelName(headerValue: string): string {
  // Mapeamento de nomes amigáveis do seletor para nomes internos
  const modelMap: Record<string, string> = {
    "GPT-4": "gpt-4",
    "GPT-3.5": "gpt-3.5-turbo",
    Claude: "claude-3-opus-20240229",
    "Gemini Pro": "gemini-1.5-pro",
    Local: "local-model",
  };

  return modelMap[headerValue] || "local-model"; // Fallback para modelo local
}

/**
 * Transforma o nome interno do modelo para o valor de exibição no Header
 */
export function modelNameToHeaderSelect(modelName: string): string {
  // Mapeamento inverso: de nomes internos para nomes amigáveis do seletor
  const displayMap: Record<string, string> = {
    "gpt-4": "GPT-4",
    "gpt-3.5-turbo": "GPT-3.5",
    "claude-3-opus-20240229": "Claude",
    "gemini-1.5-pro": "Gemini Pro",
    "local-model": "Local",
  };

  return displayMap[modelName] || "Local"; // Fallback para exibição Local
}
