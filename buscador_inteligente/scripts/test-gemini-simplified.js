#!/usr/bin/env node

/**
 * Script para testar o modelo Gemini com uma implementação simplificada
 * Uso: node scripts/test-gemini-simplified.js
 */

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");
require("dotenv").config();

console.log("🚀 Iniciando teste simplificado do modelo Gemini...");

// Verificar se a chave de API do Google está configurada
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("❌ GOOGLE_API_KEY não encontrada no ambiente.");
  console.error(
    "Por favor, adicione GOOGLE_API_KEY=seu_valor_aqui ao arquivo .env"
  );
  process.exit(1);
}

console.log("✅ GOOGLE_API_KEY encontrada no ambiente!");

try {
  // Verificar se o diretório dist/tests existe
  const distTestsDir = path.join(process.cwd(), "dist", "tests");
  if (!fs.existsSync(distTestsDir)) {
    fs.mkdirSync(distTestsDir, { recursive: true });
  }

  // Verificar se o diretório dist/tests/modules existe
  const distModulesDir = path.join(distTestsDir, "modules");
  if (!fs.existsSync(distModulesDir)) {
    fs.mkdirSync(distModulesDir, { recursive: true });
  }

  // Criar diretório dist/types se não existir
  const distTypesDir = path.join(process.cwd(), "dist", "types");
  if (!fs.existsSync(distTypesDir)) {
    fs.mkdirSync(distTypesDir, { recursive: true });
  }

  // Copiar arquivo de tipos NCM
  const srcNcmPath = path.join(process.cwd(), "src", "types", "ncm.ts");
  const destNcmPath = path.join(distTypesDir, "ncm.js");
  if (fs.existsSync(srcNcmPath) && !fs.existsSync(destNcmPath)) {
    fs.copyFileSync(srcNcmPath, destNcmPath);
    console.log("✅ Arquivo de tipos NCM copiado para dist/types");
  }

  // Compilar os arquivos de teste simplificados
  console.log("📦 Compilando arquivos de teste simplificados...");
  try {
    // Criar um arquivo de configuração temporário para a compilação
    const tempTsConfigPath = path.join(process.cwd(), "temp-tsconfig.json");
    const tsConfig = {
      compilerOptions: {
        target: "es2020",
        module: "commonjs",
        moduleResolution: "node",
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: "dist",
        rootDir: "src",
        strict: false,
        resolveJsonModule: true,
      },
      include: [
        "src/tests/modules/simplified-deepresearch.ts",
        "src/tests/modelo-test.ts",
        "src/types/ncm.ts",
      ],
      exclude: ["node_modules"],
    };

    fs.writeFileSync(tempTsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log("✅ Configuração temporária criada");

    // Compilar usando o arquivo de configuração temporário
    execSync("tsc -p temp-tsconfig.json", { stdio: "inherit" });
    console.log("✅ Compilação concluída");

    // Remover o arquivo de configuração temporário
    fs.unlinkSync(tempTsConfigPath);
  } catch (error) {
    console.error("❌ Erro ao compilar arquivos de teste simplificados.");
    console.error(error);
    process.exit(1);
  }

  // Verificar se o arquivo compilado existe
  const modeloTestPath = path.join(
    process.cwd(),
    "dist",
    "tests",
    "modelo-test.js"
  );
  if (!fs.existsSync(modeloTestPath)) {
    console.error("❌ Arquivo modelo-test.js não foi compilado corretamente.");
    process.exit(1);
  }

  // Executar o teste
  console.log("🧪 Executando teste do modelo Gemini...");
  execSync("node dist/tests/modelo-test.js", {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  console.log("✅ Teste concluído com sucesso!");
} catch (error) {
  console.error("❌ Erro ao executar teste simplificado:", error.message);
  process.exit(1);
}
