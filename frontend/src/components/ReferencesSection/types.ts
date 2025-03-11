/**
 * Interface que define uma referência
 */
export interface Reference {
  /**
   * URL da referência
   */
  url: string;

  /**
   * Título da referência (opcional)
   */
  title?: string;

  /**
   * Citação exata (opcional)
   */
  exactQuote?: string;

  /**
   * Conteúdo adicional (opcional)
   */
  content?: string;
}

/**
 * Interface que define as propriedades do componente ReferencesSection
 */
export interface ReferencesSectionProps {
  /**
   * Lista de referências
   */
  references: Reference[];

  /**
   * Estado de expansão do componente
   */
  isExpanded: boolean;

  /**
   * Função chamada ao alternar a expansão
   */
  onToggle: () => void;

  /**
   * Título da seção (opcional)
   */
  title?: string;
}
