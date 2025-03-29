/**
 * Status de uma consulta no backend
 */
export type BackendQueryStatus =
  | "processing" // Em processamento
  | "in_progress" // Em progresso
  | "completed" // Finalizado
  | "error"; // Erro

/**
 * Status de uma consulta no frontend
 * Nota: 'processing' e 'in_progress' do backend são unificados como 'in_progress'
 */
export type FrontendQueryStatus =
  | "in_progress" // Em progresso
  | "completed" // Finalizado
  | "error"; // Erro

/**
 * Objeto de consulta do backend
 */
export interface BackendQuery {
  id: string | number;
  title: string;
  timestamp: string;
  status: BackendQueryStatus;
  question: string;
  summary?: string;
}

/**
 * Objeto de consulta do frontend
 */
export interface FrontendQuery {
  id: string | number;
  title: string;
  timestamp: string;
  status: FrontendQueryStatus;
  question: string;
  summary?: string;
}
