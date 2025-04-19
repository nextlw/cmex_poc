/**
 * Configurações para o sistema de URLs
 *
 * Este arquivo contém todas as configurações relacionadas ao processamento,
 * normalização, ranking e caching de URLs.
 */

export const URL_CONFIG = {
  // Limites
  MAX_URLS_PER_STEP: 50,
  MAX_QUERIES_PER_STEP: 50,
  MAX_TOTAL_URLS: 500,

  // Cache
  CACHE_TTL: 60 * 60, // 1 hora

  // Retry
  MAX_RETRIES: 10,
  INITIAL_DELAY_MS: 2000,
  MAX_DELAY_MS: 10000,
  BACKOFF_FACTOR: 2,

  // Ranking
  BOOST_FACTORS: {
    freqFactor: 0.5, // Boost baseado na frequência do termo
    hostnameBoostFactor: 0.5, // Boost baseado na frequência do hostname
    pathBoostFactor: 0.4, // Boost baseado na frequência do caminho
    decayFactor: 0.8, // Fator de decaimento para caminhos mais longos
    jinaRerankFactor: 0.8, // Boost baseado no reranking do Jina
  },

  // Validação
  MIN_RELEVANCE_SCORE: 0.7,
  TIMEOUT_MS: 30000,

  // Cache
  MAX_CACHE_SIZE: 1000,

  // Hostnames fiscais confiáveis para boost
  FISCAL_HOSTNAMES: [
    "gov.br",
    "receita.fazenda.gov.br",
    "siscomex.gov.br",
    "planalto.gov.br",
    "confaz.fazenda.gov.br",
    "in.gov.br", // Imprensa Nacional
    "camara.leg.br",
    "senado.leg.br",
    "stf.jus.br",
    "stj.jus.br",
    "carf.fazenda.gov.br",
  ],
};
