#!/usr/bin/env node

/**
 * Script para testar um único modelo com um único produto
 * Uso: node scripts/test-single-model.js gemini-1.5-pro "Camisa polo masculina 100% algodão"
 */

// Importando as dependências necessárias (note que precisam ser compiladas antes com tsc)
try {
  // Verificar se o arquivo de tokens existe
  const fs = require("fs");
  const { TokenTracker } = require("../dist/utils/token-tracker");
  const { modelFactory } = require("../dist/controllers/deepResearchNCM");
  require("dotenv").config();

  // Obter argumentos da linha de comando
  const modelName = process.argv[2];
  const productDescription = process.argv[3];

  if (!modelName || !productDescription) {
    console.error(
      'Uso: node scripts/test-single-model.js <modelo> "<descrição do produto>"'
    );
    console.error(
      "Modelos disponíveis: gpt4, claude, deepseek, qwen, gemini-1.5-pro"
    );
    process.exit(1);
  }

  // Lista de modelos válidos para validação
  const validModels = [
    "gpt4",
    "claude",
    "deepseek",
    "qwen",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ];

  if (!validModels.includes(modelName.toLowerCase())) {
    console.error(`Modelo "${modelName}" não é válido.`);
    console.error(`Modelos disponíveis: ${validModels.join(", ")}`);
    process.exit(1);
  }

  // Função para testar um modelo com um produto
  async function testSingleModel() {
    console.log(
      `\n🧪 Testando modelo ${modelName} com produto: "${productDescription}"\n`
    );

    try {
      // Configurar o tracker de tokens
      const tokenTracker = new TokenTracker();

      // Criar uma consulta com base no produto
      const consulta = {
        consulta: productDescription,
        estadoOrigem: "SP",
        operacao: "venda",
        regimeTributario: "simples",
        tributacao: "normal",
        modelo: modelName,
        useDeepResearch: true,
      };

      // Criar a instância do modelo usando o factory
      const modelInstance = modelFactory(
        modelName,
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

      // Exibir resultado
      console.log("\n✅ Análise concluída:");
      console.log(`- Modelo: ${modelName}`);
      console.log(
        `- Tempo de processamento: ${processingTime.toFixed(2)} segundos`
      );
      console.log(`- NCM: ${result.ncm_code}`);
      console.log(`- Descrição: ${result.description}`);
      console.log(`- Confiança: ${result.confidence || "N/A"}`);

      console.log("\n📝 Resultado completo:");
      console.log(JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error(`\n❌ Erro ao testar modelo ${modelName}:`, error);
      process.exit(1);
    }
  }

  // Executar o teste
  testSingleModel().catch((error) => {
    console.error("Erro ao executar teste:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Erro ao carregar dependências:", error);
  console.error("\nCertifique-se de que o código TypeScript foi compilado:");
  console.error("  pnpm run build");
  process.exit(1);
}
