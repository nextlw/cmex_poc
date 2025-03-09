#!/usr/bin/env node

/**
 * Script para testar o modelo local (Qwen) sem depender de chaves de API
 * Uso: node scripts/test-local-model.js
 */

const path = require("path");
const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
require("dotenv").config();

console.log("🚀 Iniciando teste do modelo local (Qwen)...");

try {
  // Verificar se o diretório dist existe
  const distDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) {
    console.log("📁 Compilando arquivos TypeScript...");
    try {
      execSync("tsc -p tsconfig.test.json", { stdio: "inherit" });
    } catch (error) {
      console.error("❌ Erro ao compilar TypeScript.");
      process.exit(1);
    }
  }

  // Verificar se o modelo local está em execução
  console.log(
    "🔍 Verificando se o servidor do modelo local está em execução..."
  );

  try {
    const response = spawnSync(
      "curl",
      ["--max-time", "5", "http://localhost:1234/health"],
      {
        stdio: ["ignore", "pipe", "ignore"],
      }
    );

    const isLocalServerRunning =
      response.status === 0 && response.stdout.toString().includes("ok");

    if (!isLocalServerRunning) {
      console.warn(
        "⚠️ O servidor do modelo local não parece estar em execução."
      );
      console.warn(
        "Por favor, execute o servidor do modelo local em outro terminal e tente novamente."
      );
      process.exit(1);
    }

    console.log("✅ Servidor do modelo local detectado!");
  } catch (error) {
    console.warn("⚠️ Não foi possível verificar o servidor do modelo local.");
    console.warn(
      "Certifique-se de que ele esteja em execução antes de continuar."
    );
  }

  // Produto de teste
  const testProduct = {
    name: "Camisa Polo",
    description:
      "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
    expectedNCM: "6105.10.00",
  };

  console.log(
    `\n🧪 Testando modelo Qwen (local) com produto: "${testProduct.description}"\n`
  );

  // Executar o teste específico do modelo Qwen
  const { TokenTracker } = require("../dist/utils/token-tracker");
  const { modelFactory } = require("../dist/controllers/deepResearchNCM");

  async function testLocalModel() {
    try {
      const tokenTracker = new TokenTracker();

      // Criar uma consulta com base no produto
      const consulta = {
        consulta: testProduct.description,
        estadoOrigem: "SP",
        operacao: "venda",
        regimeTributario: "simples",
        tributacao: "normal",
        modelo: "qwen",
        useDeepResearch: true,
      };

      // Criar a instância do modelo usando o factory
      const modelInstance = modelFactory(
        "qwen",
        tokenTracker,
        null, // sem dados do FastAPI
        consulta
      );

      // Iniciando o teste
      console.log("📊 Iniciando análise...");
      const startTime = Date.now();

      // Executar a análise
      const result = await modelInstance.analisar();

      // Calculando o tempo de resposta
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      // Verificar se o NCM retornado corresponde ao esperado
      const resultNcm = result.ncm_code || "";
      const expectedNcm = testProduct.expectedNCM;
      const isCorrect =
        resultNcm.replace(/[^\d]/g, "") === expectedNcm.replace(/[^\d]/g, "");

      console.log("\n📋 Resultado do teste:");
      console.log(`NCM Esperado: ${expectedNcm}`);
      console.log(`NCM Obtido: ${resultNcm}`);
      console.log(`Correto: ${isCorrect ? "✅ Sim" : "❌ Não"}`);
      console.log(
        `Tempo de processamento: ${processingTime.toFixed(2)} segundos`
      );
      console.log(`Confiança: ${result.confidence || "N/A"}`);

      // Gerar relatório
      const reportDir = path.join(process.cwd(), "docs", "tests");
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      const today = new Date().toISOString().split("T")[0];
      const reportPath = path.join(reportDir, `teste-local-${today}.md`);

      const reportContent = `# Teste do Modelo Local (Qwen)

**Data:** ${today}

## Produto Testado

"${testProduct.description}"

## Resultado

- **NCM Esperado:** ${expectedNcm}
- **NCM Obtido:** ${resultNcm}
- **Resultado:** ${isCorrect ? "✅ Correto" : "❌ Incorreto"}
- **Tempo de processamento:** ${processingTime.toFixed(2)} segundos
- **Confiança:** ${result.confidence || "N/A"}

## Detalhes da Resposta

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`

## Conclusão

O modelo local ${
        isCorrect ? "classificou corretamente" : "não classificou corretamente"
      } o produto no código NCM esperado. O tempo de resposta foi de ${processingTime.toFixed(
        2
      )} segundos, ${
        processingTime < 3
          ? "o que é bastante rápido"
          : "o que é um pouco lento"
      } para um modelo local.
`;

      fs.writeFileSync(reportPath, reportContent);
      console.log(`\n📝 Relatório gerado em: ${reportPath}`);

      return result;
    } catch (error) {
      console.error("❌ Erro ao testar modelo local:", error);
      process.exit(1);
    }
  }

  // Executar o teste do modelo local
  testLocalModel().catch((error) => {
    console.error("Erro ao executar teste do modelo local:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("❌ Erro ao executar teste do modelo local:", error);
  process.exit(1);
}
