import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Schema, SchemaType } from "@google/generative-ai";
import { EvaluationType } from "../types";

// Constantes
export const MAX_URLS_PER_STEP = 4;
export const MAX_QUERIES_PER_STEP = 7;
export const MAX_REFLECT_PER_STEP = 3;

/**
 * Classe que gerencia schemas para validação de dados através da biblioteca Zod.
 * Esta classe permite criar schemas dinâmicos que podem ser convertidos para JSON Schema
 * para uso com diferentes modelos de linguagem.
 */
export class ZodSchemas {
  private languageStyle: string = "formal Portuguese";
  public languageCode: string = "pt-BR";

  /**
   * Define o estilo de linguagem e o código do idioma a ser usado nos schemas
   * @param style O estilo de linguagem a ser usado
   * @param code O código do idioma (ISO)
   */
  setLanguage(style: string, code: string = "pt-BR") {
    this.languageStyle = style;
    this.languageCode = code;
    console.log(`Idioma e estilo definidos: ${code} (${style})`);
  }

  /**
   * Retorna uma string de prompt para o estilo de linguagem atual
   */
  getLanguagePrompt() {
    return `Deve usar a primeira pessoa em "${this.languageCode}"; no estilo de "${this.languageStyle}".`;
  }

  /**
   * Cria um schema para o gerador de código
   * @returns Schema Zod para validação de código gerado
   */
  getCodeGeneratorSchema(): z.ZodObject<any> {
    return z.object({
      think: z
        .string()
        .describe(
          `Explicação breve ou comentários sobre o processo de pensamento por trás do código. ${this.getLanguagePrompt()}`
        )
        .max(200),
      code: z
        .string()
        .describe(
          "O código JavaScript que resolve o problema e sempre usa a declaração 'return' para retornar o resultado. Concentre-se em resolver o problema principal; Não há necessidade de tratamento de erros ou blocos try-catch ou comentários de código. Não há necessidade de declarar variáveis que já estão disponíveis, especialmente strings ou arrays longos."
        ),
    });
  }

  /**
   * Cria um schema para análise de erros
   * @returns Schema Zod para validação de análise de erros
   */
  getErrorAnalysisSchema(): z.ZodObject<any> {
    return z.object({
      recap: z
        .string()
        .describe(
          "Recapitulação das ações tomadas e das etapas conduzidas em narrativa de primeira pessoa."
        )
        .max(500),
      blame: z
        .string()
        .describe(
          `Qual ação ou etapa foi a causa raiz da rejeição da resposta. ${this.getLanguagePrompt()}`
        )
        .max(500),
      improvement: z
        .string()
        .describe(
          `Sugestão de melhoria chave para a próxima iteração, não use marcadores, seja conciso e direto. ${this.getLanguagePrompt()}`
        )
        .max(500),
      questionsToAnswer: z
        .array(
          z
            .string()
            .describe(
              "cada pergunta deve ser uma única linha, concisa e clara. não composta ou complexa, menos de 20 palavras."
            )
        )
        .max(MAX_REFLECT_PER_STEP)
        .describe(
          `Lista das perguntas de reflexão mais importantes para preencher as lacunas de conhecimento. Forneça no máximo ${MAX_REFLECT_PER_STEP} perguntas de reflexão.`
        ),
    });
  }

  /**
   * Cria um schema para reescrita de consultas
   * @returns Schema Zod para validação de reescrita de consultas
   */
  getQueryRewriterSchema(): z.ZodObject<any> {
    return z.object({
      think: z
        .string()
        .describe(
          `Explique por que você escolheu essas consultas de pesquisa. ${this.getLanguagePrompt()}`
        )
        .max(500),
      queries: z
        .array(
          z
            .string()
            .describe(
              "consulta de pesquisa baseada em palavras-chave, preferidas 2-3 palavras, comprimento total < 30 caracteres"
            )
        )
        .min(1)
        .max(MAX_QUERIES_PER_STEP)
        .describe(
          `'Array de consultas de palavras-chave de pesquisa, ortogonais entre si. Máximo ${MAX_QUERIES_PER_STEP} consultas permitidas.'`
        ),
    });
  }

