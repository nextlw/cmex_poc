#!/usr/bin/env node

/**
 * Script para executar testes E2E simulando o fluxo completo do front-end para o back-end
 * utilizando o modelo Gemini com Deep Research.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log(
  "\n🚀 Iniciando suite de testes E2E do modelo Gemini com Deep Research\n"
);

// Verificar se a chave de API está configurada
const dotEnvPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(dotEnvPath)) {
  console.error("❌ Arquivo .env não encontrado!");
  console.error("Por favor, crie um arquivo .env com sua GOOGLE_API_KEY");
  process.exit(1);
}

const envContent = fs.readFileSync(dotEnvPath, "utf8");
if (!envContent.includes("GOOGLE_API_KEY")) {
  console.error("❌ GOOGLE_API_KEY não encontrada no arquivo .env!");
  console.error(
    "Por favor, adicione GOOGLE_API_KEY=sua_chave_aqui ao arquivo .env"
  );
  process.exit(1);
}

// Executar os testes
try {
  console.log("\n📋 Executando testes E2E com sistema de retry automático...");
  console.log("   Este processo pode levar alguns minutos, aguarde...\n");

  const startTime = Date.now();
  execSync("pnpm test:e2e", { stdio: "inherit" });
  const endTime = Date.now();
  const totalTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);

  // Verificar se os relatórios foram gerados
  const docsDir = path.join(process.cwd(), "docs", "tests");
  if (fs.existsSync(docsDir)) {
    const reports = fs
      .readdirSync(docsDir)
      .filter((file) => file.startsWith("e2e-test-"));
    const syntesisReport = path.join(docsDir, "relatorio-sintese-gemini.md");

    if (reports.length > 0) {
      console.log(
        `\n✅ ${reports.length} relatórios de teste gerados com sucesso:`
      );
      reports.forEach((report) => {
        console.log(`   - ${report}`);
      });

      // Verificar os resultados nos relatórios
      let successCount = 0;
      let failCount = 0;

      reports.forEach((report) => {
        const reportContent = fs.readFileSync(
          path.join(docsDir, report),
          "utf8"
        );
        if (reportContent.includes("- **Resultado:** ✅ Correto")) {
          successCount++;
        } else {
          failCount++;
        }
      });

      console.log("\n📊 Resumo dos resultados:");
      console.log(`   - Total de testes: ${reports.length}`);
      console.log(`   - Testes bem-sucedidos: ${successCount}`);
      console.log(`   - Testes com falha: ${failCount}`);
      console.log(
        `   - Taxa de sucesso: ${(
          (successCount / reports.length) *
          100
        ).toFixed(2)}%`
      );
      console.log(`   - Tempo total de execução: ${totalTimeSeconds}s`);

      // Gerar ou abrir relatório de síntese
      if (fs.existsSync(syntesisReport)) {
        console.log(
          `\n📑 Relatório de síntese disponível em: ${syntesisReport}`
        );

        // Em ambientes que suportam, abrir o relatório automaticamente
        try {
          const platform = process.platform;
          if (platform === "darwin") {
            execSync(`open "${syntesisReport}"`, { stdio: "ignore" });
          } else if (platform === "win32") {
            execSync(`start "" "${syntesisReport}"`, { stdio: "ignore" });
          } else if (platform === "linux") {
            execSync(`xdg-open "${syntesisReport}"`, { stdio: "ignore" });
          }
        } catch (error) {
          // Ignorar erros ao tentar abrir o arquivo
        }
      }
    }
  }

  console.log("\n🏁 Execução concluída com sucesso!");
} catch (error) {
  console.error("\n❌ Erro durante a execução dos testes:", error.message);
  process.exit(1);
}
