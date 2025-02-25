import { z } from 'zod';
import { BackendQueryStatus, FrontendQueryStatus } from './types';

/**
 * Schema para validação de status no backend
 */
export const backendQueryStatusSchema = z.enum(['processing', 'in_progress', 'completed', 'error'], {
  errorMap: (issue, ctx) => {
    return { 
      message: `Status de consulta inválido: ${ctx.data}. Valores permitidos: 'processing', 'in_progress', 'completed', 'error'`
    };
  }
});

/**
 * Schema para validação de status no frontend
 */
export const frontendQueryStatusSchema = z.enum(['in_progress', 'completed', 'error'], {
  errorMap: (issue, ctx) => {
    return { 
      message: `Status de consulta inválido: ${ctx.data}. Valores permitidos: 'in_progress', 'completed', 'error'`
    };
  }
});

/**
 * Schema para validação de consulta do backend
 */
export const backendQuerySchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1, "O título não pode estar vazio"),
  timestamp: z.string().datetime("Formato de data inválido"),
  status: backendQueryStatusSchema,
  question: z.string().min(1, "A pergunta não pode estar vazia"),
  summary: z.string().optional()
});

/**
 * Schema para validação de consulta do frontend
 */
export const frontendQuerySchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1, "O título não pode estar vazio"),
  timestamp: z.string().datetime("Formato de data inválido"),
  status: frontendQueryStatusSchema,
  question: z.string().min(1, "A pergunta não pode estar vazia"),
  summary: z.string().optional()
}); 