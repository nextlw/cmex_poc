/**
 * ARQUIVO CENTRALIZADO DE TIPOS DO BACKEND
 *
 * Este arquivo contém todos os tipos globais usados no backend.
 * Anteriormente os tipos estavam espalhados em vários arquivos,
 * mas foram consolidados aqui para facilitar a manutenção.
 *
 * Ao adicionar novos tipos globais, adicione-os a este arquivo.
 * Tipos específicos de componentes devem permanecer em seus
 * próprios arquivos junto aos componentes.
 */

import { CoreAssistantMessage, CoreUserMessage, LanguageModelUsage } from "ai";
import { TokenTracker } from "../utils/token-tracker";
import { ActionTracker } from "../utils/action-tracker";
import { Schema as GoogleSchema, SchemaType } from "@google/generative-ai";

// Re-exportando os tipos da biblioteca
export { SchemaType };
export type Schema = GoogleSchema;

// Tipos Schema
export type SchemaProperty = {
  type: SchemaType;
  description?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  enum?: string[];
  maxItems?: number;
  minItems?: number;
};

export type SERPQuery = {
  q: string;
  hl?: string;
  gl?: string;
  location?: string;
  tbs?: string;
};

// Definição correta de ResponseSchema para ser compatível com @google/generative-ai
export type ResponseSchema = {
  type: SchemaType.OBJECT;
  properties: Record<string, Schema>;
  required?: string[];
};

// Tipos de Bloco de Conteúdo
export interface ContentBlock {
  type: string;
  content: string;
}

export interface TextBlock extends ContentBlock {
  type: "text";
}

export interface CodeBlock extends ContentBlock {
  type: "code";
  language?: string;
}

export interface HeadingBlock extends ContentBlock {
  type: "heading";
  level: number;
}

export interface ListItem {
  content: string;
  items?: ListItem[];
}

export interface ListOrderedBlock extends ContentBlock {
  type: "list-ordered";
  items: ListItem[];
}

export interface ListUnorderedBlock extends ContentBlock {
  type: "list-unordered";
  items: ListItem[];
}

export interface TableBlock extends ContentBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface QuoteBlock extends ContentBlock {
  type: "quote";
}

export interface AlertBlock extends ContentBlock {
  type: "alert";
  variant: "info" | "warning" | "error" | "success";
}

// Tipos de Referência
export interface Reference {
  exactQuote: string;
  url: string;
  title?: string;
  dateTime?: string;
}

// Tipos de Ação
type BaseAction = {
  action: "search" | "answer" | "reflect" | "visit" | "coding";
  think: string;
  accumulatedReasoning?: string;
};

export type SearchAction = BaseAction & {
  action: "search";
  searchQuery: string;
  searchResults?: SearchResult[] | QueryResult[];
};

export type AnswerAction = BaseAction & {
  action: "answer";
  answer: string;
  references: Reference[];
  isFinal?: boolean;
  reasoning?: string;
};

export type KnowledgeItem = {
  question: string;
  answer: string;
  references?: Reference[] | Array<any>;
  type: "qa" | "side-info" | "chat-history" | "url" | "coding";
  updated: string;
};

export type ReflectAction = BaseAction & {
  action: "reflect";
  questionsToAnswer: string[];
};

export type VisitAction = BaseAction & {
  action: "visit";
  URLTargets: string[];
};

export type CodingAction = BaseAction & {
  action: "coding";
  codingIssue: string;
};

export type StepAction =
  | SearchAction
  | AnswerAction
  | ReflectAction
  | VisitAction
  | CodingAction;

// Tipos de Avaliação
export type EvaluationType =
  | "definitive"
  | "freshness"
  | "plurality"
  | "attribution"
  | "completeness"
  | "strict";
export type EvaluationCriteria = {
  types: EvaluationType[];
  languageStyle: string;
  maxAgeDays?: number;
  think?: string;
  pass?: boolean;
  tokens?: number;
};

// Interfaces de Uso de Tokens
export interface TokenUsage {
  tool: string;
  tokens: number;
  usage?: LanguageModelUsage;
}

// Interfaces de Resposta de Busca e Leitura
export interface SearchResponse {
  code: number;
  status: number;
  data: Array<{
    title: string;
    description: string;
    url: string;
    content: string;
    usage: { tokens: number };
  }> | null;
  name?: string;
  message?: string;
  readableMessage?: string;
}

export interface BraveSearchResponse {
  web: {
    results: Array<{
      title: string;
      description: string;
      url: string;
    }>;
  };
}

