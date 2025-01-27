

export interface ValoresImpostos {
  ipi: string;
  icms: {
    [estado: string]: string;
  };
  pis: string;
  cofins: string;
}

export interface ClassificacaoTributaria {
  monofasico: boolean;
  aliquota_zero: boolean;
  ipi_entrada: string;
  ipi_saida: string;
  pis_entrada: string;
  pis_saida: string;
  cofins_entrada: string;
  cofins_saida: string;
  cst_entrada: string;
  cst_saida: string;
}

export interface HistoricoItem {

  // Colunas da tabela
  id: string;
  modelo: string;
  criado_em: string;
  
  // Coluna de resultados
  descricao: string;
  ncm: string;
  atributos: string[];
  atributos_tipi: string[];
  classificacao_tributaria: ClassificacaoTributaria;
  valores_de_impostos: ValoresImpostos;
}
