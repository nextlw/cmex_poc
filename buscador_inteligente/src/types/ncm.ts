export interface ConsultaProduto {
  consulta: string;
  estadoOrigem: string;
  operacao?: string;
  regimeTributario?: string;
  tributacao?: string;
  modelo: string;
  autocomplete?: boolean;
  useDeepResearch?: boolean;
  descricao?: string;
  caracteristicas?: string[];
}

export interface FastApiNCMResult {
  ncm_code: string;
  ncm?: string;
  description: string;
  descricao?: string;
  taxation: {
    ipi: number;
    icms: number;
    pis: number;
    cofins: number;
    import_tax: number;
  };
  valores_de_impostos?: {
    ipi: string;
    icms: { [key: string]: string };
    pis: string;
    cofins: string;
  };
  attributes: {
    [key: string]: string;
  };
  atributos?: string[];
  atributos_tipi?: string[];
  conclusion: string;
  confidence: number;
  model_used: string;
  processing_time: number;
  observacoes_deep_research?: string[];
  classificacao_tributaria?: {
    tipo_classificacao_tributario?: {
      tipo_tributario_ativo?: string;
      justificativa?: string;
    };
    ipi_entrada?: string;
    ipi_saida?: string;
    pis_entrada?: string;
    pis_saida?: string;
    cofins_entrada?: string;
    cofins_saida?: string;
    cst_entrada?: string;
    cst_saida?: string;
  };
}
