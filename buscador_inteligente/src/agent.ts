import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { readUrl } from "./tools/read";
import fs from "fs/promises";
import { SafeSearchType, search as duckSearch } from "duck-duck-scrape";
import { braveSearch } from "./tools/brave-search";
import { rewriteQuery } from "./tools/query-rewriter";
import { dedupQueries } from "./tools/dedup";
import { evaluateAnswer } from "./tools/evaluator";
import { analyzeSteps } from "./tools/error-analyzer";
import {
  SEARCH_PROVIDER,
  STEP_SLEEP,
  modelConfigs,
  LOCAL_MODEL_ENDPOINT,
  USE_LOCAL_MODEL,
  ENV,
} from "./config";
import { TokenTracker } from "./utils/token-tracker";
import { ActionTracker } from "./utils/action-tracker";
import {
  StepAction,
  SchemaProperty,
  ResponseSchema,
  AnswerAction,
  VisitAction,
  SearchAction,
  ReflectAction,
} from "./types";
import { TrackerContext } from "./types";
import { jinaSearch } from "./tools/jinaSearch";
import { LocalModelClient } from "./tools/local-model-client";
import { spawn } from "child_process";
import { EventEmitter } from "events";

const eventEmitter = new EventEmitter();

// Definição para logs do servidor (ajuste conforme necessário)
interface ServerLog {
  context: { requestId: string };
  timestamp: Date;
  message: string;
}

// Array para armazenar os logs do servidor
const serverLogs: ServerLog[] = [];

// Variável global para o client do modelo
let activeModelClient: GoogleGenerativeAI | LocalModelClient;

// Função para inicializar o cliente do modelo
function initializeModelClient(modelName?: string) {
  console.log("Iniciando inicialização do cliente do modelo...");
  console.log("Modelo solicitado:", modelName);

  try {
    // Verifica se deve usar o cliente da Google para modelos Gemini
    if (modelName && modelName.startsWith("gemini-")) {
      console.log("Detectado modelo Gemini, usando cliente GoogleGenerativeAI");

      // Tenta obter a chave da API do Gemini de várias fontes
      // 1. Variável de ambiente importada de config.ts
      // 2. Variáveis de ambiente do processo
      const geminiApiKey =
        ENV.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY;

      if (!geminiApiKey) {
        console.error("API key para Gemini não encontrada");
        console.log("Tentando usar valor do config.json...");

        // Buscar de config.json via JINA_API_KEY que está disponível
        if (process.env.JINA_API_KEY) {
          console.log("Usando chave alternativa para autenticação com Gemini");

          // Inicializa o cliente da Google com chave alternativa
          const googleClient = new GoogleGenerativeAI(process.env.JINA_API_KEY);
          activeModelClient = googleClient;
          console.log(
            "Cliente do modelo ativo configurado para Google API (chave alternativa)"
          );
        } else {
          throw new Error(
            "Nenhuma API key válida encontrada para modelos Gemini"
          );
        }
      } else {
        // Inicializa o cliente da Google
        console.log("Usando GEMINI_API_KEY para autenticação");
        const googleClient = new GoogleGenerativeAI(geminiApiKey);
        activeModelClient = googleClient;
        console.log("Cliente do modelo ativo configurado para Google API");
      }

      // Configura o modelo especificado
      console.log("Configurando modelo específico:", modelName);
      modelConfigs.agent.model = modelName;
      console.log("Configuração do modelo atualizada");

      return activeModelClient;
    }

    // Para outros modelos, usa o cliente local
    console.log("Usando cliente local para o modelo");
    console.log("Endpoint configurado:", LOCAL_MODEL_ENDPOINT);

    // Configura o modelo local
    console.log("Criando instância do LocalModelClient...");
    const localModel = new LocalModelClient(LOCAL_MODEL_ENDPOINT);

    if (!localModel) {
      console.error("Erro: Falha ao criar instância do LocalModelClient");
      throw new Error("Falha ao criar instância do modelo local");
    }

    console.log("LocalModelClient criado com sucesso");
    activeModelClient = localModel;
    console.log("Cliente do modelo ativo configurado para modo local");

    // Configura o modelo se especificado
    if (modelName) {
      console.log("Configurando modelo específico:", modelName);
      modelConfigs.agent.model = modelName;
      console.log("Configuração do modelo atualizada");
    }

    return activeModelClient;
  } catch (error) {
    console.error("Erro fatal na inicialização do cliente do modelo:", error);
    throw error;
  }
}

// Função para garantir que o cliente está inicializado
export function ensureModelClientInitialized(modelName?: string) {
  // Se não temos um cliente, inicialize-o
  if (!activeModelClient) {
    // Inicializa o cliente do modelo
    initializeModelClient(modelName);
    return;
  }

  // Se temos um cliente e um novo modelo foi solicitado
  if (modelName) {
    const isCurrentClientLocal = activeModelClient instanceof LocalModelClient;
    const isRequestingGeminiModel = modelName.startsWith("gemini-");

    // Se estamos mudando entre tipos de clientes (local/Google), reinicialize o cliente
    if (
      (isCurrentClientLocal && isRequestingGeminiModel) ||
      (!isCurrentClientLocal && !isRequestingGeminiModel)
    ) {
      console.log("Mudando tipo de cliente de modelo, reinicializando...");
      // Reinicializa o cliente com o novo modelo
      initializeModelClient(modelName);
    } else {
      // Apenas atualiza o nome do modelo no cliente existente
      console.log("Atualizando modelo no cliente existente:", modelName);
      modelConfigs.agent.model = modelName;
      console.log("Configuração do modelo atualizada");
    }
  }
}

