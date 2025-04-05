import { GoogleGenerativeAI } from "@google/generative-ai";
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
  KnowledgeItem,
  Reference,
  BoostedSearchSnippet,
} from "./types";
import { TrackerContext } from "./types";
import { jinaSearch } from "./tools/jinaSearch";
import { LocalModelClient } from "./tools/local-model-client";
import { EventEmitter } from "events";
import { Schemas } from "./schemas";
import { sortSelectURLs, removeExtraLineBreaks } from "./utils/url-tools";

// EventEmitter para progresso
const eventEmitter = new EventEmitter();

// Interface para logs do servidor
interface ServerLog {
  context: { requestId: string };
  timestamp: Date;
  message: string;
}

// Array para armazenar logs do servidor
const serverLogs: ServerLog[] = [];

// Cliente global do modelo
let activeModelClient: GoogleGenerativeAI | LocalModelClient;

// Inicializa o cliente do modelo
function initializeModelClient(
  modelName?: string
): GoogleGenerativeAI | LocalModelClient {
  console.log("Iniciando inicialização do cliente do modelo...");
  try {
    if (modelName && modelName.startsWith("gemini-")) {
      const geminiApiKey =
        ENV.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY;
      if (!geminiApiKey) {
        throw new Error("API key para Gemini não encontrada");
      }
      const googleClient = new GoogleGenerativeAI(geminiApiKey);
      activeModelClient = googleClient;
      modelConfigs.agent.model = modelName;
      return googleClient;
    }
    const localModel = new LocalModelClient(LOCAL_MODEL_ENDPOINT);
    activeModelClient = localModel;
    if (modelName) modelConfigs.agent.model = modelName;
    return localModel;
  } catch (error) {
    console.error("Erro na inicialização do cliente do modelo:", error);
    throw error;
  }
}

// Garante que o cliente esteja inicializado
export function ensureModelClientInitialized(modelName?: string): void {
  if (!activeModelClient) {
    initializeModelClient(modelName);
    return;
  }
  if (modelName) {
    const isCurrentClientLocal = activeModelClient instanceof LocalModelClient;
    const isRequestingGeminiModel = modelName.startsWith("gemini-");
    if (
      (isCurrentClientLocal && isRequestingGeminiModel) ||
      (!isCurrentClientLocal && !isRequestingGeminiModel)
    ) {
      initializeModelClient(modelName);
    } else {
      modelConfigs.agent.model = modelName;
    }
  }
}

