import { Request, Response } from "express";
import { ModuloDeepResearch, FastApiNCMResult } from "../modules/deepResearch";
import { ConsultaProduto } from "./ncm";
import {
  obterSugestoesGPT4,
  obterSugestoesClaude,
  obterSugestoesDeepseek,
  obterSugestoesQwen,
} from "./ncm";
import { TokenTracker } from "../utils/token-tracker";
import { StepResult, ResearchContext } from "../modules/deepResearch";
import { DeepResearch } from "../modules/deepResearch";
import { SchemaType } from "@google/generative-ai";
import fs from "fs/promises";

// Interface personalizada para estender o Request do Express
interface CustomRequest extends Request {
  fastApiResult?: FastApiNCMResult | null;
}

// Classe base com funcionalidades comuns
abstract class BaseDeepResearch extends DeepResearch {
  /**
   * Extrai o último JSON válido de uma string
   */
  protected extractLastJSON(text: string): string {
    const matches = text.match(/\{(?:[^{}]|{[^{}]*})*\}/g);
    if (!matches) {
      throw new Error("Nenhum JSON válido encontrado na resposta");
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      try {
        const jsonCandidate = matches[i];
        JSON.parse(jsonCandidate);
        return jsonCandidate;
      } catch (e) {
        console.log(
          `Tentativa de parsing JSON falhou para candidato ${i + 1}/${
            matches.length
          }`
        );
        continue;
      }
    }

    console.warn(
      "Todos os JSON candidatos falharam no parsing. Criando JSON de fallback..."
    );
    return JSON.stringify({
      action: "answer",
      think: "Não foi possível extrair o raciocínio original.",
      answer: "Não foi possível processar a resposta do modelo corretamente.",
      references: [],
    });
  }

  /**
   * Normaliza a ação para um formato padrão
   */
  protected normalizeAction(action: string): string {
    const normalized = action
      .toLowerCase()
      .replace(/^action[-_]?/, "")
      .replace(/[-_]?action$/, "")
      .replace(/^query[-_]?/, "")
      .replace(/[-_]?query$/, "");

    const actionMap: { [key: string]: string } = {
      search: "search",
      answer: "answer",
      reflect: "reflect",
      visit: "visit",
    };

    return actionMap[normalized] || action;
  }

