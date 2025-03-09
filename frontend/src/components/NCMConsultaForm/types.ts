/**
 * Interface que define os dados do formulário de consulta NCM
 */
export interface FormData {
  /**
   * Descrição do produto a ser consultado
   */
  consulta: string;
  /**
   * Estado de origem do produto
   */
  estadoOrigem: string;
  /**
   * Tipo de operação (Venda, Revenda, etc.)
   */
  operacao: string;
  /**
   * Regime tributário (Simples Nacional, Lucro Presumido, etc.)
   */
  regimeTributario: string;
  /**
   * Tipo de tributação (Normal, ST, Isento, etc.)
   */
  tributacao: string;
  /**
   * Modelo de IA a ser utilizado na consulta
   */
  modelo: string;
  /**
   * Indica se deve usar o DeepResearch para análise profunda
   */
  useDeepResearch: boolean;
}

/**
 * Interface que define as propriedades do componente NCMConsultaForm
 */
export interface NCMConsultaFormProps {
  /**
   * Função chamada quando o formulário é submetido
   */
  onSubmit?: (data: FormData) => void;
  /**
   * Função chamada quando o resultado da consulta é recebido
   */
  onResult?: (result: any) => void;
  /**
   * Dados iniciais para preencher o formulário
   */
  initialData?: Partial<FormData>;
}
