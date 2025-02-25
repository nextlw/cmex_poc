import axios from 'axios';
import { BRAVE_API_KEY } from '../config';

import { BraveSearchResponse } from '../types';

/**
 * Realiza uma busca no Brave Search.
 * @param query A query de busca.
 * @returns Uma promise que resolve para a resposta da busca.
 */
export async function braveSearch(query: string): Promise<{ response: BraveSearchResponse }> {
  // Realiza a busca
  const response = await axios.get<BraveSearchResponse>('https://api.search.brave.com/res/v1/web/search', {
    // Define os parâmetros
    params: {
      // Define a query
      q: query,
      // Define o número de resultados
      count: 50,
      // Define o safe search
      safesearch: 'off'
    },
    // Define os headers
    headers: {
      // Define o Accept
      'Accept': 'application/json',
      // Define o X-Subscription-Token
      'X-Subscription-Token': BRAVE_API_KEY
    },
    // Define o timeout
    timeout: 300000
  });

  // Retorna a resposta
  return { response: response.data };
}
