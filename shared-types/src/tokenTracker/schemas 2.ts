import { z } from 'zod';
import { TokenUsage } from './types';

/**
 * Schema para validação de uso de tokens
 */
export const tokenUsageSchema = z.object({
  tool: z.string().default('unknown'),
  tokens: z.number().nonnegative().default(0)
}, {
  invalid_type_error: "Registro de uso de tokens inválido",
  required_error: "Registro de uso de tokens é obrigatório"
});

/**
 * Schema para validação do rastreador de tokens do backend
 */
export const backendTokenTrackerSchema = z.object({
  usages: z.array(tokenUsageSchema).default([]),
  budget: z.number().positive().optional(),
  getTotalUsage: z.function().optional()
}, {
  invalid_type_error: "Rastreador de tokens do backend inválido"
});

/**
 * Schema para validação do rastreador de tokens do frontend
 */
export const frontendTokenTrackerSchema = z.object({
  usage: z.array(tokenUsageSchema).default([]),
  totalTokens: z.number().nonnegative().default(0)
}, {
  invalid_type_error: "Rastreador de tokens do frontend inválido",
  required_error: "Rastreador de tokens do frontend é obrigatório"
}); 