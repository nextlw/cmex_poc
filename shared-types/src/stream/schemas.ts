import { z } from 'zod';
import { BackendStreamMessageType, FrontendStreamMessageType } from './types';
import { frontendTokenTrackerSchema } from '../tokenTracker/schemas';

/**
 * Schema para validação de tipos de mensagem do backend
 */
export const backendStreamMessageTypeSchema = z.enum(
  ['progress', 'answer', 'error', 'search', 'reflect', 'visit', 'log', 'connected'], 
  {
    errorMap: (issue, ctx) => {
      return { 
        message: `Tipo de mensagem de streaming inválido: ${ctx.data}. Valores permitidos: 'progress', 'answer', 'error', 'search', 'reflect', 'visit', 'log', 'connected'`
      };
    }
  }
);

/**
 * Schema para validação de tipos de mensagem do frontend
 */
export const frontendStreamMessageTypeSchema = z.enum(
  ['progress', 'answer', 'error', 'connected'],
  {
    errorMap: (issue, ctx) => {
      return { 
        message: `Tipo de mensagem de streaming inválido: ${ctx.data}. Valores permitidos: 'progress', 'answer', 'error', 'connected'`
      };
    }
  }
);

/**
 * Schema para dados de mensagem do frontend
 */
export const frontendStreamMessageDataSchema = z.object({
  action: z.string().optional(),
  error: z.string().optional(),
  answer: z.string().optional(),
  searchQuery: z.string().optional(),
  think: z.string().optional(),
}).refine(data => 
  data.action !== undefined || 
  data.error !== undefined || 
  data.answer !== undefined || 
  data.searchQuery !== undefined || 
  data.think !== undefined, 
  {
    message: "Pelo menos um dos campos (action, error, answer, searchQuery, think) deve estar presente"
  }
);

/**
 * Schema para trackers de mensagens do frontend
 */
export const frontendStreamMessageTrackersSchema = z.object({
  tokenTracker: frontendTokenTrackerSchema.optional(),
  actionTracker: z.any().optional()
}).optional();

/**
 * Schema para mensagem completa do frontend
 */
export const frontendStreamMessageSchema = z.object({
  type: frontendStreamMessageTypeSchema,
  data: frontendStreamMessageDataSchema,
  trackers: frontendStreamMessageTrackersSchema
}); 