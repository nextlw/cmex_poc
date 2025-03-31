#!/usr/bin/env node

/**
 * Script para testar o fluxo COMPLETO do sistema, incluindo:
 * - Pesquisa com Jina através do agent.ts
 * - Processamento via server.ts
 * - Documentação de todas as etapas, pensamentos e ações
 */

const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const EventEmitter = require("events");
const WebSocket = require("ws");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as chaves de API necessárias estão configuradas
const apiKeys = {
  JINA_API_KEY: process.env.JINA_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
};

Object.entries(apiKeys).forEach(([key, value]) => {
  if (!value) {
    console.error(`❌ ${key} não encontrada!`);
    console.error(`Por favor, adicione ${key}=sua_chave_aqui ao arquivo .env`);
    process.exit(1);
  }
});

// Configuração do teste
const TEST_CASE = {
  description: "Camisa Polo - Fluxo Completo com Jina Search",
  query:
    "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
  expectedNCM: "6105.10.00",
  model: "gemini-1.5-pro",
};

// Configuração do servidor local
const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const SERVER_READY_TIMEOUT = 10000; // 10 segundos para o servidor iniciar

// Eventos para monitorar o servidor
const serverEvents = new EventEmitter();

// Classe para registrar logs e resultados
class TestReporter {
  constructor(testName) {
    this.logs = [];
    this.results = [];
    this.serverLogs = [];
    this.jinaSearches = [];
    this.modelThoughts = [];
    this.actionsTaken = [];
    this.websocketMessages = [];
    this.visitedUrls = [];

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

  addServerLog(log) {
    this.serverLogs.push(log);
  }

  addJinaSearch(search) {
    this.jinaSearches.push({
      timestamp: new Date().toISOString(),
      ...search,
    });
  }

  addModelThought(thought) {
    this.modelThoughts.push({
      timestamp: new Date().toISOString(),
      ...thought,
    });
  }

  addAction(action) {
    this.actionsTaken.push({
      timestamp: new Date().toISOString(),
      ...action,
    });
  }

  addWebsocketMessage(message) {
    this.websocketMessages.push({
      timestamp: new Date().toISOString(),
      ...message,
    });
  }

  addVisitedUrl(url, content) {
    this.visitedUrls.push({
      timestamp: new Date().toISOString(),
      url,
      contentPreview: content.substring(0, 500) + "...", // Apenas um preview do conteúdo
    });
  }

  addResult(result) {
    this.results.push(result);
  }

  writeReport() {
    const reportPath = path.join(this.reportDir, `real-flow-${this.testId}.md`);

    let reportContent = `# Teste de Fluxo Real Completo - ${this.testId}\n\n`;
    reportContent += `## Sistema Completo com Jina Search, Agent.ts e Server.ts\n\n`;

    // Adiciona informações gerais
    reportContent += `### Informações do Teste\n\n`;
    reportContent += `- **Descrição:** ${TEST_CASE.description}\n`;
    reportContent += `- **Consulta:** "${TEST_CASE.query}"\n`;
    reportContent += `- **NCM Esperado:** ${TEST_CASE.expectedNCM}\n`;
    reportContent += `- **Modelo:** ${TEST_CASE.model}\n\n`;

    // Adiciona logs gerais
    reportContent += `### Logs de Execução\n\n`;
    reportContent += this.logs.map((log) => `- ${log}`).join("\n");
    reportContent += "\n\n";

    // Adiciona pesquisas Jina
    reportContent += `### Pesquisas com Jina\n\n`;
    if (this.jinaSearches.length === 0) {
      reportContent += `*Nenhuma pesquisa Jina foi registrada*\n\n`;
    } else {
      this.jinaSearches.forEach((search, index) => {
        reportContent += `#### Pesquisa ${index + 1}\n\n`;
        reportContent += `- **Timestamp:** ${search.timestamp}\n`;
        reportContent += `- **Query:** "${search.query}"\n`;
        reportContent += `- **Resultados:** ${
          search.results ? search.results.length : 0
        } encontrados\n\n`;

        if (search.results && search.results.length > 0) {
          reportContent += `**Top Resultados:**\n\n`;
          search.results.slice(0, 5).forEach((result, i) => {
            reportContent += `${i + 1}. [${result.title || "Sem título"}](${
              result.url
            })\n`;
            reportContent += `   Snippet: ${
              result.snippet || "Sem snippet"
            }\n\n`;
          });
        }
      });
    }

    // Adiciona pensamentos do modelo
    reportContent += `### Pensamentos do Modelo\n\n`;
    if (this.modelThoughts.length === 0) {
      reportContent += `*Nenhum pensamento do modelo foi registrado*\n\n`;
    } else {
      this.modelThoughts.forEach((thought, index) => {
        reportContent += `#### Pensamento ${index + 1}\n\n`;
        reportContent += `- **Timestamp:** ${thought.timestamp}\n`;
        reportContent += `- **Contexto:** ${
          thought.context || "Não especificado"
        }\n`;
        reportContent += `- **Pensamento:** ${thought.content}\n\n`;
      });
    }

    // Adiciona ações tomadas
    reportContent += `### Ações Tomadas pelo Agente\n\n`;
    if (this.actionsTaken.length === 0) {
      reportContent += `*Nenhuma ação foi registrada*\n\n`;
    } else {
      this.actionsTaken.forEach((action, index) => {
        reportContent += `#### Ação ${index + 1}: ${action.type}\n\n`;
        reportContent += `- **Timestamp:** ${action.timestamp}\n`;
        reportContent += `- **Tipo:** ${action.type}\n`;

        if (action.type === "search") {
          reportContent += `- **Query:** "${action.query}"\n`;
        } else if (action.type === "visit") {
          reportContent += `- **URLs:** ${
            action.urls ? action.urls.join(", ") : "Nenhuma"
          }\n`;
        } else if (action.type === "answer") {
          reportContent += `- **Resposta:** ${action.answer}\n`;
          if (action.references && action.references.length) {
            reportContent += `- **Referências:**\n`;
            action.references.forEach((ref) => {
              reportContent += `  - [${ref.url}]: "${ref.exactQuote}"\n`;
            });
          }
        }
        reportContent += `- **Raciocínio:** ${
          action.think || "Não fornecido"
        }\n\n`;
      });
    }

    // Adiciona URLs visitadas
    reportContent += `### URLs Visitadas\n\n`;
    if (this.visitedUrls.length === 0) {
      reportContent += `*Nenhuma URL foi visitada*\n\n`;
    } else {
      this.visitedUrls.forEach((visit, index) => {
        reportContent += `#### URL ${index + 1}\n\n`;
        reportContent += `- **Timestamp:** ${visit.timestamp}\n`;
        reportContent += `- **URL:** ${visit.url}\n`;
        reportContent += `- **Preview do Conteúdo:**\n\n\`\`\`\n${visit.contentPreview}\n\`\`\`\n\n`;
      });
    }

    // Adiciona mensagens websocket
    reportContent += `### Comunicação em Tempo Real (WebSocket)\n\n`;
    if (this.websocketMessages.length === 0) {
      reportContent += `*Nenhuma mensagem WebSocket foi registrada*\n\n`;
    } else {
      this.websocketMessages.forEach((msg, index) => {
        reportContent += `#### Mensagem ${index + 1}\n\n`;
        reportContent += `- **Timestamp:** ${msg.timestamp}\n`;
        reportContent += `- **Tipo:** ${msg.type || "Não especificado"}\n`;
        reportContent += `- **Conteúdo:**\n\n\`\`\`json\n${JSON.stringify(
          msg.data,
          null,
          2
        )}\n\`\`\`\n\n`;
      });
    }

    // Adiciona logs do servidor
    reportContent += `### Logs do Servidor\n\n`;
    if (this.serverLogs.length === 0) {
      reportContent += `*Nenhum log do servidor foi registrado*\n\n`;
    } else {
      reportContent += `\`\`\`\n${this.serverLogs.join("\n")}\n\`\`\`\n\n`;
    }

    // Adiciona resultados finais
    reportContent += `### Resultados da Consulta\n\n`;
    if (this.results.length === 0) {
      reportContent += `*Nenhum resultado foi registrado*\n\n`;
    } else {
      this.results.forEach((result, index) => {
        reportContent += `#### Resultado ${index + 1}\n\n`;
        reportContent += "```json\n";
        reportContent += JSON.stringify(result, null, 2);
        reportContent += "\n```\n\n";

        // Adiciona análise do NCM
        if (result.ncm) {
          const obtainedNCM = result.ncm.replace(/[^\d]/g, "");
          const expectedNCM = TEST_CASE.expectedNCM.replace(/[^\d]/g, "");
          const isCorrect = obtainedNCM === expectedNCM;

          reportContent += `**Verificação do NCM:**\n\n`;
          reportContent += `- NCM Esperado: ${TEST_CASE.expectedNCM}\n`;
          reportContent += `- NCM Obtido: ${result.ncm}\n`;
          reportContent += `- Resultado: ${
            isCorrect ? "✅ Correto" : "❌ Incorreto"
          }\n\n`;
        }
      });
    }

    fs.writeFileSync(reportPath, reportContent);
    return reportPath;
  }
}

// Função para iniciar o servidor
function startServer(reporter) {
  return new Promise((resolve, reject) => {
    reporter.log("Iniciando servidor Express...");

    // Verificar se o arquivo server.js existe
    const serverPath = path.join(process.cwd(), "dist", "server.js");
    if (!fs.existsSync(serverPath)) {
      reporter.log(
        `Erro: arquivo ${serverPath} não encontrado. Verifique a compilação.`
      );
      reject(new Error(`Arquivo ${serverPath} não encontrado`));
      return;
    }

    reporter.log(`Usando servidor em: ${serverPath}`);

    // Iniciar o servidor como um processo separado
    const serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PORT: SERVER_PORT.toString(),
        DEBUG: "true", // Habilitar logs adicionais
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let serverStarted = false;

    // Configurar captura de stdout
    serverProcess.stdout.on("data", (data) => {
      const logs = data.toString().trim().split("\n");
      logs.forEach((log) => {
        if (log) {
          reporter.log(`[SERVER-OUT] ${log}`);
          reporter.addServerLog(log);

          // Detectar logs específicos para capturar ações e pensamentos
          if (log.includes("jinaSearch")) {
            try {
              const match = log.match(/jinaSearch: (.+)/);
              if (match && match[1]) {
                const searchInfo = JSON.parse(match[1]);
                reporter.addJinaSearch(searchInfo);
              }
            } catch (e) {
              // Ignorar erros de parse
            }
          }

          if (log.includes("action:")) {
            try {
              const match = log.match(/action: (.+)/);
              if (match && match[1]) {
                const actionInfo = JSON.parse(match[1]);
                reporter.addAction(actionInfo);
              }
            } catch (e) {
              // Ignorar erros de parse
            }
          }

          if (log.includes("thinking:")) {
            try {
              const match = log.match(/thinking: (.+)/);
              if (match && match[1]) {
                reporter.addModelThought({
                  content: match[1],
                });
              }
            } catch (e) {
              // Ignorar erros de parse
            }
          }
        }
      });

      // Verificar se o servidor está pronto (várias formas possíveis)
      if (
        data.toString().includes("Server is running") ||
        data.toString().includes("server started on port") ||
        data.toString().includes("listening on port")
      ) {
        reporter.log("Servidor iniciado com sucesso");
        serverStarted = true;
        serverEvents.emit("server-ready");
      }
    });

    // Configurar captura de stderr
    serverProcess.stderr.on("data", (data) => {
      const logs = data.toString().trim().split("\n");
      logs.forEach((log) => {
        if (log) {
          reporter.log(`[SERVER-ERR] ${log}`);
          reporter.addServerLog(`ERROR: ${log}`);
        }
      });
    });

    // Tratar erros e encerramento
    serverProcess.on("error", (error) => {
      reporter.log(`Erro ao iniciar servidor: ${error.message}`);
      reject(error);
    });

    serverProcess.on("close", (code) => {
      reporter.log(`Servidor encerrado com código ${code}`);
      if (code !== 0 && !serverStarted) {
        reject(new Error(`Servidor encerrou com código ${code}`));
      }
    });

    // Configurar timeout para verificar se o servidor iniciou
    const timeout = setTimeout(() => {
      if (!serverStarted) {
        reporter.log(
          "Tentando verificar se o servidor está respondendo mesmo sem logs de inicialização..."
        );

        // Verificar se está respondendo
        axios
          .get(`${SERVER_URL}/health`)
          .then((response) => {
            if (response.status === 200) {
              reporter.log(
                "Servidor está respondendo, apesar de não ter emitido log de inicialização"
              );
              serverStarted = true;
              serverEvents.emit("server-ready");
            }
          })
          .catch(() => {
            reporter.log("Timeout: Servidor não iniciou no tempo esperado");
            serverProcess.kill();
            reject(
              new Error("Timeout: Servidor não iniciou no tempo esperado")
            );
          });
      }
    }, SERVER_READY_TIMEOUT);

    // Quando o servidor estiver pronto
    serverEvents.once("server-ready", () => {
      clearTimeout(timeout);

      // Verificar explicitamente se o servidor está respondendo
      axios
        .get(`${SERVER_URL}/health`)
        .then(() => {
          reporter.log("Confirmado: Servidor está respondendo");
          resolve(serverProcess);
        })
        .catch((error) => {
          reporter.log(
            `Erro na verificação da saúde do servidor: ${error.message}`
          );
          // Ainda assim, vamos continuar com o teste
          resolve(serverProcess);
        });
    });
  });
}

// Função alternativa para iniciar o servidor com ts-node
function startServerWithTsNode(reporter) {
  return new Promise((resolve, reject) => {
    reporter.log("Tentando iniciar servidor usando ts-node...");

    // Verificar se o arquivo server.ts existe
    const serverPath = path.join(process.cwd(), "src", "server.ts");
    if (!fs.existsSync(serverPath)) {
      reporter.log(`Erro: arquivo ${serverPath} não encontrado.`);
      reject(new Error(`Arquivo ${serverPath} não encontrado`));
      return;
    }

    reporter.log(`Usando servidor em: ${serverPath}`);

    // Iniciar o servidor usando ts-node
    const serverProcess = spawn("npx", ["ts-node", serverPath], {
      env: {
        ...process.env,
        PORT: SERVER_PORT.toString(),
        DEBUG: "true", // Habilitar logs adicionais
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let serverStarted = false;

    // Configurar captura de stdout
    serverProcess.stdout.on("data", (data) => {
      const logs = data.toString().trim().split("\n");
      logs.forEach((log) => {
        if (log) {
          reporter.log(`[TS-SERVER-OUT] ${log}`);
          reporter.addServerLog(log);

          // Detectar logs específicos (mesmo código que a função original)
          if (log.includes("jinaSearch")) {
            try {
              const match = log.match(/jinaSearch: (.+)/);
              if (match && match[1]) {
                const searchInfo = JSON.parse(match[1]);
                reporter.addJinaSearch(searchInfo);
              }
            } catch (e) {
              // Ignorar erros de parse
            }
          }

          if (log.includes("action:")) {
            try {
              const match = log.match(/action: (.+)/);
              if (match && match[1]) {
                const actionInfo = JSON.parse(match[1]);
                reporter.addAction(actionInfo);
              }
            } catch (e) {
              // Ignorar erros de parse
            }
          }

          if (log.includes("thinking:")) {
            try {
              const match = log.match(/thinking: (.+)/);
              if (match && match[1]) {
                reporter.addModelThought({
                  content: match[1],
                });
              }
            } catch (e) {
              // Ignorar erros de parse
            }
          }
        }
      });

      // Verificar se o servidor está pronto (várias formas possíveis)
      if (
        data.toString().includes("Server is running") ||
        data.toString().includes("server started on port") ||
        data.toString().includes("listening on port")
      ) {
        reporter.log("Servidor ts-node iniciado com sucesso");
        serverStarted = true;
        serverEvents.emit("server-ready");
      }
    });

    // Configurar captura de stderr
    serverProcess.stderr.on("data", (data) => {
      const logs = data.toString().trim().split("\n");
      logs.forEach((log) => {
        if (log) {
          reporter.log(`[TS-SERVER-ERR] ${log}`);
          reporter.addServerLog(`ERROR: ${log}`);
        }
      });
    });

    // Tratar erros e encerramento
    serverProcess.on("error", (error) => {
      reporter.log(`Erro ao iniciar servidor ts-node: ${error.message}`);
      reject(error);
    });

    serverProcess.on("close", (code) => {
      reporter.log(`Servidor ts-node encerrado com código ${code}`);
      if (code !== 0 && !serverStarted) {
        reject(new Error(`Servidor ts-node encerrou com código ${code}`));
      }
    });

    // Configurar timeout
    const timeout = setTimeout(() => {
      if (!serverStarted) {
        reporter.log("Verificando se o servidor ts-node está respondendo...");

        // Verificar se está respondendo
        axios
          .get(`${SERVER_URL}/health`)
          .then((response) => {
            if (response.status === 200) {
              reporter.log("Servidor ts-node está respondendo");
              serverStarted = true;
              serverEvents.emit("server-ready");
            }
          })
          .catch(() => {
            reporter.log(
              "Timeout: Servidor ts-node não iniciou no tempo esperado"
            );
            serverProcess.kill();
            reject(
              new Error(
                "Timeout: Servidor ts-node não iniciou no tempo esperado"
              )
            );
          });
      }
    }, SERVER_READY_TIMEOUT);

    // Quando o servidor estiver pronto
    serverEvents.once("server-ready", () => {
      clearTimeout(timeout);

      // Verificar explicitamente se o servidor está respondendo
      axios
        .get(`${SERVER_URL}/health`)
        .then(() => {
          reporter.log("Confirmado: Servidor ts-node está respondendo");
          resolve(serverProcess);
        })
        .catch((error) => {
          reporter.log(
            `Erro na verificação da saúde do servidor ts-node: ${error.message}`
          );
          // Ainda assim, vamos continuar com o teste
          resolve(serverProcess);
        });
    });
  });
}

// Função para verificar se o servidor está respondendo
async function checkServerConnection(reporter) {
  reporter.log("Verificando conexão com o servidor...");
  try {
    const response = await axios.get(`${SERVER_URL}/health`);
    reporter.log(`Servidor respondeu com status: ${response.status}`);
    return true;
  } catch (error) {
    reporter.log(`Erro ao conectar com o servidor: ${error.message}`);
    return false;
  }
}

// Função para conectar ao WebSocket do servidor
function connectWebSocket(reporter, sessionId) {
  return new Promise((resolve) => {
    const wsUrl = `ws://localhost:${SERVER_PORT}/ws?session=${sessionId}`;
    reporter.log(`Conectando ao WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.on("open", () => {
      reporter.log("Conexão WebSocket estabelecida");
      resolve(ws);
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);
        reporter.log(
          `Recebido evento WebSocket: ${message.type || "sem tipo"}`
        );
        reporter.addWebsocketMessage(message);

        // Capturar ações e pensamentos
        if (message.type === "step") {
          if (message.data && message.data.action) {
            const action = message.data;
            reporter.addAction({
              type: action.action,
              ...action,
            });

            // Se for uma visita a URL, registrar
            if (action.action === "visit" && action.URLTargets) {
              action.URLTargets.forEach((url) => {
                // Simular a captura do conteúdo da URL
                axios
                  .get(url, { timeout: 5000 })
                  .then((response) => {
                    reporter.addVisitedUrl(url, response.data);
                  })
                  .catch(() => {
                    reporter.addVisitedUrl(
                      url,
                      "Não foi possível acessar o conteúdo"
                    );
                  });
              });
            }
          }

          if (message.data && message.data.think) {
            reporter.addModelThought({
              context: "websocket-step",
              content: message.data.think,
            });
          }
        }
      } catch (e) {
        reporter.log(`Erro ao processar mensagem WebSocket: ${e.message}`);
      }
    });

    ws.on("error", (error) => {
      reporter.log(`Erro na conexão WebSocket: ${error.message}`);
    });

    ws.on("close", () => {
      reporter.log("Conexão WebSocket fechada");
    });
  });
}

// Função para realizar a consulta de NCM através da API
async function executeNCMQuery(reporter, ws, sessionId) {
  reporter.log(`Executando consulta NCM: "${TEST_CASE.query}"`);

  // Dados da consulta NCM
  const requestData = {
    consulta: TEST_CASE.query,
    estadoOrigem: "SP",
    operacao: "venda",
    regimeTributario: "simples",
    tributacao: "normal",
    modelo: TEST_CASE.model,
    useDeepResearch: true,
  };

  try {
    // Enviar a consulta para a API
    const response = await axios.post(
      `${SERVER_URL}/api/v1/ncm?session=${sessionId}`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    reporter.log(`Recebida resposta HTTP ${response.status}`);

    // Adicionar o resultado
    reporter.addResult(response.data);

    return response.data;
  } catch (error) {
    reporter.log(`Erro na consulta NCM: ${error.message}`);
    if (error.response) {
      reporter.log(`Detalhes: ${JSON.stringify(error.response.data)}`);
      reporter.addResult({
        error: true,
        status: error.response.status,
        data: error.response.data,
      });
    }
    throw error;
  }
}

// Função principal
async function runTest() {
  const reporter = new TestReporter("fluxo-real-completo");
  reporter.log("Iniciando teste de fluxo real completo");

  // Gerar ID de sessão único
  const sessionId = uuidv4();
  reporter.log(`ID de Sessão: ${sessionId}`);

  let serverProcess = null;
  let result = null;

  try {
    // Compilar o código TypeScript
    reporter.log("Compilando o código TypeScript...");

    // Verificar se a pasta dist existe, senão criar
    if (!fs.existsSync(path.join(process.cwd(), "dist"))) {
      fs.mkdirSync(path.join(process.cwd(), "dist"), { recursive: true });
    }

    await new Promise((resolve, reject) => {
      // Usar o comando de build definido no package.json
      exec("pnpm build", (error, stdout, stderr) => {
        if (error) {
          reporter.log(`Erro na compilação: ${stderr || error.message}`);

          // Apenas logar o erro, mas não falhar o teste
          reporter.log("Continuando com a versão compilada existente...");
          resolve();
          return;
        }

        if (stderr) {
          reporter.log(`Warnings na compilação: ${stderr}`);
        }

        reporter.log("Compilação concluída com sucesso");
        resolve();
      });
    });

    // Verificar se o servidor já está rodando
    const isServerRunning = await checkServerConnection(reporter);

    // Se o servidor não estiver rodando, iniciar um novo
    if (!isServerRunning) {
      try {
        // Primeiro tenta iniciar com o código compilado
        serverProcess = await startServer(reporter);
      } catch (error) {
        reporter.log(`Erro ao iniciar servidor com Node: ${error.message}`);
        reporter.log("Tentando iniciar com ts-node como alternativa...");

        // Se falhar, tenta iniciar diretamente com ts-node
        try {
          serverProcess = await startServerWithTsNode(reporter);
        } catch (tsNodeError) {
          reporter.log(
            `Erro ao iniciar servidor com ts-node: ${tsNodeError.message}`
          );
          throw new Error(
            "Não foi possível iniciar o servidor de nenhuma forma"
          );
        }
      }

      // Aguardar um momento para garantir que o servidor está pronto para conexões
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verificar novamente a conexão
      const serverCheck = await checkServerConnection(reporter);
      if (!serverCheck) {
        throw new Error("Não foi possível conectar ao servidor após iniciá-lo");
      }
    } else {
      reporter.log(
        "Servidor já está em execução, utilizando a instância existente"
      );
    }

    // Conectar ao WebSocket
    const ws = await connectWebSocket(reporter, sessionId);

    // Iniciar cronômetro
    const startTime = Date.now();

    // Executar consulta NCM
    result = await executeNCMQuery(reporter, ws, sessionId);

    // Calcular tempo de execução
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    reporter.log(`\n✅ Teste concluído em ${totalTime.toFixed(2)} segundos`);

    // Verificar o resultado
    if (result && result.ncm) {
      const obtainedNCM = result.ncm.replace(/[^\d]/g, "");
      const expectedNCM = TEST_CASE.expectedNCM.replace(/[^\d]/g, "");
      const isCorrect = obtainedNCM === expectedNCM;

      reporter.log(`NCM Esperado: ${TEST_CASE.expectedNCM}`);
      reporter.log(`NCM Obtido: ${result.ncm}`);
      reporter.log(`Resultado: ${isCorrect ? "✅ Correto" : "❌ Incorreto"}`);
    } else {
      reporter.log("❌ Não foi possível obter um código NCM do resultado");
    }

    // Aguardar um momento para garantir que todos os eventos WebSocket foram processados
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Gerar relatório
    const reportPath = reporter.writeReport();
    reporter.log(`\n📝 Relatório detalhado gerado em: ${reportPath}`);
  } catch (error) {
    reporter.log(`\n❌ Erro fatal durante o teste: ${error.message}`);
    reporter.writeReport();
  } finally {
    // Encerrar o servidor se foi iniciado por este script
    if (serverProcess) {
      reporter.log("Encerrando servidor...");
      serverProcess.kill();
    }
  }
}

// Executar o teste
runTest();
