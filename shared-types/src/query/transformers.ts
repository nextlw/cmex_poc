import { BackendQueryStatus, FrontendQueryStatus, BackendQuery, FrontendQuery } from './types';
import { backendQueryStatusSchema, frontendQueryStatusSchema, backendQuerySchema } from './schemas';
import { handleValidationError, logTransformationError } from '../utils/errorHandling';

/**
 * Transforma um status de consulta do backend para o frontend
 * @param backendStatus Status do backend
 * @returns Status correspondente no frontend
 */
export function transformQueryStatus(
  backendStatus: BackendQueryStatus | string
): FrontendQueryStatus {
  try {
    // Validar o status de entrada
    const validatedStatus = backendQueryStatusSchema.parse(backendStatus);
    
    // Mapear 'processing' para 'in_progress'
    if (validatedStatus === 'processing') {
      return 'in_progress';
    }
    
    // Verificar se é um status válido para o frontend
    return frontendQueryStatusSchema.parse(validatedStatus) as FrontendQueryStatus;
  } catch (error) {
    // Registrar e tratar o erro
    logTransformationError('QueryStatus', backendStatus, error);
    return handleValidationError<FrontendQueryStatus>(
      error, 
      'in_progress', 
      `Status inválido: ${backendStatus}. Usando 'in_progress' como fallback.`
    );
  }
}

/**
 * Transforma um objeto de consulta do backend para o frontend
 * @param backendQuery Objeto de consulta do backend
 * @returns Objeto de consulta formatado para o frontend
 */
export function transformQueryObject(backendQuery: BackendQuery): FrontendQuery {
  try {
    // Validar o objeto de entrada
    const validatedQuery = backendQuerySchema.parse(backendQuery);
    
    // Transformar o status
    const status = transformQueryStatus(validatedQuery.status);
    
    // Retornar o objeto transformado
    return {
      ...validatedQuery,
      status,
    };
  } catch (error) {
    // Registrar e tratar o erro
    logTransformationError('QueryObject', backendQuery, error);
    
    // Criar um objeto com valores seguros
    return {
      id: backendQuery.id || 'unknown',
      title: backendQuery.title || 'Consulta sem título',
      timestamp: backendQuery.timestamp || new Date().toISOString(),
      status: 'in_progress',
      question: backendQuery.question || 'Consulta sem pergunta',
      summary: backendQuery.summary,
    };
  }
}

/**
 * Transforma uma lista de consultas do backend para o frontend
 * @param backendQueries Lista de consultas do backend
 * @returns Lista de consultas formatadas para o frontend
 */
export function transformQueryList(backendQueries: BackendQuery[]): FrontendQuery[] {
  return backendQueries.map(query => transformQueryObject(query));
} 