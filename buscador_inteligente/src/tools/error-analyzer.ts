import { modelConfigs, LOCAL_MODEL_ENDPOINT } from "../config";
import { LocalModelClient } from "./local-model-client";
/**
 * Importa o TokenTracker do arquivo ../utils/token-tracker.ts
 */
import { TokenTracker } from "../utils/token-tracker";
import Ajv from "ajv";

interface ErrorAnalysisResponse {
  data: {
    think: string;
    answer: {
      steps: string[];
      recommendations: string[];
    };
    context?: {
      similarQuery?: string;
      previousContext?: string;
    };
    references?: Array<{
      exactQuote: string;
      url: string;
    }>;
  };
}

const responseSchema = {
  type: "object",
  properties: {
    data: {
      type: "object",
      properties: {
        think: { type: "string" },
        answer: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["steps", "recommendations"],
        },
        context: {
          type: "object",
          properties: {
            similarQuery: { type: "string" },
            previousContext: { type: "string" },
          },
        },
        references: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exactQuote: { type: "string" },
              url: { type: "string" },
            },
            required: ["exactQuote", "url"],
          },
        },
      },
      required: ["think", "answer"],
    },
  },
  required: ["data"],
};

const ajv = new Ajv();
const validate = ajv.compile(responseSchema);

/**
 * Retorna um texto que serve como prompt para o modelo do Google Generative AI.
 *
 * O texto descreve o que o modelo deve fazer e inclui um exemplo de como ele deve ser feito.
 *
 * @param {string[]} diaryContext - O contexto do diário, que é uma lista de strings.
 * @returns {string} - O texto que serve como prompt para o modelo.
 */
function getPrompt(diaryContext: string[]): string {
  return `Você é um especialista em análise de processos de busca e raciocínio. Sua tarefa é analisar a sequência de passos fornecida e identificar o que deu errado no processo de busca.

    <regras>
    1. A sequência de ações tomadas
    2. A eficácia de cada passo
    3. A lógica entre passos consecutivos
    4. Abordagens alternativas que poderiam ter sido tomadas
    5. Sinais de ficar preso em padrões repetitivos
    6. Se a resposta final corresponde às informações acumuladas
    
    Analise os passos e forneça feedback detalhado seguindo estas diretrizes:
    - No resumo: Resuma as ações principais cronologicamente, destaque padrões e identifique onde o processo começou a dar errado
    - Na culpa: Aponte para passos ou padrões específicos que levaram à resposta inadequada
    - Na melhoria: Forneça sugestões acionáveis que poderiam ter levado a um melhor resultado
    
    Gere uma resposta JSON seguindo o schema JSON.
    </regras>
    
    <exemplo>
    <entrada>
    <passos>
    
    No passo 1, você tomou a ação **search** e procurou informações externas para a pergunta: "quais são as principais conquistas de UX design de William Duarte?".
    Em particular, você tentou pesquisar as seguintes palavras-chave: "William Duarte UX designer portfolio projetos".
    Você encontrou várias informações e as adicionou à sua lista de URLs para **visitar** mais tarde quando necessário. 
    
    No passo 2, você tomou a ação **visit** e mergulhou profundamente nas seguintes URLs:
    https://www.linkedin.com/in/william-duarte-75240329
    Você encontrou algumas informações úteis na web e as adicionou ao seu conhecimento para referência futura.
    
    No passo 3, você tomou a ação **search** e procurou informações externas para a pergunta: "quais são as principais conquistas de UX design de William Duarte?".
    Em particular, você tentou pesquisar as seguintes palavras-chave: "William Duarte UX case studies, design leadership".
    Você encontrou várias informações e as adicionou à sua lista de URLs para **visitar** mais tarde quando necessário. 
    
    No passo 4, você tomou a ação **search** e procurou informações externas para a pergunta: "quais são as principais conquistas de UX design de William Duarte?".
    Em particular, você tentou pesquisar as seguintes palavras-chave: "William Duarte design portfolio". 
    Mas então você percebeu que já havia pesquisado essas palavras-chave antes.
    Você decidiu pensar fora da caixa ou cortar de um ângulo completamente diferente.
    
    No passo 5, você tomou a ação **search** e procurou informações externas para a pergunta: "quais são as principais conquistas de UX design de William Duarte?".
    Em particular, você tentou pesquisar as seguintes palavras-chave: "William Duarte UX portfolio". 
    Mas então você percebeu que já havia pesquisado essas palavras-chave antes.
    Você decidiu pensar fora da caixa ou cortar de um ângulo completamente diferente.
    
    No passo 6, você tomou a ação **visit** e mergulhou profundamente nas seguintes URLs:
    https://www.linkedin.com/in/william-duarte-75240329
    Você encontrou algumas informações úteis na web e as adicionou ao seu conhecimento para referência futura.
    
    No passo 7, você tomou a ação **answer** mas o avaliador acha que não é uma boa resposta:
    
    </passos>
    
    Pergunta original: 
    quais são as principais conquistas de UX design de William Duarte?
    
    Sua resposta: 
    Com base nas informações disponíveis, William Duarte é um designer UX com experiência, mas conquistas específicas não podem ser determinadas.
    
    O avaliador acha que sua resposta é ruim porque: 
    A resposta carece de detalhes específicos sobre conquistas e projetos. É necessária uma pesquisa mais aprofundada em trabalhos de portfólio, estudos de caso e impacto profissional.
    </entrada>
    
    <saida>
    {
      "data": {
        "think": "Analisando os passos de erro...",
        "answer": {
          "steps": [
            "Passo 1: Busca inicial focada apenas em portfólio",
            "Passo 2: Visita limitada ao LinkedIn",
            "Passo 3: Busca repetitiva de case studies",
            "Passo 4: Busca redundante de portfólio",
            "Passo 5: Busca redundante de portfólio UX",
            "Passo 6: Visita repetida ao mesmo perfil LinkedIn",
            "Passo 7: Resposta genérica sem detalhes específicos"
          ],
          "recommendations": [
            "Diversificar fontes explorando plataformas específicas de design",
            "Focar em impactos quantificáveis de projetos UX",
            "Explorar experiências de liderança de equipe",
            "Investigar metodologias de design implementadas",
            "Buscar reconhecimento da indústria e publicações"
          ]
        }
      }
    }
    </saida>
    </exemplo>
    Revise os passos abaixo cuidadosamente e gere sua análise seguindo este formato.
    
    ${diaryContext.join("\n")}
    `;
}

