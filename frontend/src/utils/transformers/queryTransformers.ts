/**
 * Transformadores para o tipo Query e seus estados
 */
import { z } from 'zod';

// Definição dos tipos de status
export type BackendQueryStatus = 'in_progress' | 'processing' | 'completed' | 'error';
export type FrontendQueryStatus = 'in_progress' | 'completed' | 'error';

// Schema Zod para validação de status do backend
export const backendQueryStatusSchema = z.enum(['in_progress', 'processing', 'completed', 'error']);

// Schema Zod para validação de status do frontend
export const frontendQueryStatusSchema = z.enum(['in_progress', 'completed', 'error']);

/**
 * Transforma um status de consulta do backend para o formato do frontend
 * 
 * - 'processing' é convertido para 'in_progress'
 * - outros valores são mantidos se compatíveis com o frontend
 * - valores inválidos retornam 'in_progress' como fallback
 */
export function transformQueryStatus(
  backendStatus: BackendQueryStatus | string
): FrontendQueryStatus {
  let validatedStatus: BackendQueryStatus;
  
  // Tenta validar o status, retornando fallback se inválido
  try {
    validatedStatus = backendQueryStatusSchema.parse(backendStatus);
  } catch (error) {
    console.warn(`Status inválido recebido: ${backendStatus}. Usando 'in_progress' como fallback.`);
    return 'in_progress';
  }
  
  // Mapeia 'processing' para 'in_progress'
  if (validatedStatus === 'processing') {
    return 'in_progress';
  }
  
  // Verifica se é um status válido para o frontend
  try {
    return frontendQueryStatusSchema.parse(validatedStatus) as FrontendQueryStatus;
  } catch {
    // Fallback para 'in_progress' caso seja um valor inesperado
    console.warn(`Status inesperado recebido do backend: ${validatedStatus}`);
    return 'in_progress';
  }
}

/**
 * Transforma um objeto Query do backend para o formato do frontend
 */
export function transformQueryObject(backendQuery: any): any {
  // Valida e transforma o status
  const status = backendQuery.status 
    ? transformQueryStatus(backendQuery.status as BackendQueryStatus) 
    : 'in_progress';
  
  // Retorna o objeto transformado
  return {
    ...backendQuery,
    status,
  };
}

/**
 * Transforma uma lista de consultas do backend para o formato do frontend
 */
export function transformQueryList(backendQueries: any[]): any[] {
  return backendQueries.map(transformQueryObject);
} 