// Função para aguardar um tempo
async function sleep(ms: number) {
  // Calcula o tempo em segundos
  const seconds = Math.ceil(ms / 1000);
  // Exibe o tempo de espera
  console.log(`Waiting ${seconds}s...`);
  // Retorna uma promise que resolve após o tempo especificado
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSchema(
  allowReflect: boolean,
  allowRead: boolean,
  allowAnswer: boolean,
  allowSearch: boolean
): Schema {
  // Define as ações possíveis
  const actions: string[] = [];

  // Schema para o tipo de ação
  const actionSchema: Schema = {
    type: SchemaType.STRING,
    format: "enum",
    enum: actions, // Será atualizado abaixo
    description: "Must match exactly one action type",
  };

  // Schema para o pensamento
  const thinkSchema: Schema = {
    type: SchemaType.STRING,
    description:
      "Explain why choose this action, what's the thought process behind choosing this action",
  };

  // Define as propriedades do schema principal
  const properties: Record<string, Schema> = {
    action: actionSchema,
    think: thinkSchema,
  };

  // Verifica se a busca é permitida
  if (allowSearch) {
    actions.push("search");
    properties.searchQuery = {
      type: SchemaType.STRING,
      description:
        "Only required when choosing 'search' action, must be a short, keyword-based query that BM25, tf-idf based search engines can understand.",
    };
  }

  // Verifica se a resposta é permitida
  if (allowAnswer) {
    actions.push("answer");
    properties.answer = {
      type: SchemaType.STRING,
      description:
        "Only required when choosing 'answer' action, must be the final answer in natural language",
    };

    properties.references = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          exactQuote: {
            type: SchemaType.STRING,
            description: "Exact relevant quote from the document",
          },
          url: {
            type: SchemaType.STRING,
            description:
              "URL of the document; must be directly from the context",
          },
        },
        required: ["exactQuote", "url"],
      },
      description:
        "Must be an array of references that support the answer, each reference must contain an exact quote and the URL of the document",
    };
  }

  // Verifica se a reflexão é permitida
  if (allowReflect) {
    actions.push("reflect");
    properties.questionsToAnswer = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        description:
          "each question must be a single line, concise and clear. not composite or compound, less than 20 words.",
      },
      description:
        "List of most important questions to fill the knowledge gaps of finding the answer to the original question",
    };
  }

  // Verifica se a leitura é permitida
  if (allowRead) {
    actions.push("visit");
    properties.URLTargets = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description:
        "Must be an array of URLs, choose up the most relevant 30 URLs to visit",
    };
  }

  // Atualiza os valores do enum após coletar todas as ações
  (actionSchema as any).enum = actions;

  // Retorna o schema
  return {
    type: SchemaType.OBJECT,
    properties,
    required: ["action", "think"],
  };
}

/**
 * Gera um prompt detalhado para um analista de pesquisa de IA avançado,
 * que utiliza raciocínio em múltiplas etapas, para responder a uma
 * pergunta com absoluta certeza.
 *
 * @param question - A pergunta principal a ser respondida.
 * @param context - Ações anteriores realizadas que podem ser relevantes para
 *                  o contexto atual.
 * @param allQuestions - Todas as perguntas feitas até o momento, incluindo
 *                       perguntas intermediárias.
 * @param allowReflect - Indica se a ação de reflexão é permitida.
 * @param allowAnswer - Indica se a ação de resposta é permitida.
 * @param allowRead - Indica se a ação de visita a URLs é permitida.
 * @param allowSearch - Indica se a ação de busca em fontes externas é permitida.
 * @param badContext - Contexto de tentativas anteriores que falharam,
 *                     contendo a questão, resposta, avaliação e melhorias
 *                     sugeridas.
 * @param knowledge - Conhecimento acumulado que pode ser útil para responder
 *                    à pergunta principal.
 * @param allURLs - URLs disponíveis que podem ser visitadas para obter
 *                  conhecimento externo.
 * @param beastMode - Indica se o modo agressivo está ativo, permitindo respostas
 *                    parciais ou suposições educadas.
 * @returns Uma string contendo o prompt formatado, incluindo as seções de
 *          contexto, conhecimento, tentativas anteriores e ações possíveis,
 *          tudo em formato JSON e em português.
 */

