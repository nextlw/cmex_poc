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
  'progress' | 'answer' | 'error' | 'connected' |
  'search' | 'reflect' | 'visit'; // Adicionando esses tipos para permitir tratamento específico

// Schema Zod para validação de tipos de mensagem do backend
export const backendStreamMessageTypeSchema = z.enum([
  'progress', 'answer', 'error', 'search', 
  'reflect', 'visit', 'log', 'connected'
]);

// Schema Zod para validação de tipos de mensagem do frontend
export const frontendStreamMessageTypeSchema = z.enum([
  'progress', 'answer', 'error', 'connected',
  'search', 'reflect', 'visit' // Adicionando os mesmos tipos
]);

/**
 * Transforma um tipo de mensagem do backend para o formato do frontend
 * 
 * - Mantém os tipos search, reflect, visit para processamento específico
 * - 'log' é mapeado para 'progress'
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
    search: 'search', // Agora mantém o tipo original
    reflect: 'reflect', // Agora mantém o tipo original
    visit: 'visit', // Agora mantém o tipo original
    log: 'progress',
    connected: 'connected'
  };
  
  return typeMapping[validatedType];
}

/**
 * Transforma o campo 'data' de uma StreamMessage do backend para o formato do frontend
 * Preserva os dados originais para tipos específicos
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
  
  // Para 'search', preserva os dados originais
  if (type === 'search') {
    if (typeof data === 'string') {
      return { 
        action: 'search',
        searchQuery: data
      };
    }
    // Se for um objeto, preservar sua estrutura
    return { 
      action: 'search',
      ...data, // Manter todos os campos originais
      searchQuery: data.query || data.searchQuery || JSON.stringify(data)
    };
  }
  
  // Para 'reflect', preserva os dados originais
  if (type === 'reflect') {
    if (typeof data === 'string') {
      return { 
        action: 'reflect',
        think: data
      };
    }
    // Se for um objeto, preservar sua estrutura
    return { 
      action: 'reflect',
      ...data, // Manter todos os campos originais
      think: data.thought || data.think || JSON.stringify(data)
    };
  }
  
  // Para 'visit', preserva os dados originais
  if (type === 'visit') {
    if (typeof data === 'string') {
      return { 
        action: 'visit',
        url: data
      };
    }
    // Se for um objeto, preservar sua estrutura
    return { 
      action: 'visit',
      ...data, // Manter todos os campos originais
      url: data.url || JSON.stringify(data)
    };
  }
  
  // Para outros tipos, preserva os dados o máximo possível
  if (typeof data === 'string') {
    return { 
      action: type,
      think: data
    };
  }
  
  return { 
    action: type,
    ...data, // Incluir todos os campos originais
    think: data.thought || data.think || JSON.stringify(data)
  };
}

/**
 * Transforma um objeto StreamMessage do backend para o formato do frontend
 */
export function transformStreamMessage(backendMessage: any): any {
  if (!backendMessage) return null;
  
  try {
    // Preservar o campo 'action' original se existir
    const originalAction = backendMessage.action;
    
    // Transforma o tipo da mensagem
    const type = transformStreamMessageType(
      backendMessage.type as BackendStreamMessageType
    );
    
    // Transforma os dados com base no tipo
    const data = transformStreamMessageData(
      backendMessage.type as BackendStreamMessageType, 
      backendMessage.data || backendMessage
    );
    
    // Se temos um 'action' original, garantir que ele seja preservado nos dados
    if (originalAction && data) {
      data.action = originalAction;
    }
    
    // Transforma os trackers se existirem
    const trackers = backendMessage.trackers ? {
      tokenTracker: backendMessage.trackers.tokenTracker 
        ? transformTokenTracker(backendMessage.trackers.tokenTracker)
        : undefined,
      actionTracker: backendMessage.trackers.actionTracker || undefined,
      actionState: backendMessage.trackers.actionState || undefined // Preservar o actionState
    } : undefined;
    
    // Retorna a mensagem transformada
    return {
      type,
      data,
      trackers,
      // Incluir quaisquer outros campos relevantes do backend
      outputs: backendMessage.outputs,
      rawMessage: process.env.NODE_ENV === 'development' ? backendMessage : undefined
    };
  } catch (error) {
    console.error('Erro ao transformar StreamMessage:', error);
    
    // Em caso de erro, retorna uma mensagem de erro genérica
    return {
      type: 'error',
      data: {
        error: 'Erro ao processar a mensagem do servidor',
        originalError: String(error)
      }
    };
  }
} 