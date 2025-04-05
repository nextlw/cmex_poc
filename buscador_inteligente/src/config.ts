import dotenv from "dotenv";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI, OpenAIProviderSettings } from "@ai-sdk/openai";
import configJson from "../config.json";

/**
 * Indica se deve usar o modelo local.
 */
export const USE_LOCAL_MODEL = false;
console.log("Modo de modelo:", USE_LOCAL_MODEL ? "Local" : "Remoto");

/**
 * Interface de configuração do modelo.
 */
interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Interface de configuração das ferramentas.
 */
interface ToolConfig {
  temperature?: number;
  maxTokens?: number;
}

interface ToolConfigs {
  dedup: ModelConfig;
  evaluator: ModelConfig;
  errorAnalyzer: ModelConfig;
  queryRewriter: ModelConfig;
  agent: ModelConfig;
  agentBeastMode: ModelConfig;
  fallback?: ModelConfig;
}

/**
 * Interface de configuração dos modelos.
 */
interface ModelsConfig {
  default: ModelConfig; // Configuração padrão do modelo
  tools: Record<string, ToolConfig>; // Configurações específicas para cada ferramenta
}

/**
 * Configura o ambiente.
 */
dotenv.config();

// Interfaces para o config.json
interface EnvConfig {
  https_proxy: string;
  OPENAI_BASE_URL: string;
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  JINA_API_KEY: string;
  BRAVE_API_KEY: string;
  DEFAULT_MODEL_NAME: string;
}

interface DefaultsConfig {
  search_provider: string;
  llm_provider: string;
  step_sleep: number;
}

interface ProviderConfig {
  createClient: string;
  clientConfig?: Record<string, any>;
}

interface ConfigJson {
  env: EnvConfig;
  defaults: DefaultsConfig;
  providers: Record<string, ProviderConfig>;
  models: Record<string, ModelsConfig>;
}

// Carrega o config.json com tipagem
const config: ConfigJson = configJson;

// Configuração do ambiente
const env: EnvConfig = { ...config.env };
(Object.keys(env) as (keyof EnvConfig)[]).forEach((key) => {
  if (process.env[key]) {
    env[key] = process.env[key] || env[key];
  }
});

// Configuração do proxy
if (env.https_proxy) {
  try {
    const proxyUrl = new URL(env.https_proxy).toString();
    const dispatcher = new ProxyAgent({ uri: proxyUrl });
    setGlobalDispatcher(dispatcher);
  } catch (error) {
    console.error("Failed to set proxy:", error);
  }
}

// Exporta as variáveis de ambiente para ser usada pelo agent.ts
export const ENV = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

// Para encontrar facilmente a API KEY do Gemini no arquivo config.json
try {
  // Se tiver config.json carregado, tenta extrair
  if (config?.env?.GEMINI_API_KEY) {
    ENV.GEMINI_API_KEY = config.env.GEMINI_API_KEY;
    console.log("API KEY do Gemini encontrada em config.json");
  }
} catch (error) {
  console.warn("Erro ao acessar API KEY do Gemini em config.json:", error);
}

/**
 * Fornecedor de busca.
 */
export const SEARCH_PROVIDER: "brave" | "jina" | "duck" = "jina";

/**
 * Endpoint do modelo local.
 */
const rawEndpoint = process.env.LOCAL_MODEL_ENDPOINT || "http://localhost:1234";
console.log("Endpoint local bruto:", rawEndpoint);

// Normaliza o endpoint removendo barras duplicadas e garantindo formato correto
export const LOCAL_MODEL_ENDPOINT = rawEndpoint.replace(/([^:]\/)\/+/g, "$1");
console.log("Endpoint local normalizado:", LOCAL_MODEL_ENDPOINT);

// Valida se o endpoint está em um formato válido
try {
  new URL(LOCAL_MODEL_ENDPOINT);
  console.log("Endpoint local validado com sucesso");
} catch (error) {
  console.error("Erro: endpoint local inválido:", error);
  throw new Error(`Endpoint local inválido: ${LOCAL_MODEL_ENDPOINT}`);
}

/**
 * Configurações dos modelos.
 */
const DEFAULT_MODEL = "qwen2.5-7b-instruct-1m"; // Forçando uso do modelo local

/**
 * Configuração padrão do modelo.
 */
const defaultConfig: ModelConfig = {
  model: DEFAULT_MODEL,
  temperature: 0,
  maxTokens: 4096,
};

/**
 * Configurações dos modelos das ferramentas.
 */
