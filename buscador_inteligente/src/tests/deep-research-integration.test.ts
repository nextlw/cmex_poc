import { jest } from "@jest/globals";
import axios from "axios";
import fs from "fs";
import path from "path";
import { EventEmitter } from "events";

// Mock para axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Importar o serviço de Deep Research (simulado para testes)
class DeepResearchService {
  private eventEmitter: EventEmitter;
  private isResearching: boolean = false;
  private taskQueue: any[] = [];
  private results: any[] = [];

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  async startResearch(query: string, options: any = {}): Promise<string> {
    if (this.isResearching) {
      throw new Error("Já existe uma pesquisa em andamento");
    }

    this.isResearching = true;
    this.taskQueue = [];
    this.results = [];

    // Simular ID de sessão
    const sessionId = `dr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Iniciar processo assíncrono
    setTimeout(() => this.processResearch(query, sessionId, options), 100);

    return sessionId;
  }

  private async processResearch(
    query: string,
    sessionId: string,
    options: any
  ): Promise<void> {
    try {
      // Emitir evento de início
      this.eventEmitter.emit("research:start", { sessionId, query });

      // Simular etapas da pesquisa profunda
      await this.simulateStep("Analisando consulta", sessionId, 500);

      // Gerar tarefas de pesquisa
      const tasks = this.generateTasks(query);
      this.taskQueue = [...tasks];

      this.eventEmitter.emit("research:tasks", {
        sessionId,
        totalTasks: tasks.length,
        tasks: tasks.map((t) => t.description),
      });

      // Processar tarefas
      for (const task of tasks) {
        await this.simulateStep(
          `Executando: ${task.description}`,
          sessionId,
          task.duration
        );

        // Simular resultado da tarefa
        const taskResult = await this.executeTask(task, query);
        this.results.push(taskResult);

        // Atualizar progresso
        const completedTasks = this.results.length;
        const progress = Math.floor((completedTasks / tasks.length) * 100);

        this.eventEmitter.emit("research:progress", {
          sessionId,
          progress,
          completedTasks,
          totalTasks: tasks.length,
          latestResult: taskResult,
        });
      }

      // Finalizar pesquisa
      await this.simulateStep("Consolidando resultados", sessionId, 800);

      // Emitir resultados finais
      this.eventEmitter.emit("research:complete", {
        sessionId,
        results: this.results,
        summary: this.generateSummary(this.results),
      });
    } catch (error) {
      this.eventEmitter.emit("research:error", {
        sessionId,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      this.isResearching = false;
    }
  }

  private async simulateStep(
    step: string,
    sessionId: string,
    duration: number
  ): Promise<void> {
    this.eventEmitter.emit("research:status", { sessionId, status: step });
    await new Promise((resolve) => setTimeout(resolve, duration));
  }

  private generateTasks(query: string): any[] {
    // Simular geração de tarefas baseadas na consulta
    const baseTasks = [
      { id: 1, description: "Buscar informações gerais", duration: 300 },
      { id: 2, description: "Analisar documentos relacionados", duration: 600 },
      { id: 3, description: "Verificar regulamentações", duration: 400 },
      { id: 4, description: "Consultar bases de conhecimento", duration: 500 },
    ];

    // Adicionar tarefas específicas baseadas na consulta
    if (query.toLowerCase().includes("ncm")) {
      baseTasks.push({
        id: 5,
        description: "Consultar tabela NCM",
        duration: 350,
      });
      baseTasks.push({
        id: 6,
        description: "Verificar notas explicativas",
        duration: 450,
      });
    }

    if (
      query.toLowerCase().includes("importação") ||
      query.toLowerCase().includes("exportação")
    ) {
      baseTasks.push({
        id: 7,
        description: "Analisar regras de comércio exterior",
        duration: 550,
      });
    }

    return baseTasks;
  }

  private async executeTask(task: any, query: string): Promise<any> {
    // Simular execução da tarefa e retornar resultado
    // Em um caso real, isso faria chamadas a APIs, consultas a bancos de dados, etc.

    // Simular chamada à API
    if (task.id === 1 || task.id === 4) {
      try {
        // Simular resposta da API
        const mockResponse = {
          data: {
            results: [
              {
                title: `Resultado 1 para ${task.description}`,
                content: `Conteúdo detalhado sobre ${query}`,
              },
              {
                title: `Resultado 2 para ${task.description}`,
                content: `Mais informações sobre ${query}`,
              },
            ],
          },
        };

        return {
          taskId: task.id,
          description: task.description,
          results: mockResponse.data.results,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Erro ao executar tarefa ${task.id}:`, error);
        return {
          taskId: task.id,
          description: task.description,
          error: "Falha ao obter dados da API",
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Simular processamento local
    return {
      taskId: task.id,
      description: task.description,
      results: [
        {
          title: `Análise para ${task.description}`,
          content: `Resultado da análise de ${query} para a tarefa ${task.id}`,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  private generateSummary(results: any[]): string {
    // Simular geração de resumo baseado nos resultados
    const totalResults = results.reduce((count, result) => {
      return count + (result.results ? result.results.length : 0);
    }, 0);

    return `Pesquisa concluída com ${results.length} tarefas processadas e ${totalResults} resultados encontrados.`;
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  getStatus(): { isResearching: boolean; progress: number } {
    if (!this.isResearching) {
      return { isResearching: false, progress: 0 };
    }

    const progress =
      this.taskQueue.length > 0
        ? Math.floor((this.results.length / this.taskQueue.length) * 100)
        : 0;

    return { isResearching: true, progress };
  }
}

// Classe para integração com FastAPI
class FastAPIIntegration {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:10000") {
    this.baseUrl = baseUrl;
  }

  async sendDeepResearchRequest(
    query: string,
    sessionId: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/deep-research`,
        {
          query,
          sessionId,
          options: {
            maxDepth: 3,
            includeReferences: true,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Erro ao enviar requisição para FastAPI:", error);
      throw error;
    }
  }

  async getDeepResearchStatus(sessionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/deep-research/${sessionId}/status`
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao obter status da pesquisa:", error);
      throw error;
    }
  }
}

// Testes de integração
describe("Deep Research Integration Tests", () => {
  let deepResearchService: DeepResearchService;
  let fastApiIntegration: FastAPIIntegration;

  // Configurar mocks e serviços antes de cada teste
  beforeEach(() => {
    jest.clearAllMocks();

    deepResearchService = new DeepResearchService();
    fastApiIntegration = new FastAPIIntegration();

    // Configurar mock para axios
    mockedAxios.post.mockResolvedValue({
      data: {
        sessionId: "test-session-123",
        status: "accepted",
        message: "Deep research iniciada com sucesso",
      },
    });

    mockedAxios.get.mockResolvedValue({
      data: {
        sessionId: "test-session-123",
        status: "in_progress",
        progress: 50,
        message: "Processando pesquisa",
      },
    });
  });

  // Diretório para resultados
  const resultsDir = path.resolve(__dirname, "./results");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  test("deve iniciar uma pesquisa profunda e receber eventos de progresso", async () => {
    // Preparar eventos para captura
    const events: any[] = [];

    // Registrar listeners para eventos
    deepResearchService.on("research:start", (data) =>
      events.push({ type: "start", data })
    );
    deepResearchService.on("research:tasks", (data) =>
      events.push({ type: "tasks", data })
    );
    deepResearchService.on("research:progress", (data) =>
      events.push({ type: "progress", data })
    );
    deepResearchService.on("research:complete", (data) =>
      events.push({ type: "complete", data })
    );

    // Iniciar pesquisa
    const query = "Como classificar produtos eletrônicos importados no NCM?";
    const sessionId = await deepResearchService.startResearch(query);

    // Aguardar conclusão (simulado)
    await new Promise((resolve) => {
      deepResearchService.on("research:complete", resolve);

      // Timeout de segurança
      setTimeout(resolve, 5000);
    });

    // Verificar eventos capturados
    expect(events.length).toBeGreaterThan(0);
    expect(events.find((e) => e.type === "start")).toBeDefined();
    expect(events.find((e) => e.type === "tasks")).toBeDefined();
    expect(events.find((e) => e.type === "progress")).toBeDefined();
    expect(events.find((e) => e.type === "complete")).toBeDefined();

    // Verificar se a pesquisa foi concluída
    const completeEvent = events.find((e) => e.type === "complete");
    expect(completeEvent).toBeDefined();
    expect(completeEvent.data.sessionId).toBe(sessionId);
    expect(completeEvent.data.results.length).toBeGreaterThan(0);

    // Salvar resultados para análise
    fs.writeFileSync(
      path.join(resultsDir, "deep-research-events.json"),
      JSON.stringify(events, null, 2)
    );

    console.log(`✅ Teste concluído. ${events.length} eventos capturados.`);
  }, 10000); // Timeout aumentado para 10s

  test("deve integrar com FastAPI para pesquisa profunda", async () => {
    // Iniciar pesquisa via FastAPI
    const query = "Qual a classificação NCM para smartphones com IA?";

    const response = await fastApiIntegration.sendDeepResearchRequest(
      query,
      "test-session-123"
    );

    // Verificar resposta
    expect(response).toBeDefined();
    expect(response.sessionId).toBe("test-session-123");
    expect(response.status).toBe("accepted");

    // Verificar chamada ao axios
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:10000/api/v1/deep-research",
      expect.objectContaining({
        query,
        sessionId: "test-session-123",
      })
    );

    // Verificar status
    const statusResponse = await fastApiIntegration.getDeepResearchStatus(
      "test-session-123"
    );

    expect(statusResponse).toBeDefined();
    expect(statusResponse.sessionId).toBe("test-session-123");
    expect(statusResponse.status).toBe("in_progress");
    expect(statusResponse.progress).toBe(50);

    // Verificar chamada ao axios para status
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:10000/api/v1/deep-research/test-session-123/status"
    );

    console.log("✅ Teste de integração com FastAPI concluído com sucesso.");
  });

  test("deve lidar com erros durante a pesquisa profunda", async () => {
    // Configurar mock para simular erro
    mockedAxios.post.mockRejectedValueOnce(
      new Error("Falha na conexão com o servidor")
    );

    // Preparar para capturar eventos de erro
    const errorPromise = new Promise((resolve) => {
      deepResearchService.on("research:error", resolve);
    });

    // Iniciar pesquisa que deve falhar
    try {
      await fastApiIntegration.sendDeepResearchRequest(
        "query com erro",
        "error-session"
      );
      fail("Deveria ter lançado um erro");
    } catch (error) {
      expect(error).toBeDefined();
    }

    // Iniciar pesquisa no serviço local e forçar erro
    const originalExecuteTask = (deepResearchService as any).executeTask;
    (deepResearchService as any).executeTask = jest
      .fn()
      .mockImplementation(() => Promise.reject(new Error("Falha simulada")));

    // Iniciar pesquisa que deve emitir erro
    const sessionId = await deepResearchService.startResearch(
      "query para teste de erro"
    );

    // Aguardar evento de erro
    const errorEvent = await Promise.race([
      errorPromise,
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 5000)),
    ]);

    // Restaurar método original
    (deepResearchService as any).executeTask = originalExecuteTask;

    // Verificar se capturamos um erro (e não um timeout)
    expect(errorEvent).not.toBe("timeout");

    console.log("✅ Teste de tratamento de erros concluído.");
  }, 10000); // Timeout aumentado para 10s

