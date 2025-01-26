export enum EstadoTributario {
  DEFAULT = 'default',
  VERDADEIRO = 'verdadeiro',
  POSITIVO = 'positivo',    // Verde - para operações favoráveis
  ATENCAO = 'atencao',      // Amarelo - para operações que precisam de atenção
  NEGATIVO = 'negativo',    // Vermelho - para operações desfavoráveis
  NEUTRO = 'neutro'         // Azul - para operações neutras
}

export interface TipoTributario {
  codigo?: string;
  operacao?: string;
  texto_completo?: string;
  descricao?: string;
  justificativa?: string;
}

export interface TiposTributariosProps {
  tipoAtivo?: TipoTributario;
  temResposta?: boolean;
} 