/**
 * Transformadores para o tipo ServerLog
 */
import { z } from 'zod';

/**
 * Interface para o tipo ServerLog do backend
 */
export interface ServerLog {
  context: { 
    pid: number;
    env: string;
    requestId?: string;
  };
  timestamp: string;
  message: string;
  level: 'log' | 'error' | 'warn' | 'info';
}

/**
 * Interface para o tipo LogsResponse do frontend
 */
export interface LogsResponse {
  serverLogs: Array<{
    timestamp: string;
    message: string;
    level: 'log' | 'error' | 'warn' | 'info';
  }>;
  promptContents?: Array<{
    filename: string;
    content: string;
  }>;
}

/**
 * Schema Zod para validação de nível de log
 */
export const logLevelSchema = z.enum(['log', 'error', 'warn', 'info']);

/**
 * Schema Zod para validação de logs do servidor
 */
export const serverLogSchema = z.object({
  context: z.object({
    pid: z.number(),
    env: z.string(),
    requestId: z.string().optional()
  }),
  timestamp: z.string(),
  message: z.string(),
  level: logLevelSchema
});

/**
 * Schema Zod para validação da resposta de logs no frontend
 */
export const logsResponseSchema = z.object({
  serverLogs: z.array(z.object({
    timestamp: z.string(),
    message: z.string(),
    level: logLevelSchema
  })),
  promptContents: z.array(z.object({
    filename: z.string(),
    content: z.string()
  })).optional()
});

/**
 * Transforma um objeto ServerLog do backend para o formato que o frontend espera
 * 
 * - O campo `context` é removido
 */
export function transformServerLog(backendLog: any): any {
  try {
    // Validar o log usando o schema
    const validatedLog = serverLogSchema.parse(backendLog);
    
    // Extrair apenas os campos necessários
    return {
      timestamp: validatedLog.timestamp,
      message: validatedLog.message,
      level: validatedLog.level
    };
  } catch (error) {
    console.error('Erro ao transformar ServerLog:', error);
    
    // Em caso de erro, retorna um log genérico
    return {
      timestamp: new Date().toISOString(),
      message: backendLog?.message || 'Log inválido',
      level: 'error'
    };
  }
}

/**
 * Transforma uma lista de ServerLog do backend para o formato LogsResponse do frontend
 */
export function transformLogsResponse(
  backendLogs: any[], 
  promptContents?: Array<{filename: string; content: string}>
): LogsResponse {
  try {
    // Transformar cada log individualmente
    const serverLogs = Array.isArray(backendLogs) 
      ? backendLogs.map(transformServerLog)
      : [];
    
    // Montar a resposta
    const response: LogsResponse = {
      serverLogs
    };
    
    // Adicionar promptContents se fornecido
    if (promptContents) {
      response.promptContents = promptContents;
    }
    
    // Validar a resposta
    return logsResponseSchema.parse(response) as LogsResponse;
  } catch (error) {
    console.error('Erro ao transformar LogsResponse:', error);
    
    // Em caso de erro, retornar uma resposta vazia mas válida
    return { serverLogs: [] };
  }
} 