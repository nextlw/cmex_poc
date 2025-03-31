/**
 * Interface que define as propriedades do componente DeepResearchToggle
 */
export interface DeepResearchToggleProps {
  /**
   * Estado atual do toggle (ativado ou desativado)
   */
  enabled: boolean;
  /**
   * Função chamada quando o estado do toggle é alterado
   */
  onChange: (enabled: boolean) => void;
  /**
   * Define se o toggle está desabilitado
   */
  disabled?: boolean;
  /**
   * Texto do label do toggle
   */
  label?: string;
  /**
   * Texto de ajuda exibido abaixo do toggle
   */
  helpText?: string;
}
