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

  /**
   * Estado de validação externo para controlar o componente
   */
  externalValidationStatus?: {
    infoBasicas: { validated: boolean; loading: boolean };
    atributos: { validated: boolean; loading: boolean };
    tributacao: { validated: boolean; loading: boolean };
  };

  /**
   * Callback chamado quando o estado de validação interno muda
   */
  onValidationStatusChange?: (status: {
    infoBasicas: { validated: boolean; loading: boolean };
    atributos: { validated: boolean; loading: boolean };
    tributacao: { validated: boolean; loading: boolean };
  }) => void;
}

/**
 * Representa um passo na pesquisa profunda
 */
export interface ResearchStep {
  /**
   * ID único do passo
   */
  id: number;

  /**
   * Título do passo
   */
  title: string;

  /**
   * Conteúdo/descrição do passo
   */
  content: string;

  /**
   * Status atual do passo
   */
  status: "waiting" | "processing" | "completed" | "error";

  /**
   * Detalhes associados a este passo
   */
  details?: ResearchDetail[];

  /**
   * Número de iterações realizadas neste passo
   */
  iterations?: number;

  /**
   * Se o passo está minimizado (colapsado)
   */
  minimized?: boolean;

  /**
   * Se o passo está oculto
   */
  hidden?: boolean;

  /**
   * Mensagem de notificação para o passo (erro, sucesso, etc.)
   */
  notification?: StepNotification;

  /**
   * Dados de progresso para o passo (porcentagem, etc.)
   */
  progress?: StepProgress;
}

/**
 * Representa um detalhe/evidência encontrada durante a pesquisa
 */
export interface ResearchDetail {
  /**
   * Tipo do detalhe (link, texto, lei, pergunta)
   */
  type: "link" | "text" | "law" | "question";

  /**
   * Conteúdo do detalhe
   */
  content: string;

  /**
   * Fonte do detalhe (opcional)
   */
  source?: string;

  /**
   * Momento em que o detalhe foi registrado
   */
  timestamp: Date;
}

/**
 * Representa uma notificação associada a um passo
 */
export interface StepNotification {
  /**
   * Tipo da notificação
   */
  type: "error" | "success" | "warning" | "info";

  /**
   * Mensagem da notificação
   */
  message: string;

  /**
   * Tempo de exibição em ms (0 para persistente)
   */
  duration?: number;
}

/**
 * Representa o progresso de um passo
 */
export interface StepProgress {
  /**
   * Porcentagem de progresso (0-100)
   */
  percentage: number;

  /**
   * Texto a ser exibido junto ao progresso
   */
  text?: string;
}

/**
 * Representa um resultado de validação para o último passo
 */
export interface ValidationResult {
  /**
   * Se a validação foi bem-sucedida
   */
  isValid: boolean;

  /**
   * NCM sugerido (se diferente do original)
   */
  suggestedNCM?: string;

  /**
   * NCM original
   */
  originalNCM: string;

  /**
   * Motivo para a sugestão ou validação
   */
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
