const fs = require("fs");
const path = require("path");

// Função para ler o arquivo de evidências
function readEvidenceFile() {
  const filePath = path.join(__dirname, "TEST_EVIDENCE.md");
  return fs.readFileSync(filePath, "utf8");
}

// Função para escrever no arquivo de evidências
function writeEvidenceFile(content) {
  const filePath = path.join(__dirname, "TEST_EVIDENCE.md");
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Arquivo de evidências atualizado em ${filePath}`);
}

// Função para ler resultados dos testes
function readTestResults() {
  const reportsPath = path.join(__dirname, "..", "..", "test-reports");

  // Ler resultados dos componentes
  let componentResults;
  try {
    componentResults = JSON.parse(
      fs.readFileSync(path.join(reportsPath, "component-tests.json"), "utf8")
    );
  } catch (e) {
    componentResults = { numFailedTests: 0, testResults: [] };
    console.error(
      "Não foi possível ler os resultados dos testes de componentes. Usando dados padrão."
    );
  }

  // Ler resultados de integração
  let integrationResults;
  try {
    integrationResults = JSON.parse(
      fs.readFileSync(path.join(reportsPath, "integration-tests.json"), "utf8")
    );
  } catch (e) {
    integrationResults = { numFailedTests: 0, testResults: [] };
    console.error(
      "Não foi possível ler os resultados dos testes de integração. Usando dados padrão."
    );
  }

  // Ler resultados de e2e
  let e2eResults;
  try {
    e2eResults = JSON.parse(
      fs.readFileSync(path.join(reportsPath, "e2e-tests.json"), "utf8")
    );
  } catch (e) {
    e2eResults = { numFailedTests: 0, testResults: [] };
    console.error(
      "Não foi possível ler os resultados dos testes e2e. Usando dados padrão."
    );
  }

  // Ler resultados de cobertura, se existirem
  let coverageResults = {
    statements: "N/A",
    branches: "N/A",
    functions: "N/A",
    lines: "N/A",
  };

  try {
    // Tentativa de ler o arquivo de cobertura
    const coverageSummaryPath = path.join(
      __dirname,
      "..",
      "..",
      "coverage",
      "coverage-summary.json"
    );
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageSummary = JSON.parse(
        fs.readFileSync(coverageSummaryPath, "utf8")
      );
      const total = coverageSummary.total;

      coverageResults = {
        statements: `${total.statements.pct.toFixed(2)}%`,
        branches: `${total.branches.pct.toFixed(2)}%`,
        functions: `${total.functions.pct.toFixed(2)}%`,
        lines: `${total.lines.pct.toFixed(2)}%`,
      };
    }
  } catch (e) {
    console.error(
      "Não foi possível ler os resultados de cobertura. Usando dados padrão."
    );
  }

  return {
    componentResults,
    integrationResults,
    e2eResults,
    coverageResults,
  };
}

// Função para obter informações do ambiente
function getEnvironmentInfo() {
  // Ler logs da execução para obter versões
  const logsDir = path.join(__dirname, "..", "..", "test-reports", "evidence");
  let nodeVersion = "N/A";
  let npmVersion = "N/A";

  try {
    const logFiles = fs.readdirSync(logsDir);
    const latestLogFile = logFiles
      .filter((file) => file.startsWith("test_execution_"))
      .sort()
      .pop();

    if (latestLogFile) {
      const logContent = fs.readFileSync(
        path.join(logsDir, latestLogFile),
        "utf8"
      );

      // Extrair versões dos logs
      const nodeMatch = logContent.match(/Versão do Node: (v[0-9.]+)/);
      if (nodeMatch && nodeMatch[1]) {
        nodeVersion = nodeMatch[1];
      }

      const npmMatch = logContent.match(/Versão do NPM: ([0-9.]+)/);
      if (npmMatch && npmMatch[1]) {
        npmVersion = npmMatch[1];
      }
    }
  } catch (e) {
    console.error(
      "Não foi possível obter informações do ambiente dos logs. Usando dados padrão."
    );
  }

  return {
    timestamp: new Date().toISOString(),
    nodeVersion,
    npmVersion,
  };
}

// Função principal para atualizar o documento de evidências
function updateEvidenceDocument() {
  // Obter o conteúdo atual do arquivo
  let content = readEvidenceFile();

  // Obter resultados dos testes
  const { componentResults, integrationResults, e2eResults, coverageResults } =
    readTestResults();

  // Obter informações do ambiente
  const { timestamp, nodeVersion, npmVersion } = getEnvironmentInfo();

  // Substituir placeholders de ambiente
  content = content.replace("TIMESTAMP_PLACEHOLDER", timestamp);
  content = content.replace("VERSION_PLACEHOLDER", nodeVersion);
  content = content.replace("NPM: VERSION_PLACEHOLDER", `NPM: ${npmVersion}`);

  // Substituir placeholders de cobertura
  content = content.replace("COVERAGE_STATEMENTS", coverageResults.statements);
  content = content.replace("COVERAGE_BRANCHES", coverageResults.branches);
  content = content.replace("COVERAGE_FUNCTIONS", coverageResults.functions);
  content = content.replace("COVERAGE_LINES", coverageResults.lines);

  // Função para determinar o status baseado nos resultados
  function getComponentStatus(name, results) {
    // Procurar pelo teste específico do componente
    for (const result of results.testResults) {
      if (result.name.includes(name)) {
        if (result.status === "passed") {
          return {
            status: "✅ Passou",
            observations: `${result.numPassingTests} testes passaram`,
          };
        } else {
          return {
            status: "❌ Falhou",
            observations: `${result.numFailingTests} testes falharam`,
          };
        }
      }
    }

    return {
      status: "⚠️ Não testado",
      observations: "Componente não foi encontrado nos resultados dos testes",
    };
  }

  // Substituir placeholders de status
  const chatMessageStatus = getComponentStatus("ChatMessage", componentResults);
  content = content.replace(
    "ChatMessage | STATUS_PLACEHOLDER",
    `ChatMessage | ${chatMessageStatus.status}`
  );
  content = content.replace(
    "OBSERVATIONS_PLACEHOLDER",
    chatMessageStatus.observations
  );

  const deepResearchStatus = getComponentStatus(
    "DeepResearchProgress",
    componentResults
  );
  content = content.replace(
    "DeepResearchProgress | STATUS_PLACEHOLDER",
    `DeepResearchProgress | ${deepResearchStatus.status}`
  );
  content = content.replace(
    "OBSERVATIONS_PLACEHOLDER",
    deepResearchStatus.observations
  );

  const connectionIndicatorStatus = getComponentStatus(
    "ConnectionIndicator",
    componentResults
  );
  content = content.replace(
    "ConnectionIndicator | STATUS_PLACEHOLDER",
    `ConnectionIndicator | ${connectionIndicatorStatus.status}`
  );
  content = content.replace(
    "OBSERVATIONS_PLACEHOLDER",
    connectionIndicatorStatus.observations
  );

  const sseClientStatus = getComponentStatus("sseClient", integrationResults);
  content = content.replace(
    "SSEClient | STATUS_PLACEHOLDER",
    `SSEClient | ${sseClientStatus.status}`
  );
  content = content.replace(
    "OBSERVATIONS_PLACEHOLDER",
    sseClientStatus.observations
  );

  const chatFlowStatus = getComponentStatus("chatFlow", e2eResults);
  content = content.replace(
    "ChatFlow | STATUS_PLACEHOLDER",
    `ChatFlow | ${chatFlowStatus.status}`
  );
  content = content.replace(
    "OBSERVATIONS_PLACEHOLDER",
    chatFlowStatus.observations
  );

  // Atualizar data de documentação
  content = content.replace(
    "**Data de Documentação**: TIMESTAMP_PLACEHOLDER",
    `**Data de Documentação**: ${timestamp}`
  );

  // Escrever o arquivo atualizado
  writeEvidenceFile(content);
}

// Executar a atualização
updateEvidenceDocument();
