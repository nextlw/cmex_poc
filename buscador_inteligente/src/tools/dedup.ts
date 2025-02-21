// import { GoogleGenerativeAI } from "@google/generative-ai";
import { modelConfigs, LOCAL_MODEL_ENDPOINT } from "../config";
import { TokenTracker } from "../utils/token-tracker";
import { LocalModelClient } from "./local-model-client";
import { z } from 'zod';


// const MAX_RETRIES = 20; // Número máximo de tentativas
// const RETRY_DELAY = 30000; // 30 segundos


/**
 * Pausa a execução de uma função assíncrona por um número especificado de milissegundos.
 *
 * @param ms - O número de milissegundos para aguardar antes de continuar a execução.
 * @returns Uma Promise que é resolvida após o atraso especificado.
 */
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Tenta executar uma função assíncrona e, se a execução falhar por qualquer razão,
 * tenta novamente com um atraso especificado.
 *
 * @param fn - A função assíncrona a ser executada.
 * @param retries - O número de vezes que a função deve ser tentada novamente.
 *                O padrão é 3.
 *
 * @returns A Promise que é resolvida com o resultado da função ou rejeitada
 *          com o erro da função.
 */
interface RetryOptions {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
}

async function tryWithRetry(
    fn: () => Promise<any>, 
    options: RetryOptions = {
        maxRetries: 20,
        retryDelay: 30000,
        exponentialBackoff: true
    }
): Promise<any> {
    try {
        return await fn();
    } catch (error) {
        if (options.maxRetries > 0) {
            const delay = options.exponentialBackoff 
                ? options.retryDelay * (2 ** (3 - options.maxRetries))
                : options.retryDelay;
            
            console.log(`Tentativa falhou, tentando novamente em ${delay}ms... (${options.maxRetries} tentativas restantes)`);
            await sleep(delay);
            return tryWithRetry(fn, {
                ...options,
                maxRetries: options.maxRetries - 1
            });
        }
        throw error;
    }
}


    /**
     * Tenta deduplicar as queries recebidas e retorna apenas as que são semanticamente diferentes.
     *
     * @param queries - As queries a serem deduplicadas.
     * @param existingQueries - As queries existentes que devem ser comparadas com as queries recebidas.
     * @param tracker - Um contador de tokens para rastrear o uso do modelo.
     *
     * @returns Uma Promise que é resolvida com um objeto contendo as queries deduplicadas e o número de tokens utilizados.
     */
