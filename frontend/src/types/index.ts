/**
 * TIPOS CENTRALIZADOS DO FRONTEND
 *
 * Este arquivo é o ponto central para todos os tipos usados no frontend.
 * Em vez de importar tipos diretamente de seus respectivos arquivos,
 * importe-os daqui para garantir consistência.
 *
 * Estrutura:
 * 1. Tipos relacionados à API e comunicação com o backend
 * 2. Tipos relacionados ao domínio de negócio (NCM, impostos, etc.)
 * 3. Tipos específicos dos componentes da UI
 */

import { ReactNode, ChangeEvent, KeyboardEvent } from "react";
import { z } from "zod";

// ----------------------------------------------------
// 1. TIPOS RELACIONADOS À API
// ----------------------------------------------------

/**
 * Tipos de referência para citações e fontes
 */
export interface Reference {
  /** Citação exata do texto de referência */
  exactQuote: string;
  /** URL da fonte da referência */
  url: string;
}

/**
 * Parâmetros de consulta para API
 */
export interface Query {
  /** Texto da consulta */
  q: string;
  /** Orçamento máximo (tokens) */
  budget?: number;
  /** Número máximo de tentativas malsucedidas permitidas */
  maxBadAttempt?: number;
  /** Modelo de IA a ser usado */
  model?: "qwen2.5-7b-instruct-1m" | "gemini-2.0-flash";
}

/**
 * Estrutura de saída do modelo de linguagem
 */
export interface LLMOutput {
  /** Timestamp da resposta */
  timestamp: string;
  /** Tipo de saída */
  type: "progress" | "final_answer" | "error";
  /** Dados da resposta */
  data: Record<string, any>;
}

/**
 * Resultado de uma tarefa processada
 */
export interface TaskResult {
  /** Ação realizada */
  action: string;
  /** Resposta textual, se houver */
  answer?: string;
  /** Referências utilizadas, se houver */
  references?: Reference[];
  /** Raciocínio por trás da ação */
  think: string;
}

/**
 * Resposta contendo logs do servidor
 */
export interface LogsResponse {
  /** Logs do servidor */
  serverLogs: Array<{
    /** Timestamp do log */
    timestamp: string;
    /** Mensagem do log */
    message: string;
    /** Nível do log */
    level: "log" | "error" | "warn" | "info";
  }>;
  /** Conteúdos de prompts, se disponíveis */
  promptContents?: Array<{
    /** Nome do arquivo */
    filename: string;
    /** Conteúdo do arquivo */
    content: string;
  }>;
}

/**
 * Schema para a resposta inicial da API
 */
export const QueryResponseSchema = z.object({
  requestId: z.string(),
  error: z.string().optional(),
});

/**
 * Schema para os eventos SSE
 */
export const SSEMessageSchema = z.object({
  type: z.enum(["progress", "answer", "error", "connected", "status"]),
  data: z
    .object({
      think: z.string().optional(),
      answer: z.string().optional(),
      references: z
        .array(
          z.object({
            exactQuote: z.string(),
            url: z.string(),
          })
        )
        .optional(),
      questionsToAnswer: z.array(z.string()).optional(),
      status: z.enum(["error", "completed", "in_progress"]).optional(),
      reasoning: z.string().optional(),
      urls: z.array(z.string()).optional(),
    })
    .optional(),
  trackers: z
    .object({
      tokenTracker: z.object({
        usage: z.array(
          z.object({
            tool: z.string(),
            tokens: z.number(),
          })
        ),
        totalTokens: z.number(),
      }),
      actionState: z.object({
        think: z.string(),
        action: z.string(),
        searchQuery: z.string().optional(),
        questionsToAnswer: z.array(z.string()).optional(),
        accumulatedReasoning: z.string().optional(),
      }),
    })
    .optional(),
});

// ----------------------------------------------------
// 2. TIPOS RELACIONADOS AO DOMÍNIO DE NEGÓCIO
// ----------------------------------------------------

/**
 * Tipos relacionados à validação do DeepResearch
 */
export interface ValidationDeepResearch {
  /** Status da validação: confirmado, negado, sugestão, erro, timeout ou pendente */
  status: string;
  /** Mensagem informativa sobre a validação */
  mensagem: string;
  /** Cor para representação visual do status (verde, vermelho, amarelo, cinza) */
  cor?: string;
  /** ID da requisição de DeepResearch */
  requestId?: string;
  /** Sugestões originais antes da validação */
  sugestao_original?: any[];
}

/**
 * Informações sobre tipos tributários
 */
export interface TipoTributario {
  /** Indica se o produto é monofásico */
  monofasico: boolean;
  /** Indica se o produto tem alíquota zero */
  aliquota_zero: boolean;
  /** Indica se o produto é isento */
  isento: boolean;
  /** Indica se o produto está com tributação suspensa */
  suspenso: boolean;
}

/**
 * Estrutura dos valores de impostos aplicados
 */
