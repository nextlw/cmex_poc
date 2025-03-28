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

export interface ResearchStep {
  id: number;
  title: string;
  content: string;
  status: "waiting" | "processing" | "completed" | "error";
  details?: ResearchDetail[];
  iterations?: number;
  minimized?: boolean;
  hidden?: boolean;
}

export interface ResearchDetail {
  type: "link" | "text" | "law" | "question";
  content: string;
  source?: string;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  suggestedNCM?: string;
  originalNCM: string;
  reason?: string;
}

// Interface para o relatório final
export interface FinalReport {
  conclusion: string;
  evidences: Array<{
    source: string;
    content: string;
    type: "law" | "jurisprudence" | "technical" | "example";
  }>;
  alternativeCases: Array<{
    scenario: string;
    impact: string;
    suggestedNCM?: string;
  }>;
  ncmCode: string;
  ncmDescription: string;
  taxationDetails?: {
    ipi?: string;
    icms?: string;
    pis?: string;
    cofins?: string;
    importTax?: string;
  };
  attributes?: Record<string, string>;
}

// Interface para controlar quais campos estão em validação
export interface ValidationStatus {
  ncmCode: boolean;
  ncmDescription: boolean;
  taxationDetails: boolean;
  attributes: boolean;
  conclusion: boolean;
}
