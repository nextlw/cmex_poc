import { z } from "zod";
import { TokenTracker } from "./token-tracker";
import { Schema } from "@google/generative-ai";
import { zodSchemas } from "./zod-schemas";
import { modelConfigs } from "../config";

/**
 * Interface para o resultado da geração de objetos
 */
interface GenerateObjectResult<T> {
  object: T;
  usage: number;
}

/**
 * Interface para as opções de geração de objetos
 */
interface GenerateOptions<T> {
  model: string;
  schema: z.ZodType<T> | Schema;
  prompt?: string;
  system?: string;
  messages?: Array<{ role: string; content: string }>;
}

/**
 * Classe responsável por gerar objetos a partir de modelos de linguagem
 * com validação segura usando Zod.
 */
export class SafeObjectGenerator {
  private tokenTracker: TokenTracker;
  private activeModelClient: any; // Tipo do cliente do modelo

  /**
   * Construtor para a classe SafeObjectGenerator
   * @param tokenTracker Rastreador de tokens para monitorar o uso
   * @param modelClient Cliente do modelo de linguagem
   */
  constructor(tokenTracker: TokenTracker, modelClient: any) {
    this.tokenTracker = tokenTracker;
    this.activeModelClient = modelClient;
  }

  /**
   * Gera um objeto a partir de um modelo de linguagem
   * @param options Opções para a geração do objeto
   * @returns O objeto gerado e informações de uso
   */
  async generateObject<T>(
    options: GenerateOptions<T>
  ): Promise<GenerateObjectResult<T>> {
    const { model, schema, prompt, system, messages } = options;

    try {
      // Determina se estamos usando um modelo Gemini
      const isGeminiModel = model.startsWith("gemini-");
      const clientModel = this.activeModelClient.getGenerativeModel({
        model,
        generationConfig: {
          temperature: modelConfigs.agent.temperature,
          responseMimeType: "application/json",
          // Se o schema for um ZodType, converta para Google Schema
          responseSchema:
            schema instanceof z.ZodType
              ? zodSchemas.convertToGoogleSchema(schema)
              : schema,
        },
      });

      // Constrói o prompt adequado para o tipo de modelo
      let finalPrompt = "";
      if (system && prompt) {
        finalPrompt = `${system}\n\n${prompt}`;
      } else if (system) {
        finalPrompt = system;
      } else if (prompt) {
        finalPrompt = prompt;
      }

      // Adiciona instruções específicas para modelos Gemini
      if (isGeminiModel) {
        finalPrompt +=
          "\n\nIMPORTANTE: Responda APENAS com um objeto JSON válido seguindo o formato especificado. Não inclua texto adicional ou explicações fora do JSON.";
      }

      // Gera o conteúdo com o modelo
      const result = await clientModel.generateContent(
        messages?.length ? messages : finalPrompt
      );
      const response = await result.response;

      // Processa a resposta como texto
      let rawResponseText = "";
      try {
        if (typeof response.text === "function") {
          rawResponseText = await response.text();
        } else if (response.text !== undefined) {
          rawResponseText = response.text;
        } else if (typeof response.toString === "function") {
          rawResponseText = response.toString();
        } else {
          rawResponseText = JSON.stringify(response);
        }
      } catch (error) {
        console.error("Erro ao acessar texto da resposta:", error);
        rawResponseText = "{}";
      }

      // Para modelos Gemini, extraímos JSON da resposta
      if (isGeminiModel) {
        const jsonRegex = /```json\s*([\s\S]*?)\s*```|(\{[\s\S]*\})/;
        const match = rawResponseText.match(jsonRegex);
        if (match) {
          rawResponseText = match[1] || match[2];
        }
      }

      // Analisa a resposta como JSON
      let parsedObject: any;
      try {
        parsedObject = JSON.parse(rawResponseText);
      } catch (parseError) {
        // Tenta extrair JSON de uma string que pode não estar formatada corretamente
        const jsonPattern = /\{[^]*\}/;
        const extracted = rawResponseText.match(jsonPattern);

        if (extracted) {
          try {
            parsedObject = JSON.parse(extracted[0]);
          } catch (secondError) {
            console.error("Falha ao extrair e analisar JSON:", secondError);
            throw new Error(
              `Resposta não é um JSON válido: ${rawResponseText}`
            );
          }
        } else {
          throw new Error(`Resposta não contém JSON: ${rawResponseText}`);
        }
      }

      // Valida o objeto com Zod se o schema for um ZodType
      if (schema instanceof z.ZodType) {
        try {
          const validatedObject = schema.parse(parsedObject);
          return {
            object: validatedObject as T,
            usage: response.usageMetadata?.totalTokenCount || 0,
          };
        } catch (validationError) {
          console.error("Erro de validação Zod:", validationError);

          // Em caso de erro de validação, tenta uma recuperação parcial
          return {
            object: parsedObject as T,
            usage: response.usageMetadata?.totalTokenCount || 0,
          };
        }
      }

      // Se não for um schema Zod, retorna diretamente
      return {
        object: parsedObject as T,
        usage: response.usageMetadata?.totalTokenCount || 0,
      };
    } catch (error) {
      console.error(`Erro ao gerar objeto com modelo '${model}':`, error);
      throw error;
    }
  }
}
