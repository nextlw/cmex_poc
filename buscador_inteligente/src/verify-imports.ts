/**
 * Arquivo de verificação de importações
 * Este arquivo importa todos os tipos principais para garantir que as importações estão corretas
 */

import {
  QuerySession,
  FastApiNCMResult,
  ConsultaProduto,
  StepAction,
  TrackerContext,
  AnswerAction,
} from "./types/globalTypes";

console.log("✅ Todas as importações de tipos estão funcionando corretamente.");

// Verificando a estrutura básica de alguns tipos
const sessionStub: Partial<QuerySession> = {
  id: "test-session",
  question: "Teste de importação",
  status: "in_progress",
};

const resultStub: Partial<FastApiNCMResult> = {
  ncm_code: "1234.56.78",
  description: "Teste de importação",
};

const consultaStub: Partial<ConsultaProduto> = {
  consulta: "Teste de produto",
  modelo: "local-model",
};

console.log("✅ Validação da estrutura dos tipos concluída com sucesso.");
console.log(
  "📦 Tipos importados:",
  [
    "QuerySession",
    "FastApiNCMResult",
    "ConsultaProduto",
    "StepAction",
    "TrackerContext",
    "AnswerAction",
  ].join(", ")
);
