// Arquivo index principal para exportar todos os tipos do projeto
// Ao invés de definir tipos aqui, estamos centralizando em globalTypes.ts
export * from './globalTypes';

export interface ValidationDeepResearch {
  status: string;
  mensagem: string;
  cor?: string;
  requestId?: string;
  sugestao_original?: any[];
}

export interface SugerirNCM {
  ncm: string;
  descricao: string;
  atributos: string[];
  atributos_tipi: string[];
  classificacao_tributaria: {
    ipi_entrada: string;
    ipi_saida: string;
    pis_entrada: string;
    pis_saida: string;
    cofins_entrada: string;
    cofins_saida: string;
    cst_entrada: string;
    cst_saida: string;
  };
  valores_de_impostos: {
    ipi: string;
    icms: Record<string, any>;
    pis: string;
    cofins: string;
  };
  validacao_deepresearch?: ValidationDeepResearch;
}