  test("deve processar tarefas em paralelo para melhor desempenho", async () => {
    // Sobrescrever método para simular processamento paralelo
    const originalProcessResearch = (deepResearchService as any)
      .processResearch;

    (deepResearchService as any).processResearch = async function (
      query: string,
      sessionId: string,
      options: any
    ) {
      try {
        // Emitir evento de início
        this.eventEmitter.emit("research:start", { sessionId, query });

        // Gerar tarefas
        const tasks = this.generateTasks(query);
        this.taskQueue = [...tasks];

        this.eventEmitter.emit("research:tasks", {
          sessionId,
          totalTasks: tasks.length,
          tasks: tasks.map((t: any) => t.description),
        });

        // Processar tarefas em paralelo
        const startTime = Date.now();

        // Usar Promise.all para paralelismo
        const results = await Promise.all(
          tasks.map(async (task: any, index: number) => {
            // Simular execução paralela com diferentes tempos
            await new Promise((resolve) =>
              setTimeout(resolve, 100 + (index % 3) * 50)
            );

            const result = await this.executeTask(task, query);

            // Emitir progresso
            const completedTasks = index + 1;
            const progress = Math.floor((completedTasks / tasks.length) * 100);

            this.eventEmitter.emit("research:progress", {
              sessionId,
              progress,
              completedTasks,
              totalTasks: tasks.length,
              latestResult: result,
            });

            return result;
          })
        );

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        this.results = results;

        // Finalizar
        this.eventEmitter.emit("research:complete", {
          sessionId,
          results: this.results,
          summary: this.generateSummary(this.results),
          executionTime: totalTime,
        });
      } catch (error) {
        this.eventEmitter.emit("research:error", {
          sessionId,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      } finally {
        this.isResearching = false;
      }
    };

    // Capturar eventos para análise
    let completeEvent: any = null;
    deepResearchService.on("research:complete", (data) => {
      completeEvent = data;
    });

    // Iniciar pesquisa
    const query =
      "Análise completa de classificação NCM para equipamentos médicos importados";
    const sessionId = await deepResearchService.startResearch(query);

    // Aguardar conclusão
    await new Promise((resolve) => {
      deepResearchService.on("research:complete", resolve);
      setTimeout(resolve, 5000); // Timeout de segurança
    });

    // Restaurar método original
    (deepResearchService as any).processResearch = originalProcessResearch;

    // Verificar tempo de execução
    expect(completeEvent).not.toBeNull();
    expect(completeEvent.executionTime).toBeDefined();

    // Em um processamento paralelo eficiente, o tempo total deve ser menor que a soma das durações
    const totalTaskDuration = (deepResearchService as any)
      .generateTasks(query)
      .reduce((sum: number, task: any) => sum + task.duration, 0);

    console.log(`Tempo de execução paralela: ${completeEvent.executionTime}ms`);
    console.log(`Soma das durações das tarefas: ${totalTaskDuration}ms`);

    // O tempo paralelo deve ser significativamente menor (pelo menos 40% mais rápido)
    expect(completeEvent.executionTime).toBeLessThan(totalTaskDuration * 0.6);

    // Salvar resultados
    fs.writeFileSync(
      path.join(resultsDir, "deep-research-parallel.json"),
      JSON.stringify(
        {
          parallelTime: completeEvent.executionTime,
          sequentialEstimate: totalTaskDuration,
          improvement:
            (
              ((totalTaskDuration - completeEvent.executionTime) /
                totalTaskDuration) *
              100
            ).toFixed(2) + "%",
          results: completeEvent.results,
        },
        null,
        2
      )
    );

    console.log("✅ Teste de processamento paralelo concluído com sucesso.");
  }, 10000); // Timeout aumentado para 10s
});

// Executar testes diretamente
if (require.main === module) {
  console.log("Executando testes de integração do Deep Research...");
  // Os testes seriam executados pelo framework de teste (Jest)
}
