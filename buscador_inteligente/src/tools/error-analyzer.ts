import { modelConfigs, LOCAL_MODEL_ENDPOINT } from "../config";
import { LocalModelClient } from "./local-model-client";
/**
 * Importa o TokenTracker do arquivo ../utils/token-tracker.ts
 */
import { TokenTracker } from "../utils/token-tracker";
import Ajv from 'ajv';

interface ErrorAnalysisResponse {
    recap: string;
    blame: string;
    improvement: string;
}

const responseSchema = {
  /**
   * O tipo da resposta é um objeto
   */
  type: "object",
  /**
   * As propriedades da resposta
   */
  properties: {
    /**
     * A propriedade recap é uma string
     */
    recap: {
      /**
       * O tipo da propriedade recap é uma string
       */
      type: "string"
    },
    /**
     * A propriedade blame é uma string
     */
    blame: {
      /**
       * O tipo da propriedade blame é uma string
       */
      type: "string"
    },
    /**
     * A propriedade improvement é uma string
     */
    improvement: {
      /**
       * O tipo da propriedade improvement é uma string
       */
      type: "string"
    }
  },
  /**
   * As propriedades obrigatórias
   */
  required: ["recap", "blame", "improvement"]
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
    return `You are an expert at analyzing search and reasoning processes. Your task is to analyze the given sequence of steps and identify what went wrong in the search process.

    <rules>
    1. The sequence of actions taken
    2. The effectiveness of each step
    3. The logic between consecutive steps
    4. Alternative approaches that could have been taken
    5. Signs of getting stuck in repetitive patterns
    6. Whether the final answer matches the accumulated information
    
    Analyze the steps and provide detailed feedback following these guidelines:
    - In the recap: Summarize key actions chronologically, highlight patterns, and identify where the process started to go wrong
    - In the blame: Point to specific steps or patterns that led to the inadequate answer
    - In the improvement: Provide actionable suggestions that could have led to a better outcome
    
    Generate a JSON response following JSON schema.
    </rules>
    
    <example>
    <input>
    <steps>
    
    At step 1, you took the **search** action and look for external information for the question: "what are William Duarte's main UX design achievements?".
    In particular, you tried to search for the following keywords: "William Duarte UX designer portfolio projects".
    You found quite some information and add them to your URL list and **visit** them later when needed. 
    
    
    At step 2, you took the **visit** action and deep dive into the following URLs:
    https://www.linkedin.com/in/william-duarte-75240329
    You found some useful information on the web and add them to your knowledge for future reference.
    
    
    At step 3, you took the **search** action and look for external information for the question: "what are William Duarte's main UX design achievements?".
    In particular, you tried to search for the following keywords: "William Duarte UX case studies, design leadership".
    You found quite some information and add them to your URL list and **visit** them later when needed. 
    
    
    At step 4, you took the **search** action and look for external information for the question: "what are William Duarte's main UX design achievements?".
    In particular, you tried to search for the following keywords: "William Duarte design portfolio". 
    But then you realized you have already searched for these keywords before.
    You decided to think out of the box or cut from a completely different angle.
    
    
    At step 5, you took the **search** action and look for external information for the question: "what are William Duarte's main UX design achievements?".
    In particular, you tried to search for the following keywords: "William Duarte UX portfolio". 
    But then you realized you have already searched for these keywords before.
    You decided to think out of the box or cut from a completely different angle.
    
    
    At step 6, you took the **visit** action and deep dive into the following URLs:
    https://www.linkedin.com/in/william-duarte-75240329
    You found some useful information on the web and add them to your knowledge for future reference.
    
    
    At step 7, you took **answer** action but evaluator thinks it is not a good answer:
    
    </steps>
    
    Original question: 
    what are William Duarte's main UX design achievements?
    
    Your answer: 
    Based on the available information, William Duarte is a UX designer with experience, but specific achievements cannot be determined.
    
    The evaluator thinks your answer is bad because: 
    The answer lacks specific details about achievements and projects. More thorough research into portfolio work, case studies, and professional impact is needed.
    </input>
    
    
    <output>
    {
      "recap": "The search process involved 7 steps focusing on finding UX design achievements. Initial searches targeted portfolio and projects (steps 1-2), followed by case studies and leadership experience (step 3). The process showed repetition in portfolio searches (steps 4-5) and revisited the same LinkedIn profile twice (steps 2 and 6) without exploring other professional platforms or design communities.",
      
      "blame": "The search failed due to over-reliance on basic portfolio searches and limited source diversity. The process didn't explore design platforms like Behance or Dribbble, industry recognition, or specific project impacts. Steps 4-6 showed stagnation by repeating searches and revisiting the same source.",
      
      "improvement": "Diversify sources by exploring design-specific platforms, conference presentations, and industry publications. Focus on quantifiable impacts of UX projects, team leadership experiences, and specific design methodologies implemented rather than just searching for general portfolio information."
    }
    </output>
    </example>
    Review the steps below carefully and generate your analysis following this format.
    
    ${diaryContext.join('\n')}
    `;
}