  /**
   * Valida e processa a resposta do modelo
   */
  protected async processModelResponse(
    rawContent: string
  ): Promise<StepResult> {
    // Log detalhado da resposta bruta antes do processamento
    try {
      const logMessage = `[${new Date().toISOString()}] processModelResponse received rawContent:
${rawContent}
---
`;
      await fs.appendFile("deep_research_debug.log", logMessage);
    } catch (logError) {
      console.error("Erro ao escrever no log de depuração:", logError);
      // Não interrompe o fluxo principal se o log falhar
    }

    try {
      const jsonContent = this.extractLastJSON(rawContent);
      let content = JSON.parse(jsonContent);

      // Normaliza a ação se necessário
      if (content.action) {
        // Verificar se action é uma string antes de chamar toLowerCase
        if (typeof content.action !== "string") {
          console.warn(
            `[${new Date().toISOString()}] Ação recebida não é uma string: ${JSON.stringify(
              content.action
            )}`
          );
          // Lógica de fallback segura - poderia ser ajustada se necessário
          // Tentativa de normalizar mesmo assim, ou definir um padrão
          try {
            const normalizedAction = this.normalizeAction(
              String(content.action)
            ); // Tenta converter para string
            if (normalizedAction !== String(content.action)) {
              console.log(
                `Normalizando ação (convertida) de "${String(
                  content.action
                )}" para "${normalizedAction}"`
              );
              content.action = normalizedAction;
            }
          } catch (normalizationError) {
            console.error(
              "Erro ao tentar normalizar ação não-string:",
              normalizationError
            );
            content.action = "search"; // Define um padrão seguro em caso de falha total
          }
        } else {
          // Processamento normal para string
          const normalizedAction = this.normalizeAction(content.action);
          if (normalizedAction !== content.action) {
            console.log(
              `Normalizando ação de "${content.action}" para "${normalizedAction}"`
            );
            content.action = normalizedAction;
          }
        }
      } else {
        console.warn(
          `[${new Date().toISOString()}] Campo 'action' ausente na resposta processada: ${jsonContent}`
        );
        // Definir uma ação padrão se 'action' estiver ausente
        content.action = "answer"; // Ou 'search', dependendo do comportamento desejado
      }

      // Validação do formato da ação (agora mais robusta)
      if (
        !content.action ||
        !["search", "answer", "reflect", "visit"].includes(content.action)
      ) {
        const errorMsg = `Ação inválida ou ausente: ${content.action}`;
        console.error(`[${new Date().toISOString()}] ${errorMsg}`);
        return {
          success: false,
          content: null,
          error: errorMsg,
        };
      }

      // Validação dos campos obrigatórios
      if (content.action === "search" && !content.searchQuery) {
        const errorMsg = "Campo searchQuery é obrigatório para ação search";
        console.error(`[${new Date().toISOString()}] ${errorMsg}`);
        return {
          success: false,
          content: null,
          error: errorMsg,
        };
      }

      return {
        success: true,
        content: JSON.stringify(content),
        error: null,
      };
    } catch (parseError) {
      console.error(
        `[${new Date().toISOString()}] Erro ao processar JSON:`,
        parseError
      );
      console.log(`[${new Date().toISOString()}] Conteúdo recebido que causou erro:
${rawContent}
---`);
      return {
        success: false,
        content: null,
        error: "Resposta não está no formato JSON esperado",
      };
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo GPT-4
class DeepResearchGPT4 extends BaseDeepResearch {
  async initialize(): Promise<void> {
    // Inicialização específica para GPT-4
  }

  async processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult> {
    try {
      const consultaPreparada = {
        ...this.consulta,
        consulta: context.productDescription,
      };
      const resultado = await obterSugestoesGPT4(consultaPreparada);
      return this.processModelResponse(JSON.stringify(resultado));
    } catch (error) {
      console.error("Erro ao processar DeepResearch com GPT-4:", error);
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo Claude
class DeepResearchClaude extends BaseDeepResearch {
  async initialize(): Promise<void> {
    // Inicialização específica para Claude
  }

  async processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult> {
    try {
      const consultaPreparada = {
        ...this.consulta,
        consulta: context.productDescription,
      };
      const resultado = await obterSugestoesClaude(consultaPreparada);
      return this.processModelResponse(JSON.stringify(resultado));
    } catch (error) {
      console.error("Erro ao processar DeepResearch com Claude:", error);
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo Deepseek
class DeepResearchDeepseek extends BaseDeepResearch {
  async initialize(): Promise<void> {
    // Inicialização específica para Deepseek
  }

  async processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult> {
    try {
      const consultaPreparada = {
        ...this.consulta,
        consulta: context.productDescription,
      };
      const resultado = await obterSugestoesDeepseek(consultaPreparada);
      return this.processModelResponse(JSON.stringify(resultado));
    } catch (error) {
      console.error("Erro ao processar DeepResearch com Deepseek:", error);
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Classe específica que herda do módulo base e implementa para o modelo Qwen
class DeepResearchQwen extends BaseDeepResearch {
  async initialize(): Promise<void> {
    // Inicialização específica para Qwen
  }

  async processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult> {
    try {
      const consultaPreparada = {
        ...this.consulta,
        consulta: context.productDescription,
      };
      const resultado = await obterSugestoesQwen(consultaPreparada);
      return this.processModelResponse(JSON.stringify(resultado));
    } catch (error) {
      console.error("Erro ao processar DeepResearch com Qwen:", error);
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Classe específica que herda do módulo base e implementa para os modelos Gemini
class DeepResearchGemini extends BaseDeepResearch {
  private model: any;

  async initialize(): Promise<void> {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "GOOGLE_API_KEY não encontrada no ambiente. Verifique o arquivo .env"
        );
      }

      console.log(
        "Inicializando modelo Gemini com a chave de API fornecida..."
      );
      const genAI = new GoogleGenerativeAI(apiKey);

      // Define o schema da resposta esperada no formato do LocalModelClient
      const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["search", "answer", "reflect", "visit"],
            description: "Tipo de ação a ser executada",
          },
          think: {
            type: SchemaType.STRING,
            description: "Raciocínio sobre a próxima ação",
          },
          searchQuery: {
            type: SchemaType.STRING,
            description: "Consulta de busca quando a ação é 'search'",
          },
          answer: {
            type: SchemaType.STRING,
            description: "Resposta final quando a ação é 'answer'",
          },
          references: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                exactQuote: { type: SchemaType.STRING },
                url: { type: SchemaType.STRING },
              },
              required: ["exactQuote", "url"],
            },
            description: "Referências que suportam a resposta",
          },
          questionsToAnswer: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description:
              "Lista de questões importantes para preencher lacunas de conhecimento",
          },
          ncm: {
            type: SchemaType.STRING,
            description: "Código NCM identificado",
          },
          descricao: {
            type: SchemaType.STRING,
            description: "Descrição do produto",
          },
          atributos: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Atributos do produto",
          },
          impostos: {
            type: SchemaType.OBJECT,
            properties: {
              ipi: { type: SchemaType.STRING },
              icms: {
                type: SchemaType.OBJECT,
                properties: { SP: { type: SchemaType.STRING } },
              },
              pis: { type: SchemaType.STRING },
              cofins: { type: SchemaType.STRING },
            },
            description: "Informações sobre impostos",
          },
        },
        required: ["action", "think"],
      };

      this.model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: responseSchema as any,
        },
      });

      console.log("Modelo Gemini inicializado com sucesso!");
    } catch (error) {
      console.error("Erro ao inicializar modelo Gemini:", error);
      throw error;
    }
  }

  async processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult> {
    const systemMessage = `Você é um assistente especializado em classificação fiscal, focado em análise detalhada de produtos para determinar sua classificação NCM correta.

IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido seguindo exatamente este formato:
{
  "action": "answer",
  "think": "Seu raciocínio detalhado aqui",
  "answer": "Resposta detalhada aqui",
  "references": [
    {
      "exactQuote": "Citação exata da fonte",
      "url": "URL da fonte"
    }
  ],
  "ncm": "código NCM",
  "descricao": "descrição do produto",
  "atributos": ["array de strings com atributos"],
  "impostos": {
    "ipi": "string (alíquota)",
    "icms": { "SP": "string (alíquota)" },
    "pis": "string (alíquota)",
    "cofins": "string (alíquota)"
  }
}

Se precisar fazer uma busca adicional, use:
{
  "action": "search",
  "think": "Seu raciocínio aqui",
  "searchQuery": "sua query de busca aqui"
}

Se precisar refletir sobre o problema, use:
{
  "action": "reflect",
  "think": "Seu raciocínio aqui",
  "questionsToAnswer": ["pergunta 1", "pergunta 2", "pergunta 3"]
}`;

    const prompt = this.getPromptForStep(step, context);
    const fullPrompt = `${systemMessage}\n\n${prompt}\n\nLembre-se: Responda APENAS com o JSON, sem nenhum texto adicional.`;

    try {
      const response = await this.model.generateContent(fullPrompt);
      const rawContent = response.response.text();

      // Atualiza o contador de tokens
      if (response.response?.promptFeedback?.tokenCount) {
        this.tokenTracker.addTokens(
          "gemini-1.5-pro",
          response.response.promptFeedback.tokenCount
        );
      }

      // Extrai e processa o JSON
      return this.processModelResponse(rawContent);
    } catch (error) {
      console.error("Erro ao processar step:", error);
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Factory para criar instâncias dos diferentes modelos de DeepResearch
export const modelFactory = (
  modelName: string,
  tokenTracker: TokenTracker,
  fastApiData: FastApiNCMResult | null,
  consulta: ConsultaProduto
): DeepResearch => {
  switch (modelName.toLowerCase()) {
    case "gpt4":
      return new DeepResearchGPT4(tokenTracker, fastApiData, consulta);
    case "claude":
      return new DeepResearchClaude(tokenTracker, fastApiData, consulta);
    case "deepseek":
      return new DeepResearchDeepseek(tokenTracker, fastApiData, consulta);
    case "qwen":
      return new DeepResearchQwen(tokenTracker, fastApiData, consulta);
    case "gemini-1.5-flash":
    case "gemini-1.5-pro":
    case "gemini-2.0-flash":
      return new DeepResearchGemini(tokenTracker, fastApiData, consulta);
    default:
      throw new Error(`Modelo não suportado: ${modelName}`);
  }
};

/**
 * Controlador para processamento DeepResearch de consultas NCM
 *
 * @param req Requisição Express com dados da FastAPI e consulta original
 * @param res Resposta Express
 */
export async function processarDeepResearch(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const startTime = Date.now();
  try {
    // Extrai parâmetros da requisição
    const consultaParams = req.body as ConsultaProduto;
    const fastApiResult = req.fastApiResult as FastApiNCMResult | null;
    const { modelo } = consultaParams;

    console.log(
      `Iniciando processamento DeepResearch para NCM com modelo: ${modelo}`
    );

    // Cria uma instância do TokenTracker
    const tokenTracker = new TokenTracker();

    // Verifica se o modelo é válido
    const modeloNormalizado = modelo.toLowerCase();
    const modeloMapeado = {
      "nex-0.1-pro-2024": "gpt4",
      "nex-0.3-preview-2024": "claude",
      "nex-0.5-preview-2025": "deepseek",
      "qwen2.5-7b-instruct-1m": "qwen",
      "gemini-1.5-flash": "gemini-1.5-flash",
      "gemini-1.5-pro": "gemini-1.5-pro",
      "gemini-2.0-flash": "gemini-2.0-flash",
      "nexcode-0.1-beta": "gemini-1.5-pro",
    }[modeloNormalizado];

    if (!modeloMapeado) {
      res.status(400).json({
        status_code: 400,
        errors: [
          {
            loc: ["body", "modelo"],
            msg: "Modelo não encontrado ou inválido para DeepResearch",
            type: "error.invalid_value",
            ctx: { valor_fornecido: modelo },
          },
        ],
        message: "Modelo não encontrado ou inválido para DeepResearch",
        error_type: "invalid_value",
      });
      return;
    }

    // 1. Utiliza o factory para criar o módulo adequado
    const moduloDeepResearch = modelFactory(
      modeloMapeado,
      tokenTracker,
      fastApiResult,
      consultaParams
    );

    // 2. Executa a análise profunda
    const resultadoEnriquecido = await moduloDeepResearch.analisar();

    // 3. Calcula o tempo decorrido
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000; // em segundos

    // Log de duração da consulta
    console.log(
      `Consulta DeepResearch NCM concluída em ${elapsedTime.toFixed(
        2
      )}s (modelo: ${modelo})`
    );

    // 4. Retorna a resposta enriquecida
    res.status(200).json({
      ...resultadoEnriquecido,
      _meta: {
        processamento: "deep_research",
        tempo_processamento: elapsedTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro no processamento DeepResearch:", error);
    res.status(500).json({
      status_code: 500,
      errors: [
        {
          loc: ["server", "deepResearch"],
          msg: `Erro no processamento DeepResearch: ${error}`,
          type: "error.server_error",
        },
      ],
      message: "Erro ao processar a consulta no modo DeepResearch",
      error_type: "server_error",
    });
  }
}
