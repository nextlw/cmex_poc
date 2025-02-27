/**
 * Registro de uso de tokens para uma ferramenta
 */
export interface TokenUsage {
  tool: string;
  tokens: number;
}

/**
 * Interface para a classe TokenTracker do backend
 */
export interface BackendTokenTracker {
  usages: TokenUsage[];
  budget?: number;
  getTotalUsage?: () => number;
}

/**
 * Interface para o rastreador de tokens simplificado para o frontend
 */
export interface FrontendTokenTracker {
  usage: TokenUsage[];
  totalTokens: number;
} 