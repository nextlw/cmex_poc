/**
 * Transformadores para o tipo StreamMessage
 */
import { z } from 'zod';
import { transformTokenTracker } from "./tokenTrackerTransformers.js";

// Definição dos tipos de mensagens de streaming
export type BackendStreamMessageType = 
  'progress' | 'answer' | 'error' | 'search' | 
  'reflect' | 'visit' | 'log' | 'connected';

export type FrontendStreamMessageType = 
  'progress' | 'answer' | 'error' | 'connected';

// Schema Zod para validação de tipos de mensagem do backend
export const backendStreamMessageTypeSchema = z.enum([
  'progress', 'answer', 'error', 'search', 
  'reflect', 'visit', 'log', 'connected'
]);

// Schema Zod para validação de tipos de mensagem do frontend
export const frontendStreamMessageTypeSchema = z.enum([
  'progress', 'answer', 'error', 'connected'
]);

/**
 * Transforma um tipo de mensagem do backend para o formato do frontend
 * 
 * - 'search', 'reflect', 'visit', 'log' são mapeados para 'progress'
 * - outros valores são mantidos se compatíveis com o frontend
 */
export function transformStreamMessageType(
  backendType: BackendStreamMessageType
): FrontendStreamMessageType {
  // Garante que o tipo atende ao schema do backend
  const validatedType = backendStreamMessageTypeSchema.parse(backendType);
  
  // Mapeamento de tipos do backend para o frontend
  const typeMapping: Record<BackendStreamMessageType, FrontendStreamMessageType> = {
    progress: 'progress',
    answer: 'answer',
    error: 'error',
    search: 'progress',
    reflect: 'progress',
    visit: 'progress',
    log: 'progress',
    connected: 'connected'
  };
  
  return typeMapping[validatedType];
}

/**
 * Transforma o campo 'data' de uma StreamMessage do backend para o formato do frontend
 */
export function transformStreamMessageData(type: BackendStreamMessageType, data: any): any {
  // Para tipos diretos como 'error' e 'connected', mantém o mesmo formato
  if (type === 'error' || type === 'connected') {
    return { error: typeof data === 'string' ? data : JSON.stringify(data) };
  }
  
  // Para 'answer', extrai o conteúdo da resposta
  if (type === 'answer') {
    return { 
      action: 'answer',
      answer: typeof data === 'string' ? data : data.answer || data.content || JSON.stringify(data)
    };
  }
  
  // Para 'search', extrai a consulta de busca
  if (type === 'search') {
    return { 
      action: 'search',
      searchQuery: typeof data === 'string' ? data : data.query || JSON.stringify(data)
    };
  }
  
  // Para 'reflect', extrai o pensamento
  if (type === 'reflect') {
    return { 
      action: 'reflect',
      think: typeof data === 'string' ? data : data.thought || JSON.stringify(data)
    };
  }
  
  // Para outros tipos, tenta extrair dados úteis ou converte para string
  return { 
    action: type,
    think: typeof data === 'string' ? data : JSON.stringify(data)
  };
}

/**
 * Transforma um objeto StreamMessage do backend para o formato do frontend
 */
export function transformStreamMessage(backendMessage: any): any {
  if (!backendMessage) return null;
  
  try {
    // Transforma o tipo da mensagem
    const type = transformStreamMessageType(
      backendMessage.type as BackendStreamMessageType
    );
    
    // Transforma os dados com base no tipo
    const data = transformStreamMessageData(
      backendMessage.type as BackendStreamMessageType, 
      backendMessage.data
    );
    
    // Transforma os trackers se existirem
    const trackers = backendMessage.trackers ? {
      tokenTracker: backendMessage.trackers.tokenTracker 
        ? transformTokenTracker(backendMessage.trackers.tokenTracker)
        : undefined,
      actionTracker: backendMessage.trackers.actionTracker || undefined
    } : undefined;
    
    // Retorna a mensagem transformada
    return {
      type,
      data,
      trackers,
      // Não inclui campos como 'outputs', 'step' e 'budget' que são internos do backend
    };
  } catch (error) {
    console.error('Erro ao transformar StreamMessage:', error);
    
    // Em caso de erro, retorna uma mensagem de erro genérica
    return {
      type: 'error',
      data: {
        error: 'Erro ao processar a mensagem do servidor'
      }
    };
  }
} 