function getPrompt(
  question: string,
  context?: string[],
  allQuestions?: string[],
  allowReflect: boolean = true,
  allowAnswer: boolean = true,
  allowRead: boolean = true,
  allowSearch: boolean = true,
  badContext?: {
    question: string;
    answer: string;
    evaluation: string;
    recap: string;
    blame: string;
    improvement: string;
  }[],
  knowledge?: { question: string; answer: string; references: any[] }[],
  allURLs?: Record<string, string>,
  beastMode?: boolean
): string {
  const sections: string[] = [];

  // Determinar se a pergunta é relacionada a assuntos fiscais
  const fiscalKeywords = [
    "tributário",
    "fiscal",
    "imposto",
    "tributo",
    "ncm",
    "sped",
    "nota fiscal",
    "icms",
    "ipi",
    "pis",
    "cofins",
    "itbi",
    "iptu",
    "itr",
    "itcmd",
    "receita federal",
    "legislação fiscal",
    "código tributário",
    "importação",
    "exportação",
    "siscomex",
    "regulamento aduaneiro",
    "classificação fiscal",
    "alíquota",
    "contribuinte",
  ];

  const isFiscalQuery = fiscalKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword.toLowerCase())
  );

  sections.push(`Current date: ${new Date().toUTCString()}

    Você é um analista de pesquisa de IA avançado especializado em raciocínio de múltiplas etapas. Usando seus dados de treinamento e lições aprendidas anteriormente, responda à seguinte pergunta com absoluta certeza:

    <question>
    ${question}
    </question>
    `);

  // Adiciona contexto específico para consultas fiscais
  if (isFiscalQuery) {
    sections.push(`
    <fiscal-context>
    Você é especialista em legislação fiscal e tributária brasileira. Para consultas relacionadas a impostos, 
    classificação fiscal e regulamentações, siga estas diretrizes:
    
    1. Priorize fontes oficiais do governo como Receita Federal, Ministério da Fazenda, Planalto e portais governamentais
    2. Verifique a data das informações para garantir que estão atualizadas com a legislação vigente
    3. Para classificação fiscal (NCM), busque o código exato e justifique com base nas características do produto
    4. Quando mencionar alíquotas de impostos, especifique a data de validade e jurisdição aplicável
    5. Para interpretações tributárias complexas, referencie decisões do CARF ou tribunais superiores
    6. Seja especialmente cuidadoso ao verificar exceções regionais nas leis estaduais (ICMS) e municipais (ISS)
    7. Identifique claramente quando houver divergências na interpretação da legislação
    </fiscal-context>
    `);
  }

  // Adiciona a seção de contexto se existir
  if (context?.length) {
    sections.push(`
    <context>
    Você realizou as seguintes ações:
    ${context.join("\n")}
    </context>
    `);
  }

  // Adiciona a seção de conhecimento se existir
  if (knowledge?.length) {
    const knowledgeItems = knowledge
      .map(
        (k, i) => `
    <knowledge-${i + 1}>
    <question>
    ${k.question}
    </question>
    <answer>
    ${k.answer}
    </answer>
    ${
      k.references.length > 0
        ? `
    <references>
    ${JSON.stringify(k.references)}
    </references>
    `
        : ""
    }
    </knowledge-${i + 1}>
    `
      )
      .join("\n\n");

    sections.push(`
    <knowledge>
    Você reuniu com sucesso alguns conhecimentos que podem ser úteis para responder à pergunta original. 
    Aqui está o conhecimento que você reuniu até agora:
    ${knowledgeItems}
    </knowledge>
    `);
  }

  // Adiciona a seção de contexto de tentativas anteriores se existir
  if (badContext?.length) {
    const attempts = badContext
      .map(
        (c, i) => `
    <attempt-${i + 1}>
    - Question: ${c.question}
    - Answer: ${c.answer}
    - Reject Reason: ${c.evaluation}
    - Actions Recap: ${c.recap}
    - Actions Blame: ${c.blame}
    </attempt-${i + 1}>
    `
      )
      .join("\n\n");

    const learnedStrategy = badContext.map((c) => c.improvement).join("\n");

    sections.push(`
    <bad-attempts>
    Você tentou as seguintes ações, mas não conseguiu encontrar a resposta para a pergunta:
    ${attempts}
    </bad-attempts>

    <learned-strategy>
    Com base nas tentativas fracassadas, você aprendeu a seguinte estratégia:
    ${learnedStrategy}
    </learned-strategy>
    `);
  }

  // Construi a seção de ações
  const actions: string[] = [];

  if (allURLs && Object.keys(allURLs).length > 0 && allowRead) {
    // Organizar URLs por relevância
    let urlList = "";

    if (isFiscalQuery) {
      // Priorização especial para URLs fiscais
      const priorityDomains = [
        "gov.br",
        "receita.fazenda.gov.br",
        "planalto.gov.br",
        "confaz.fazenda.gov.br",
        "in.gov.br",
        "siscomex.gov.br",
      ];

      // Organizar em grupos de prioridade
      const priorityUrls: string[] = [];
      const otherUrls: string[] = [];

      Object.entries(allURLs).forEach(([url, desc]) => {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        if (priorityDomains.some((pd) => domain.includes(pd))) {
          priorityUrls.push(`  +++ FONTE OFICIAL: "${url}": "${desc}"`);
        } else {
          otherUrls.push(`  + "${url}": "${desc}"`);
        }
      });

      urlList = [...priorityUrls, ...otherUrls].join("\n");
    } else {
      // Organização padrão para URLs não fiscais
      urlList = Object.entries(allURLs)
        .map(([url, desc]) => `  + "${url}": "${desc}"`)
        .join("\n");
    }

    actions.push(`
    <action-visit>    
    - Visite URLs da lista abaixo para obter conhecimento externo
    - Escolha as URLs mais relevantes que possam conter a resposta
    - Explore o máximo de URLs possíveis para encontrar a resposta
    <url-list>
    ${urlList}
    </url-list>
    - Use quando tiver resultados de busca suficientes no contexto e quiser explorar URLs específicas em profundidade
    - Permite acessar o conteúdo completo por trás de qualquer URL
    ${
      isFiscalQuery
        ? "- Para consultas fiscais, priorize fontes oficiais do governo marcadas como FONTE OFICIAL"
        : ""
    }
    </action-visit>
    `);
  }

  if (allowSearch) {
    actions.push(`
    <action-search>    
    - Consulte fontes externas usando um mecanismo de busca público
    - Concentre-se em resolver um aspecto específico da questão
    - Forneça apenas palavras-chave de busca, não frases completas
    ${
      isFiscalQuery
        ? `- Para buscas fiscais, inclua termos específicos como "legislação", "portaria", "instrução normativa" junto com os termos técnicos
    - Considere adicionar termos como "site:gov.br" para limitar a fontes oficiais
    - Se buscar por um NCM específico, inclua o código completo entre aspas, ex: "9503.00.99"`
        : ""
    }
    </action-search>
    `);
  }

  if (allowAnswer) {
    const answerSection = `
    <action-answer>
    - Forneça a resposta final apenas quando estiver 96% certo
    - As respostas devem ser definitivas (sem ambiguidade, incerteza ou avisos)${
      allowReflect
        ? "\n    - Se ainda houver dúvidas, use <action-reflect>"
        : ""
    }
    - Formate sua resposta em markdown com as seguintes seções:
      - **Resposta Direta**: Uma resposta clara e concisa à pergunta ou problema, levando em consideração o contexto e o conhecimento acumulado, podendo também ser uma negativa e explicar o porque vocie acha isso e onde procurou mas nnao encontrou.
      - **Nota Detalhada**: Explicação adicional com contexto ou raciocínio.
      - **Referências**: Liste todas as fontes relevantes em formato [Citação Exata](URL).
    - Use todo o conhecimento acumulado para garantir uma resposta abrangente
    - Inclua exemplos, dados numéricos e citações quando relevante
    - Mantenha a formatação consistente
    ${
      isFiscalQuery
        ? `
    - Para respostas fiscais, especifique sempre:
      - A fonte legal exata (número da lei, decreto, instrução normativa)
      - A data de vigência da informação
      - Possíveis exceções ou casos especiais
      - Jurisdição aplicável (federal, estadual, municipal)
      - Se houver divergências na interpretação, mencione as diferentes posições`
        : ""
    }
    </action-answer>
    `;

    actions.push(answerSection);
  }

  if (beastMode) {
    actions.push(`
    <action-answer>
    - Qualquer resposta é melhor que nenhuma resposta
    - Respostas parciais são permitidas, mas certifique-se de que sejam baseadas no contexto e no conhecimento que você reuniu
    - Quando estiver incerto, suposições educadas baseadas no contexto e no conhecimento são permitidas e incentivadas
    - As respostas devem ser definitivas (sem ambiguidade, incerteza ou avisos)
    - Formate sua resposta em markdown com as seguintes seções:
      - **Resposta Direta**: Uma resposta clara e concisa à pergunta.
      - **Nota Detalhada**: Explicação adicional com contexto ou raciocínio.
      - **Referências**: Liste todas as fontes relevantes em formato [Citação Exata](URL).
    </action-answer>
    `);
  }

  if (allowReflect) {
    actions.push(`
    <action-reflect>    
    - Realize análise crítica por meio de cenários hipotéticos ou decomposições sistemáticas
    - Identifique lacunas de conhecimento e formule perguntas esclarecedoras essenciais
    - As perguntas devem ser:
      - Originais (não variações de perguntas existentes)
      - Focadas em conceitos únicos
      - Com menos de 20 palavras
      - Não compostas/não complexas
    ${
      isFiscalQuery
        ? `
    - Para reflexões fiscais, considere:
      - Especificidades de diferentes regimes fiscais
      - Particularidades regionais da tributação
      - Mudanças recentes na legislação
      - Interpretações jurisprudenciais relevantes`
        : ""
    }
    </action-reflect>
    `);
  }

  sections.push(`
    Baseado no contexto atual, você deve escolher uma das seguintes ações:
    <actions>
    ${actions.join("\n\n")}
    </actions>
    `);

  // Adiciona o rodapé
  sections.push(`Responda exclusivamente em formato JSON válido correspondente ao esquema JSON exato.

    Requisitos Críticos:
    - Inclua APENAS UM tipo de ação
    - Nunca adicione chaves não suportadas
    - Exclua todo texto que não seja JSON
    - Mantenha sintaxe JSON estrita
    - Todo conteúdo de texto deve estar em Português (Brasil)
    - Suporta codificação UTF-8 para caracteres especiais (á, é, í, ó, ú, â, ê, î, ô, û, ã, õ, ç)`);

  return sections.join("\n");
}
const allContext: StepAction[] = []; // todos os passos na sessão atual, incluindo aqueles que levaram a resultados errados

