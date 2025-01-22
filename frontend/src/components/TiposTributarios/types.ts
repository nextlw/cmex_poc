export type TipoTributario = 'monofasico' | 'aliquota_zero' | 'isento' | 'suspenso';

export interface EstadosTributarios {
  monofasico: boolean;
  aliquota_zero: boolean;
  isento: boolean;
  suspenso: boolean;
}

export enum EstadoTributario {
  DEFAULT = 'tipo-tributario-empty',
  VERDADEIRO = 'tipo-tributario-true',
  FALSO = 'tipo-tributario-false'
}

export interface TiposTributariosProps {
  estados: EstadosTributarios | null; // null quando não tem resposta
  temResposta: boolean;
} 