export async function dedupQueries(queries: string[], existingQueries: string[], tracker?: TokenTracker): Promise<{ unique_queries: string[], tokens: number }> {
    if (!queries || queries.length === 0) {
        return { unique_queries: [], tokens: 0 };
    }

    /**
     * Cria um prompt para deduplicar as queries recebidas e retornar apenas as que são semanticamente diferentes das queries existentes.
     *
     * @param queries - As queries a serem deduplicadas.
     * @param existingQueries - As queries existentes que devem ser comparadas com as queries recebidas.
     */
    const prompt = `Compare as seguintes queries e retorne apenas as que são semanticamente diferentes das queries existentes.
    Queries para analisar:
    ${queries.join('\n')}
    Queries existentes:
    ${existingQueries.join('\n')}


    Retorne apenas as queries que são semanticamente diferentes em formato JSON:
    {
        "unique_queries": ["query1", "query2"]
    }`;




/**
 * Tenta deduplicar queries utilizando um modelo local e retorna as queries que são
 * semanticamente diferentes das existentes, juntamente com o número de tokens utilizados.
 *
 * O modelo local é configurado com um gerador de conteúdo que utiliza um prompt específico.
 * A função realiza tentativas de geração com retentativas em caso de falhas.
 *
 * @returns Um objeto contendo as queries deduplicadas e o número de tokens utilizados.
 * @throws Se o formato da resposta do modelo local for inválido.
 */
const dedupSchema = z.object({
  unique_queries: z.array(z.string()),
  think: z.string().optional()
});

async function tryLocalModel() {
  const localModel = new LocalModelClient(LOCAL_MODEL_ENDPOINT);
  const model = localModel.getGenerativeModel({
    model: "qwen2.5-7b-instruct-1m",
    generationConfig: {
      temperature: modelConfigs.dedup.temperature
    }
  });

  const result = await tryWithRetry(async () => {
    const response = await model.generateContent(prompt);
    return response;
  });

  const response = result.response;
  const content = JSON.parse(response.text());
  
  try {
    const validated = dedupSchema.parse(content);
    return {
      unique_queries: validated.unique_queries,
      tokens: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    console.error('Erro na validação do schema:', error);
    throw new Error('Formato de resposta inválido');
  }
}



    /**
     * Tenta deduplicar as queries usando o modelo do Gemini.
     * @returns Um objeto contendo as queries deduplicadas e o número de tokens utilizados.
     * @throws Se o formato da resposta do Gemini for inválido.
     */
    // Comentando a função do Gemini para uso futuro
    /*
    async function tryGemini() {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: modelConfigs.dedup.model,
            generationConfig: {
                temperature: modelConfigs.dedup.temperature
            }
        });

        const result = await tryWithRetry(async () => {
            const response = await model.generateContent(prompt);
            return response;
        });

        const response = await result.response;
        const usage = response.usageMetadata;
        const content = JSON.parse(response.text());

        if (!content.unique_queries || !Array.isArray(content.unique_queries)) {
            throw new Error('Formato de resposta inválido do Gemini');
        }

        (tracker || new TokenTracker()).trackUsage('dedup', usage?.totalTokenCount || 0);
        return {
            unique_queries: content.unique_queries,
            tokens: usage?.totalTokenCount || 0
        };
    }
    */



    try {
        /**
         * Tenta deduplicar as queries usando o modelo local ou o modelo do Gemini.
         */
        // Forçar uso do modelo local sempre
        return await tryLocalModel();
        
        /* Código original comentado para referência futura
        if (USE_LOCAL_MODEL) {
            try {
                return await tryLocalModel();
            } catch (error) {
                console.error('Erro ao usar modelo local, tentando Gemini como fallback:', error);
                if (GEMINI_API_KEY) {
                    return await tryGemini();
                }
                throw error;
            }
        } else {
            try {
                return await tryGemini();
            } catch (error) {
                console.error('Erro ao usar Gemini, tentando modelo local como fallback:', error);
                return await tryLocalModel();
            }
        }
        */
    } catch (error) {
        /**
         * Lança um erro se a deduplicação falhar.
         */
        console.error('Erro na deduplicação:', error);
        /**
         * Retorna as queries originais.
         */
        return {
            /**
             * As queries originais.
             */
            unique_queries: queries,
            /**
             * O número de tokens utilizados.
             */
            tokens: 0
        };
    }
}

/**
 * Executa a deduplicação de queries recebendo como parâmetro a lista de queries
 * novas e a lista de queries existentes.
 *
 * @example node src/tools/dedub.ts '["query1","query2"]' '["query3","query4"]'
 * @throws {Error} Erro ao deduplicar queries.
 */
export async function main() {
    /**
     * Obtém as queries novas e existentes a partir dos argumentos da linha de comando.
     */
    const newQueries = process.argv[2] ? JSON.parse(process.argv[2]) : [];
    /**
     * Obtém as queries existentes a partir do terceiro argumento da linha de comando.
     */
    const existingQueries = process.argv[3] ? JSON.parse(process.argv[3]) : [];

    try {
        /**
         * Executa a deduplicação de queries.
         */
        await dedupQueries(newQueries, existingQueries);
    } catch (error) {
        /**
         * Lança um erro se a deduplicação falhar.
         */
        console.error('Failed to deduplicate queries:', error);
    }
}

/**
 * Executa o script se o arquivo for executado diretamente.
 */
if (require.main === module) {
    /**
     * Executa o script.
     */
    main().catch(console.error);
}