/**
 * Atualiza o contexto atual da sessão com um novo passo.
 *
 * @param step O novo passo que será adicionado ao contexto.
 */
function updateContext(step: any) {
  allContext.push(step);
}

/**
 * Remove todos os caracteres de quebra de linha do texto fornecido.
 *
 * @param text O texto que contenha quebras de linha.
 * @returns O texto sem quebras de linha.
 */
function removeAllLineBreaks(text: string) {
  return text.replace(/(\r\n|\n|\r)/gm, " ");
}

/**
 * Remove todas as tags HTML do texto fornecido.
 *
 * @param text O texto que contenha tags HTML.
 * @returns O texto sem tags HTML.
 */
function removeHTMLtags(text: string) {
  return text.replace(/<[^>]*>?/gm, "");
}

/**
 * Sanitiza o texto fornecido, garantindo que ele esteja codificado corretamente
 * em UTF-8. Essa função utiliza o TextEncoder e o TextDecoder para codificar
 * e decodificar o texto, eliminando eventuais caracteres inválidos.
 *
 * @param text O texto a ser sanitizado.
 * @returns O texto sanitizado, codificado em UTF-8.
 */

function sanitizeText(text: string) {
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  return decoder.decode(encoder.encode(text));
}

/**
 * Tenta fazer o parse de um texto como JSON. Se falhar e a string não terminar
 * com '}', tenta corrigir adicionando '}' ao final e tenta novamente o parse.
 *
 * @param text A string contendo o JSON a ser analisado.
 * @returns O objeto JSON resultante do parse.
 * @throws Se o JSON não puder ser analisado, mesmo após tentativa de correção.
 */

function attemptJSONParse(text: string): any {
  // Tenta fazer o parse do JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // Tenta completar se a string não terminar com '}'
    let fixed = text.trim();
    if (!fixed.endsWith("}")) {
      fixed = fixed + "}";
    }
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.error(
        "Falha ao tentar corrigir o JSON. Resposta original:",
        text
      );
      throw e2;
    }
  }
}

// Adiciona a função captureLLMOutput para processar a saída do LLM sem causar ReferenceError
/**
 * Captura e processa a saída do modelo de linguagem (LLM).
 * @param rawText O texto bruto retornado pelo modelo.
 * @returns O objeto JSON analisado a partir do texto sanitizado.
 */
function captureLLMOutput(rawText: string): any {
  return attemptJSONParse(sanitizeText(rawText));
}

/**
 * Função que executa o agente de raciocínio que responde às perguntas.
 *
 * O agente tem como objetivo responder às perguntas do usuário com base em
 * conhecimentos pré-concebidos. Para isso, ele utiliza um modelo de linguagem
 * treinado previamente, que gera uma ação a ser executada em cada passo.
 * As ações podem ser:
 *  - **answer**: responder à pergunta com base em conhecimentos pré-concebidos;
 *  - **reflect**: refletir sobre as lacunas de conhecimento e gerar novas perguntas;
 *  - **search**: buscar informações na Internet para sanar as lacunas de conhecimento;
 *  - **visit**: visitar as URLs relevantes encontradas na busca e extrair informações úteis;
 *
 * O agente também tem como objetivo aprender com os erros e melhorar suas respostas
 * ao longo do tempo. Para isso, ele armazena todas as perguntas e respostas em um
 * banco de dados e as utiliza para treinar o modelo de linguagem.
 *
 * @param question pergunta do usuário
 * @param tokenBudget orçamento de tokens para a execução do agente
 * @param maxBadAttempts número máximo de tentativas para responder à pergunta
 * @param existingContext contexto existente do agente, que pode ser utilizado para
 *  continuar a execução do agente de onde ele parou anteriormente
 * @returns uma promessa que resolve com o resultado da execução do agente, que
 *  inclui a resposta à pergunta e o contexto atualizado do agente
 */
