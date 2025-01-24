export enum EstadoTributario {
  DEFAULT = 'default',
  VERDADEIRO = 'verdadeiro',
  POSITIVO = 'positivo',    // Verde - para operações favoráveis
  ATENCAO = 'atencao',      // Amarelo - para operações que precisam de atenção
  NEGATIVO = 'negativo',    // Vermelho - para operações desfavoráveis
  NEUTRO = 'neutro'         // Azul - para operações neutras
}

export interface DadosTributarios {
  codigo: string;
  valor: boolean;
  descricao?: string;
  estado?: EstadoTributario;
}

export interface ClassificacaoTributaria {
  [key: string]: {
    [key: string]: DadosTributarios;
  };
}

export interface TipoOperacao {
  [key: string]: ClassificacaoTributaria;
}

export interface GrupoOperacoes {
  [key: string]: TipoOperacao;
}

export interface TiposTributariosProps {
  classificacao?: GrupoOperacoes;
  temResposta?: boolean;
} 