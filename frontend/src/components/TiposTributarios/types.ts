export enum EstadoTributario {
  DEFAULT = 'default',
  VERDADEIRO = 'verdadeiro',
  POSITIVO = 'positivo',

  // Créditos - Tons de Verde
  CREDITO_BASICO = 'credito_basico',
  CREDITO_MERCADO_INTERNO = 'credito_mercado_interno',
  CREDITO_NAO_TRIBUTADO = 'credito_nao_tributado',
  CREDITO_EXPORTACAO = 'credito_exportacao',
  CREDITO_TRIBUTADO_NAO_TRIBUTADO = 'credito_tributado_nao_tributado',
  CREDITO_TRIBUTADO_EXPORTACAO = 'credito_tributado_exportacao',
  CREDITO_NAO_TRIBUTADO_EXPORTACAO = 'credito_nao_tributado_exportacao',

  // Atenção - Tons de Amarelo
  ATENCAO = 'atencao',
  SUSPENSA = 'suspensa',
  SUBSTITUICAO_TRIBUTARIA = 'substituicao_tributaria',
  MONOFASICA_REVENDA = 'monofasica_revenda',
  ALIQUOTA_DIFERENCIADA = 'aliquota_diferenciada',

  // Negativos - Tons de Vermelho
  NEGATIVO = 'negativo',
  SEM_CREDITO = 'sem_credito',
  SEM_INCIDENCIA = 'sem_incidencia',
  OUTRAS_OPERACOES = 'outras_operacoes',

  // Neutros - Tons de Azul
  NEUTRO = 'neutro',
  ALIQUOTA_BASICA = 'aliquota_basica',
  ALIQUOTA_UNIDADE_MEDIDA = 'aliquota_unidade_medida',
  MERCADO_INTERNO = 'mercado_interno',
  NAO_TRIBUTADO = 'nao_tributado',
  EXPORTACAO = 'exportacao'
}

export interface TipoTributarioAtivo {
  operacao: string;
  codigo: string;
  descricao?: string;
  texto_completo?: string;
  classificacao_tributaria?: {
    tipo_classificacao_tributario?: {
      justificativa?: string;
    };
  };
}

export interface TiposTributariosProps {
  tipoAtivo?: TipoTributarioAtivo;
  temResposta?: boolean;
  justificativa?: string;
  texto_completo?: string;
} 