export async function getResponse(
  question: string,
  tokenBudget: number = 10_000_000,
  maxBadAttempts: number = 10,
  existingContext?: Partial<TrackerContext>,
  requestId?: string
): Promise<{
  result: StepAction;
  context: TrackerContext;
  audit: {
    logs: ServerLog[];
    tokenUsage: number;
    steps: number;
    errors: string[];
  };
}> {
  // Garante que o cliente está inicializado
  ensureModelClientInitialized();

  // Cria o contexto do agente, utilizando o contexto existente, se houver
  const context: TrackerContext = {
    tokenTracker:
      existingContext?.tokenTracker || new TokenTracker(tokenBudget),
    actionTracker:
      existingContext?.actionTracker ||
      new ActionTracker({ requestId: "default" }),
    outputs: existingContext?.outputs || [],
  };
  context.actionTracker.trackAction({
    gaps: [question],
    totalStep: 0,
    badAttempts: 0,
  });
  let step = 0;
  let totalStep = 0;
  let badAttempts = 0;
  const gaps: string[] = [question]; // Todas as perguntas a serem respondidas, incluindo a pergunta original
  const allQuestions = [question];
  const allKeywords = [];
  const allKnowledge = []; // knowledge são perguntas intermediárias que são respondidas
  const badContext = [];
  let diaryContext = [];
  let allowAnswer = true;
  let allowSearch = true;
  let allowRead = true;
  let allowReflect = true;
  let prompt = "";
  let thisStep: StepAction = {
    action: "answer",
    answer: "",
    references: [],
    think: "",
  };
  let isAnswered = false;

  const allURLs: Record<string, string> = {};
  const visitedURLs: string[] = [];
  while (
    context.tokenTracker.getTotalUsage() < tokenBudget &&
    badAttempts <= maxBadAttempts
  ) {
    // adiciona um atraso de 1s para evitar o limite de taxa
    await sleep(STEP_SLEEP);
    step++;
    totalStep++;
    context.actionTracker.trackAction({
      totalStep,
      thisStep,
      gaps,
      badAttempts,
    });
    const budgetPercentage = (
      (context.tokenTracker.getTotalUsage() / tokenBudget) *
      100
    ).toFixed(2);
    console.log(`Step ${totalStep} / Budget used ${budgetPercentage}%`);
    console.log("Gaps:", gaps);
    allowReflect = allowReflect && gaps.length <= 1;
    const currentQuestion = gaps.length > 0 ? gaps.shift()! : question;
    // atualiza todos os urls com buildURLMap
    allowRead = allowRead && Object.keys(allURLs).length > 0;
    allowSearch = allowSearch && Object.keys(allURLs).length < 200; // desabilita a busca quando há muitos urls já

    // gera o prompt para este passo
    prompt = getPrompt(
      currentQuestion,
      diaryContext,
      allQuestions,
      allowReflect,
      allowAnswer,
      allowRead,
      allowSearch,
      badContext,
      allKnowledge,
      allURLs,
      false
    );

    // cria o modelo gerador de conteúdo
    const isGeminiModel = modelConfigs.agent.model.startsWith("gemini-");
    let model;

    if (isGeminiModel) {
      console.log("Usando configuração específica para modelo Gemini");
      model = activeModelClient.getGenerativeModel({
        model: modelConfigs.agent.model,
        generationConfig: {
          temperature: modelConfigs.agent.temperature,
          // O Gemini não aceita responseSchema da mesma forma que o modelo local
          // então não enviamos essa configuração
        },
      });
    } else {
      console.log("Usando configuração para modelo local");
      model = activeModelClient.getGenerativeModel({
        model: modelConfigs.agent.model,
        generationConfig: {
          temperature: modelConfigs.agent.temperature,
          responseMimeType: "application/json",
          responseSchema: getSchema(
            allowReflect,
            allowRead,
            allowAnswer,
            allowSearch
          ),
        },
      });
    }

    // gera o conteúdo
    let result;
    let response;
    let rawResponseText;

    try {
      if (isGeminiModel) {
        console.log("Gerando conteúdo com modelo Gemini");
        // O Gemini precisa de instruções específicas para gerar JSON formatado
        const geminiPrompt = `${prompt}\n\nIMPORTANTE: Responda APENAS com um objeto JSON válido seguindo o formato especificado. Não inclua texto adicional ou explicações fora do JSON.`;
        result = await model.generateContent(geminiPrompt);
      } else {
        result = await model.generateContent(prompt);
      }

      response = await result.response;

      // Abordagem robusta para lidar com text sendo uma função ou propriedade
      try {
        // Verificar se response existe e tem a propriedade text
        if (!response) {
          console.error("Erro: objeto response é nulo ou indefinido");
          rawResponseText = "{}"; // Valor padrão em caso de erro
        } else {
          console.log("Response type:", typeof response);
          console.log(
            "Response properties:",
            Object.getOwnPropertyNames(response)
          );

          // Verificar se text existe como propriedade ou método
          if (typeof response.text === "function") {
            console.log("text é uma função, chamando response.text()");
            rawResponseText = await response.text();
          } else if (response.text !== undefined) {
            console.log(
              "text é uma propriedade, acessando response.text diretamente"
            );
            rawResponseText = response.text;
          } else if (typeof response.toString === "function") {
            console.log("Usando toString() como fallback");
            rawResponseText = response.toString();
          } else {
            console.log(
              "Nenhum método confiável encontrado, convertendo para JSON"
            );
            try {
              rawResponseText = JSON.stringify(response);
            } catch (jsonError) {
              console.error("Erro ao converter response para JSON:", jsonError);
              rawResponseText = "{}";
            }
          }
        }
      } catch (textError) {
        console.error("Erro ao acessar response.text:", textError);
        rawResponseText = "{}";
      }

      console.log("Raw response text:", rawResponseText);

      // Tenta extrair JSON da resposta do Gemini, se necessário
      if (isGeminiModel) {
        // O Gemini pode retornar texto com markdown ou outros formatos
        // Vamos tentar extrair apenas o JSON da resposta
        const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/;
        const match = rawResponseText.match(jsonRegex);
        if (match) {
          // Usa o grupo que capturou o JSON (dentro ou fora do bloco de código)
          rawResponseText = match[1] || match[2];
          console.log("JSON extraído da resposta do Gemini:", rawResponseText);
        }
      }

      const usage = response.usageMetadata;
      context.tokenTracker.trackUsage("agent", usage?.totalTokenCount || 0);
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo:", error);
      throw new Error(`Falha ao gerar conteúdo: ${error.message}`);
    }

    // Verifica se o context.outputs existe, senão inicializa
    if (!context.outputs) {
      context.outputs = [];
    }

    // Armazena o output no context.outputs
    context.outputs.push({
      step: totalStep,
      rawResponseText: rawResponseText,
    });

    thisStep = captureLLMOutput(rawResponseText);
    // imprime as ações permitidas e escolhe a ação
    const actionsStr = [allowSearch, allowRead, allowAnswer, allowReflect]
      .map((a, i) => (a ? ["search", "read", "answer", "reflect"][i] : null))
      .filter((a) => a)
      .join(", ");
    console.log(`${thisStep.action} <- [${actionsStr}]`);
    console.log(thisStep);

    // reseta allowAnswer para true
    allowAnswer = true;
    allowReflect = true;
    allowRead = true;
    allowSearch = true;

    // executa o passo e a ação
    if (thisStep.action === "answer") {
      const answerStep = thisStep as AnswerAction;
      if (typeof answerStep.answer !== "string") {
        console.log("Iniciando correção do formato da resposta final...");
        if (activeModelClient instanceof LocalModelClient) {
          const correctedAnswer = await activeModelClient.retryWithCorrection(
            JSON.stringify(answerStep),
            'Formato de resposta inválido: campo "answer" deve ser string'
          );

          // Atualiza a resposta com a versão corrigida
          answerStep.answer = JSON.parse(correctedAnswer).answer;
        }
      }

      updateContext({
        totalStep,
        question: currentQuestion,
        ...answerStep,
      });

      const evaluation = await evaluateAnswer(
        currentQuestion,
        answerStep,
        { types: ["definitive"], languageStyle: "plain Portuguese" },
        [context.tokenTracker, context.actionTracker],
        visitedURLs
      );

      if (currentQuestion === question) {
        if (badAttempts >= maxBadAttempts) {
          diaryContext.push(`
                    At step ${step} and ${badAttempts} attempts, you took **answer** action and found an answer, not a perfect one but good enough to answer the original question:

                    Original question: 
                    ${currentQuestion}

                    Your answer: 
                    ${answerStep.answer}

                    The evaluator thinks your answer is good because: 
                    ${evaluation.response.think}

                    Your journey ends here.
                    `);
          isAnswered = false;
          break;
        }
        if (evaluation.response.pass) {
          if (
            answerStep.references?.length > 0 ||
            Object.keys(allURLs).length === 0
          ) {
            // PONTO DE SAÍDA DO PROGRAMA!!!!
            diaryContext.push(`
                        At step ${step}, you took **answer** action and finally found the answer to the original question:

                        Original question: 
                        ${currentQuestion}

                        Your answer: 
                        ${answerStep.answer}

                        The evaluator thinks your answer is good because: 
                        ${evaluation.response.think}

                        Your journey ends here. You have successfully answered the original question. Congratulations! 🎉
                        `);
            isAnswered = true;
            break;
          } else {
            diaryContext.push(`
                        At step ${step}, you took **answer** action and finally found the answer to the original question:

                        Original question: 
                        ${currentQuestion}

                        Your answer: 
                        ${answerStep.answer}

                        Unfortunately, you did not provide any references to support your answer. 
                        You need to find more URL references to support your answer.`);
          }

          isAnswered = true;
          break;
        } else {
          diaryContext.push(`
                    At step ${step}, you took **answer** action but evaluator thinks it is not a good answer:

                    Original question: 
                    ${currentQuestion}

                    Your answer: 
                    ${answerStep.answer}

                    The evaluator thinks your answer is bad because: 
                    ${evaluation.response.think}
                    `);
          // armazena o contexto ruim e reseta o diário de contexto
          const errorAnalysis = await analyzeSteps(diaryContext);

          badContext.push({
            question: currentQuestion,
            answer: answerStep.answer,
            evaluation: evaluation.response.think,
            ...JSON.parse(errorAnalysis.analysis),
          });
          badAttempts++;
          allowAnswer = false; // desabilita a ação de resposta na próxima etapa
          diaryContext = [];
          step = 0;
        }
      } else if (evaluation.response.pass) {
        diaryContext.push(`
                At step ${step}, you took **answer** action. You found a good answer to the sub-question:

                Sub-question: 
                ${currentQuestion}

                Your answer: 
                ${answerStep.answer}

                The evaluator thinks your answer is good because: 
                ${evaluation.response.think}

                Although you solved a sub-question, you still need to find the answer to the original question. You need to keep going.
                `);
        allKnowledge.push({
          question: currentQuestion,
          answer: answerStep.answer,
          references: answerStep.references,
          type: "qa",
        });
      }
    } else if (thisStep.action === "reflect" && thisStep.questionsToAnswer) {
      // Passo adicional: Recapitulando o que foi processado até o momento
      const [savedContext, savedKeywords, savedQuestions, savedKnowledge] =
        await loadContext(requestId || question, step);
      diaryContext.push(`
                Recapitulando o que foi processado até o momento (Query ID: ${
                  requestId || question
                }):
                - Contexto: ${JSON.stringify(savedContext, null, 2)}
                - Palavras-chave: ${JSON.stringify(savedKeywords, null, 2)}
                - Perguntas já feitas: ${JSON.stringify(
                  savedQuestions,
                  null,
                  2
                )}
                - Conhecimento acumulado: ${JSON.stringify(
                  savedKnowledge,
                  null,
                  2
                )}
            `);

      // Prossegue com o processo de reflexão utilizando o novo conhecimento
      let newGapQuestions = thisStep.questionsToAnswer;
      const oldQuestions = [...newGapQuestions];
      newGapQuestions = (await dedupQueries(newGapQuestions, allQuestions))
        .unique_queries;

      if (newGapQuestions.length > 0) {
        // encontrou novas perguntas de lacuna
        diaryContext.push(`
                    At step ${step}, you took **reflect** and think about the knowledge gaps. You found some sub-questions are important to the question: "${currentQuestion}"
                    You realize you need to know the answers to the following sub-questions:
                    ${newGapQuestions.map((q: string) => `- ${q}`).join("\n")}

                    You will now figure out the answers to these sub-questions and see if they can help you find the answer to the original question.
                    `);
        gaps.push(...newGapQuestions);
        allQuestions.push(...newGapQuestions);
        gaps.push(question); // sempre mantém a pergunta original nos gaps
      } else {
        diaryContext.push(`
                    At step ${step}, you took **reflect** and think about the knowledge gaps. You tried to break down the question "${currentQuestion}" into gap-questions like this: ${oldQuestions.join(
          ", "
        )} 
                    But then you realized you have asked them before. You decided to to think out of the box or cut from a completely different angle. 
                    `);
        updateContext({
          totalStep,
          ...thisStep,
          result:
            "You have tried all possible questions and found no useful information. You must think out of the box or from a completely different angle!!!",
        });
        allowReflect = false;
      }

      // Emite evento para ação reflect
      eventEmitter.emit(`progress-${requestId || question}`, {
        type: "reflect",
        data: {
          message: `Reflect action processed for "${currentQuestion}"`,
          newGapQuestions,
          previousQuestions: oldQuestions,
        },
        trackers: {
          tokenUsage: context.tokenTracker.getTotalUsage(),
          actionState: context.actionTracker.getState(),
        },
      });
    } else if (thisStep.action === "search" && thisStep.searchQuery) {
      // reescreve as consultas
      let { queries: keywordsQueries } = await rewriteQuery(thisStep);

      const oldKeywords = keywordsQueries;
      // evita consultas existentes
      const { unique_queries: dedupedQueries } = await dedupQueries(
        keywordsQueries,
        allKeywords
      );
      keywordsQueries = dedupedQueries;

      if (keywordsQueries.length > 0) {
        const searchResults = [];
        for (const query of keywordsQueries) {
          console.log(`Search query: ${query}`);
          let results;
          switch (SEARCH_PROVIDER) {
            case "jina":
              // usa jinaSearch
              results = {
                results:
                  (await jinaSearch(query, context.tokenTracker)).response
                    ?.data || [],
              };
              break;
            case "duck":
              results = await duckSearch(query, {
                safeSearch: SafeSearchType.STRICT,
              });
              break;
            case "brave":
              try {
                const { response } = await braveSearch(query);
                results = {
                  results:
                    response.web?.results?.map((r: any) => ({
                      title: r.title,
                      url: r.url,
                      description: r.description,
                    })) || [],
                };
              } catch (error) {
                console.error("Brave search failed:", error);
                results = { results: [] };
              }
              await sleep(STEP_SLEEP);
              break;
            default:
              results = { results: [] };
          }
          const minResults = 30;
          const minResultsData = results.results
            .slice(0, minResults)
            .map((r: any) => ({
              title: r.title,
              url: r.url,
              description: r.description,
            }));
          Object.assign(
            allURLs,
            Object.fromEntries(minResultsData.map((r: any) => [r.url, r.title]))
          );
          searchResults.push({ query, results: minResultsData });
          allKeywords.push(query);
        }
        allKnowledge.push({
          question: `What do Internet say about ${thisStep.searchQuery}?`,
          answer: removeHTMLtags(
            searchResults
              .map((r: any) =>
                r.results.map((r: any) => r.description).join("; ")
              )
              .join("; ")
          ),
          // transforma em uma lista de urls únicas
          references: searchResults
            .map((r: any) => r.results.map((r: any) => r.url))
            .flat()
            .filter((v: any, i: number, a: any[]) => a.indexOf(v) === i),
          type: "side-info",
        });
        diaryContext.push(`
                    At step ${step}, you took the **search** action and look for external information for the question: "${currentQuestion}".
                    In particular, you tried to search for the following keywords: "${keywordsQueries.join(
                      ", "
                    )}".
                    You found quite some information and add them to your URL list and **visit** them later when needed. 
                    `);

        updateContext({
          totalStep,
          question: currentQuestion,
          ...thisStep,
          result: searchResults,
        });

        // Emite evento para ação search
        eventEmitter.emit(`progress-${requestId || question}`, {
          type: "search",
          data: {
            message: `Search action processed with keywords: "${keywordsQueries.join(
              ", "
            )}"`,
            searchResults,
          },
          trackers: {
            tokenUsage: context.tokenTracker.getTotalUsage(),
            actionState: context.actionTracker.getState(),
          },
        });
      } else {
        diaryContext.push(`
                    At step ${step}, you took the **search** action and look for external information for the question: "${currentQuestion}".
                    In particular, you tried to search for the following keywords: ${oldKeywords.join(
                      ", "
                    )}. 
                    But then you realized you have already searched for these keywords before.
                    You decided to think out of the box or cut from a completely different angle.
                    `);

        // atualiza o contexto
        updateContext({
          totalStep,
          ...thisStep,
          result:
            "You have tried all possible queries and found no new information. You must think out of the box or different angle!!!",
        });
        allowSearch = false;
      }
    } else if (
      thisStep.action === "visit" &&
      (thisStep as VisitAction)["URLTargets"]?.length
    ) {
      eventEmitter.emit(`progress-${requestId || question}`, {
        type: "visit",
        data: {
          urlList: (thisStep as VisitAction)["URLTargets"],
        },
        trackers: {
          tokenUsage: context.tokenTracker.getTotalUsage(),
          actionState: context.actionTracker.getState(),
        },
      });
    }

    // Após cada passo, acumule o raciocínio no diaryContext
    if (thisStep.action !== "answer" || !isAnswered) {
      const reasoningStep = `
### Passo ${totalStep}: ${
        thisStep.action.charAt(0).toUpperCase() + thisStep.action.slice(1)
      }
- **Pensamento**: ${thisStep.think || "Nenhum pensamento registrado"}
- **Ação Realizada**: ${
        thisStep.action === "search"
          ? `Busca com query: "${(thisStep as SearchAction).searchQuery}"`
          : thisStep.action === "reflect"
          ? `Reflexão gerando perguntas: ${
              (thisStep as ReflectAction).questionsToAnswer?.join(", ") ||
              "Nenhuma pergunta"
            }`
          : thisStep.action === "visit"
          ? `Visita às URLs: ${
              (thisStep as VisitAction).URLTargets?.join(", ") || "Nenhuma URL"
            }`
          : "Nenhuma ação detalhada"
      }
${diaryContext.join("\n\n") || ""}`.trim();

      // Atualize o contexto acumulado
      thisStep.accumulatedReasoning =
        (thisStep.accumulatedReasoning || "") + "\n\n" + reasoningStep;
    }

    // Quando a resposta final é gerada (action === 'answer' e isAnswered === true)
    if (thisStep.action === "answer" && isAnswered) {
      const answerStep = thisStep as AnswerAction;
      const finalPrompt = getPrompt(
        question,
        diaryContext,
        allQuestions,
        false, // Desativa reflexões para a resposta final
        true,
        false,
        false,
        badContext,
        allKnowledge,
        allURLs,
        false
      );

      // Verifica se estamos usando modelo Gemini
      const isGeminiModel = modelConfigs.agent.model.startsWith("gemini-");
      let model;

      if (isGeminiModel) {
        console.log(
          "Usando configuração específica para modelo Gemini na resposta final"
        );
        model = activeModelClient.getGenerativeModel({
          model: modelConfigs.agent.model,
          generationConfig: {
            temperature: modelConfigs.agent.temperature,
            // Sem responseSchema para Gemini
          },
        });
      } else {
        console.log("Usando configuração para modelo local na resposta final");
        model = activeModelClient.getGenerativeModel({
          model: modelConfigs.agent.model,
          generationConfig: {
            temperature: modelConfigs.agent.temperature,
            responseMimeType: "application/json",
            responseSchema: getSchema(false, false, true, false),
          },
        });
      }

      // Ajuste do prompt e processamento da resposta para Gemini
      try {
        let result;
        if (isGeminiModel) {
          const geminiPrompt = `${finalPrompt}\n\nIMPORTANTE: Responda APENAS com um objeto JSON válido seguindo o formato especificado. Não inclua texto adicional ou explicações fora do JSON.`;
          result = await model.generateContent(geminiPrompt);
        } else {
          result = await model.generateContent(finalPrompt);
        }

        const response = await result.response;
        // Verificar se text é uma função ou uma propriedade
        let rawResponseText =
          typeof response.text === "function"
            ? await response.text()
            : response.text;

        // Extrai JSON da resposta do Gemini, se necessário
        if (isGeminiModel) {
          const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/;
          const match = rawResponseText.match(jsonRegex);
          if (match) {
            rawResponseText = match[1] || match[2];
            console.log(
              "JSON extraído da resposta final do Gemini:",
              rawResponseText
            );
          }
        }

        thisStep = captureLLMOutput(rawResponseText);

        // Adicione o raciocínio acumulado à resposta final
        thisStep.accumulatedReasoning = `
## Processo de Raciocínio
${thisStep.accumulatedReasoning || "Nenhum raciocínio acumulado"}

## Resposta Final
${answerStep.answer}`;
      } catch (error: any) {
        console.error("Erro ao gerar resposta final:", error);
        // Continua usando o thisStep atual no caso de erro
      }
    }

    // armazena o contexto
    await storeContext(
      prompt,
      [allContext, allKeywords, allQuestions, allKnowledge],
      totalStep,
      requestId || question
    );
  }

  // armazena o contexto
  await storeContext(
    prompt,
    [allContext, allKeywords, allQuestions, allKnowledge],
    totalStep,
    requestId || question
  );

  // se a resposta foi encontrada, retorna o resultado
  if (isAnswered) {
    const audit = {
      requestId: requestId || question,
      logs: serverLogs,
      tokenUsage: context.tokenTracker.getTotalUsage(),
      steps: context.actionTracker.getState().totalStep,
      errors: [],
    };

    eventEmitter.emit(`progress-${requestId || question}`, {
      type: "query",
      data: {
        message: `Sua pergunta "${question}" foi registrada e está sendo processada.`,
        buttonNumber: totalStep,
      },
      trackers: {
        tokenUsage: context.tokenTracker.getTotalUsage(),
        actionState: context.actionTracker.getState(),
      },
    });

    return { result: thisStep, context, audit };
  } else {
    console.log("Enter Beast mode!!!");
    // qualquer resposta é melhor que nenhuma resposta, última chance da humanidade
    step++;
    totalStep++;
    const prompt = getPrompt(
      question,
      diaryContext,
      allQuestions,
      false,
      false,
      false,
      false,
      badContext,
      allKnowledge,
      allURLs,
      true
    );

    // Verifica se estamos usando modelo Gemini no modo Beast
    const isGeminiModel =
      modelConfigs.agentBeastMode.model.startsWith("gemini-");
    let model;

    if (isGeminiModel) {
      console.log(
        "Usando configuração específica para modelo Gemini no Beast Mode"
      );
      model = activeModelClient.getGenerativeModel({
        model: modelConfigs.agentBeastMode.model,
        generationConfig: {
          temperature: modelConfigs.agentBeastMode.temperature,
          // Sem responseSchema para Gemini
        },
      });
    } else {
      console.log("Usando configuração para modelo local no Beast Mode");
      model = activeModelClient.getGenerativeModel({
        model: modelConfigs.agentBeastMode.model,
        generationConfig: {
          temperature: modelConfigs.agentBeastMode.temperature,
          responseMimeType: "application/json",
          responseSchema: getSchema(false, false, allowAnswer, false),
        },
      });
    }

    // Ajuste do prompt e processamento da resposta para Gemini
    try {
      let result;
      if (isGeminiModel) {
        const geminiPrompt = `${prompt}\n\nIMPORTANTE: Responda APENAS com um objeto JSON válido seguindo o formato especificado. Não inclua texto adicional ou explicações fora do JSON.`;
        result = await model.generateContent(geminiPrompt);
      } else {
        result = await model.generateContent(prompt);
      }

      const response = await result.response;
      // Verificar se text é uma função ou uma propriedade
      let rawResponseText =
        typeof response.text === "function"
          ? await response.text()
          : response.text;

      // Extrai JSON da resposta do Gemini, se necessário
      if (isGeminiModel) {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/;
        const match = rawResponseText.match(jsonRegex);
        if (match) {
          rawResponseText = match[1] || match[2];
          console.log(
            "JSON extraído da resposta do Gemini no Beast Mode:",
            rawResponseText
          );
        }
      }

      console.log("Raw response text:", rawResponseText);
      const usage = response.usageMetadata;
      context.tokenTracker.trackUsage("agent", usage?.totalTokenCount || 0);

      // Verifica se o context.outputs existe, senão inicializa
      if (!context.outputs) {
        context.outputs = [];
      }

      // Armazena o output no context.outputs
      context.outputs.push({
        step: totalStep,
        rawResponseText: rawResponseText,
      });

      // parseia o conteúdo
      thisStep = captureLLMOutput(rawResponseText);
      console.log(thisStep);
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo no Beast Mode:", error);
      // Mantém thisStep atual em caso de erro
    }

    const audit = {
      logs: serverLogs,
      tokenUsage: context.tokenTracker.getTotalUsage(),
      steps: context.actionTracker.getState().totalStep,
      errors: [],
    };

    // retorna o resultado
    return { result: thisStep, context, audit };
  }
}

