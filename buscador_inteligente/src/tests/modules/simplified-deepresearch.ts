import { EventEmitter } from "events";
import { FastApiNCMResult, ConsultaProduto } from "../../types/globalTypes";

// Implementação simplificada do TokenTracker para testes
export class TokenTracker extends EventEmitter {
  private usage: Record<string, number> = {};

  constructor() {
    super();
  }

  addTokens(modelName: string, count: number): void {
    if (!this.usage[modelName]) {
      this.usage[modelName] = 0;
    }
    this.usage[modelName] += count;
    this.emit("tokensAdded", { modelName, count });
  }

  getUsageByModel(modelName?: string): Record<string, number> {
    if (modelName) {
      return { [modelName]: this.usage[modelName] || 0 };
    }
    return { ...this.usage };
  }

  resetUsage(): void {
    this.usage = {};
    this.emit("usageReset");
  }

  registerTokenUsage(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): void {
    const totalTokens = promptTokens + completionTokens;
    this.addTokens(model, totalTokens);
  }
}

// Interface para resultados de etapas
export interface StepResult {
  success: boolean;
  content: string | null;
  error: string | null;
}

// Interface para contexto de pesquisa
export interface ResearchContext {
  productDescription: string;
  currentStep: number;
  previousResponses: string[];
}

// Classe base para DeepResearch
export abstract class DeepResearch {
  protected tokenTracker: TokenTracker;
  protected fastApiData: FastApiNCMResult | null;
  protected consulta: ConsultaProduto;

  constructor(
    tokenTracker: TokenTracker,
    fastApiData: FastApiNCMResult | null,
    consulta: ConsultaProduto
  ) {
    this.tokenTracker = tokenTracker;
    this.fastApiData = fastApiData;
    this.consulta = consulta;
  }

  abstract initialize(): Promise<void>;
  abstract processStep(
    step: number,
    context: ResearchContext
  ): Promise<StepResult>;

  protected getPromptForStep(step: number, context: ResearchContext): string {
    const basePrompt = `Analise o produto: "${context.productDescription}"`;

    switch (step) {
      case 1:
        return `${basePrompt}\n\nIdentifique o código NCM mais apropriado para este produto. Forneça o código e uma breve justificativa.`;
      case 2:
        return `${basePrompt}\n\nDescreva detalhadamente as características do produto que justificam sua classificação no NCM identificado.`;
      case 3:
        return `${basePrompt}\n\nDetalhe a tributação aplicável a este produto (IPI, ICMS, PIS, COFINS).`;
      case 4:
        return `${basePrompt}\n\nIdentifique atributos específicos do produto que possam impactar sua classificação fiscal.`;
      case 5:
        return `${basePrompt}\n\nForneça uma conclusão final sobre a classificação, incluindo recomendações e observações importantes.`;
      default:
        throw new Error(`Passo ${step} não definido no processo de pesquisa.`);
    }
  }

  async analisar(): Promise<any> {
    try {
      await this.initialize();

      const context: ResearchContext = {
        productDescription: this.consulta.consulta || "",
        currentStep: 1,
        previousResponses: [],
      };

      const results: StepResult[] = [];

      // Executa cada passo do processo
      for (let step = 1; step <= 5; step++) {
        context.currentStep = step;
        const result = await this.processStep(step, context);

        if (!result.success) {
          console.error(`Erro no passo ${step}:`, result.error);
          break;
        }

        if (result.content) {
          context.previousResponses.push(result.content);
        }

        results.push(result);
      }

      // Processa os resultados
      return this.processResults(results);
    } catch (error) {
      console.error("Erro na análise:", error);
      throw error;
    }
  }

  protected processResults(results: StepResult[]): FastApiNCMResult {
    // Implementação base que pode ser sobrescrita pelos modelos específicos
    const ncmResult: FastApiNCMResult = {
      ncm_code: "",
      description: "",
      attributes: {},
      taxation: {
        ipi: 0,
        icms: 0,
        pis: 0,
        cofins: 0,
        import_tax: 0,
      },
      conclusion: "",
      confidence: 0,
      model_used: this.consulta.modelo || "",
      processing_time: 0,
    };

    // Processa cada resultado
    results.forEach((result, index) => {
      if (result.success && result.content) {
        try {
          const content = JSON.parse(result.content);
          switch (index + 1) {
            case 1: // NCM e descrição inicial
              ncmResult.ncm_code = content.ncm_code || content.ncm || "";
              ncmResult.description = content.description || "";
              break;
            case 2: // Características
              ncmResult.attributes = content.attributes || {};
              break;
            case 3: // Tributação
              ncmResult.taxation = content.taxation || ncmResult.taxation;
              break;
            case 4: // Atributos específicos
              Object.assign(ncmResult.attributes, content.attributes || {});
              break;
            case 5: // Conclusão
              ncmResult.conclusion = content.conclusion || "";
              ncmResult.confidence = content.confidence || 0;
              break;
          }
        } catch (error) {
          console.error(
            `Erro ao processar resultado do passo ${index + 1}:`,
            error
          );
        }
      }
    });

    return ncmResult;
  }
}

