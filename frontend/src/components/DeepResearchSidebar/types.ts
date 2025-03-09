/**
 * Interface para as propriedades do componente DeepResearchSidebar
 */
export interface DeepResearchSidebarProps {
  /**
   * Se o sidebar está aberto ou fechado
   */
  isOpen: boolean;

  /**
   * ID da requisição para acompanhamento do status
   */
  requestId: string | null;

  /**
   * Nome do produto sendo analisado
   */
  productName: string;

  /**
   * Código NCM do produto sendo analisado
   */
  ncmCode?: string;

  /**
   * Se há processamento em andamento
   */
  isProcessing: boolean;

  /**
   * Função chamada quando o usuário cancela a requisição
   */
  onCancelRequest?: () => void;
}
