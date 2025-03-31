#!/usr/bin/env node

/**
 * Script para executar testes de validação dos modelos de IA
 * Uso: npm run test:models
 */

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

console.log("🚀 Iniciando testes de validação dos modelos de IA...");

// Verificar se o arquivo .env existe
const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.warn(
    "⚠️ Arquivo .env não encontrado. Certifique-se de que as chaves de API estão configuradas no ambiente."
  );
  process.exit(1);
}

// Verificar se as chaves de API necessárias estão configuradas
let envContent = fs.readFileSync(envPath, "utf8");
let checklist = {
  GOOGLE_API_KEY: envContent.includes("GOOGLE_API_KEY="),
  OPENAI_API_KEY: envContent.includes("OPENAI_API_KEY="),
  ANTHROPIC_API_KEY: envContent.includes("ANTHROPIC_API_KEY="),
};

console.log("\n🔑 Verificação de chaves de API:");
Object.entries(checklist).forEach(([key, exists]) => {
  console.log(`  ${exists ? "✅" : "❌"} ${key}`);
});

const missingKeys = Object.entries(checklist)
  .filter(([_, exists]) => !exists)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.warn(`\n⚠️ Chaves de API ausentes: ${missingKeys.join(", ")}`);
  console.warn("Adicione-as ao arquivo .env para testar todos os modelos.");
}

try {
  // Verificar se o diretório de destino dos testes existe
  const testsDir = path.join(process.cwd(), "docs", "tests");
  if (!fs.existsSync(testsDir)) {
    console.log("📁 Criando diretório para relatórios de teste...");
    fs.mkdirSync(testsDir, { recursive: true });
  }

  // Compilar somente os arquivos necessários para os testes
  console.log("\n📦 Compilando arquivos de teste...");
  try {
    // Usar tsconfig.test.json para compilar apenas os arquivos necessários
    execSync("tsc -p tsconfig.test.json", { stdio: "inherit" });
    console.log("✅ Compilação concluída com sucesso");
  } catch (error) {
    console.error("❌ Erro ao compilar arquivos de teste.");
    console.error("Por favor, corrija os erros acima e tente novamente.");
    process.exit(1);
  }

  // Verificar se os arquivos compilados existem
  const testFile = path.join(
    process.cwd(),
    "dist",
    "tests",
    "model-validation.test.js"
  );
  if (!fs.existsSync(testFile)) {
    console.error("❌ Arquivo de teste compilado não encontrado.");
    console.error(
      "Verifique se o arquivo src/tests/model-validation.test.ts existe e se está sendo compilado corretamente."
    );
    process.exit(1);
  }

  // Prompt para o usuário confirmar quais modelos testar
  console.log("\n🤖 Modelos disponíveis para teste:");
  console.log("  1. GPT-4 (OpenAI) - Requer OPENAI_API_KEY");
  console.log("  2. Claude (Anthropic) - Requer ANTHROPIC_API_KEY");
  console.log("  3. Deepseek (Local)");
  console.log("  4. Qwen (Local)");
  console.log("  5. Gemini 1.5 Pro (Google) - Requer GOOGLE_API_KEY");

  console.log("\n⚠️ Aviso: Testes com modelos de API consumirão créditos!");
  console.log("\n🧪 Executando testes de modelos...");

  // Executar o teste
  try {
    execSync("node dist/tests/model-validation.test.js", {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        LOG_LEVEL: "info",
      },
    });
  } catch (error) {
    console.error("❌ Erro ao executar testes de modelos:", error.message);
    process.exit(1);
  }

  console.log("✅ Testes de modelos concluídos com sucesso.");

  // Verificar se o relatório foi gerado
  const today = new Date().toISOString().split("T")[0];
  const reportFile = path.join(
    process.cwd(),
    "docs",
    "tests",
    `modelos-ia-teste-${today}.md`
  );

  if (fs.existsSync(reportFile)) {
    console.log(`📝 Relatório gerado em: ${reportFile}`);
  } else {
    console.warn("⚠️ Relatório não foi encontrado no local esperado.");
  }
} catch (error) {
  console.error("❌ Erro ao executar testes de modelos:", error.message);
  process.exit(1);
}
