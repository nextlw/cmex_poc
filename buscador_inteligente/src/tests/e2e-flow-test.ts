import { ConsultaProduto, FastApiNCMResult } from "../types";
import {
  TokenTracker,
  DeepResearch,
  DeepResearchGemini,
  modelFactory,
  StepResult,
  ResearchContext,
} from "./modules/simplified-deepresearch";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Carregar variáveis de ambiente
dotenv.config();

// Interface para simular o estado do frontend
interface FrontendState {
  selectedModel: string;
  inputQuery: string;
  isProcessing: boolean;
  result: FastApiNCMResult | null;
  error: string | null;
}

// Interface para registrar o processo de deep research
interface DeepResearchEvidence {
  steps: {
    step: number;
    prompt: string;
    response: string;
    parsedResponse: any;
    success: boolean;
    error?: string;
    processingTime: number;
    retryCount?: number;
  }[];
  finalResult: FastApiNCMResult | null;
  totalProcessingTime: number;
}

// Configurações para retry
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 2000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};

// Casos de teste
const testCases = [
  {
    description: "Camisa Polo - Caso Base",
    input: {
      query:
        "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
      expectedNCM: "6105.10.00",
      model: "gemini-1.5-pro",
    },
  },
  {
    description: "Camisa Polo - Caso com Detalhes Específicos",
    input: {
      query:
        "Camisa polo masculina, tecido piqué 100% algodão, manga curta, gola canelada com listras, 3 botões frontais perolizados, logotipo bordado no peito, fenda lateral, barra reta.",
      expectedNCM: "6105.10.00",
      model: "gemini-1.5-pro",
    },
  },
];