export type DedupResponse = {
  think: string;
  unique_queries: string[];
};

export interface ReadResponse {
  code: number;
  status: number;
  data?: {
    title: string;
    description: string;
    url: string;
    content: string;
    links?: [string, string][];
    usage: { tokens: number };
  };
  name?: string;
  message?: string;
  readableMessage?: string;
}

// Interfaces de Avaliação e Análise
export type EvaluationResponse = {
  pass: boolean;
  think: string;
  tokens?: number;
  type?:
    | "definitive"
    | "freshness"
    | "plurality"
    | "attribution"
    | "completeness"
    | "strict";
  freshness_analysis?: {
    likely_outdated: boolean;
    dates_mentioned: string[];
    current_time: string;
    max_age_days?: number;
  };
  plurality_analysis?: {
    expects_multiple: boolean;
    provides_multiple: boolean;
    count_expected?: number;
    count_provided: number;
  };
  attribution_analysis?: {
    sources_provided: boolean;
    sources_verified: boolean;
    quotes_accurate: boolean;
  };
};

export type ErrorAnalysisResponse = {
  recap?: string;
  blame?: string;
  improvement?: string;
  questionsToAnswer?: string[];
};

// Interfaces de Pesquisa
export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export interface SearchSnippet {
  title: string;
  url: string;
  description: string;
  weight?: number;
}

export interface BoostedSearchSnippet extends SearchSnippet {
  freqBoost?: number;
  hostnameBoost?: number;
  pathBoost?: number;
  jinaRerankBoost?: number;
  finalScore?: number;
}

export interface FiscalURL extends BoostedSearchSnippet {
  isFiscal: boolean;
  category?:
    | "legislation"
    | "regulation"
    | "guidance"
    | "jurisprudence"
    | "news"
    | "other";
  trustScore?: number;
  relevanceToQuery?: number;
  lastUpdated?: string;
  fiscalDomain?: boolean;
}

export interface QueryResult {
  query: string;
  results: SearchResult[];
}

export interface StepData {
  step: number;
  question: string;
  action: string;
  reasoning: string;
  searchQuery?: string;
  result?: QueryResult[];
}

export type KeywordsResponse = {
  think: string;
  queries: string[];
};

// Interfaces de Mensagem
export interface StreamMessage {
  trackers: {
    tokenTracker: TokenTracker;
    actionTracker: ActionTracker;
  };
  type:
    | "progress"
    | "answer"
    | "error"
    | "search"
    | "reflect"
    | "visit"
    | "log"
    | "connected";
  data: string | StepAction;
  outputs?: any[];
  step?: number;
  budget?: {
    used: number;
    total: number;
    percentage: string;
  };
}

// Interfaces do Contexto do Rastreador
export interface TrackerContext {
  tokenTracker: TokenTracker;
  actionTracker: ActionTracker;
  outputs?: Array<{ step: number; rawResponseText: string }>;
}

// ============ TIPOS DO ARQUIVO NCM.TS ============

export interface ConsultaProduto {
  consulta: string;
  estadoOrigem: string;
  operacao?: string;
  regimeTributario?: string;
  tributacao?: string;
  modelo: string;
  autocomplete?: boolean;
  useDeepResearch?: boolean;
  descricao?: string;
  caracteristicas?: string[];
}

export interface FastApiNCMResult {
  ncm_code: string;
  ncm?: string;
  description: string;
  descricao?: string;
  taxation: {
    ipi: number;
    icms: number;
    pis: number;
    cofins: number;
    import_tax: number;
  };
  valores_de_impostos?: {
    ipi: string;
    icms: { [key: string]: string };
    pis: string;
    cofins: string;
  };
  attributes: {
    [key: string]: string;
  };
  atributos?: string[];
  atributos_tipi?: string[];
  conclusion: string;
  confidence: number;
  model_used: string;
  processing_time: number;
  observacoes_deep_research?: string[];
  classificacao_tributaria?: {
    tipo_classificacao_tributario?: {
      tipo_tributario_ativo?: string;
      justificativa?: string;
    };
    ipi_entrada?: string;
    ipi_saida?: string;
    pis_entrada?: string;
    pis_saida?: string;
    cofins_entrada?: string;
    cofins_saida?: string;
    cst_entrada?: string;
    cst_saida?: string;
  };
}

// ============ TIPOS DO ARQUIVO SESSION.TS ============

