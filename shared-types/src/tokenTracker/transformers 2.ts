import { BackendTokenTracker, FrontendTokenTracker, TokenUsage } from './types';
import { tokenUsageSchema, backendTokenTrackerSchema, frontendTokenTrackerSchema } from './schemas';
import { handleValidationError, logTransformationError } from '../utils/errorHandling';

/**
 * Transforma um rastreador de tokens do backend para o frontend
 * 
 * @param backendTracker Rastreador de tokens do backend
 * @returns Rastreador de tokens formatado para o frontend ou null se a entrada for nula
 */
export function transformTokenTracker(
  backendTracker: BackendTokenTracker | null
): FrontendTokenTracker | null {
  // Retorna null se a entrada for nula
  if (backendTracker === null) {
    return null;
  }

  try {
    // Valida o rastreador de entrada
    const validatedTracker = backendTokenTrackerSchema.parse(backendTracker);
    
    // Valida e transforma cada item de uso
    const usage = validatedTracker.usages.map(item => {
      try {
        return tokenUsageSchema.parse(item);
      } catch (error) {
        logTransformationError('TokenUsage', item, error);
        return {
          tool: item.tool || 'unknown',
          tokens: typeof item.tokens === 'number' ? item.tokens : 0
        };
      }
    });
    
    // Calcula o total de tokens
    let totalTokens = 0;
    
    // Se o método getTotalUsage estiver disponível, usa-o
    if (typeof validatedTracker.getTotalUsage === 'function') {
      try {
        const result = validatedTracker.getTotalUsage();
        totalTokens = typeof result === 'number' ? result : 0;
      } catch (error) {
        logTransformationError('TokenTracker.getTotalUsage', validatedTracker, error);
        // Em caso de erro, calcula manualmente
        totalTokens = usage.reduce((sum, item) => sum + item.tokens, 0);
      }
    } else {
      // Caso contrário, soma os tokens de cada item
      totalTokens = usage.reduce((sum, item) => sum + item.tokens, 0);
    }
    
    // Cria o rastreador de tokens para o frontend
    const frontendTracker: FrontendTokenTracker = {
      usage,
      totalTokens
    };
    
    // Valida o rastreador de saída
    return frontendTokenTrackerSchema.parse(frontendTracker);
  } catch (error) {
    // Registra e trata o erro
    logTransformationError('TokenTracker', backendTracker, error);
    
    // Retorna um objeto com valores padrão seguros
    return handleValidationError<FrontendTokenTracker>(
      error,
      { usage: [], totalTokens: 0 },
      `Erro ao transformar rastreador de tokens. Usando valores padrão.`
    );
  }
} 