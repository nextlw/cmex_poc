import { ZodError } from 'zod';

/**
 * Interface para monitoramento de erros de validação
 */
export interface ValidationErrorLog {
  component: string;
  inputValue: any;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}

// Array para armazenar erros para análise
const validationErrors: ValidationErrorLog[] = [];

/**
 * Registra e trata um erro de transformação
 * @param component Nome do componente onde ocorreu o erro
 * @param inputValue Valor de entrada que causou o erro
 * @param error Objeto de erro
 */
export function logTransformationError(
  component: string,
  inputValue: any,
  error: unknown
): void {
  // Criar log detalhado
  const errorLog: ValidationErrorLog = {
    component,
    inputValue: JSON.stringify(inputValue),
    errorType: error instanceof ZodError ? 'ZodError' : 'UnknownError',
    errorMessage: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };
  
  // Adicionar ao array para análise posterior
  validationErrors.push(errorLog);
  
  // Limite o tamanho do array para evitar vazamento de memória
  if (validationErrors.length > 1000) {
    validationErrors.shift();
  }
  
  // Log para console em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error(`Erro de transformação em ${component}:`, error);
    console.error('Valor de entrada:', inputValue);
  }
  
  // Em produção, enviar para serviço de monitoramento
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Exemplo: enviar para um endpoint de monitoramento
    try {
      const apiUrl = process.env.VALIDATION_ERROR_ENDPOINT;
      if (apiUrl) {
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorLog),
        }).catch(() => {
          // Ignorar erros de envio para não quebrar a funcionalidade principal
        });
      }
    } catch {
      // Ignorar erros neste ponto
    }
  }
}

/**
 * Processa um erro de validação e retorna um valor fallback
 * @param error Erro de validação
 * @param fallbackValue Valor de fallback a ser retornado
 * @param message Mensagem para log
 * @returns Valor de fallback
 */
export function handleValidationError<T>(
  error: unknown, 
  fallbackValue: T, 
  message: string
): T {
  // Log da mensagem específica
  console.warn(message);
  
  // Registrar detalhes do erro se for do tipo Zod
  if (error instanceof ZodError) {
    console.debug('Detalhes do erro de validação:', error.errors);
  }
  
  // Retornar valor de fallback
  return fallbackValue;
}

/**
 * Retorna todos os erros de validação registrados
 * Útil para análise e diagnóstico
 */
export function getValidationErrors(): ValidationErrorLog[] {
  return [...validationErrors];
}

/**
 * Limpa o histórico de erros de validação
 */
export function clearValidationErrors(): void {
  validationErrors.length = 0;
} 