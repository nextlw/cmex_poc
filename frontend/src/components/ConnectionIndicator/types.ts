/**
 * Tipos para o componente ConnectionIndicator
 */

/**
 * Interface de propriedades para o ConnectionIndicator
 */
export interface ConnectionIndicatorProps {
  /**
   * Status atual da conexão
   */
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error"
    | "failed";

  /**
   * Número de tentativas de reconexão (opcional)
   */
  attempts?: number;

  /**
   * Última mensagem de erro (opcional)
   */
  lastError?: string;

  /**
   * Indica se deve mostrar o texto do status ao lado do indicador
   */
  showText?: boolean;
}