/**
 * Analisa um conjunto de passos de busca e raciocínio e retorna uma resposta de análise de erro.
 * 
 * @param {string[]} diaryContext - Um array de strings que representam os passos da busca e raciocínio.
 * @param {TokenTracker} [tracker] - Um rastreador de tokens opcional para rastrear o uso de tokens.
 * @returns {Promise<{ response: ErrorAnalysisResponse, tokens: number }>} - Uma promessa que retorna um objeto contendo a resposta de análise de erro e o número de tokens utilizados.
 */
export async function analyzeSteps(steps: any[], tracker?: TokenTracker): Promise<{ analysis: string, tokens: number }> {
    const localModel = new LocalModelClient(LOCAL_MODEL_ENDPOINT);
    const model = localModel.getGenerativeModel({
        model: modelConfigs.errorAnalyzer.model,
        generationConfig: {
            temperature: modelConfigs.errorAnalyzer.temperature
        }
    });

    /* Código original comentado para referência futura
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: modelConfigs.errorAnalyzer.model,
        generationConfig: {
            temperature: modelConfigs.errorAnalyzer.temperature
        }
    });
    */

    /**
     * Tenta analisar os passos do diário e gerar uma resposta de análise de erro.
     */
    try {
        /**
         * Obtém o prompt para o modelo.
         */
        const prompt = getPrompt(steps);
        /**
         * Gera o conteúdo com o modelo.
         */
        const result = await model.generateContent(prompt);
        /**
         * Obtém a resposta do modelo.
         */
        const response = await result.response;
        /**
         * Obtém o uso do modelo.
         */
        const usage = response.usageMetadata;
        /**
         * Converte a resposta do modelo para JSON.
         */
        const json = JSON.parse(response.text()) as ErrorAnalysisResponse;
        /**
         * Exibe a resposta da análise de erro.
         */
        console.log('Error analysis:', {
            is_valid: !json.blame,
            reason: json.blame || 'No issues found'
        });
        /**
         * Obtém o número de tokens utilizados.
         */
        const tokens = usage?.totalTokenCount || 0;
        /**
         * Rastreia o uso do modelo.
         */
        (tracker || new TokenTracker()).trackUsage('error-analyzer', tokens);
        /**
         * Validar a resposta antes de retornar
         */
        if (!validate(json)) {
            throw new Error(`Resposta inválida: ${JSON.stringify(validate.errors)}`);
        }
        /**
         * Adicionar recap padrão quando não fornecido
         */
        if (!json.recap) {
            json.recap = 'Análise parcial realizada';
        }
        /**
         * Retorna a resposta da análise de erro e o número de tokens utilizados.
         */
        return { analysis: JSON.stringify(json), tokens };
    } catch (error) {
        /**
         * Lança um erro se ocorrer um erro na análise de erro.
         */
        console.error('Error in answer evaluation:', error);
        /**
         * Lança o erro.
         */
        throw error;
    }
}