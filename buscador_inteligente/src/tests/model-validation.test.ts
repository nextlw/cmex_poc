import { TokenTracker } from "../utils/token-tracker";
import { DeepResearch } from "../modules/deepResearch";
import { FastApiNCMResult, ConsultaProduto } from "../types/ncm";
import { modelFactory } from "../controllers/deepResearchNCM";
import fs from "fs";
import path from "path";

// Interfaces para tipagem
interface TestProduct {
  name: string;
  description: string;
  expectedNCM: string;
}

interface TestResult {
  model: string;
  product: string;
  result?: FastApiNCMResult;
  processingTime?: number;
  tokenUsage?: Record<string, number>;
  correctNCM?: boolean;
  expectedNCM?: string;
  actualNCM?: string;
  error?: string;
  success: boolean;
}

interface ModelResult {
  model: string;
  results: TestResult[];
  correctCount: number;
  totalCount: number;
}

// Produtos de teste reais para avaliar os modelos
const testProducts: TestProduct[] = [
  {
    name: "Camisa Polo",
    description:
      "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
    expectedNCM: "6105.10.00",
  },
  {
    name: "Smart TV",
    description:
      "Smart TV LED 50 polegadas, resolução 4K, com processador quad-core, sistema operacional WebOS, conexão Wi-Fi, Bluetooth e 3 entradas HDMI.",
    expectedNCM: "8528.72.00",
  },
  {
    name: "Cafeteira Elétrica",
    description:
      "Cafeteira elétrica automática, potência 800W, capacidade para 1,5L, sistema corta-pingos, desligamento automático e porta-filtro removível.",
    expectedNCM: "8516.71.00",
  },
  {
    name: "Medicamento Analgésico",
    description:
      "Medicamento analgésico e antitérmico à base de paracetamol 750mg, em comprimidos, caixa com 20 unidades.",
    expectedNCM: "3004.90.19",
  },
  {
    name: "Perfume",
    description:
      "Perfume feminino, concentração eau de parfum, fragrância floral, embalagem de vidro com 50ml.",
    expectedNCM: "3303.00.20",
  },
];

// Lista de modelos a serem testados
const modelsToTest: string[] = [
  "gpt4",
  "claude",
  "deepseek",
  "qwen",
  "gemini-1.5-pro",
];

// Função para testar um modelo com um produto
async function testModel(
  modelName: string,
  product: TestProduct
): Promise<TestResult> {
  console.log(`Testando modelo ${modelName} com produto ${product.name}...`);

  // Configurar o tracker de tokens
  const tokenTracker = new TokenTracker();

  // Criar uma consulta com base no produto
  const consulta: ConsultaProduto = {
    consulta: product.description,
    estadoOrigem: "SP",
    operacao: "venda",
    regimeTributario: "simples",
    tributacao: "normal",
    modelo: modelName,
    useDeepResearch: true,
  };

  try {
    // Criar a instância do modelo usando o factory
    const modelInstance = modelFactory(
      modelName,
      tokenTracker,
      null, // sem dados do FastAPI
      consulta
    );

    // Iniciando o teste
    const startTime = Date.now();

    // Executar a análise
    const result = await modelInstance.analisar();

    // Calculando o tempo de resposta
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    // Obter o uso de tokens
    const tokenUsage = tokenTracker.getUsageByModel(modelName);

    // Verificar se o NCM retornado corresponde ao esperado
    const correctNCM =
      result.ncm_code.replace(/[^\d]/g, "") ===
      product.expectedNCM.replace(/[^\d]/g, "");

    return {
      model: modelName,
      product: product.name,
      result,
      processingTime,
      tokenUsage,
      correctNCM,
      expectedNCM: product.expectedNCM,
      actualNCM: result.ncm_code,
      success: true,
    };
  } catch (error) {
    console.error(
      `Erro ao testar modelo ${modelName} com produto ${product.name}:`,
      error
    );
    return {
      model: modelName,
      product: product.name,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      success: false,
    };
  }
}