// Função utilitária para esperar um tempo determinado
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Função que estende a classe DeepResearch para capturar todas as etapas
function createInstrumentedDeepResearch(
  modelo: string,
  tokenTracker: TokenTracker,
  fastApiData: FastApiNCMResult | null,
  consulta: ConsultaProduto
): { model: DeepResearch; evidence: DeepResearchEvidence } {
  // Evidências a serem coletadas
  const evidence: DeepResearchEvidence = {
    steps: [],
    finalResult: null,
    totalProcessingTime: 0,
  };

  // Criar modelo original
  const originalModel = modelFactory(
    modelo,
    tokenTracker,
    fastApiData,
    consulta
  );

  // Sobreescrever o método processStep com retry
  const originalProcessStep = originalModel.processStep.bind(originalModel);
  originalModel.processStep = async (
    step: number,
    context: ResearchContext
  ): Promise<StepResult> => {
    const prompt = (originalModel as any).getPromptForStep(step, context);
    console.log(`\n📝 Executando Passo ${step}/5: ${getStepDescription(step)}`);

    let result: StepResult | null = null;
    let retryCount = 0;
    let lastError: any = null;
    let processingTime = 0;
    let startTime = 0;
    let endTime = 0;

    // Implementação com retry e backoff exponencial
    while (retryCount <= RETRY_CONFIG.maxRetries && !result?.success) {
      try {
        if (retryCount > 0) {
          const delayMs = Math.min(
            RETRY_CONFIG.initialDelayMs *
              Math.pow(RETRY_CONFIG.backoffFactor, retryCount - 1),
            RETRY_CONFIG.maxDelayMs
          );
          console.log(
            `🔄 Tentativa ${retryCount + 1}/${
              RETRY_CONFIG.maxRetries + 1
            } após ${delayMs / 1000}s de espera...`
          );
          await delay(delayMs);
        }

        startTime = Date.now();
        result = await originalProcessStep(step, context);
        endTime = Date.now();
        processingTime = (endTime - startTime) / 1000;

        if (result.success) {
          console.log(
            `✅ Passo ${step} concluído em ${processingTime.toFixed(2)}s` +
              (retryCount > 0 ? ` (após ${retryCount} tentativas)` : "")
          );
        } else {
          throw new Error(result.error || "Erro desconhecido");
        }
      } catch (error: any) {
        lastError = error;
        retryCount++;
        console.error(
          `❌ Erro no passo ${step} (tentativa ${retryCount}/${
            RETRY_CONFIG.maxRetries + 1
          }): ${error.message}`
        );

        // Se atingiu o número máximo de tentativas, cria um resultado de erro
        if (retryCount > RETRY_CONFIG.maxRetries) {
          result = {
            success: false,
            content: null,
            error: `Falha após ${RETRY_CONFIG.maxRetries + 1} tentativas: ${
              error.message
            }`,
          };
          endTime = Date.now();
          processingTime = (endTime - startTime) / 1000;
        }
      }
    }

    let parsedResponse = null;
    if (result?.content) {
      try {
        parsedResponse = JSON.parse(result.content);
        console.log(
          `📊 Resultado do Passo ${step}:`,
          JSON.stringify(parsedResponse, null, 2).substring(0, 200) + "..."
        );
      } catch (error) {
        console.error(
          `❌ Erro ao fazer parse do resultado do passo ${step}:`,
          error
        );
      }
    }

    // Registrar evidência da etapa
    evidence.steps.push({
      step,
      prompt,
      response: result?.content || "",
      parsedResponse,
      success: result?.success || false,
      error: result?.error || undefined,
      processingTime,
      retryCount,
    });

    // Se ainda não temos um resultado válido, retornar erro
    if (!result) {
      return {
        success: false,
        content: null,
        error: `Falha ao processar passo ${step}: ${
          lastError?.message || "Erro desconhecido"
        }`,
      };
    }

    return result;
  };

  // Sobreescrever o método analisar com retry global
  const originalAnalisar = originalModel.analisar.bind(originalModel);
  originalModel.analisar = async (): Promise<FastApiNCMResult> => {
    console.log("\n🔍 Iniciando análise profunda com 5 etapas sequenciais");
    const startTime = Date.now();

    try {
      const result = await originalAnalisar();
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      evidence.finalResult = result;
      evidence.totalProcessingTime = totalTime;

      console.log(`\n✅ Análise concluída em ${totalTime.toFixed(2)} segundos`);
      return result;
    } catch (error: any) {
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;

      evidence.totalProcessingTime = totalTime;
      console.error(
        `\n❌ Análise interrompida após ${totalTime.toFixed(
          2
        )} segundos com erro: ${error.message}`
      );

      // Criar um resultado parcial com base nas etapas bem-sucedidas
      const partialResult = processPartialResults(evidence.steps);
      evidence.finalResult = partialResult;

      return partialResult;
    }
  };

  return { model: originalModel, evidence };
}

// Função para processar resultados parciais quando ocorrem erros
function processPartialResults(
  steps: DeepResearchEvidence["steps"]
): FastApiNCMResult {
  // Cria um resultado vazio
  const partialResult: FastApiNCMResult = {
    ncm_code: "",
    description: "",
    attributes: {},
    taxation: {
      ipi: 0,
      icms: 0,
      pis: 0,
      cofins: 0,
      import_tax: 0,
    },
    conclusion: "",
    confidence: 0,
    model_used: "",
    processing_time: 0,
  };

  // Processa cada passo bem-sucedido
  steps.forEach((step) => {
    if (step.success && step.parsedResponse) {
      try {
        switch (step.step) {
          case 1: // NCM e descrição inicial
            partialResult.ncm_code =
              step.parsedResponse.ncm_code || step.parsedResponse.ncm || "";
            partialResult.description = step.parsedResponse.description || "";
            break;
          case 2: // Características
            partialResult.attributes = {
              ...(partialResult.attributes || {}),
              ...(step.parsedResponse.attributes || {}),
            };
            break;
          case 3: // Tributação
            partialResult.taxation =
              step.parsedResponse.taxation || partialResult.taxation;
            break;
          case 4: // Atributos específicos
            partialResult.attributes = {
              ...(partialResult.attributes || {}),
              ...(step.parsedResponse.attributes || {}),
            };
            break;
          case 5: // Conclusão
            partialResult.conclusion = step.parsedResponse.conclusion || "";
            partialResult.confidence = step.parsedResponse.confidence || 0;
            break;
        }
      } catch (error) {
        console.error(
          `Erro ao processar resultado parcial do passo ${step.step}:`,
          error
        );
      }
    }
  });

  return partialResult;
}

