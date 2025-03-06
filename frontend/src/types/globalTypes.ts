/**
 * ARQUIVO CENTRALIZADO DE TIPOS DO FRONTEND
 *
 * Este arquivo contém todos os tipos globais usados no frontend.
 * Anteriormente os tipos estavam espalhados em vários arquivos,
 * mas foram consolidados aqui para facilitar a manutenção.
 *
 * Ao adicionar novos tipos globais, adicione-os a este arquivo.
 * Tipos específicos de componentes devem permanecer em seus
 * próprios arquivos junto aos componentes.
 */

import { z } from "zod";
import { ReactNode, ChangeEvent, KeyboardEvent } from "react";

// Tipos básicos de referência
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
  error: z.string().optional(),
});

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

// Tipos de imposto
export interface ICMSByState {
  [state: string]: string;
}

export interface TipoTributario {
  monofasico: boolean;
  aliquota_zero: boolean;
  isento: boolean;
  suspenso: boolean;
}

export interface ValoresdeImpostos {
  ipi: string;
  icms: Record<string, string>;
  pis: string;
  cofins: string;
}

export interface ClassificacaoTributaria {
  tipo_tributario?: TipoTributario;
  ipi_entrada: string;
  ipi_saida: string;
  pis_entrada: string;
  pis_saida: string;
  cofins_entrada: string;
  cofins_saida: string;
  cst_entrada: string;
  cst_saida: string;
}

export interface ValidationDeepResearch {
  status:
    | "confirmado"
    | "negado"
    | "sugestao"
    | "erro"
    | "timeout"
    | "pendente";
  mensagem: string;
  cor: "verde" | "vermelho" | "amarelo" | "cinza";
  sugestao_original?: any;
}

export interface SugerirNCM {
  ncm: string;
  descricao: string;
  atributos: string[];
  atributos_tipi: string[];
  valores_de_impostos: ValoresdeImpostos;
  classificacao_tributaria: ClassificacaoTributaria;
  validacao_deepresearch?: ValidationDeepResearch;
}

export interface ProdutodaPesquisa {
  pesquisa: string;
}

/**
 * Propriedades do componente de preenchimento automático
 */
export interface PreenchimentoAutomaticoProps {
  onSuggestionSelect?: (sugerir: SugerirNCM) => void;
  placeholder?: string;
}

// Enums
export enum TipoImposto {
  IPI = "IPI",
  PIS = "PIS",
  COFINS = "COFINS",
  ICMS = "ICMS",
}

export enum EstadoVerificacao {
  VERIFIED = "VERIFIED",
  OUTDATED = "OUTDATED",
  PENDING = "PENDING",
}

// Types básicos
export type CodigoEstado = string;
export type TaxasImposto = string;
export type CodigoNCM = string;

// Interface base para atributos
export interface AtributosBase {
  readonly name: string;
  readonly description?: string;
}

// Interfaces principais
export interface RegraImposto {
  readonly condition: (attrs: string[]) => boolean;
  readonly rate: TaxasImposto;
  readonly description?: string;
}

export interface ConjuntoRegrasImposto {
  readonly [ncmPrefix: string]: RegraImposto;
}

export interface RegrasPersonalizadas {
  readonly [key: string]: RegraImposto;
}

export interface InformacoesAliquotaICMS {
  readonly state: CodigoEstado;
  readonly rate: TaxasImposto;
  readonly lastUpdate?: Date;
  readonly isVerified?: boolean;
  readonly source?: string;
}

export interface PropriedadesCartaoImposto {
  readonly label: string;
  value?: TaxasImposto;
  readonly className?: string;
  readonly ncm: CodigoNCM;
  readonly attributes?: readonly string[];
  readonly tipiAttributes?: readonly string[];
  readonly taxType: TipoImposto;
  readonly customRules?: RegrasPersonalizadas;
}

export interface PropriedadesTabelaICMS {
  readonly icmsRates: Readonly<Record<CodigoEstado, TaxasImposto>>;
  readonly maxHeight?: string;
  readonly verificationConfig?: ConfiguracaoVerificacaoICMS;
  readonly ncm?: CodigoNCM;
}

export interface ConfiguracaoVerificacaoICMS {
  readonly enabled: boolean;
  readonly apiUrl?: string;
  readonly updateInterval?: number;
  readonly verificationStrategy?: "real-time" | "cached" | "manual";
}

