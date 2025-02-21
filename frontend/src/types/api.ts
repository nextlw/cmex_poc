import { z } from 'zod';

// Schema para a resposta inicial da API
export const QueryResponseSchema = z.object({
  requestId: z.string(),
  error: z.string().optional()
});

// Schema para os eventos SSE
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
    status: z.enum(['error', 'success']).optional()
  }).optional(),
  trackers: z.object({
    tokenUsage: z.number().optional(),
    actionState: z.object({
      think: z.string().optional(),
      action: z.string().optional(),
      searchQuery: z.string().optional()
    }).optional()
  }).optional()
}); 