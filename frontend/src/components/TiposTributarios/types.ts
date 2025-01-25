export enum EstadoTributario {
  DEFAULT = 'default',
  VERDADEIRO = 'verdadeiro',
  POSITIVO = 'positivo',    // Verde - para operações favoráveis
  ATENCAO = 'atencao',      // Amarelo - para operações que precisam de atenção
  NEGATIVO = 'negativo',    // Vermelho - para operações desfavoráveis
  NEUTRO = 'neutro'         // Azul - para operações neutras
}

export interface TipoTributarioAtivo {
  operacao: string;
  codigo: string;
  descricao?: string;
  texto_completo?: string;  // Campo para armazenar o texto completo do tipo tributário
}

export interface TiposTributariosProps {
  tipoAtivo?: TipoTributarioAtivo;
  temResposta?: boolean;
} 