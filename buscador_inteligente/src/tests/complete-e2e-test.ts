import express, { Request, Response, NextFunction } from "express";
import { ncmRouter } from "../controllers/ncm";
import { processarDeepResearch } from "../controllers/deepResearchNCM";
import { TokenTracker } from "../utils/token-tracker";
import { ConsultaProduto, FastApiNCMResult } from "../types/globalTypes";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { EventEmitter } from "events";
import httpClient from "../utils/http-client";
import { LocalModelClient } from "../tools/local-model-client";
import { ensureModelClientInitialized } from "../agent";
import "../types/custom-express"; // Importa as definições de tipo personalizadas

// Carregar variáveis de ambiente
dotenv.config();

// Componente para registrar logs e resultados
class TestReporter {
  private logs: string[] = [];
  private results: any[] = [];
  private reportDir: string;
  private testId: string;

  constructor(testName: string) {
    this.testId = `${testName}-${new Date().toISOString().replace(/:/g, "-")}`;
    this.reportDir = path.join(process.cwd(), "docs", "tests");
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    this.logs.push(formattedMessage);
  }

  addResult(result: any): void {
    this.results.push(result);
  }

  writeReport(): string {
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

// Função para simular uma requisição HTTP
async function simulateHttpRequest(
  reporter: TestReporter,
  testCase: any
): Promise<any> {
  reporter.log(
    `Iniciando simulação de requisição HTTP para consulta: "${testCase.query}"`
  );

  // Criando instância de Express para simulação
  const app = express();
  app.use(express.json());

  // Dados de requisição
  const requestBody: ConsultaProduto = {
    consulta: testCase.query,
    estadoOrigem: "SP",
    operacao: "venda",
    regimeTributario: "simples",
    tributacao: "normal",
    modelo: testCase.model,
    useDeepResearch: true,
  };

  reporter.log(`Preparando requisição com modelo: ${testCase.model}`);

  // Simulando requisição HTTP
  return new Promise((resolve, reject) => {
    // Criando objetos simulados de req e res
    const req: Partial<Request> = {
      body: requestBody,
      fastApiResult: null,
    };

    const res: Partial<Response> = {
      status: (code) => {
        reporter.log(`Resposta com status: ${code}`);
        return res as Response;
      },
      json: (data) => {
        reporter.log(`Recebida resposta JSON`);
        reporter.addResult(data);
        resolve(data);
        return res as Response;
      },
      send: (data) => {
        reporter.log(`Recebida resposta`);
        reporter.addResult(data);
        resolve(data);
        return res as Response;
      },
    };

    const next: NextFunction = (error?: any) => {
      if (error) {
        reporter.log(
          `Erro no middleware: ${error.message || "Erro desconhecido"}`
        );
        reject(error);
      } else {
        reporter.log(`Middleware ncmRouter executado com sucesso`);

        // Após o ncmRouter, processa o DeepResearch
        processarDeepResearch(req as Request, res as Response);
      }
    };

    // Inicializando o modelo antes de tudo
    try {
      reporter.log(`Inicializando cliente do modelo: ${testCase.model}`);
      ensureModelClientInitialized(testCase.model);

      // Simulando chamada à API FastAPI para obter dados preliminares
      reporter.log(`Simulando chamada à FastAPI`);

      // Verificando se temos o serviço FastAPI em execução
      httpClient
        .get("/health")
        .then(() => {
          reporter.log(`FastAPI disponível, fazendo chamada real`);

          // FastAPI está disponível, fazer chamada real
          httpClient
            .post("/consultas", {
              consulta: requestBody.consulta,
              modelo: requestBody.modelo.toLowerCase(),
              estadoOrigem: requestBody.estadoOrigem,
              operacao: requestBody.operacao,
              regimeTributario: requestBody.regimeTributario,
              tributacao: requestBody.tributacao,
            })
            .then((response) => {
              reporter.log(`Recebida resposta da FastAPI`);
              req.fastApiResult = response.data;

              // Processando com ncmRouter
              reporter.log(`Chamando ncmRouter`);
              ncmRouter(req as Request, res as Response, next);
            })
            .catch((error) => {
              reporter.log(`Erro na chamada à FastAPI: ${error.message}`);
              req.fastApiResult = null;

              // Continua mesmo sem dados da FastAPI
              reporter.log(`Chamando ncmRouter sem dados da FastAPI`);
              ncmRouter(req as Request, res as Response, next);
            });
        })
        .catch(() => {
          reporter.log(`FastAPI não disponível, criando resultado simulado`);

          // FastAPI não está disponível, cria resultado simulado
          req.fastApiResult = {
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
            model_used: testCase.model,
            processing_time: 0,
          };

          // Processando com ncmRouter
          reporter.log(`Chamando ncmRouter com dados simulados`);
          ncmRouter(req as Request, res as Response, next);
        });
    } catch (error: any) {
      reporter.log(`Erro na inicialização: ${error.message}`);
      reject(error);
    }
  });
}

// Função principal de teste
async function runCompleteE2ETest() {
  const reporter = new TestReporter("fluxo-completo");
  reporter.log("Iniciando teste E2E completo com fluxo real do sistema");

  // Casos de teste
  const testCases = [
    {
      description: "Camisa Polo - Teste com modelo Gemini",
      query:
        "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
      expectedNCM: "6105.10.00",
      model: "gemini-1.5-pro",
    },
  ];

  try {
    const delays = [];

    // Executar testes sequencialmente
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      reporter.log(
        `\n======= Teste ${i + 1}/${testCases.length}: ${
          testCase.description
        } =======`
      );

      const startTime = Date.now();

      try {
        // Executa a consulta
        const result = await simulateHttpRequest(reporter, testCase);

        const endTime = Date.now();
        const processingTime = (endTime - startTime) / 1000;

        // Verifica o resultado
        reporter.log(
          `Tempo de processamento: ${processingTime.toFixed(2)} segundos`
        );

        // Verificar NCM
        let isCorrect = false;
        let obtainedNCM = "";

        if (result && typeof result === "object") {
          if (result.ncm) {
            obtainedNCM = result.ncm;
          } else if (result.ncm_code) {
            obtainedNCM = result.ncm_code;
          }

          // Compara ignorando traços e pontos
          isCorrect =
            obtainedNCM.replace(/[^\d]/g, "") ===
            testCase.expectedNCM.replace(/[^\d]/g, "");
        }

        reporter.log(`NCM Esperado: ${testCase.expectedNCM}`);
        reporter.log(`NCM Obtido: ${obtainedNCM}`);
        reporter.log(`Resultado: ${isCorrect ? "✅ Correto" : "❌ Incorreto"}`);

        // Adiciona delay entre os testes para evitar rate limits
        if (i < testCases.length - 1) {
          const delayTime = 5000;
          reporter.log(
            `Aguardando ${delayTime / 1000}s antes do próximo teste...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        }
      } catch (error: any) {
        reporter.log(`Erro no teste: ${error.message || "Erro desconhecido"}`);
      }
    }

    // Gera o relatório final
    const reportPath = reporter.writeReport();
    reporter.log(`\nRelatório gerado em: ${reportPath}`);
  } catch (error: any) {
    reporter.log(`Erro fatal: ${error.message || "Erro desconhecido"}`);
    reporter.writeReport();
  }
}

// Executa o teste
runCompleteE2ETest();
