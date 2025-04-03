export enum FormaPreenchimento {
  TEXTO = "TEXTO",
  NUMERO_INTEIRO = "NUMERO_INTEIRO",
  NUMERO_REAL = "NUMERO_REAL",
  BOOLEANO = "BOOLEANO",
  DATA = "DATA",
  LISTA_ESTATICA = "LISTA_ESTATICA",
  LISTA_DINAMICA = "LISTA_DINAMICA",
  DATA_HORA = "DATA_HORA",
  LISTA_TABX_FILTRO = "LISTA_TABX_FILTRO",
}

export enum Modalidade {
  IMPORTACAO = "IMPORTACAO",
  EXPORTACAO = "EXPORTACAO",
  AMBOS = "AMBOS",
}

export interface DominioItem {
  codigo: string;
  descricao: string;
}

export interface Objetivo {
  codigo: string;
  descricao: string;
}

export interface AtributoNCM {
  codigo: string;
  nome: string;
  nomeApresentacao: string;
  formaPreenchimento: FormaPreenchimento;
  modalidade: Modalidade;
  obrigatorio: boolean;
  dataInicioVigencia: string;
  dataFimVigencia?: string;
  dominio?: DominioItem[];
  objetivos: Objetivo[];
  orgaos: string[];
  atributoCondicionante: boolean;
  multivalorado: boolean;
}
