import {
  ModelInfo,
  ModelConfig,
  ModelTokenUsage,
  ModelStatistics,
} from "./types";

/**
 * Transformadores para tipos do sistema de múltiplos modelos
 */

/**
 * Transforma uma configuração completa de modelo em informações simplificadas para o frontend
 */
export function transformModelConfig(config: ModelConfig): ModelInfo {
  return {
    modelName: config.modelName,
    displayName: config.displayName,
    description: config.description,
    provider: config.provider,
    supportsStreaming: config.supportsStreaming,
    maxContextLength: config.maxContextLength,
  };
}

/**
 * Transforma um array de configurações de modelo em informações para o frontend
 */
export function transformModelConfigList(configs: ModelConfig[]): ModelInfo[] {
  return configs.map(transformModelConfig);
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

/**
 * Transforma estatísticas do backend para o formato do frontend
 */
export function transformModelStatistics(statistics: ModelStatistics): any {
  return {
    modelName: modelNameToHeaderSelect(statistics.modelName),
    provider: statistics.provider,
    usage: {
      total: statistics.totalUsage,
      cost: statistics.totalCost.toFixed(5),
    },
    performance: {
      responseTime: `${statistics.averageResponseTime.toFixed(0)}ms`,
      successRate: `${statistics.successRate.toFixed(1)}%`,
    },
  };
}

/**
 * Transforma estatísticas de uso de tokens
 */
export function transformTokenUsage(usage: ModelTokenUsage): any {
  return {
    input: usage.promptTokens,
    output: usage.completionTokens,
    total: usage.totalTokens,
    cost: usage.cost.toFixed(5),
  };
}
