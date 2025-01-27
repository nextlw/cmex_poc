
export interface BoxdeImpostosProps {
  classificacao: {
    tipo_classificacao_tributario?: {
      tipo_tributario_ativo: string;
    };
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
