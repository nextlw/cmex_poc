/**
 * Exemplo de uso do sistema Zod com o agente CMEX
 *
 * Este arquivo demonstra como integrar o sistema Zod para tipagem segura e validação
 * em tempo de execução no agente CMEX.
 */

import { createSchemaAdapter } from "../utils/agent-schema-adapter";
import { TokenTracker } from "../utils/token-tracker";
import { ActionTracker } from "../utils/action-tracker";

// Este exemplo assume a existência de um 'modelClient'
async function exampleUsage(modelClient: any) {
  // 1. Criar o contexto do agente
  const context = {
    tokenTracker: new TokenTracker(10000),
    actionTracker: new ActionTracker({ requestId: "exemplo-zod" }),
    outputs: [],
  };

  // 2. Criar o adaptador de schema
  const schemaAdapter = createSchemaAdapter(context, modelClient);

  // 3. Definir o estilo de linguagem
  schemaAdapter.setLanguage("formal Portuguese", "pt-BR");

  // 4. Obter um schema Zod para o agente
  const agentZodSchema = schemaAdapter.getAgentZodSchema(
    true, // allowReflect
    true, // allowRead
    true, // allowAnswer
    true // allowSearch
  );

  // 5. Converter para Google Schema quando necessário
  const agentGoogleSchema = schemaAdapter.getAgentGoogleSchema(
    true, // allowReflect
    true, // allowRead
    true, // allowAnswer
    true // allowSearch
  );

  // 6. Usar o schema para validar uma resposta
  const sampleResponse = {
    think:
      "Preciso buscar mais informações sobre esse tema para dar uma resposta precisa.",
    action: "search",
    searchQuery: "melhores práticas typescript tipagem zod",
  };

  try {
    // Validação com Zod
    const validatedResponse = agentZodSchema.parse(sampleResponse);
    console.log("Resposta validada com sucesso:", validatedResponse);

    // O objeto validado agora tem os tipos corretos
    if (validatedResponse.action === "search") {
      console.log("Consulta de pesquisa:", validatedResponse.searchQuery);
    }
  } catch (error) {
    console.error("Erro de validação:", error);
  }

  // 7. Gerar um objeto usando o schema
  try {
    const generatedResult = await schemaAdapter.generateObject({
      model: "gemini-pro",
      schema: agentZodSchema,
      system: "Você é um assistente útil.",
      prompt: "Como posso melhorar a tipagem no TypeScript?",
    });

    console.log("Objeto gerado:", generatedResult.object);
    console.log("Tokens usados:", generatedResult.usage);

    // O objeto gerado já está tipado e validado
    const { action, think } = generatedResult.object;
    console.log(`Ação: ${action}, Pensamento: ${think}`);
  } catch (error) {
    console.error("Erro ao gerar objeto:", error);
  }

  // 8. Converter para JSON Schema para debug
  const jsonSchema = schemaAdapter.zodToJsonSchema(agentZodSchema);
  console.log("JSON Schema:", JSON.stringify(jsonSchema, null, 2));
}

/**
 * Exemplo de como utilizar o Zod para validar uma função específica no agente
 *
 * @param rawEvaluationResponse A resposta bruta da avaliação
 * @param evalType O tipo de avaliação
 * @param schemaAdapter O adaptador de schema
 * @returns A resposta validada
 */
async function validateEvaluationResponse(
  rawEvaluationResponse: any,
  evalType: "definitive" | "freshness" | "plurality" | "attribution",
  schemaAdapter: any
) {
  // Obter o schema correto para o tipo de avaliação
  const evaluatorSchema = schemaAdapter.getEvaluatorZodSchema(evalType);

  try {
    // Validar a resposta contra o schema
    return evaluatorSchema.parse(rawEvaluationResponse);
  } catch (error) {
    console.error(
      `Erro de validação para avaliação do tipo ${evalType}:`,
      error
    );

    // Fallback: retornar a resposta original, mas com type e pass definidos
    return {
      ...rawEvaluationResponse,
      type: evalType,
      pass: false,
      think: rawEvaluationResponse.think || "Falha na validação da resposta",
    };
  }
}

/**
 * Como integrar Zod no seu arquivo agent.ts existente:
 *
 * 1. Importe as classes e funções necessárias:
 *    - import { createSchemaAdapter } from "./utils/agent-schema-adapter";
 *
 * 2. Na função getResponse, inicialize o adaptador de schema:
 *    - const schemaAdapter = createSchemaAdapter(context, activeModelClient);
 *
 * 3. Use o adaptador em vez de chamar diretamente getSchema:
 *    - const schema = schemaAdapter.getAgentGoogleSchema(allowReflect, allowRead, allowAnswer, allowSearch);
 *
 * 4. Para validação, use os schemas Zod:
 *    - const validatedResponse = schemaAdapter.getAgentZodSchema(...).parse(responseObject);
 */

export { exampleUsage, validateEvaluationResponse };