  /**
   * Cria um schema para avaliação de respostas
   * @param evalType O tipo de avaliação a ser realizada
   * @returns Schema Zod para validação de avaliação
   */
  getEvaluatorSchema(evalType: EvaluationType): z.ZodObject<any> {
    const baseSchemaBefore = {
      think: z
        .string()
        .describe(
          `Explicação do processo de pensamento por que a resposta não passa na avaliação, ${this.getLanguagePrompt()}`
        )
        .max(500),
    };
    const baseSchemaAfter = {
      pass: z
        .boolean()
        .describe("Se a resposta passa no teste definido pelo avaliador"),
    };

    switch (evalType) {
      case "definitive":
        return z.object({
          type: z.literal("definitive"),
          ...baseSchemaBefore,
          ...baseSchemaAfter,
        });
      case "freshness":
        return z.object({
          type: z.literal("freshness"),
          ...baseSchemaBefore,
          freshness_analysis: z.object({
            dates_mentioned: z.array(z.string()),
            current_time: z.string(),
            likely_outdated: z.boolean(),
            max_age_days: z.number().optional(),
          }),
          ...baseSchemaAfter,
        });
      case "plurality":
        return z.object({
          type: z.literal("plurality"),
          ...baseSchemaBefore,
          plurality_analysis: z.object({
            expects_multiple: z.boolean(),
            provides_multiple: z.boolean(),
            count_expected: z.number().optional(),
            count_provided: z.number(),
          }),
          ...baseSchemaAfter,
        });
      case "attribution":
        return z.object({
          type: z.literal("attribution"),
          ...baseSchemaBefore,
          attribution_analysis: z.object({
            sources_provided: z.boolean(),
            sources_verified: z.boolean(),
            quotes_accurate: z.boolean(),
          }),
          ...baseSchemaAfter,
        });
      default:
        throw new Error(`Tipo de avaliação desconhecido: ${evalType}`);
    }
  }

  /**
   * Cria um schema completo para o agente, baseado nas ações permitidas
   * @param allowReflect Se a ação de reflexão é permitida
   * @param allowRead Se a ação de leitura é permitida
   * @param allowAnswer Se a ação de resposta é permitida
   * @param allowSearch Se a ação de busca é permitida
   * @param finalAnswerImprovement Plano de melhoria para resposta final (opcional)
   * @returns Schema Zod para validação do agente
   */
  getAgentSchema(
    allowReflect: boolean,
    allowRead: boolean,
    allowAnswer: boolean,
    allowSearch: boolean,
    finalAnswerImprovement?: string
  ): z.ZodObject<any> {
    const actionSchemas: Record<string, z.ZodObject<any>> = {};

    if (allowSearch) {
      actionSchemas.search = z.object({
        searchQuery: z
          .string()
          .min(1)
          .max(50)
          .describe(
            `Uma consulta de pesquisa em ${this.languageStyle}. Baseada na intenção profunda por trás da pergunta original e no formato de resposta esperado.`
          ),
      });
    }

    if (allowAnswer) {
      actionSchemas.answer = z.object({
        references: z
          .array(
            z
              .object({
                exactQuote: z
                  .string()
                  .describe(
                    "Citação relevante exata do documento, deve ser uma frase curta e direta, sem rodeios"
                  )
                  .max(100),
                url: z
                  .string()
                  .describe(
                    "URL da fonte; deve ser copiado diretamente do conhecimento existente, evite example.com ou quaisquer URLs falsos de espaço reservado"
                  )
                  .max(200),
              })
              .required()
          )
          .describe(
            "Obrigatório quando action='answer'. Deve ser um array de referências que apoiam a resposta, cada referência deve conter uma citação exata e URL"
          ),
        answer: z.string().describe(
          `Obrigatório quando action='answer'. 
          
          ${finalAnswerImprovement || ""}
          Use todo o conhecimento que você coletou, cubra múltiplos aspectos, se necessário. 
          Deve ser definitivo, sem ambiguidade, sem incerteza, sem avisos. Deve estar em ${
            this.languageStyle
          } e ser confiante. 
          Use a sintaxe de nota de rodapé do markdown como [^1], [^2] para se referir ao item de referência correspondente.
          NÃO contenha nenhuma variável de espaço reservado na resposta final.
          `
        ),
      });
    }

    if (allowReflect) {
      actionSchemas.reflect = z.object({
        questionsToAnswer: z
          .array(
            z
              .string()
              .describe(
                "cada pergunta deve ser uma única linha, as perguntas devem ser: originais (não variações de perguntas existentes); Focadas em conceitos únicos; Menos de 20 palavras; Não compostas/não complexas"
              )
          )
          .max(MAX_REFLECT_PER_STEP)
          .describe(
            `Obrigatório quando action='reflect'. Lista das perguntas mais importantes para preencher as lacunas de conhecimento para encontrar a resposta à pergunta original. Forneça no máximo ${MAX_REFLECT_PER_STEP} perguntas de reflexão.`
          ),
      });
    }

    if (allowRead) {
      actionSchemas.visit = z.object({
        URLTargets: z
          .array(z.string())
          .max(MAX_URLS_PER_STEP)
          .describe(
            `Obrigatório quando action='visit'. Deve ser um array de URLs, escolha até as ${MAX_URLS_PER_STEP} URLs mais relevantes para visitar`
          ),
      });
    }

    // Cria um objeto com ação como uma string literal e exatamente uma propriedade de ação
    return z.object({
      think: z
        .string()
        .describe(
          `Articule seu processo de raciocínio estratégico: (1) Quais informações específicas ainda são necessárias? (2) Por que esta ação tem mais probabilidade de fornecer essa informação? (3) Quais alternativas você considerou e por que foram rejeitadas? (4) Como esta ação avançará em direção à resposta completa? Seja conciso, porém completo em ${this.getLanguagePrompt()}.`
        )
        .max(500),
      action: z
        .enum(
          Object.keys(actionSchemas).map((key) => key) as [string, ...string[]]
        )
        .describe(
          "Escolha exatamente uma melhor ação entre as ações disponíveis"
        ),
      ...actionSchemas,
    });
  }