export interface ValoresdeImpostos {
  /** Valor do IPI */
  ipi: string;
  /** Valores de ICMS por estado */
  icms: Record<string, string>;
  /** Valor do PIS */
  pis: string;
  /** Valor do COFINS */
  cofins: string;
}

/**
 * Classificação tributária completa de um produto
 */
export interface ClassificacaoTributaria {
  /** Tipo tributário do produto */
  tipo_tributario?: TipoTributario;
  /** IPI de entrada */
  ipi_entrada: string;
  /** IPI de saída */
  ipi_saida: string;
  /** PIS de entrada */
  pis_entrada: string;
  /** PIS de saída */
  pis_saida: string;
  /** COFINS de entrada */
  cofins_entrada: string;
  /** COFINS de saída */
  cofins_saida: string;
  /** CST de entrada */
  cst_entrada: string;
  /** CST de saída */
  cst_saida: string;
}

/**
 * Estrutura completa de um NCM sugerido pelo sistema
 */
export interface SugerirNCM {
  /** Código NCM */
  ncm: string;
  /** Descrição do produto/mercadoria */
  descricao: string;
  /** Atributos gerais do produto */
  atributos: string[] | null;
  /** Classificação tributária do produto */
  classificacao_tributaria: ClassificacaoTributaria | null;
  /** Valores de impostos aplicáveis */
  valores_de_impostos: ValoresdeImpostos | null;
  /** Resultado da validação via DeepResearch, se disponível */
  validacao_deepresearch?: ValidationDeepResearch;
}

/**
 * Estrutura de dados para resultados de pesquisa na página de busca
 */
export interface ProdutodaPesquisa {
  /** Termo de pesquisa usado */
  pesquisa: string;
}

/**
 * Tipos para diferentes impostos do sistema tributário
 */
export enum TipoImposto {
  IPI = "IPI",
  PIS = "PIS",
  COFINS = "COFINS",
  ICMS = "ICMS",
}

/**
 * Estados possíveis para verificação de informações tributárias
 */
export enum EstadoVerificacao {
  VERIFIED = "VERIFIED",
  OUTDATED = "OUTDATED",
  PENDING = "PENDING",
}

/**
 * Tipo para código de estado (UF)
 */
export type CodigoEstado = string;

/**
 * Tipo para taxas de imposto (normalmente uma string representando porcentagem)
 */
export type TaxasImposto = string;

/**
 * Tipo para código NCM
 */
export type CodigoNCM = string;

/**
 * Tipos para autocomplete na busca de NCM
 */
export interface AutocompleteType {
  /** ID único para o item de autocomplete */
  id: string;
  /** Texto a ser exibido */
  text: string;
  /** Tipo do item: código NCM ou nome de produto */
  type: "ncm" | "product";
}

/**
 * Item do histórico de pesquisas
 */
export interface HistoricoItem {
  /** ID único da pesquisa */
  id: string;
  /** Termo pesquisado */
  pesquisa: string;
  /** Modelo utilizado na pesquisa */
  modelo: string;
  /** Data de criação */
  criado_em: string;
  /** Resultados da pesquisa, se disponíveis */
  resultado?: SugerirNCM[];
}

/**
 * Item do histórico tratado para exibição na tabela
 */
export interface HistoricoItemTratado {
  /** ID único da pesquisa */
  id: string;
  /** Modelo utilizado na pesquisa */
  modelo: string;
  /** Data de criação */
  criado_em: string;
  /** Código NCM */
  ncm?: string;
  /** Descrição do NCM */
  descricao?: string;
  /** Atributos gerais do produto */
  atributos?: string[];
  /** Atributos específicos da TIPI */
  atributos_tipi?: string[];
  /** Valores de impostos aplicáveis */
  valores_de_impostos?: ValoresdeImpostos;
}

/**
 * Estado de ICMS para um UF específico
 */
export interface EstadoICMS {
  /** Nome do estado */
  nome: string;
  /** Valor do ICMS */
  icms: string;
}

/**
 * Agrupamento de estados para ICMS por região
 */
export interface RegiaoICMS {
  /** Nome da região */
  nome: string;
  /** Lista de estados na região */
  estados: EstadoICMS[];
}

/**
 * Propriedades para componentes de estado de carregamento
 */
export interface LoadingStateProps {
  /** Mensagem a ser exibida durante o carregamento */
  message?: string;
  /** Tipo de indicador de carregamento */
  type?: "spinner" | "skeleton" | "progressive";
}

// ----------------------------------------------------
// 3. RE-EXPORTAÇÃO DOS TIPOS DE COMPONENTES
// ----------------------------------------------------

// Exporta todos os tipos específicos dos componentes
// Isso permite que os componentes continuem a definir seus próprios tipos
// enquanto os disponibiliza centralmente
export * from "../components/InputAi/types";
export * from "../components/DeepResearchToggle/types";
export * from "../components/DeepResearchSidebar/types";
export * from "../components/DeepResearchStatus/types";
export * from "../components/DropdownMenu/types";
export * from "../components/NCMConsultaForm/types";
export * from "../components/ReasoningBox/types";