export interface QueryStep {
  id: number;
  type:
    | "query"
    | "step"
    | "response"
    | "error"
    | "connected"
    | "reflect"
    | "search"
    | "log"
    | "visit"
    | "answer";
  content: string;
  timestamp: string;
  data?: {
    think?: string;
    answer?: string;
    references?: Reference[];
    searchQuery?: string;
    questionsToAnswer?: string[];
    reasoning?: string;
    urls?: string[];
  };
  action?: {
    type: string;
    title: string;
    status: "waiting" | "processing" | "completed";
    completed: boolean;
    active: boolean;
  };
}

export interface QuerySession {
  id: string;
  question: string;
  timestamp: string;
  status: "in_progress" | "completed" | "error";
  summary?: string;
  steps: QueryStep[];
  metadata: {
    model: string;
    totalTokens?: number;
    elapsedTime?: string;
    urlCount?: number;
  };
}

// Interfaces de Log do Servidor
export interface ServerLog {
  context: {
    pid: number;
    env: string;
    requestId?: string;
  };
  timestamp: string;
  message: string;
  level: "log" | "error" | "warn" | "info";
}

// --- NOVOS TIPOS ---

// Tipo para partes de conteúdo em mensagens multimodais
export type ContentPart =
  | { type: "text"; text: string }
  | {
      type: "image_url";
      image_url: { url: string; detail?: "low" | "high" | "auto" };
    };

// Tipo para mensagens no request (compatível com string ou array de ContentPart)
export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ContentPart[];
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[]; // Adicione tipos mais específicos se necessário
};

// Tipo para o Request da API Chat Completions
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number; // Renomeado de max_completion_tokens para padrão OpenAI
  // Campos específicos mantidos/adaptados do original ou NexCode
  reasoning_effort?: "low" | "medium" | "high";
  budget_tokens?: number;
  max_attempts?: number;
  max_returned_urls?: number;
  no_direct_answer?: boolean;
  boost_hostnames?: string[];
  bad_hostnames?: string[];
  only_hostnames?: string[];
  response_format?: { type?: "text" | "json_object"; json_schema?: any }; // Adaptado
}

// Tipo para Referência/Citação de URL na Annotation
export interface URLCitation {
  title: string;
  exactQuote: string;
  url: string;
  dateTime?: string;
}

// Tipo para Annotation na resposta
export interface URLAnnotation {
  type: "url_citation";
  url_citation: URLCitation;
}

// Tipo para a mensagem de resposta (completa)
export interface ChatCompletionResponseMessage {
  role: "assistant";
  content: string | null; // Conteúdo pode ser nulo se houver tool_calls
  tool_calls?: any[]; // Adicione tipos mais específicos se necessário
  // Adicionando campos para compatibilidade com UI NexCode
  type?: "text" | "json" | "error";
  annotations?: URLAnnotation[];
}

// Tipo para a escolha na resposta completa
export interface ChatCompletionResponseChoice {
  index: number;
  message: ChatCompletionResponseMessage;
  finish_reason:
    | "stop"
    | "length"
    | "tool_calls"
    | "content_filter"
    | "function_call"
    | "error"; // Adicionado 'error'
  logprobs?: any; // Ou tipo mais específico
}

// Tipo para a Resposta Completa da API
export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionResponseChoice[];
  usage?: TokenUsageData;
  system_fingerprint?: string;
  // Campos específicos mantidos/adaptados do NexCode
  visitedURLs?: string[];
  readURLs?: string[];
  numURLs?: number;
}

// Tipo para o Delta dentro do Chunk de streaming
export interface ChatCompletionChunkDelta {
  role?: "assistant";
  content?: string | null;
  tool_calls?: any[]; // Adicione tipos mais específicos se necessário
  // Adicionando campos para compatibilidade com UI NexCode
  type?: "text" | "think" | "json" | "error";
  url?: string; // Para chunks de visita
  annotations?: URLAnnotation[];
}

// Tipo para a escolha no Chunk de streaming
export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatCompletionChunkDelta;
  finish_reason?:
    | "stop"
    | "length"
    | "tool_calls"
    | "content_filter"
    | "function_call"
    | "error"
    | "thinking_end"
    | null; // Adicionado 'thinking_end' e 'error'
  logprobs?: any; // Ou tipo mais específico
}

// Tipo para o Chunk de Streaming da API
export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
  usage?: TokenUsageData;
  system_fingerprint?: string;
  // Campos específicos mantidos/adaptados do NexCode (podem aparecer no último chunk)
  visitedURLs?: string[];
  readURLs?: string[];
  numURLs?: number;
}

// Tipo para Uso de Tokens (se LanguageModelUsage da lib 'ai' falhar)
export interface TokenUsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// --- FIM NOVOS TIPOS ---