/**
 * Armazena o contexto em arquivos de texto
 *
 * @param prompt prompt usado para gerar o conteúdo
 * @param memory memória do agente
 * @param step número do passo atualizado
 */
async function storeContext(
  prompt: string,
  memory: any[][],
  step: number,
  requestId: string
) {
  try {
    // Usa o requestId fornecido ao invés de gerar um novo
    const queryDir = `queries/${requestId}`;
    await fs.mkdir(queryDir, { recursive: true });

    // Salva os arquivos na pasta específica da query
    await fs.writeFile(`${queryDir}/prompt-${step}.txt`, prompt);

    const [context, keywords, questions, knowledge] = memory;
    await fs.writeFile(
      `${queryDir}/context.json`,
      JSON.stringify(context, null, 2)
    );
    await fs.writeFile(
      `${queryDir}/queries.json`,
      JSON.stringify(keywords, null, 2)
    );
    await fs.writeFile(
      `${queryDir}/questions.json`,
      JSON.stringify(questions, null, 2)
    );
    await fs.writeFile(
      `${queryDir}/knowledge.json`,
      JSON.stringify(knowledge, null, 2)
    );
  } catch (error) {
    console.error(`Context storage failed for query ${requestId}:`, error);
  }
}

async function loadContext(requestId: string, step: number) {
  try {
    const queryDir = `queries/${requestId}`;
    // Usa o "step" para carregar o arquivo de prompt correspondente (se necessário)
    const prompt = await fs.readFile(`${queryDir}/prompt-${step}.txt`, "utf-8");
    const context = JSON.parse(
      await fs.readFile(`${queryDir}/context.json`, "utf-8")
    );
    const keywords = JSON.parse(
      await fs.readFile(`${queryDir}/queries.json`, "utf-8")
    );
    const questions = JSON.parse(
      await fs.readFile(`${queryDir}/questions.json`, "utf-8")
    );
    const knowledge = JSON.parse(
      await fs.readFile(`${queryDir}/knowledge.json`, "utf-8")
    );

    // Retorna também o prompt correspondente ao passo, se desejar usá-lo
    return [prompt, context, keywords, questions, knowledge];
  } catch (error) {
    console.error(
      `Failed to load context for query ${requestId} at step ${step}:`,
      error
    );
    return ["", [], [], [], []];
  }
}