// Função para obter descrição textual de cada etapa
function getStepDescription(step: number): string {
  switch (step) {
    case 1:
      return "Identificação do código NCM";
    case 2:
      return "Análise de características do produto";
    case 3:
      return "Cálculo de tributação aplicável";
    case 4:
      return "Identificação de atributos específicos";
    case 5:
      return "Conclusão e nível de confiança";
    default:
      return "Etapa desconhecida";
  }
}

// Função para simular o fluxo do frontend
async function simulateFrontendFlow(
  testCase: (typeof testCases)[0],
  testIndex: number
): Promise<void> {
  console.log(
    `\n🧪 Iniciando teste (${testIndex + 1}/${testCases.length}): ${
      testCase.description
    }\n`
  );

  // Simular estado inicial do frontend
  const frontendState: FrontendState = {
    selectedModel: testCase.input.model,
    inputQuery: testCase.input.query,
    isProcessing: false,
    result: null,
    error: null,
  };

  // Criar instância do TokenTracker
  const tokenTracker = new TokenTracker();

  // Criar consulta com base no estado do frontend
  const consulta: ConsultaProduto = {
    consulta: frontendState.inputQuery,
    estadoOrigem: "SP",
    operacao: "venda",
    regimeTributario: "simples",
    tributacao: "normal",
    modelo: frontendState.selectedModel,
    useDeepResearch: true,
  };

  try {
    // Simular início do processamento
    console.log("📝 Detalhes da Consulta:");
    console.log(`Modelo Selecionado: ${frontendState.selectedModel}`);
    console.log(`Query: "${frontendState.inputQuery}"`);
    console.log("\n🔄 Iniciando processamento...");

    frontendState.isProcessing = true;
    const startTime = Date.now();

    // Criar instância instrumentada do modelo
    const { model: modelo, evidence } = createInstrumentedDeepResearch(
      frontendState.selectedModel,
      tokenTracker,
      null,
      consulta
    );

    // Executar análise
    const result = await modelo.analisar();
    frontendState.result = result;

    // Calcular tempo de processamento
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    // Verificar resultado
    const isCorrect =
      result.ncm_code.replace(/[^\d]/g, "") ===
      testCase.input.expectedNCM.replace(/[^\d]/g, "");

    // Gerar relatório
    await generateTestReport(
      testCase,
      frontendState,
      processingTime,
      isCorrect,
      tokenTracker,
      evidence
    );

    console.log("\n📊 Resultado Final do Teste:");
    console.log(`NCM Esperado: ${testCase.input.expectedNCM}`);
    console.log(`NCM Obtido: ${result.ncm_code}`);
    console.log(`Correto: ${isCorrect ? "✅ Sim" : "❌ Não"}`);
    console.log(
      `Tempo de Processamento Total: ${processingTime.toFixed(2)} segundos`
    );
    console.log(`Confiança: ${result.confidence || "N/A"}`);

    // Intervalo entre testes para evitar problemas de quota
    if (testIndex < testCases.length - 1) {
      const cooldownTime = 5000; // 5 segundos
      console.log(
        `\n⏱️ Aguardando ${
          cooldownTime / 1000
        }s antes do próximo teste para evitar limitações de API...`
      );
      await delay(cooldownTime);
    }

    return;
  } catch (error: any) {
    frontendState.error = error.message;
    console.error("❌ Erro durante o teste:", error);
    throw error;
  } finally {
    frontendState.isProcessing = false;
  }
}

