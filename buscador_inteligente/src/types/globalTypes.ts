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
  | "attribution";
export type EvaluationCriteria = {
  types: EvaluationType[];
  languageStyle: string;
  maxAgeDays?: number;
  think?: string;
  pass?: boolean;
  tokens?: number;
};

// Interface de Uso de Tokens
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
  type?: "definitive" | "freshness" | "plurality" | "attribution";
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
  // Status de validação dos componentes da UI
  validation_status?: {
    infoBasicas: { validated: boolean; loading: boolean };
    atributos: { validated: boolean; loading: boolean };
    tributacao: { validated: boolean; loading: boolean };
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
