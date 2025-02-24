import { z } from 'zod';

// Tipos básicos
export interface Reference {
  exactQuote: string;
  url: string;
}

// Tipos de requisição
export interface Query {
  q: string;
  budget?: number;
  maxBadAttempt?: number;
  model?: "qwen2.5-7b-instruct-1m" | "gemini-2.0-flash";
}

// Tipos de resposta
export interface LLMOutput {
  timestamp: string;
  type: "progress" | "final_answer" | "error";
  data: Record<string, any>;
}

export interface TaskResult {
  action: string;
  answer?: string;
  references?: Reference[];
  think: string;
}

export interface LogsResponse {
  serverLogs: Array<{
    timestamp: string;
    message: string;
    level: "log" | "error" | "warn" | "info";
  }>;
  promptContents?: Array<{
    filename: string;
    content: string;
  }>;
}

// Schemas Zod para validação
export const QueryResponseSchema = z.object({
  requestId: z.string(),
  error: z.string().optional()
});

export const SSEMessageSchema = z.object({
  type: z.enum(['progress', 'answer', 'error', 'connected', 'status']),
  data: z.object({
    think: z.string().optional(),
    answer: z.string().optional(),
    references: z.array(z.object({
      exactQuote: z.string(),
      url: z.string()
    })).optional(),
    questionsToAnswer: z.array(z.string()).optional(),
    status: z.enum(['error', 'completed', 'in_progress']).optional(),
    reasoning: z.string().optional(),
    urls: z.array(z.string()).optional()
  }).optional(),
  trackers: z.object({
    tokenTracker: z.object({
      usage: z.array(z.object({
        tool: z.string(),
        tokens: z.number()
      })),
      totalTokens: z.number()
    }),
    actionState: z.object({
      think: z.string(),
      action: z.string(),
      searchQuery: z.string().optional(),
      questionsToAnswer: z.array(z.string()).optional(),
      accumulatedReasoning: z.string().optional()
    })
  }).optional()
});
