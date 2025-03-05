// Exportação de tipos globais
export * from './globalTypes';

// Importação dos módulos
import * as TestTypesInternal from './TestTypes';
import * as SessionModule from './session';

// Re-exportação com namespace
export const TestModule = TestTypesInternal;
export { SessionModule }; 