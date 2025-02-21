import { modelConfigs, LOCAL_MODEL_ENDPOINT } from "../config";
import { LocalModelClient } from "./local-model-client";
/**
 * Importa o TokenTracker do arquivo ../utils/token-tracker.ts
 */
import { TokenTracker } from "../utils/token-tracker";
import Ajv from 'ajv';

interface ErrorAnalysisResponse {
    data: {
        think: string;
        answer: string;
        context?: {
            similarQuery?: string;
            previousContext?: string;
        };
        references?: Array<{
            exactQuote: string;
            url: string;
        }>;
    }
}

const responseSchema = {
    type: "object",
    properties: {
        data: {
            type: "object",
            properties: {
                think: { type: "string" },
                answer: { type: "string" },
                context: {
                    type: "object",
                    properties: {
                        similarQuery: { type: "string" },
                        previousContext: { type: "string" }
                    }
                },
                references: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            exactQuote: { type: "string" },
                            url: { type: "string" }
                        },
                        required: ["exactQuote", "url"]
                    }
                }
            },
            required: ["think", "answer"]
        }
    },
    required: ["data"]
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

    try {
        const prompt = getPrompt(steps);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const usage = response.usageMetadata;

        // Converte a resposta do modelo para JSON
        const json = JSON.parse(response.text());

        // Formata a resposta no novo padrão
        const formattedResponse: ErrorAnalysisResponse = {
            data: {
                think: json.think || "Analisando a query...",
                answer: json.answer || "",
                context: json.context || {},
                references: json.references || []
            }
        };

        // Validar a resposta
        if (!validate(formattedResponse)) {
            throw new Error(`Resposta inválida: ${JSON.stringify(validate.errors)}`);
        }

        // Exibe a resposta da análise
        console.log('Error analysis:', {
            is_valid: true,
            context: formattedResponse.data.context
        });

        const tokens = usage?.totalTokenCount || 0;
        (tracker || new TokenTracker()).trackUsage('error-analyzer', tokens);

        return { analysis: JSON.stringify(formattedResponse), tokens };
    } catch (error) {
        console.error('Error in answer evaluation:', error);
        throw error;
    }
}