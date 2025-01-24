export interface ClassificacaoTributaria {
  codigo: string;
  valor: boolean;
  descricao?: string;
  justificativa?: string;
}

export interface TipoOperacao {
  [key: string]: ClassificacaoTributaria;
}

export interface GrupoOperacoes {
  [key: string]: TipoOperacao;
}

export interface TiposTributariosProps {
  classificacao: GrupoOperacoes | undefined;
  temResposta: boolean;
}

export enum EstadoTributario {
  DEFAULT = 'tipo-tributario-empty',
  VERDADEIRO = 'tipo-tributario-true',
  FALSO = 'tipo-tributario-false'
} 