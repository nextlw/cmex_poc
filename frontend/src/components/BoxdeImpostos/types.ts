import { GrupoOperacoes } from '../TiposTributarios/types';

export interface TipoTributario {
  monofasico: boolean;
  aliquota_zero: boolean;
  isento: boolean;
  suspenso: boolean;
}

export interface BoxdeImpostosProps {
  classificacao: {
    tipo_classificacao_tributario?: GrupoOperacoes;
    tipo_tributario?: TipoTributario;
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
