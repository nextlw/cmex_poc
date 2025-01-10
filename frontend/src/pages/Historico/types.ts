

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
  id: string;
  modelo: string;
  timestamp: string;
  ncm: string;
  descricao: string;
  atributos: string[];
  atributos_tipi: string[];
  valores_de_impostos: ValoresImpostos;
  classificacao_tributaria: ClassificacaoTributaria;
}
