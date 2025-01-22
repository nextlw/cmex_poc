export interface HomePageProps {
  // Se necessário, adicione props específicas do LoginForm aqui
}

export interface TipoTributario {
  monofasico: boolean;
  aliquota_zero: boolean;
  isento: boolean;
  suspenso: boolean;
}

export interface SugerirNCM {
  ncm: string;
  descricao: string;
  atributos: string[];
  atributos_tipi: string[];
  classificacao_tributaria: {
    tipo_tributario?: TipoTributario;
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
    icms: Record<string, string>;
    pis: string;
    cofins: string;
  };
}
