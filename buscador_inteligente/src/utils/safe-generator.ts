import * as z from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { TokenTracker } from "./token-tracker";
import { getModel, ToolName } from "../config";

interface ModelInstance {
  generateContent: (prompt: string) => Promise<{
    response: {
      text: () => string;
      usageMetadata?: { totalTokenCount: number };
    };
  }>;
}

interface GenerateObjectResult<T> {
  object: T;
  usage: number;
}

interface GenerateOptions<T> {
  model: ToolName;
  schema: z.ZodType<T>;
  prompt: string;
}

export class ObjectGeneratorSafe {
  private tokenTracker: TokenTracker;
  private maxRetries = 3;

  constructor(tokenTracker?: TokenTracker) {
    this.tokenTracker = tokenTracker || new TokenTracker();
  }

  async generateObject<T>(
    options: GenerateOptions<T>
  ): Promise<GenerateObjectResult<T>> {
    const { model, schema, prompt } = options;
    const modelInstance = getModel(model) as ModelInstance;
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        const response = await modelInstance.generateContent(prompt);
        const rawText =
          typeof response.response.text === "function"
            ? response.response.text()
            : response.response.text;

        try {
          const parsed = JSON.parse(rawText);
          const validatedObject = schema.parse(parsed);

          return {
            object: validatedObject,
            usage: response.response.usageMetadata?.totalTokenCount || 0,
          };
        } catch (parseError) {
          // Se falhar no parse JSON ou validação, tenta extrair JSON válido do texto
          const extractedJson = this.extractJsonFromText(rawText);
          if (extractedJson) {
            const validatedObject = schema.parse(extractedJson);
            return {
              object: validatedObject,
              usage: response.response.usageMetadata?.totalTokenCount || 0,
            };
          }

          // Se ainda falhar, tenta novamente com prompt modificado
          attempts++;
          if (attempts < this.maxRetries) {
            let modifiedPrompt = this.getRepairPrompt(prompt, rawText, schema);
            console.log(`preciso que mude o prompt: ${modifiedPrompt}`);
            continue;
          }
        }
      } catch (error) {
        attempts++;
        if (attempts >= this.maxRetries) {
          throw error;
        }
      }
    }

    throw new Error("Failed to generate valid object after maximum retries");
  }

  private extractJsonFromText(text: string): any | null {
    const jsonRegex = /{[\s\S]*}/;
    const match = text.match(jsonRegex);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }

  private getRepairPrompt(
    originalPrompt: string,
    failedResponse: string,
    schema: z.ZodType<any>
  ): string {
    const jsonSchema = zodToJsonSchema(schema as any);
    return `${originalPrompt}

Previous response was invalid. Please provide a response in the following JSON format:
${JSON.stringify(jsonSchema, null, 2)}

Failed response was:
${failedResponse}

Please fix the format and try again.`;
  }

  private async processResponse<T>(response: any): Promise<T> {
    try {
      // Verificar se text é uma função ou uma propriedade
      const rawText =
        typeof response.response.text === "function"
          ? response.response.text()
          : response.response.text;

      // Analisar o texto para obter o JSON
      const parsed = JSON.parse(rawText);
      return parsed as T;
    } catch (error) {
      throw error;
    }
  }
}
