import { z } from "zod";

/**
 * Schemas Zod para validação de tipos de modelos
 */

// Schema para provider de modelo
export const modelProviderSchema = z.enum([
  "openai",
  "anthropic",
  "google",
  "local",
]);

// Schema para mensagem de modelo
export const modelMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "function"]),
  content: z.string(),
  name: z.string().optional(),
});

// Schema para requisição de modelo
export const modelRequestSchema = z.object({
  messages: z.array(modelMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional(),
  jsonMode: z.boolean().optional(),
  stop: z.array(z.string()).optional(),
  tools: z.array(z.any()).optional(),
  toolChoice: z
    .union([z.literal("auto"), z.literal("none"), z.string()])
    .optional(),
});

// Schema para uso de tokens
export const modelTokenUsageSchema = z.object({
  promptTokens: z.number().nonnegative(),
  completionTokens: z.number().nonnegative(),
  totalTokens: z.number().nonnegative(),
  cost: z.number().nonnegative(),
});

// Schema para resposta de modelo
export const modelResponseSchema = z.object({
  content: z.string(),
  usage: modelTokenUsageSchema,
  model: z.string(),
  finishReason: z.string().optional(),
});

// Schema para informações de modelo
export const modelInfoSchema = z.object({
  modelName: z.string(),
  displayName: z.string(),
  description: z.string(),
  provider: modelProviderSchema,
  supportsStreaming: z.boolean(),
  maxContextLength: z.number().positive(),
});

// Schema para status de streaming
export const modelStreamingStatusSchema = z.object({
  isStreaming: z.boolean(),
  progress: z.number().min(0).max(100),
  currentStep: z.string(),
  modelInfo: modelInfoSchema.optional(),
  error: z.string().optional(),
});

// Schema para estatísticas de modelo
export const modelStatisticsSchema = z.object({
  modelName: z.string(),
  provider: modelProviderSchema,
  totalUsage: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  averageResponseTime: z.number().nonnegative(),
  successRate: z.number().min(0).max(100),
});
