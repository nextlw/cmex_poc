/**
 * Interface que define uma etapa do processo de pesquisa profunda
 */
export interface DeepResearchStep {
  /**
   * Identificador único da etapa
   */
  id: string;

  /**
   * Título da etapa
   */
  title: string;

  /**
   * Descrição da etapa (opcional)
   */
  description?: string;

  /**
   * Status atual da etapa
   */
  status:
    | "waiting"
    | "processing"
    | "completed"
    | "error"
    | "pending"
    | "current";

  /**
   * Mensagem de erro (se status for 'error') (opcional)
   */
  errorMessage?: string;
}

/**
 * Interface que define as propriedades do componente DeepResearchProgress
 */
export interface DeepResearchProgressProps {
  /**
   * Indica se o processamento está ativo
   */
  isProcessing?: boolean;

  /**
   * Progresso atual (0 a 1)
   */
  progress?: number;

  /**
   * Etapa atual (índice do array steps)
   */
  currentStep?: number;

  /**
   * ID da etapa atual
   */
  currentStepId?: string;

  /**
   * Total de etapas
   */
  totalSteps?: number;

  /**
   * Array de etapas do processo
   */
  steps: DeepResearchStep[];

  /**
   * Classe CSS adicional (opcional)
   */
  className?: string;

  /**
   * Função chamada ao cancelar o processo (opcional)
   */
  onCancel?: () => void;
}