// Função de espera
async function sleep(ms: number): Promise<void> {
  console.log(`Waiting ${Math.ceil(ms / 1000)}s...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Tipo para BadAttemptContext
interface BadAttemptContext {
  question: string;
  answer: string;
  evaluation: string;
  recap?: string;
  blame?: string;
  improvement?: string;
}

// Gera o prompt com lógica fiscal integrada
function getPrompt(
  question: string,
  context?: string[],
  allQuestions?: string[],
  allowReflect: boolean = true,
  allowAnswer: boolean = true,
  allowRead: boolean = true,
  allowSearch: boolean = true,
  badContext?: BadAttemptContext[],
  knowledge?: KnowledgeItem[],
  allURLs?: Record<string, string>,
  beastMode?: boolean
): string {
  const sections: string[] = [];
  const actionSections: string[] = [];

  // Detecção de consultas fiscais
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

  // Cabeçalho do prompt
  sections.push(`
    Current date: ${new Date().toUTCString()}

    Você é um analista de pesquisa de IA avançado especializado em raciocínio de múltiplas etapas. Usando seus dados de treinamento e lições aprendidas anteriormente, responda à seguinte pergunta com absoluta certeza:
    Um buscador curioso e muito experiente, consegue achar qualquer coisa na internet, procura até nos mínimos detalhes de pistas que possam te levar até a resposta correta. Suas respostas devem seguir estas regras:

    1. Use sempre português do Brasil nas respostas finais
    2. Mantenha o formato JSON conforme solicitado
    3. Não inclua tags XML como <think> no JSON final
    4. Se precisar explicar seu raciocínio, faça isso em português antes de dar a resposta em JSON

    5. Exercício de Raciocínio Lógico Obrigatório SOMENTE PARA PROBLEMAS QUE ENVOLVEM MÚLTIPLAS VARIÁVEIS e de complexidade elevada:
      - Identifique variáveis, crie uma matriz de possibilidades e analise cada combinação com informações específicas, base teórica, exemplos práticos e observações.

    6. EXERCÍCIO DE RACIOCÍNIO OBRIGATÓRIO para classificação fiscal no Brasil:
      - Liste todas as variáveis (estado, regime, operação), crie uma matriz de possibilidades, busque informações específicas para cada caso, cite fontes/legislação e dê exemplos práticos.

    7. Aplicação da Fórmula de Bháskara para Análise de Extremos:
      - Use x_v = -b/(2a) e f(x_v) = -Δ/(4a), com Δ = b² - 4ac, quando aplicável.

    8. IMPORTANTE:
      - Use "searchQuery" para busca, inclua "think" no JSON, nunca diga "depende" ou "não sei" sem justificar com evidências, mostre todas as possibilidades, cite legislação quando essencial, dê exemplos práticos.

    <question>
    ${question}
    </question>
  `);

  // Contexto fiscal
  if (isFiscalQuery) {
    sections.push(`
      <fiscal-context>
      Você é especialista em legislação fiscal e tributária brasileira. Para consultas fiscais:
      1. Priorize fontes oficiais (Receita Federal, Ministério da Fazenda, Planalto)
      2. Verifique a data das informações
      3. Para NCM, busque o código exato e justifique
      4. Especifique data e jurisdição para alíquotas
      5. Referencie decisões do CARF ou tribunais para interpretações complexas
      6. Considere exceções regionais (ICMS, ISS)
      7. Identifique divergências na legislação
      </fiscal-context>
    `);
  }

  // Contexto de ações anteriores
  if (context?.length) {
    sections.push(`
      <context>
      Você realizou as seguintes ações:
      ${context.join("\n")}
      </context>
    `);
  }

  // Conhecimento acumulado
  if (knowledge?.length) {
    const knowledgeItems = knowledge
      .map(
        (k: KnowledgeItem, i: number) => `
      <knowledge-${i + 1}>
      <question>${k.question}</question>
      <answer>${k.answer}</answer>
      ${
        k.references?.length
          ? `<references>${JSON.stringify(k.references)}</references>`
          : ""
      }
      </knowledge-${i + 1}>
    `
      )
      .join("\n\n");
    sections.push(`
      <knowledge>
      Conhecimento reunido até agora:
      ${knowledgeItems}
      </knowledge>
    `);
  }

  // Tentativas anteriores falhas
  if (badContext?.length) {
    const attempts = badContext
      .map(
        (c: BadAttemptContext, i: number) => `
      <attempt-${i + 1}>
      - Question: ${c.question}
      - Answer: ${c.answer}
      - Reject Reason: ${c.evaluation}
      ${c.recap ? `- Actions Recap: ${c.recap}` : ""}
      ${c.blame ? `- Actions Blame: ${c.blame}` : ""}
      </attempt-${i + 1}>
    `
      )
      .join("\n\n");
    sections.push(`
      <bad-attempts>
      Tentativas fracassadas:
      ${attempts}
      </bad-attempts>
    `);
  }

  // Ações disponíveis
  if (allowRead && allURLs && Object.keys(allURLs).length > 0) {
    const urlList = sortSelectURLs(
      Object.entries(allURLs).map(
        ([url, desc]) =>
          ({
            url,
            merged: desc,
            score: 1, // Ajuste conforme necessário
          } as BoostedSearchSnippet)
      ),
      20
    );
    const urlListStr = urlList
      .map(
        (item: BoostedSearchSnippet, idx: number) =>
          `  - [idx=${idx + 1}] [weight=${item.score.toFixed(2)}] "${
            item.url
          }": "${item.merged.slice(0, 50)}"`
      )
      .join("\n");
    actionSections.push(`
      <action-visit>
      - Leia o conteúdo completo das URLs abaixo. Escolha as mais relevantes:
      <url-list>
      ${urlListStr}
      </url-list>
      ${
        isFiscalQuery
          ? "- Priorize fontes oficiais marcadas como FONTE OFICIAL"
          : ""
      }
      </action-visit>
    `);
  }

  if (allowSearch) {
    actionSections.push(`
      <action-search>
      - Use busca pública para resolver aspectos específicos
      - Forneça palavras-chave curtas
      ${
        isFiscalQuery
          ? `
      - Inclua "legislação", "portaria", "site:gov.br" quando aplicável
      - Use NCM entre aspas, ex: "9503.00.99"
      `
          : ""
      }
      </action-search>
    `);
  }

  if (allowAnswer) {
    actionSections.push(`
      <action-answer>
      - Responda com 96% de certeza em markdown:
        - **Resposta Direta**: Resposta clara
        - **Nota Detalhada**: Explicação
        - **Referências**: [Citação Exata](URL)
      ${allowReflect ? "- Use <action-reflect> se houver dúvidas" : ""}
      ${
        isFiscalQuery
          ? `
      - Especifique fonte legal, data de vigência, jurisdição, exceções e divergências
      `
          : ""
      }
      </action-answer>
    `);
  }

  if (beastMode) {
    actionSections.push(`
      <action-answer>
      - Qualquer resposta é melhor que nenhuma. Use suposições educadas se necessário, em markdown:
        - **Resposta Direta**: Resposta clara
        - **Nota Detalhada**: Explicação
        - **Referências**: [Citação Exata](URL)
      </action-answer>
    `);
  }

  if (allowReflect) {
    actionSections.push(`
      <action-reflect>
      - Identifique lacunas e formule perguntas curtas (< 20 palavras)
      ${
        isFiscalQuery
          ? `
      - Considere regimes fiscais, particularidades regionais, mudanças na legislação
      `
          : ""
      }
      </action-reflect>
    `);
  }

  sections.push(`
    Escolha uma ação:
    <actions>
    ${actionSections.join("\n\n")}
    </actions>
  `);

  sections.push(`
    Responda em JSON válido, incluindo "action" e "think".
  `);

  return removeExtraLineBreaks(sections.join("\n\n"));
}