/**
 * Analisa um conjunto de passos de busca e raciocínio e retorna uma resposta de análise de erro.
 *
 * @param {string[]} diaryContext - Um array de strings que representam os passos da busca e raciocínio.
 * @param {TokenTracker} [tracker] - Um rastreador de tokens opcional para rastrear o uso de tokens.
 * @returns {Promise<{ response: ErrorAnalysisResponse, tokens: number }>} - Uma promessa que retorna um objeto contendo a resposta de análise de erro e o número de tokens utilizados.
 */
export async function analyzeSteps(
  steps: any[],
  tracker?: TokenTracker
): Promise<{ analysis: string; tokens: number }> {
  const localModel = new LocalModelClient(LOCAL_MODEL_ENDPOINT);
  const model = localModel.getGenerativeModel({
    model: modelConfigs.errorAnalyzer.model,
    generationConfig: {
      temperature: modelConfigs.errorAnalyzer.temperature,
    },
  });

  try {
    const prompt = getPrompt(steps);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const usage = response.usageMetadata;

    // Converte a resposta do modelo para JSON
    const json = JSON.parse(response.text);

    // Formata a resposta no novo padrão
    const formattedResponse: ErrorAnalysisResponse = {
      data: {
        think: json.data?.think || "Analisando a query...",
        answer: json.data?.answer || {
          steps: [],
          recommendations: [],
        },
        context: json.data?.context || {},
        references: json.data?.references || [],
      },
    };

    // Validar a resposta
    if (!validate(formattedResponse)) {
      throw new Error(`Resposta inválida: ${JSON.stringify(validate.errors)}`);
    }

    // Exibe a resposta da análise
    console.log("Error analysis:", {
      is_valid: true,
      context: formattedResponse.data.context,
    });

    const tokens = usage?.totalTokenCount || 0;
    (tracker || new TokenTracker()).trackUsage("error-analyzer", tokens);

    return { analysis: JSON.stringify(formattedResponse), tokens };
  } catch (error) {
    console.error("Error in answer evaluation:", error);
    throw error;
  }
}
