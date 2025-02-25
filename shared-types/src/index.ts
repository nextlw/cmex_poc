/**
 * @cmex/shared-types
 * 
 * Pacote que fornece tipos compartilhados entre o frontend e o backend da CMEX,
 * incluindo schemas de validação (Zod) e funções de transformação.
 */

// Exporta utilitários de tratamento de erro
export * from './utils/errorHandling';

// Exporta módulos de tipos específicos
export * as Query from './query';
export * as Stream from './stream';
export * as Logs from './logs'; 
export * as TokenTracker from './tokenTracker';

// Re-exporta tipos e transformadores comumente utilizados
// para simplificar importações

// Re-exportações de Query
export {
  transformQueryStatus,
  transformQueryObject,
  transformQueryList,
  BackendQueryStatus,
  FrontendQueryStatus,
  BackendQuery,
  FrontendQuery
} from './query';

// Re-exportações de Stream
export {
  transformStreamMessage,
  transformStreamMessageType,
  BackendStreamMessageType,
  FrontendStreamMessageType
} from './stream';

// Re-exportações de Logs
export {
  transformServerLog,
  transformLogsResponse,
  ServerLog,
  FrontendLog,
  LogsResponse
} from './logs';

// Re-exportações de TokenTracker
export {
  transformTokenTracker,
  TokenUsage,
  FrontendTokenTracker
} from './tokenTracker'; 