// Implementação simplificada do modelo Gemini para testes
export class DeepResearchGemini extends DeepResearch {
  private model: any;

  async initialize(): Promise<void> {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      // Verifica se a chave de API existe
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

      this.model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
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
    const systemMessage =
      "Você é um assistente especializado em classificação fiscal, focado em análise detalhada de produtos para determinar sua classificação NCM correta. IMPORTANTE: Responda SEMPRE em formato JSON válido.";
    let prompt = this.getPromptForStep(step, context);

    // Adicionar instruções específicas para formato JSON
    prompt +=
      "\n\nIMPORTANTE: Sua resposta deve ser APENAS um objeto JSON válido, sem texto adicional, seguindo este formato:";

    switch (step) {
      case 1:
        prompt += `\n{
  "ncm_code": "código NCM no formato XXXX.XX.XX",
  "description": "descrição oficial do NCM"
}`;
        break;
      case 2:
        prompt += `\n{
  "attributes": {
    "material": "material principal",
    "tipo": "tipo do produto",
    "uso": "finalidade de uso",
    "outras_caracteristicas": "outras características relevantes"
  }
}`;
        break;
      case 3:
        prompt += `\n{
  "taxation": {
    "ipi": número (percentual),
    "icms": número (percentual),
    "pis": número (percentual),
    "cofins": número (percentual),
    "import_tax": número (percentual)
  }
}`;
        break;
      case 4:
        prompt += `\n{
  "attributes": {
    "atributo1": "valor1",
    "atributo2": "valor2"
  }
}`;
        break;
      case 5:
        prompt += `\n{
  "conclusion": "conclusão sobre a classificação",
  "confidence": número entre 0 e 1 (nível de confiança)
}`;
        break;
    }

    const fullPrompt = `${systemMessage}\n\n${prompt}`;

    try {
      const response = await this.model.generateContent(fullPrompt);
      let content = response.response.text();

      // Tentar extrair JSON se a resposta não for um JSON puro
      if (content && !content.trim().startsWith("{")) {
        const jsonMatch =
          content.match(/```json\s*([\s\S]*?)\s*```/) ||
          content.match(/```\s*([\s\S]*?)\s*```/) ||
          content.match(/\{[\s\S]*\}/);

        if (jsonMatch && jsonMatch[1]) {
          content = jsonMatch[1].trim();
        } else {
          console.warn(
            "Não foi possível extrair JSON da resposta. Tentando processar como texto."
          );
          // Criar um JSON básico com o texto como conteúdo
          if (step === 1) {
            // Tentar extrair código NCM do texto
            const ncmMatch = content.match(/\d{4}\.\d{2}\.\d{2}/);
            content = JSON.stringify({
              ncm_code: ncmMatch ? ncmMatch[0] : "",
              description: content.substring(0, 100), // Primeiros 100 caracteres como descrição
            });
          } else {
            content = JSON.stringify({
              content: content.substring(0, 100),
            });
          }
        }
      }

      // Atualiza o contador de tokens
      if (response.response?.promptFeedback?.tokenCount) {
        this.tokenTracker.addTokens(
          "gemini-1.5-pro",
          response.response.promptFeedback.tokenCount
        );
      }

      return {
        success: true,
        content,
        error: null,
      };
    } catch (error) {
      console.error(`Erro no passo ${step}:`, error);
      return {
        success: false,
        content: null,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  }
}

// Implementação do modelFactory para testes
export const modelFactory = (
  modelName: string,
  tokenTracker: TokenTracker,
  fastApiData: FastApiNCMResult | null,
  consulta: ConsultaProduto
): DeepResearch => {
  // Por enquanto, apenas retornamos o modelo Gemini para simplificar
  return new DeepResearchGemini(tokenTracker, fastApiData, consulta);
};