  /**
   * Converte um schema Zod para JSON Schema
   * @param schema O schema Zod a ser convertido
   * @returns O JSON Schema equivalente
   */
  convertToJsonSchema(schema: z.ZodType<any>): any {
    return zodToJsonSchema(schema);
  }

  /**
   * Converte um schema Zod para um schema do Google Generative AI
   * @param schema O schema Zod a ser convertido
   * @returns O schema do Google Generative AI equivalente
   */
  convertToGoogleSchema(schema: z.ZodType<any>): Schema {
    const jsonSchema = this.convertToJsonSchema(schema);
    return this.jsonSchemaToGoogleSchema(jsonSchema);
  }

  /**
   * Converte um JSON Schema para um schema do Google Generative AI
   * Nota: Esta é uma implementação simplificada que suporta apenas os tipos mais comuns
   * @param jsonSchema O JSON Schema a ser convertido
   * @returns O schema do Google Generative AI equivalente
   */
  private jsonSchemaToGoogleSchema(jsonSchema: any): Schema {
    // Função recursiva para converter propriedades
    const convertProperty = (property: any): any => {
      if (!property) return null;

      // Converte o tipo do JSON Schema para SchemaType
      let schemaType;
      switch (property.type) {
        case "string":
          schemaType = SchemaType.STRING;
          break;
        case "number":
        case "integer":
          schemaType = SchemaType.NUMBER;
          break;
        case "boolean":
          schemaType = SchemaType.BOOLEAN;
          break;
        case "array":
          schemaType = SchemaType.ARRAY;
          break;
        case "object":
          schemaType = SchemaType.OBJECT;
          break;
        default:
          // Usa STRING como fallback em vez de ANY que não existe
          schemaType = SchemaType.STRING;
      }

      // Cria o objeto base do schema
      const schemaObject: any = {
        type: schemaType,
      };

      // Adiciona descrição se existir
      if (property.description) {
        schemaObject.description = property.description;
      }

      // Processa propriedades específicas de cada tipo
      if (property.type === "array" && property.items) {
        schemaObject.items = convertProperty(property.items);
      } else if (property.type === "object" && property.properties) {
        schemaObject.properties = {};
        for (const [key, value] of Object.entries(property.properties)) {
          schemaObject.properties[key] = convertProperty(value as any);
        }
        if (property.required) {
          schemaObject.required = property.required;
        }
      } else if (property.enum) {
        schemaObject.enum = property.enum;
        schemaObject.format = "enum";
      }

      return schemaObject;
    };

    // Inicia a conversão a partir da raiz do JSON Schema
    return convertProperty(jsonSchema);
  }
}

// Cria e exporta uma instância padrão
export const zodSchemas = new ZodSchemas();
