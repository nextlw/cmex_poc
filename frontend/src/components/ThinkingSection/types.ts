/**
 * Interface que define as propriedades do componente ThinkingSection
 */
export interface ThinkingSectionProps {
  /**
   * Conteúdo de pensamento a ser exibido
   */
  content: string;

  /**
   * Estado de expansão do componente
   */
  isExpanded: boolean;

  /**
   * Função chamada ao alternar a expansão
   */
  onToggle: () => void;

  /**
   * Nome do modelo que gerou o pensamento
   */
  modelName?: string;

  /**
   * Título do pensamento (opcional)
   */
  title?: string;
}
