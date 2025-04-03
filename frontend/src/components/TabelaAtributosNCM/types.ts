import { ReactNode } from "react";

export enum Modalidade {
  IMPORTACAO = "IMPORTACAO",
  EXPORTACAO = "EXPORTACAO",
  AMBOS = "AMBOS",
}

export enum FormaPreenchimento {
  LISTA_ESTATICA = "LISTA_ESTATICA",
  LISTA_DINAMICA = "LISTA_DINAMICA",
  LISTA_TABX_FILTRO = "LISTA_TABX_FILTRO",
  BOOLEANO = "BOOLEANO",
  TEXTO = "TEXTO",
  NUMERO_INTEIRO = "NUMERO_INTEIRO",
  NUMERO_REAL = "NUMERO_REAL",
  DATA = "DATA",
  DATA_HORA = "DATA_HORA",
  DOMINIO_DINAMICO = "DOMINIO_DINAMICO",
  COMPOSTO = "COMPOSTO",
}

export interface AtributoNCM {
  codigo: string;
  nome: string;
  nomeApresentacao: string;
  modalidade: Modalidade;
  formaPreenchimento: FormaPreenchimento;
  obrigatorio: boolean;
  orientacaoPreenchimento?: string;
  tamanhoMaximo?: number;
  mascara?: string;
  casasDecimais?: number;
  informacaoAdicional?: string;
  dataInicioVigencia?: string;
  dataFimVigencia?: string;
  dominio?: Array<{ codigo: string; descricao: string }>;
  objetivos?: Array<{ codigo: string | number; descricao: string }>;
  orgaos?: string[];
  atributoCondicionante?: boolean;
  multivalorado?: boolean;
}

export interface TabelaAtributosNCMProps {
  atributos?: AtributoNCM[];
  isLoading?: boolean;
  error?: string | null;
}

export interface IconProps {
  title: string;
  children: ReactNode;
  className: string;
}