// Função para gerar relatório do teste
async function generateTestReport(
  testCase: (typeof testCases)[0],
  frontendState: FrontendState,
  processingTime: number,
  isCorrect: boolean,
  tokenTracker: TokenTracker,
  evidence: DeepResearchEvidence
): Promise<void> {
  const reportDir = path.join(process.cwd(), "docs", "tests");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const today = new Date().toISOString().split("T")[0];
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+/, "");
  const reportPath = path.join(
    reportDir,
    `e2e-test-${timestamp}-${testCase.description
      .toLowerCase()
      .replace(/\s+/g, "-")}.md`
  );

  // Criar conteúdo do relatório
  let reportContent = `# Teste E2E - ${testCase.description}

## Data: ${today}

### Configuração do Teste
- **Modelo Selecionado:** ${frontendState.selectedModel}
- **Query:** "${frontendState.inputQuery}"

### Resultado
- **NCM Esperado:** ${testCase.input.expectedNCM}
- **NCM Obtido:** ${frontendState.result?.ncm_code || "N/A"}
- **Resultado:** ${isCorrect ? "✅ Correto" : "❌ Incorreto"}
- **Tempo de Processamento Total:** ${processingTime.toFixed(2)} segundos
- **Confiança:** ${frontendState.result?.confidence || "N/A"}

## Processo de Análise Profunda (Deep Research)

### Resumo
- **Total de Etapas:** ${evidence.steps.length}
- **Etapas Concluídas com Sucesso:** ${
    evidence.steps.filter((s) => s.success).length
  }
- **Tempo Total de Processamento:** ${evidence.totalProcessingTime.toFixed(
    2
  )} segundos
- **Total de Retentativas:** ${evidence.steps.reduce(
    (acc, s) => acc + (s.retryCount || 0),
    0
  )}

`;

  // Adicionar detalhes de cada etapa
  reportContent += `### Detalhes das Etapas\n\n`;

  for (const step of evidence.steps) {
    reportContent += `#### Etapa ${step.step}: ${getStepDescription(
      step.step
    )}\n\n`;
    reportContent += `- **Status:** ${
      step.success ? "✅ Sucesso" : "❌ Falha"
    }\n`;
    reportContent += `- **Tempo de Processamento:** ${step.processingTime.toFixed(
      2
    )} segundos\n`;
    if (step.retryCount && step.retryCount > 0) {
      reportContent += `- **Tentativas Realizadas:** ${step.retryCount + 1}\n`;
    }
    reportContent += `\n`;

    reportContent += `**Prompt Enviado:**\n\`\`\`\n${step.prompt}\n\`\`\`\n\n`;

    if (step.success && step.response) {
      reportContent += `**Resposta JSON:**\n\`\`\`json\n${JSON.stringify(
        step.parsedResponse,
        null,
        2
      )}\n\`\`\`\n\n`;
    } else if (step.error) {
      reportContent += `**Erro:**\n\`\`\`\n${step.error}\n\`\`\`\n\n`;
    }
  }

  // Adicionar resultado final
  reportContent += `### Resultado Consolidado
\`\`\`json
${JSON.stringify(frontendState.result, null, 2)}
\`\`\`

### Análise de Tokens
\`\`\`json
${JSON.stringify(tokenTracker.getUsageByModel(), null, 2)}
\`\`\`

### Conclusão
O modelo ${frontendState.selectedModel} ${
    isCorrect ? "classificou corretamente" : "não classificou corretamente"
  } o produto no código NCM esperado. 
${
  frontendState.result?.conclusion
    ? `\nConclusão do modelo:\n${frontendState.result.conclusion}`
    : ""
}

### Observações
- Tempo de resposta total: ${processingTime.toFixed(2)} segundos
- Taxa de confiança: ${frontendState.result?.confidence || "N/A"}
${
  frontendState.error
    ? `- Erros encontrados: ${frontendState.error}`
    : "- Nenhum erro encontrado durante o processamento"
}
`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n📝 Relatório detalhado gerado em: ${reportPath}`);
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log(
    "🚀 Iniciando suite de testes E2E com análise profunda e retry\n"
  );

  let passedTests = 0;
  let failedTests = 0;

  for (const [index, testCase] of testCases.entries()) {
    try {
      await simulateFrontendFlow(testCase, index);
      passedTests++;
    } catch (error) {
      console.error(`❌ Erro fatal no teste "${testCase.description}":`, error);
      failedTests++;
    }
  }

  console.log("\n✅ Suite de testes concluída!");
  console.log(
    `Resultados: ${passedTests} testes passaram, ${failedTests} falharam`
  );
}

// Executar os testes
runAllTests();
