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
import { SchemaType } from "@google/generative-ai";

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

export type ResponseSchema = {
  type?: SchemaType;
  properties: Record<string, SchemaProperty>;
  required?: string[];
};

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
  question: string,
  answer: string,
  references?: Reference[] | Array<any>;
  type: 'qa' | 'side-info' | 'chat-history' | 'url' | 'coding',
  updated: string,
}

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

export type StepAction = SearchAction | AnswerAction | ReflectAction | VisitAction | CodingAction;

// Tipos de Avaliação
export type EvaluationType = 'definitive' | 'freshness' | 'plurality' | 'attribution';
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
    usage: { tokens: number; };
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
    usage: { tokens: number; };
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
  type?: 'definitive' | 'freshness' | 'plurality' | 'attribution';
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
  type: 'progress' | 'answer' | 'error' | 'search' | 'reflect' | 'visit' | 'log' | 'connected';
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
  outputs: any[];
  tokenTracker: TokenTracker;
  actionTracker: ActionTracker;
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
  level: 'log' | 'error' | 'warn' | 'info';
}

// Tipos da API OpenAI
export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<CoreUserMessage | CoreAssistantMessage>;
  stream?: boolean;
  reasoning_effort?: 'low' | 'medium' | 'high' | null;
  max_completion_tokens?: number | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    logprobs: null;
    finish_reason: 'stop';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  system_fingerprint: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    logprobs: null;
    finish_reason: null | 'stop';
  }>;
  usage?: any;
}

// Tipos de Sessão e Etapas
export interface QueryStep {
  id: number;
  type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'search' | 'log' | 'visit' | 'answer';
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
    status: 'waiting' | 'processing' | 'completed';
    completed: boolean;
    active: boolean;
  };
}

export interface QuerySession {
  id: string;
  question: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'error';
  summary?: string;
  steps: QueryStep[];
  metadata: {
    model: string;
    totalTokens?: number;
    elapsedTime?: string;
    urlCount?: number;
  };
} 