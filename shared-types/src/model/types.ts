/**
 * Tipos para o sistema de múltiplos modelos de IA
 */

/**
 * Provedores de modelos suportados
 */
export type ModelProvider = "openai" | "anthropic" | "google" | "local";

/**
 * Configuração de um modelo de IA
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
 * Mensagem para modelo de chat
 */
export interface ModelMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string; // Para mensagens de função
}

/**
 * Requisição para completions de modelo
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
 * Estatísticas de uso de tokens
 */
export interface ModelTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

/**
 * Resposta de completion de modelo
 */
export interface ModelResponse {
  content: string;
  usage: ModelTokenUsage;
  model: string;
  finishReason?: string;
}

/**
 * Informações sobre modelo disponível
 * (Versão simplificada para frontend)
 */
export interface ModelInfo {
  modelName: string;
  displayName: string;
  description: string;
  provider: ModelProvider;
  supportsStreaming: boolean;
  maxContextLength: number;
}

/**
 * Status de streaming para frontend
 */
export interface ModelStreamingStatus {
  isStreaming: boolean;
  progress: number;
  currentStep: string;
  modelInfo?: ModelInfo;
  error?: string;
}

/**
 * Eventos do sistema de modelos
 */
export type ModelServiceEventType =
  | "response:start"
  | "response:chunk"
  | "response:end"
  | "response:error"
  | "model:selected"
  | "model:unavailable"
  | "token:usage"
  | "log";

/**
 * Estatísticas de modelo para dashboard
 */
export interface ModelStatistics {
  modelName: string;
  provider: ModelProvider;
  totalUsage: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
}
