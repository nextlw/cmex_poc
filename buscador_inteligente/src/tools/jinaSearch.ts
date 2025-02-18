import https from 'https';
import { TokenTracker } from "../utils/token-tracker";

import { SearchResponse } from '../types';
import {JINA_API_KEY} from "../config";

/**
 * Faz uma busca com a API do Jina Search.
 * @param query String da busca.
 * @param tracker Tracker de tokens, opcional.
 * @returns Promise que resolve com o objeto de resposta da API do Jina
 *          e o n mero total de tokens usados.
 */
export function jinaSearch(query: string, tracker?: TokenTracker): Promise<{ response: SearchResponse, tokens: number }> {
  return new Promise((resolve, reject) => {
    if (!query.trim()) {
      reject(new Error('Query cannot be empty'));
      return;
    }

    // Configurações da requisição para a API do Jina
    const options = {
      /**
       * Hostname da API do Jina.
       */
      hostname: 's.jina.ai',
      /**
       * Porta da API do Jina.
       */
      port: 443,
      /**
       * Caminho da API do Jina.
       */
      path: `/${encodeURIComponent(query)}?count=0`,
      method: 'GET',
      headers: {
        /**
         * Aceitação de JSON.
         */
        'Accept': 'application/json',
        /**
         * Autorização com a chave da API do Jina.
         */
        'Authorization': `Bearer ${JINA_API_KEY}`,
        /**
         * Não retém imagens.
         */
        'X-Retain-Images': 'none'
      }
    };

    // Cria a requisição para a API do Jina
    const req = https.request(options, (res) => {
      // Inicializa a variável para armazenar os dados da resposta
      let responseData = '';
      // Adiciona os dados da resposta
      res.on('data', (chunk) => responseData += chunk);
      // Quando a resposta termina, analisa os dados
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          try {
            const errorResponse = JSON.parse(responseData);
            if (res.statusCode === 402) {
              reject(new Error(errorResponse.readableMessage || 'Insufficient balance'));
              return;
            }
            reject(new Error(errorResponse.readableMessage || `HTTP Error ${res.statusCode}`));
          } catch {
            reject(new Error(`HTTP Error ${res.statusCode}`));
          }
          return;
        }

        let response: SearchResponse;
        try {
          response = JSON.parse(responseData) as SearchResponse;
        } catch (error: unknown) {
          reject(new Error(`Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}`));
          return;
        }

        // Verifica se o formato da resposta é inválido
        if (!response.data || !Array.isArray(response.data)) {
          // Rejeita a promise com um erro
          reject(new Error('Invalid response format'));
          return;
        }

        const totalTokens = response.data.reduce((sum, item) => sum + (item.usage?.tokens || 0), 0);
        console.log('Total URLs:', response.data.length);

        const tokenTracker = tracker || new TokenTracker();
        tokenTracker.trackUsage('search', totalTokens);
        tokenTracker.printSummary();

        resolve({ response, tokens: totalTokens });
      });
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}
