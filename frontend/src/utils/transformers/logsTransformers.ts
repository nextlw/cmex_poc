/**
 * Transformadores para logs do servidor
 */
import { z } from 'zod';

/**
 * Interface para o tipo ServerLog do backend
 */
export interface ServerLog {
  context: {
    pid?: number;
    env?: string;
    requestId?: string;
    [key: string]: any;
  };
  timestamp: string;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Interface para o tipo FrontendLog do frontend
 */
export interface FrontendLog {
  timestamp: string;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Interface para o tipo LogsResponse do frontend
 */
export interface LogsResponse {
  serverLogs: FrontendLog[];
  promptContents?: Array<{
    filename: string;
    content: string;
  }>;
}

/**
 * Interface para o tipo PromptContent do frontend
 */
export interface PromptContent {
  filename: string;
  content: string;
}

/**
 * Schema Zod para validação de nível de log
 */
export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

/**
 * Schema Zod para validação de logs do servidor
 */
export const serverLogSchema = z.object({
  context: z.object({
    pid: z.number().optional(),
    env: z.string().optional(),
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
 * Transforma um log do servidor para o formato do frontend
 */
export function transformServerLog(backendLog: ServerLog): FrontendLog {
  try {
    // Validação simples
    if (!backendLog || !backendLog.message) {
      throw new Error('Log inválido');
    }
    
    // Extrair apenas os campos necessários para o frontend
    return {
      timestamp: backendLog.timestamp || new Date().toISOString(),
      message: backendLog.message,
      level: backendLog.level || 'error'
    };
  } catch (error) {
    console.error('Erro ao transformar log do servidor:', error);
    
    // Retornar um log com valores padrão seguros
    return {
      timestamp: backendLog?.timestamp || new Date().toISOString(),
      message: backendLog?.message || 'Mensagem de log indisponível',
      level: backendLog?.level || 'error'
    };
  }
}

/**
 * Transforma uma lista de logs do servidor para o formato do frontend
 */
export function transformLogsResponse(
  backendLogs?: ServerLog[] | null,
  promptContents?: PromptContent[]
): LogsResponse {
  try {
    // Garantir que backendLogs é um array
    const logs = Array.isArray(backendLogs) ? backendLogs : [];
    
    // Transformar cada log
    const serverLogs = logs.map(log => transformServerLog(log));
    
    // Criar a resposta
    const response: LogsResponse = {
      serverLogs
    };
    
    // Adicionar promptContents se fornecido
    if (promptContents) {
      response.promptContents = promptContents;
    }
    
    return response;
  } catch (error) {
    console.error('Erro ao transformar resposta de logs:', error);
    
    // Retornar uma resposta vazia mas válida
    return { 
      serverLogs: []
    };
  }
} 