// Função principal para executar todos os testes
async function runAllTests(): Promise<void> {
  const results: ModelResult[] = [];
  const startTime = Date.now();

  for (const model of modelsToTest) {
    const modelResults: TestResult[] = [];
    console.log(`\n--- Iniciando testes para modelo ${model} ---\n`);

    for (const product of testProducts) {
      const result = await testModel(model, product);
      modelResults.push(result);

      // Aguardar um pouco entre as chamadas para evitar limitações de API
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    results.push({
      model,
      results: modelResults,
      correctCount: modelResults.filter((r) => r.correctNCM).length,
      totalCount: testProducts.length,
    });
  }

  const endTime = Date.now();
  const totalTestTime = (endTime - startTime) / 1000;

  // Gerar relatório
  generateReport(results, totalTestTime);
}

// Função para gerar o relatório em Markdown
function generateReport(results: ModelResult[], totalTestTime: number): void {
  const reportDate = new Date().toISOString().split("T")[0];
  const reportDir = path.join(__dirname, "../../docs/tests");

  // Criar o diretório de relatórios se não existir
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `modelos-ia-teste-${reportDate}.md`);

  let reportContent = `# Relatório de Validação dos Modelos de IA\n\n`;
  reportContent += `**Data:** ${reportDate}\n\n`;
  reportContent += `**Tempo total de execução:** ${totalTestTime.toFixed(
    2
  )} segundos\n\n`;
  reportContent += `## Resumo\n\n`;
  reportContent += `| Modelo | Acertos | Total | Taxa de Acerto |\n`;
  reportContent += `|--------|---------|-------|---------------|\n`;

  for (const modelResult of results) {
    const accuracy = (
      (modelResult.correctCount / modelResult.totalCount) *
      100
    ).toFixed(2);
    reportContent += `| ${modelResult.model} | ${modelResult.correctCount} | ${modelResult.totalCount} | ${accuracy}% |\n`;
  }

  reportContent += `\n## Detalhes por Modelo\n\n`;

  for (const modelResult of results) {
    reportContent += `### Modelo: ${modelResult.model}\n\n`;
    reportContent += `| Produto | NCM Esperado | NCM Obtido | Correto | Tempo (s) | Confiança |\n`;
    reportContent += `|---------|--------------|------------|---------|-----------|----------|\n`;

    for (const testResult of modelResult.results) {
      if (!testResult.success) {
        reportContent += `| ${testResult.product} | - | Erro: ${testResult.error} | ❌ | - | - |\n`;
      } else {
        const correct = testResult.correctNCM ? "✅" : "❌";
        reportContent += `| ${testResult.product} | ${
          testResult.expectedNCM
        } | ${testResult.actualNCM} | ${correct} | ${
          testResult.processingTime?.toFixed(2) || "-"
        } | ${testResult.result?.confidence?.toFixed(2) || "-"} |\n`;
      }
    }

    reportContent += `\n#### Exemplos de Resposta\n\n`;

    // Adicionar exemplo de resposta para o primeiro produto (se houver)
    const exampleResult = modelResult.results.find(
      (r: TestResult) => r.success
    );
    if (exampleResult && exampleResult.result) {
      reportContent += `**Produto:** ${exampleResult.product}\n\n`;
      reportContent += "```json\n";
      reportContent += JSON.stringify(exampleResult.result, null, 2);
      reportContent += "\n```\n\n";
    }

    reportContent += `\n`;
  }

  reportContent += `## Conclusão\n\n`;
  reportContent += `Este relatório apresenta os resultados dos testes realizados em ${testProducts.length} produtos reais, utilizando ${modelsToTest.length} modelos diferentes de IA para classificação fiscal (NCM).\n\n`;
  reportContent += `Os resultados mostram a eficácia de cada modelo em termos de precisão na classificação e tempo de resposta, fornecendo uma base para decisões sobre qual modelo utilizar em ambiente de produção.\n\n`;

  // Escrever o relatório em um arquivo
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Relatório gerado em: ${reportPath}`);
}

// Executar os testes
runAllTests().catch((error) => {
  console.error("Erro ao executar testes:", error);
});
