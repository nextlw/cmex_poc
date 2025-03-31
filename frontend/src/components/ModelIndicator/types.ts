/**
 * Interface que define as propriedades do componente ModelIndicator
 */
export interface ModelIndicatorProps {
  /**
   * Nome do modelo utilizado
   */
  modelName: string;

  /**
   * Tamanho do indicador (padrão: 'medium')
   */
  size?: "small" | "medium" | "large";

  /**
   * Classe CSS adicional
   */
  className?: string;

  /**
   * Tempo de processamento (opcional)
   */
  processingTime?: number;

  /**
   * Indicação se este modelo é o padrão
   */
  isDefault?: boolean;
}
