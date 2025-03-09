#!/usr/bin/env node

/**
 * Script para testar o modelo Gemini com o fluxo completo do sistema
 * Simula o processo real de consulta NCM com Deep Research
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const { TokenTracker } = require("../dist/utils/token-tracker");

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se a chave de API está configurada
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ Chave de API do Google não encontrada!");
  console.error(
    "Por favor, adicione GOOGLE_API_KEY=sua_chave_aqui ao arquivo .env"
  );
  process.exit(1);
}

// Configuração do teste
const TEST_CASE = {
  description: "Camisa Polo - Teste com modelo Gemini",
  query:
    "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
  expectedNCM: "6105.10.00",
  model: "gemini-1.5-pro",
};

// Classe para registrar logs e resultados
class TestReporter {
  constructor(testName) {
    this.logs = [];
    this.results = [];
    this.testId = `${testName}-${new Date().toISOString().replace(/:/g, "-")}`;
    this.reportDir = path.join(process.cwd(), "docs", "tests");

    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    this.logs.push(formattedMessage);
  }

  addResult(result) {
    this.results.push(result);
  }

  writeReport() {
    const reportPath = path.join(
      this.reportDir,
      `complete-e2e-${this.testId}.md`
    );

    let reportContent = `# Teste E2E Completo - ${this.testId}\n\n`;
    reportContent += `## Utilizando fluxo completo do sistema\n\n`;
    reportContent += `### Logs de Execução\n\n`;
    reportContent += this.logs.map((log) => `- ${log}`).join("\n");

    reportContent += `\n\n### Resultados da Consulta\n\n`;
    this.results.forEach((result, index) => {
      reportContent += `#### Resultado ${index + 1}\n\n`;
      reportContent += "```json\n";
      reportContent += JSON.stringify(result, null, 2);
      reportContent += "\n```\n\n";
    });

    fs.writeFileSync(reportPath, reportContent);
    return reportPath;
  }
}

// Função para simular o processo de Deep Research
async function simulateDeepResearch(reporter, testCase) {
  reporter.log(
    `Iniciando simulação de Deep Research para consulta: "${testCase.query}"`
  );

  // Inicializar o cliente Gemini
  reporter.log(`Inicializando cliente Gemini com modelo: ${testCase.model}`);
  const genAI = new GoogleGenerativeAI(apiKey);

  // Criar instância do modelo
  const model = genAI.getGenerativeModel({
    model: testCase.model,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
    },
  });

  reporter.log("Cliente Gemini inicializado com sucesso");

  // Etapas do processo de Deep Research
  const steps = [
    {
      name: "Identificação do código NCM",
      prompt: `Você é um especialista em classificação fiscal de mercadorias.
Analise o produto: "${testCase.query}"

Identifique o código NCM mais apropriado para este produto. Forneça o código e uma breve justificativa.

RESPONDA EM JSON EXATAMENTE COM A SEGUINTE ESTRUTURA:
{
  "action": "answer",
  "think": "Seu raciocínio detalhado aqui",
  "answer": "Código NCM identificado com justificativa",
  "ncm": "CÓDIGO NCM no formato XXXX.XX.XX",
  "descricao": "Descrição oficial do NCM"
}

NÃO INCLUA NENHUM OUTRO TEXTO OU EXPLICAÇÃO FORA DO JSON.`,
    },
    {
      name: "Análise de características do produto",
      prompt: `Você é um especialista em classificação fiscal de mercadorias.
Analise o produto: "${testCase.query}"

Descreva detalhadamente as características do produto que justificam sua classificação no NCM identificado.

RESPONDA EM JSON EXATAMENTE COM A SEGUINTE ESTRUTURA:
{
  "action": "answer",
  "think": "Seu raciocínio detalhado aqui",
  "answer": "Análise detalhada das características",
  "atributos": ["lista", "de", "atributos", "relevantes"]
}

NÃO INCLUA NENHUM OUTRO TEXTO OU EXPLICAÇÃO FORA DO JSON.`,
    },
    {
      name: "Cálculo de tributação aplicável",
      prompt: `Você é um especialista em classificação fiscal de mercadorias.
Analise o produto: "${testCase.query}"

Detalhe a tributação aplicável a este produto (IPI, ICMS, PIS, COFINS).

RESPONDA EM JSON EXATAMENTE COM A SEGUINTE ESTRUTURA:
{
  "action": "answer",
  "think": "Seu raciocínio detalhado aqui",
  "answer": "Análise detalhada da tributação",
  "impostos": {
    "ipi": "X%",
    "icms": {"SP": "X%"},
    "pis": "X%",
    "cofins": "X%"
  }
}

NÃO INCLUA NENHUM OUTRO TEXTO OU EXPLICAÇÃO FORA DO JSON.`,
    },
    {
      name: "Conclusão e nível de confiança",
      prompt: `Você é um especialista em classificação fiscal de mercadorias.
Analise o produto: "${testCase.query}"

Forneça uma conclusão final sobre a classificação, incluindo recomendações e observações importantes.

RESPONDA EM JSON EXATAMENTE COM A SEGUINTE ESTRUTURA:
{
  "action": "answer",
  "think": "Seu raciocínio detalhado aqui",
  "answer": "Conclusão final sobre a classificação",
  "references": [
    {
      "exactQuote": "Citação exata da fonte",
      "url": "URL da fonte (se aplicável)"
    }
  ],
  "confidence": 0.95
}

NÃO INCLUA NENHUM OUTRO TEXTO OU EXPLICAÇÃO FORA DO JSON.`,
    },
  ];

  // Resultados de cada etapa
  const stepResults = [];

  // Executar cada etapa
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    reporter.log(
      `\n📝 Executando Etapa ${i + 1}/${steps.length}: ${step.name}`
    );

    try {
      // Executar a etapa com retry
      let result = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries && !result) {
        try {
          if (retryCount > 0) {
            const delayMs = Math.min(2000 * Math.pow(2, retryCount - 1), 10000);
            reporter.log(
              `🔄 Tentativa ${retryCount + 1}/${maxRetries + 1} após ${
                delayMs / 1000
              }s de espera...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }

          const startTime = Date.now();
          const response = await model.generateContent(step.prompt);
          const endTime = Date.now();
          const processingTime = (endTime - startTime) / 1000;

          const responseText = response.response.text();

          // Extrair JSON da resposta
          let jsonContent;
          try {
            // Tentar extrair JSON se a resposta não for um JSON puro
            if (responseText && !responseText.trim().startsWith("{")) {
              const jsonMatch =
                responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                responseText.match(/\{[\s\S]*\}/);

              if (jsonMatch && jsonMatch[1]) {
                jsonContent = JSON.parse(jsonMatch[1].trim());
              } else {
                throw new Error("Não foi possível extrair JSON da resposta");
              }
            } else {
              jsonContent = JSON.parse(responseText);
            }

            result = {
              step: i + 1,
              name: step.name,
              prompt: step.prompt,
              response: responseText,
              parsedResponse: jsonContent,
              processingTime,
              success: true,
            };

            reporter.log(
              `✅ Etapa ${i + 1} concluída em ${processingTime.toFixed(2)}s` +
                (retryCount > 0 ? ` (após ${retryCount} tentativas)` : "")
            );
            reporter.log(
              `📊 Resultado: ${JSON.stringify(jsonContent).substring(
                0,
                200
              )}...`
            );

            stepResults.push(result);
          } catch (parseError) {
            reporter.log(`❌ Erro ao processar JSON: ${parseError.message}`);
            reporter.log(
              `Resposta recebida: ${responseText.substring(0, 200)}...`
            );
            throw parseError;
          }
        } catch (error) {
          retryCount++;
          reporter.log(
            `❌ Erro na etapa ${i + 1} (tentativa ${retryCount}/${
              maxRetries + 1
            }): ${error.message}`
          );

          if (retryCount > maxRetries) {
            reporter.log(
              `❌ Número máximo de tentativas excedido para etapa ${i + 1}`
            );
            stepResults.push({
              step: i + 1,
              name: step.name,
              prompt: step.prompt,
              response: error.message,
              success: false,
              error: error.message,
            });
            break;
          }
        }
      }
    } catch (error) {
      reporter.log(`❌ Erro fatal na etapa ${i + 1}: ${error.message}`);
      stepResults.push({
        step: i + 1,
        name: step.name,
        prompt: step.prompt,
        response: error.message,
        success: false,
        error: error.message,
      });
    }
  }

  // Processar os resultados para criar o resultado final
  reporter.log("\n🔄 Processando resultados finais...");

  // Criar o resultado consolidado
  const finalResult = {
    ncm: "",
    descricao: "",
    atributos: [],
    impostos: {
      ipi: "",
      icms: {},
      pis: "",
      cofins: "",
    },
    conclusion: "",
    confidence: 0,
    references: [],
    model_used: testCase.model,
    processing_time: stepResults.reduce(
      (total, step) => total + (step.processingTime || 0),
      0
    ),
  };

  // Extrair informações de cada etapa
  stepResults.forEach((result) => {
    if (result.success && result.parsedResponse) {
      const data = result.parsedResponse;

      // Etapa 1: NCM e descrição
      if (result.step === 1) {
        finalResult.ncm = data.ncm || "";
        finalResult.descricao = data.descricao || "";
      }

      // Etapa 2: Atributos
      if (result.step === 2 && data.atributos) {
        finalResult.atributos = data.atributos;
      }

      // Etapa 3: Impostos
      if (result.step === 3 && data.impostos) {
        finalResult.impostos = data.impostos;
      }

      // Etapa 4: Conclusão e confiança
      if (result.step === 4) {
        finalResult.conclusion = data.answer || "";
        finalResult.confidence = data.confidence || 0;
        finalResult.references = data.references || [];
      }

      // Adicionar o raciocínio de cada etapa
      if (data.think) {
        finalResult[`think_step_${result.step}`] = data.think;
      }
    }
  });

  // Verificar se o NCM está correto
  const obtainedNCM = finalResult.ncm.replace(/[^\d]/g, "");
  const expectedNCM = testCase.expectedNCM.replace(/[^\d]/g, "");
  const isCorrect = obtainedNCM === expectedNCM;

  reporter.log(`\n📊 Resultado Final:`);
  reporter.log(`NCM Esperado: ${testCase.expectedNCM}`);
  reporter.log(`NCM Obtido: ${finalResult.ncm}`);
  reporter.log(`Resultado: ${isCorrect ? "✅ Correto" : "❌ Incorreto"}`);
  reporter.log(`Confiança: ${finalResult.confidence}`);

  // Adicionar resultado final
  reporter.addResult({
    ...finalResult,
    test_result: {
      expected_ncm: testCase.expectedNCM,
      is_correct: isCorrect,
      total_steps: steps.length,
      successful_steps: stepResults.filter((s) => s.success).length,
    },
    step_details: stepResults.map((s) => ({
      step: s.step,
      name: s.name,
      success: s.success,
      processing_time: s.processingTime || 0,
    })),
  });

  return finalResult;
}

// Função principal
async function runTest() {
  const reporter = new TestReporter("fluxo-completo-js");
  reporter.log("Iniciando teste E2E completo com fluxo real do sistema");

  try {
    const startTime = Date.now();

    // Executar o teste
    await simulateDeepResearch(reporter, TEST_CASE);

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    reporter.log(`\n✅ Teste concluído em ${totalTime.toFixed(2)} segundos`);

    // Gerar relatório
    const reportPath = reporter.writeReport();
    reporter.log(`\n📝 Relatório detalhado gerado em: ${reportPath}`);
  } catch (error) {
    reporter.log(`\n❌ Erro fatal durante o teste: ${error.message}`);
    reporter.writeReport();
  }
}

// Executar o teste
runTest();
