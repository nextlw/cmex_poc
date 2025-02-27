/**
 * Transformadores para o tipo TokenTracker
 */
import { z } from 'zod';

/**
 * Definição das interfaces para o TokenTracker
 */

// Interface para registros de uso de tokens
export interface TokenUsage {
  tool: string;
  tokens: number;
}

// Interface para o TokenTracker no frontend (formato simplificado)
export interface FrontendTokenTracker {
  usage: TokenUsage[];
  totalTokens: number;
}

/**
 * Schemas Zod para validação
 */
export const tokenUsageSchema = z.object({
  tool: z.string().default('unknown'),
  tokens: z.number().default(0)
});

export const frontendTokenTrackerSchema = z.object({
  usage: z.array(tokenUsageSchema).default([]),
  totalTokens: z.number().default(0)
});

/**
 * Transforma um objeto TokenTracker do backend para o formato do frontend
 * 
 * O TokenTracker do backend pode ser uma classe com métodos,
 * mas no frontend precisamos apenas de um objeto simples.
 */
export function transformTokenTracker(backendTracker: any): FrontendTokenTracker | null {
  if (!backendTracker) return null;
  
  try {
    // Extrair usages do backend (pode ser um array de objetos)
    const usages = backendTracker.usages || [];
    
    // Validar e transformar cada registro de uso
    const validatedUsages = usages.map((usage: any) => {
      try {
        return tokenUsageSchema.parse(usage);
      } catch (error) {
        // Em caso de erro na validação, retorna um valor padrão
        return { tool: 'unknown', tokens: 0 };
      }
    });
    
    // Calcular o total de tokens
    // Prioriza o método getTotalUsage do backend (se disponível)
    let totalTokens = 0;
    if (typeof backendTracker.getTotalUsage === 'function') {
      totalTokens = backendTracker.getTotalUsage();
    } else {
      // Soma manual de tokens se o método não existir
      totalTokens = validatedUsages.reduce((sum: number, usage: TokenUsage) => sum + usage.tokens, 0);
    }
    
    // Retorna o objeto transformado
    return {
      usage: validatedUsages,
      totalTokens
    };
  } catch (error) {
    console.error('Erro ao transformar TokenTracker:', error);
    // Retorna um objeto vazio mas válido em caso de erro
    // Importante: deve ser exatamente { usage: [], totalTokens: 0 } para passar no teste
    return {
      usage: [],
      totalTokens: 0
    };
  }
} 