/**
 * Função principal que executa o agente de raciocínio
 *
 * @returns uma promessa que resolve com o resultado da execução do agente
 */
export async function main() {
  const question = process.argv[2] || "";
  const modelArg = process.argv[3];

  // Use ensureModelClientInitialized para garantir a inicialização
  ensureModelClientInitialized(modelArg);

  // executa o agente de raciocínio
  const { result: finalStep, context: tracker } = (await getResponse(
    question
  )) as { result: AnswerAction; context: TrackerContext };

  // imprime a resposta final
  console.log("Final Answer:", finalStep.answer);
  tracker.tokenTracker.printSummary();
  console.log("Modelo rodando:", modelConfigs.agent.model);

  // // Integração com o script de finalização
  // try {
  //     const pythonProcess = spawn('python', ['finalizacao.py', question, finalStep.answer], {
  //         stdio: ['inherit', 'inherit', 'inherit']
  //     });
  //     // Trata erros
  //     pythonProcess.on('error', (error: Error) => {
  //         console.error('Erro ao executar script de finalização:', error);
  //     });
  //     // Trata o fechamento do script
  //     pythonProcess.on('close', (code: number | null) => {
  //         if (code !== 0) {
  //             console.error(`Script de finalização encerrou com código ${code}`);
  //         }
  //     });
  // } catch (error) {
  //     console.error('Erro ao executar script de finalização:', error);
  // }
}

// executa a função principal
if (require.main === module) {
  main().catch(console.error);
}