// Contexto global
const allContext: StepAction[] = [];

// Atualiza o contexto
function updateContext(step: StepAction): void {
  allContext.push(step);
}

// Sanitiza texto
function sanitizeText(text: string): string {
  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  return decoder.decode(encoder.encode(text));
}

// Parseia JSON com correção
function attemptJSONParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    let fixed = text.trim();
    if (!fixed.endsWith("}")) fixed += "}";
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.error("Falha ao corrigir JSON:", text);
      throw e2;
    }
  }
}

// Captura saída do LLM
function captureLLMOutput(rawText: string): StepAction {
  return attemptJSONParse(sanitizeText(rawText)) as StepAction;
}

// Função principal do agente
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
  ensureModelClientInitialized();

  const context: TrackerContext = {
    tokenTracker:
      existingContext?.tokenTracker || new TokenTracker(tokenBudget),
    actionTracker:
      existingContext?.actionTracker ||
      new ActionTracker({ requestId: requestId || "default" }),
    outputs: existingContext?.outputs || [],
  };

  let step = 0;
  let totalStep = 0;
  let badAttempts = 0;
  const gaps: string[] = [question];
  const allQuestions: string[] = [question];
  const allKeywords: string[] = [];
  const allKnowledge: KnowledgeItem[] = [];
  const badContext: BadAttemptContext[] = [];
  const diaryContext: string[] = [];
  let allowAnswer = true;
  let allowSearch = true;
  let allowRead = true;
  let allowReflect = true;
  const allURLs: Record<string, string> = {};
  let thisStep: StepAction = {
    action: "answer",
    answer: "",
    references: [],
    think: "",
  };

  while (
    context.tokenTracker.getTotalUsage() < tokenBudget &&
    badAttempts <= maxBadAttempts
  ) {
    await sleep(STEP_SLEEP);
    step++;
    totalStep++;

    context.actionTracker.trackAction({
      totalStep,
      thisStep,
      gaps,
      badAttempts,
    });
    console.log(
      `Step ${totalStep} / Budget used ${(
        (context.tokenTracker.getTotalUsage() / tokenBudget) *
        100
      ).toFixed(2)}%`
    );
    allowReflect = allowReflect && gaps.length <= 1;
    const currentQuestion = gaps.shift() || question;
    allowRead = allowRead && Object.keys(allURLs).length > 0;
    allowSearch = allowSearch && Object.keys(allURLs).length < 200;

    const prompt = getPrompt(
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

    const isGeminiModel = modelConfigs.agent.model.startsWith("gemini-");
    const model = activeModelClient.getGenerativeModel({
      model: modelConfigs.agent.model,
      generationConfig: { temperature: modelConfigs.agent.temperature },
    });

    try {
      const result = await model.generateContent(
        isGeminiModel ? `${prompt}\n\nResponda apenas em JSON válido.` : prompt
      );
      const response = await result.response;
      let rawResponseText =
        typeof response.text === "function"
          ? await response.text()
          : response.text || "{}";

      if (isGeminiModel) {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/;
        const match = rawResponseText.match(jsonRegex);
        if (match) rawResponseText = match[1] || match[2];
      }

      context.tokenTracker.trackUsage(
        "agent",
        response.usageMetadata?.totalTokenCount || 0
      );
      thisStep = captureLLMOutput(rawResponseText);
      context.outputs.push({ step: totalStep, rawResponseText });

      if (thisStep.think && typeof thisStep.think === "string") {
        context.actionTracker.trackThink(thisStep.think);
      }

      updateContext(thisStep);
      context.actionTracker.trackAction({ thisStep });

      switch (thisStep.action) {
        case "answer": {
          const answerStep = thisStep as AnswerAction;
          if (answerStep.answer) {
            allKnowledge.push({
              question: currentQuestion,
              answer: answerStep.answer,
              references: answerStep.references || [],
              type: "qa",
              updated: new Date().toISOString(),
            });
          } else {
            const errorAnalysis = await analyzeSteps(diaryContext);
            const analysisResult = JSON.parse(errorAnalysis.analysis || "{}");
            badContext.push({
              question: currentQuestion,
              answer: answerStep.answer || "",
              evaluation: analysisResult.analysis || "Resposta inválida",
              recap: analysisResult.recap,
              blame: analysisResult.blame,
              improvement: analysisResult.improvement,
            });
            badAttempts++;
          }
          break;
        }
        case "reflect": {
          const reflectStep = thisStep as ReflectAction;
          if (reflectStep.questionsToAnswer) {
            const dedupResult = await dedupQueries(
              reflectStep.questionsToAnswer,
              allQuestions
            );
            const newGapQuestions = dedupResult.unique_queries;
            if (newGapQuestions.length > 0) {
              gaps.push(...newGapQuestions);
              allQuestions.push(...newGapQuestions);
              gaps.push(question);
            } else {
              allowReflect = false;
            }
          }
          break;
        }
        case "search": {
          const searchStep = thisStep as SearchAction;
          if (searchStep.searchQuery) {
            allKnowledge.push({
              question: `O que a internet diz sobre ${searchStep.searchQuery}?`,
              answer: searchStep.searchQuery,
              references: [],
              type: "side-info",
              updated: new Date().toISOString(),
            });
            allKeywords.push(searchStep.searchQuery);
          }
          break;
        }
        case "visit": {
          const visitStep = thisStep as VisitAction;
          if (visitStep.URLTargets) {
            allKnowledge.push({
              question: currentQuestion,
              answer: visitStep.URLTargets.join(", "),
              references: visitStep.URLTargets.map((url: string) => ({
                exactQuote: "",
                url,
              })),
              type: "url",
              updated: new Date().toISOString(),
            });
          }
          break;
        }
      }

      allowAnswer = allowReflect = allowRead = allowSearch = true;
    } catch (error) {
      console.error("Erro na geração:", error);
      thisStep = {
        action: "reflect",
        questionsToAnswer: ["Erro de geração"],
        think: `Erro: ${(error as Error).message}`,
      };
      badAttempts++;
    }
  }

  await storeContext(
    prompt,
    [allContext, allKeywords, allQuestions, allKnowledge],
    totalStep,
    requestId || question
  );

  if (badAttempts > maxBadAttempts) {
    console.log("Entrando no Beast Mode!");
    totalStep++;
    const beastPrompt = getPrompt(
      question,
      diaryContext,
      allQuestions,
      false,
      true,
      false,
      false,
      badContext,
      allKnowledge,
      allURLs,
      true
    );
    const model = activeModelClient.getGenerativeModel({
      model: modelConfigs.agentBeastMode.model,
      generationConfig: {
        temperature: modelConfigs.agentBeastMode.temperature,
      },
    });
    const result = await model.generateContent(beastPrompt);
    const response = await result.response;
    const rawResponseText =
      typeof response.text === "function"
        ? await response.text()
        : response.text || "{}";
    thisStep = captureLLMOutput(rawResponseText);
  }

  const audit = {
    logs: serverLogs,
    tokenUsage: context.tokenTracker.getTotalUsage(),
    steps: totalStep,
    errors: [],
  };

  return { result: thisStep, context, audit };
}

// Armazena o contexto
async function storeContext(
  prompt: string,
  memory: any[][],
  step: number,
  requestId: string
): Promise<void> {
  try {
    const queryDir = `queries/${requestId}`;
    await fs.mkdir(queryDir, { recursive: true });
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
    console.error(`Erro ao armazenar contexto para ${requestId}:`, error);
  }
}

// Função principal
export async function main(): Promise<void> {
  const question = process.argv[2] || "";
  const modelArg = process.argv[3];
  ensureModelClientInitialized(modelArg);
  const { result, context } = await getResponse(question);
  console.log("Final Answer:", (result as AnswerAction).answer);
  context.tokenTracker.printSummary();
  console.log("Modelo rodando:", modelConfigs.agent.model);
}

if (require.main === module) {
  main().catch(console.error);
}