export const modelConfigs: ToolConfigs = {
  dedup: {
    ...defaultConfig,
    temperature: 0.2,
  },
  evaluator: {
    ...defaultConfig,
  },
  errorAnalyzer: {
    ...defaultConfig,
  },
  queryRewriter: {
    ...defaultConfig,
    temperature: 0.3,
  },
  agent: {
    ...defaultConfig,
    temperature: 0.5,
  },
  agentBeastMode: {
    ...defaultConfig,
    temperature: 0.5,
  },
  fallback: {
    model: "qwen2.5-7b-instruct-1m",
    temperature: 0.7,
    maxTokens: 2048,
  },
};

/**
 * Tempo de espera entre passos.
 */
export const STEP_SLEEP = configJson.defaults.step_sleep;

// Tipos
export type LLMProvider = "openai" | "gemini" | "vertex";
export type ToolName = keyof typeof configJson.models.gemini.tools;

// Determina o provedor LLM
export const LLM_PROVIDER: LLMProvider = (() => {
  const provider = process.env.LLM_PROVIDER || config.defaults.llm_provider;
  if (!isValidProvider(provider)) {
    throw new Error(`Invalid LLM provider: ${provider}`);
  }
  return provider;
})();

function isValidProvider(provider: string): provider is LLMProvider {
  return (
    provider === "openai" || provider === "gemini" || provider === "vertex"
  );
}

// Obtém a configuração de uma ferramenta
export function getToolConfig(toolName: ToolName): ModelConfig {
  const providerConfig =
    config.models[LLM_PROVIDER === "vertex" ? "gemini" : LLM_PROVIDER];
  const defaultConfig = providerConfig.default;
  const toolOverrides = providerConfig.tools[toolName];

  return {
    model: process.env.DEFAULT_MODEL_NAME || defaultConfig.model,
    temperature: toolOverrides?.temperature ?? defaultConfig.temperature,
    maxTokens: toolOverrides?.maxTokens ?? defaultConfig.maxTokens,
  };
}

export function getMaxTokens(toolName: ToolName): number {
  return getToolConfig(toolName).maxTokens;
}

// Obtém a instância do modelo
export function getModel(toolName: ToolName) {
  const configTool = getToolConfig(toolName);
  const providerConfig = config.providers[LLM_PROVIDER];

  if (LLM_PROVIDER === "openai") {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not found");
    }

    const opt: OpenAIProviderSettings = {
      apiKey: env.OPENAI_API_KEY,
      compatibility: providerConfig?.clientConfig?.compatibility,
    };

    if (env.OPENAI_BASE_URL) {
      opt.baseURL = env.OPENAI_BASE_URL;
    }

    return createOpenAI(opt)(configTool.model);
  }

  if (LLM_PROVIDER === "vertex") {
    const createVertex = require("@ai-sdk/google-vertex").createVertex;
    if (toolName === "searchGrounding") {
      return createVertex({
        project: process.env.GCLOUD_PROJECT,
        ...providerConfig?.clientConfig,
      })(configTool.model, { useSearchGrounding: true });
    }
    return createVertex({
      project: process.env.GCLOUD_PROJECT,
      ...providerConfig?.clientConfig,
    })(configTool.model);
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found");
  }

  if (toolName === "searchGrounding") {
    return createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })(
      configTool.model,
      { useSearchGrounding: true }
    );
  }
  return createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })(
    configTool.model
  );
}

// Validação das variáveis de ambiente
if (LLM_PROVIDER === "gemini" && !env.GEMINI_API_KEY)
  throw new Error("GEMINI_API_KEY not found");
if (LLM_PROVIDER === "openai" && !env.OPENAI_API_KEY)
  throw new Error("OPENAI_API_KEY not found");
if (!env.JINA_API_KEY) throw new Error("JINA_API_KEY not found");

export const JINA_API_KEY = env.JINA_API_KEY;

export const BRAVE_API_KEY = process.env.BRAVE_API_KEY || "";

// Log das configurações
const configSummary = {
  provider: {
    name: LLM_PROVIDER,
    model:
      LLM_PROVIDER === "openai"
        ? config.models.openai.default.model
        : config.models.gemini.default.model,
    ...(LLM_PROVIDER === "openai" && { baseUrl: env.OPENAI_BASE_URL }),
  },
  search: {
    provider: SEARCH_PROVIDER,
  },
  tools: Object.fromEntries(
    Object.keys(
      config.models[LLM_PROVIDER === "vertex" ? "gemini" : LLM_PROVIDER].tools
    ).map((name) => [name, getToolConfig(name as ToolName)])
  ),
  defaults: {
    stepSleep: STEP_SLEEP,
  },
};

// Removendo o log detalhado da configuração
// console.log('Configuration Summary:', JSON.stringify(configSummary, null, 2));