export interface AtributosProduto extends AtributosBase {
  readonly category: string;
  readonly subCategory?: string;
  readonly isImported: boolean;
}

export interface AtributosTIPI extends AtributosBase {
  readonly code: string;
  readonly chapter: string;
  readonly section: string;
}

export interface PropriedadesCartaoProduto {
  readonly ncm: CodigoNCM;
  readonly description: string;
  readonly attributes: readonly AtributosProduto[];
  readonly tipiAttributes: readonly AtributosTIPI[];
  readonly onClick?: () => void;
}

export interface SugestaoImposto {
  value: string;
  readonly ncm: CodigoNCM;
  readonly description: string;
  readonly attributes: readonly string[];
  readonly tipi_attributes: readonly string[];
  readonly tax_rates: {
    readonly ipi: TaxasImposto;
    readonly icms: Readonly<Record<CodigoEstado, TaxasImposto>>;
    readonly pis: TaxasImposto;
    readonly cofins: TaxasImposto;
  };
  readonly probability?: number;
  readonly source?: string;
}

export interface EstadoPesquisa {
  readonly query: string;
  readonly isLoading: boolean;
  readonly suggestions: readonly SugestaoImposto[];
  readonly error?: string;
}

export interface AcoesPesquisa {
  readonly setQuery: (query: string) => void;
  readonly setSuggestions: (suggestions: SugestaoImposto[]) => void;
  readonly setLoading: (isLoading: boolean) => void;
  readonly setError: (error: string) => void;
}

export interface PropriedadesPesquisa extends EstadoPesquisa, AcoesPesquisa {
  readonly onSearch: (query: string) => Promise<void>;
}

export interface PropriedadesContainerResultados {
  readonly suggestions: readonly SugestaoImposto[];
  readonly isLoading: boolean;
  readonly onSelect?: (suggestion: SugestaoImposto) => void;
}

export interface PropriedadesEstadoVazio {
  readonly message?: string;
  readonly icon?: ReactNode;
}

export interface PropriedadesEstadoCarregamento {
  readonly message?: string;
  readonly type?: "spinner" | "skeleton" | "progressive";
}

export type ResultadoValidacao = {
  readonly isValid: boolean;
  readonly errors?: readonly string[];
};

export type ResultadoCalculoImposto = {
  readonly value: TaxasImposto;
  readonly isZero: boolean;
  readonly appliedRules: readonly string[];
  readonly metadata?: Record<string, unknown>;
};

export interface PropriedadesFormularioPesquisa {
  title?: string;
}

export interface ConjuntoRegrasPersonalizadas {
  defaultRate: string;
  specialRates: {
    [ncmPrefix: string]: {
      rate: string;
      conditions?: {
        attributes?: string[];
        tipiAttributes?: string[];
      };
    };
  };
}

export interface PropriedadesCartaoResultadoPesquisa {
  title: string;
  children: ReactNode;
  className?: string;
}

export interface PropriedadesGradeImpostos {
  taxRates: {
    ipi: string;
    icms: Record<string, string>;
    pis: string;
    cofins: string;
  };
}

export interface PropriedadesCabecalhoPesquisa {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export interface PropriedadesInputFeedback {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface PropriedadesTooltipImposto {
  ncm: string;
  attributes: string[];
  appliedRules: string[];
}

export interface EstadoICMS {
  nome: string;
  icms: string;
}

export interface RegiaoICMS {
  nome: string;
  estados: EstadoICMS[];
}

export interface Sugestao {
  ncm: string;
  descricao: string;
  atributos: string[];
  aliquotas: {
    ipi: string;
    icms: Record<string, string>;
    pis: string;
    cofins: string;
  };
  classificacao_tributaria: ClassificacaoTributaria;
}

export interface SearchState {
  query: string;
  isLoading: boolean;
  error?: string;
}

export interface SearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export interface SearchResultCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export interface LoadingStateProps {
  message?: string;
  type?: "spinner" | "skeleton" | "progressive";
}

export interface ChatProps {
  inputValue: string;
  output: string;
  loading: boolean;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSend: () => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
}

// Tipos para chat e consultas
export interface QueryHistoryItem {
  id: string;
  question: string;
  timestamp: string;
  status: "success" | "error" | "in_progress";
  answer?: string;
  model?: string;
}
