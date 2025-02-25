/**
 * Tipo de mensagem de streaming no backend
 */
export type BackendStreamMessageType = 
  | 'progress'   // Progresso geral
  | 'answer'     // Resposta final
  | 'error'      // Erro
  | 'search'     // Busca em andamento
  | 'reflect'    // Reflexão/pensamento
  | 'visit'      // Visitando recurso
  | 'log'        // Log de sistema
  | 'connected'  // Conexão estabelecida
  | 'thinking';  // Pensamento (mantido para compatibilidade com testes)

/**
 * Tipo de mensagem de streaming no frontend
 * Nota: Vários tipos do backend são unificados como 'progress'
 */
export type FrontendStreamMessageType = 
  | 'progress'   // Progresso (unifica vários tipos do backend)
  | 'answer'     // Resposta final
  | 'error'      // Erro
  | 'connected'  // Conexão estabelecida
  | 'thinking';  // Pensamento (mantido para compatibilidade com testes)

/**
 * Estrutura base para mensagens de streaming
 */
export interface StreamMessageBase {
  type: string;
  data?: any;
  // Campos adicionais para compatibilidade com testes
  id?: string;
  content?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Mensagem de streaming do backend
 */
export interface BackendStreamMessage extends StreamMessageBase {
  type: BackendStreamMessageType;
  data: any;
  trackers?: {
    tokenTracker?: any;
    actionTracker?: any;
  };
}

/**
 * Mensagem de streaming do frontend
 */
export interface FrontendStreamMessage extends StreamMessageBase {
  type: FrontendStreamMessageType;
  data: {
    action?: string;
    error?: string;
    answer?: string;
    searchQuery?: string;
    think?: string;
  };
  trackers?: {
    tokenTracker?: {
      usage: Array<{ tool: string; tokens: number }>;
      totalTokens: number;
    };
    actionTracker?: any;
  };
} 