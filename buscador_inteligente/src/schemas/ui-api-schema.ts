import { z } from "zod";

// Esquema para ContentPart (Text)
const TextContentPartSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

// Esquema para ContentPart (Image URL)
const ImageUrlSchema = z.object({
  url: z.string().url({ message: "URL da imagem inválida" }),
  detail: z.enum(["low", "high", "auto"]).optional(),
});

const ImageContentPartSchema = z.object({
  type: z.literal("image_url"),
  image_url: ImageUrlSchema,
});

// Esquema para ContentPart (União de Text e Image)
const ContentPartSchema = z.union([
  TextContentPartSchema,
  ImageContentPartSchema,
]);

// Esquema para ChatMessage
const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([
    z.string(),
    z
      .array(ContentPartSchema)
      .min(1, { message: "Array de conteúdo não pode ser vazio" }),
  ]),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
  tool_calls: z.array(z.any()).optional(), // Pode ser refinado se a estrutura de tool_calls for conhecida
});

// Esquema principal para ChatCompletionRequest
export const ChatCompletionRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, {
      message: "O array de mensagens é obrigatório e não deve estar vazio",
    })
    .refine((messages) => messages[messages.length - 1].role === "user", {
      message: "A última mensagem deve ser do usuário",
      path: ["messages", -1, "role"], // Aponta para o role da última mensagem
    }),
  model: z.string().optional(),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
  reasoning_effort: z.enum(["low", "medium", "high"]).optional(),
  budget_tokens: z.number().int().positive().optional(),
  max_attempts: z.number().int().positive().optional(),
  max_returned_urls: z.number().int().positive().optional(),
  no_direct_answer: z.boolean().optional(),
  boost_hostnames: z.array(z.string()).optional(),
  bad_hostnames: z.array(z.string()).optional(),
  only_hostnames: z.array(z.string()).optional(),
  response_format: z
    .object({
      type: z.enum(["text", "json_object"]).optional(),
      // json_schema pode ser validado mais a fundo se necessário
      json_schema: z.any().optional(),
    })
    .optional(),
});

// Exportar o tipo inferido para uso no código, se desejado
export type ChatCompletionRequestInput = z.infer<
  typeof ChatCompletionRequestSchema
>;
