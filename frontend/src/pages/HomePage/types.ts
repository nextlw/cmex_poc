export interface HomePageProps {
  // Se necessário, adicione props específicas do LoginForm aqui
}

export interface SugerirNCM {
  ncm: string;
  descricao: string;
  atributos: string[];
  atributos_tipi: string[];
  valores_de_impostos: {
    ipi: string | number;
    icms: Record<string, string | number>;
    pis: string | number;
    cofins: string | number;
  };
  classificacao_tributaria: {
    monofasico: boolean;
    aliquota_zero: boolean;
    ipi_entrada: string | number;
    ipi_saida: string | number;
    pis_entrada: string | number;
    pis_saida: string | number;
    cofins_entrada: string | number;
    cofins_saida: string | number;
    cst_entrada: string | number;
    cst_saida: string | number;
  };
}
