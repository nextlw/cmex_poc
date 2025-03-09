/**
 * Interface para as propriedades do componente DeepResearchStatus
 */
export interface DeepResearchStatusProps {
  /**
   * ID da requisição DeepResearch para acompanhamento
   */
  requestId: string | null;

  /**
   * Nome do produto sendo analisado
   */
  productName: string;

  /**
   * Código NCM do produto (opcional)
   */
  ncmCode?: string;
}

/**
 * Interface para informações de pesquisa coletadas durante o processo DeepResearch
 */
export interface ResearchInfo {
  /**
   * Tipo de informação (link, texto, lei ou pergunta)
   */
  type: "link" | "text" | "law" | "question";

  /**
   * Conteúdo da informação
   */
  content: string;

  /**
   * Fonte da informação (opcional)
   */
  source?: string;

  /**
   * Timestamp de quando a informação foi coletada
   */
  timestamp: Date;
}
