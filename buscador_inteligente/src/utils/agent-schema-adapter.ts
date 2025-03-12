import { z } from "zod";
import { Schema, SchemaType } from "@google/generative-ai";
import { zodSchemas } from "./zod-schemas";
import { SafeObjectGenerator } from "./safe-object-generator";
import { TokenTracker } from "./token-tracker";
import { ActionTracker } from "./action-tracker";
import { Schema as GoogleSchema } from "@google/generative-ai";
import { EvaluationType, TrackerContext } from "../types";

/**
 * Classe adaptadora que integra os schemas Zod ao agente CMEX.
 * Esta classe fornece métodos para obter schemas Google a partir de schemas Zod
 * e para validar objetos contra schemas Zod.
 */
export class AgentSchemaAdapter {
  private zodSchemas: typeof zodSchemas;
  private context: Partial<TrackerContext>;
  private safeObjectGenerator: SafeObjectGenerator | null = null;

  /**
   * Construtor para a classe AgentSchemaAdapter
   * @param context Contexto do rastreador do agente
   * @param modelClient Cliente do modelo de linguagem
   */
  constructor(context: Partial<TrackerContext>, modelClient?: any) {
    this.zodSchemas = zodSchemas;
    this.context = context;

    if (modelClient && context.tokenTracker) {
      this.safeObjectGenerator = new SafeObjectGenerator(
        context.tokenTracker as TokenTracker,
        modelClient
      );
    }
  }

  /**
   * Define o estilo de linguagem para os schemas
   * @param style Estilo de linguagem
   * @param code Código do idioma
   */
  setLanguage(style: string, code: string = "pt-BR") {
    this.zodSchemas.setLanguage(style, code);
  }

  /**
   * Obtém um schema para o agente baseado nas ações permitidas
   * @param allowReflect Se a ação de reflexão é permitida
   * @param allowRead Se a ação de leitura é permitida
   * @param allowAnswer Se a ação de resposta é permitida
   * @param allowSearch Se a ação de busca é permitida
   * @param improvement Plano de melhoria para a resposta final (opcional)
   * @returns Schema Zod para o agente
   */
  getAgentZodSchema(
    allowReflect: boolean,
    allowRead: boolean,
    allowAnswer: boolean,
    allowSearch: boolean,
    improvement?: string
  ): z.ZodObject<any> {
    return this.zodSchemas.getAgentSchema(
      allowReflect,
      allowRead,
      allowAnswer,
      allowSearch,
      improvement
    );
  }

  /**
   * Obtém um schema Google para o agente baseado nas ações permitidas
   * @param allowReflect Se a ação de reflexão é permitida
   * @param allowRead Se a ação de leitura é permitida
   * @param allowAnswer Se a ação de resposta é permitida
   * @param allowSearch Se a ação de busca é permitida
   * @param improvement Plano de melhoria para a resposta final (opcional)
   * @returns Schema Google para o agente
   */
  getAgentGoogleSchema(
    allowReflect: boolean,
    allowRead: boolean,
    allowAnswer: boolean,
    allowSearch: boolean,
    improvement?: string
  ): GoogleSchema {
    const zodSchema = this.getAgentZodSchema(
      allowReflect,
      allowRead,
      allowAnswer,
      allowSearch,
      improvement
    );
    return this.zodSchemas.convertToGoogleSchema(zodSchema);
  }

  /**
   * Obtém um schema Zod para avaliação
   * @param evalType Tipo de avaliação
   * @returns Schema Zod para avaliação
   */
  getEvaluatorZodSchema(evalType: EvaluationType): z.ZodObject<any> {
    return this.zodSchemas.getEvaluatorSchema(evalType);
  }

  /**
   * Obtém um schema Google para avaliação
   * @param evalType Tipo de avaliação
   * @returns Schema Google para avaliação
   */
  getEvaluatorGoogleSchema(evalType: EvaluationType): GoogleSchema {
    const zodSchema = this.getEvaluatorZodSchema(evalType);
    return this.zodSchemas.convertToGoogleSchema(zodSchema);
  }

  /**
   * Gera um objeto a partir de um prompt usando um schema Zod
   * @param model Nome do modelo a ser usado
   * @param schema Schema Zod para validação
   * @param system Sistema de instruções (opcional)
   * @param prompt Prompt do usuário (opcional)
   * @param messages Mensagens no formato de chat (opcional)
   * @returns O objeto gerado com informações de uso
   */
  async generateObject<T>({
    model,
    schema,
    system,
    prompt,
    messages,
  }: {
    model: string;
    schema: z.ZodType<T>;
    system?: string;
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
  }): Promise<{ object: T; usage: number }> {
    if (!this.safeObjectGenerator) {
      throw new Error(
        "SafeObjectGenerator não foi inicializado. Forneça modelClient no construtor."
      );
    }

    return this.safeObjectGenerator.generateObject({
      model,
      schema,
      system,
      prompt,
      messages,
    });
  }

  /**
   * Converte um schema Zod para um schema JSON
   * @param schema Schema Zod para converter
   * @returns Schema JSON equivalente
   */
  zodToJsonSchema(schema: z.ZodType<any>): any {
    return this.zodSchemas.convertToJsonSchema(schema);
  }
}

/**
 * Cria uma instância do adaptador de schemas para o agente
 * @param context Contexto do rastreador do agente
 * @param modelClient Cliente do modelo de linguagem
 * @returns Instância do adaptador de schemas
 */
export function createSchemaAdapter(
  context: Partial<TrackerContext>,
  modelClient?: any
): AgentSchemaAdapter {
  return new AgentSchemaAdapter(context, modelClient);
}
