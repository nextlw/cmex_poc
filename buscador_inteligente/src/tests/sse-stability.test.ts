import axios from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Importação dos tipos
import { SSEConnection } from "../services/sse-service";

dotenv.config();

// Diretório para resultados de teste
const TEST_RESULTS_DIR = path.join(process.cwd(), "test-results");
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Configuração do teste
const config = {
  baseUrl: process.env.TEST_API_URL || "http://localhost:3000",
  connectionCount: process.env.NODE_ENV === "ci" ? 3 : 10, // Menos conexões em CI
  testDuration: process.env.NODE_ENV === "ci" ? 60000 : 30 * 60 * 1000, // 30min em desenvolvimento para teste
  logInterval: 60000, // Log a cada minuto
};

// Arquivo de log
const logStream = fs.createWriteStream(
  path.join(TEST_RESULTS_DIR, `sse-stability-${Date.now()}.log`),
  { flags: "a" }
);

// Interface para eventos SSE
interface EventSourceMessage {
  data: string;
  type?: string;
  lastEventId?: string;
}

// Classe que imita EventSource mas com axios para testes
class TestEventSource {
  url: string;
  readyState: number;
  onopen: ((event: any) => void) | null;
  onmessage: ((event: EventSourceMessage) => void) | null;
  onerror: ((event: any) => void) | null;
  private abortController: AbortController;
  private eventListeners: Map<
    string,
    Array<(event: EventSourceMessage) => void>
  >;
  private isConnected: boolean;

  constructor(url: string) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.abortController = new AbortController();
    this.eventListeners = new Map();
    this.isConnected = false;

    this.connect();
  }

  private async connect() {
    try {
      const response = await axios.get(this.url, {
        responseType: "stream",
        signal: this.abortController.signal,
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      this.readyState = 1; // OPEN
      this.isConnected = true;

      if (this.onopen) {
        this.onopen({});
      }

      let buffer = "";
      response.data.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();

        if (buffer.includes("\n\n")) {
          const messages = buffer.split("\n\n");
          buffer = messages.pop() || "";

          messages.forEach((message) => {
            this.processMessage(message);
          });
        }
      });

      response.data.on("end", () => {
        this.readyState = 2; // CLOSED
        this.isConnected = false;
        this.onerror && this.onerror(new Error("Connection closed"));
      });

      response.data.on("error", (err: Error) => {
        this.readyState = 2; // CLOSED
        this.isConnected = false;
        this.onerror && this.onerror(err);
      });
    } catch (error) {
      this.readyState = 2; // CLOSED
      this.isConnected = false;
      this.onerror && this.onerror(error);
    }
  }

  private processMessage(messageText: string) {
    const lines = messageText.split("\n");
    let event: string = "message";
    let data: string = "";
    let id: string = "";

    lines.forEach((line) => {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data = line.slice(5).trim();
      } else if (line.startsWith("id:")) {
        id = line.slice(3).trim();
      }
    });

    const messageEvent: EventSourceMessage = {
      data,
      type: event,
      lastEventId: id,
    };

    // Dispatch to specific event listener
    if (event !== "message" && this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event) || [];
      listeners.forEach((listener) => listener(messageEvent));
    }

    // Always dispatch to onmessage
    if (this.onmessage) {
      this.onmessage(messageEvent);
    }
  }

  addEventListener(
    event: string,
    callback: (event: EventSourceMessage) => void
  ) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)?.push(callback);
  }

  removeEventListener(
    event: string,
    callback: (event: EventSourceMessage) => void
  ) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(callback);

      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  close() {
    this.abortController.abort();
    this.readyState = 2; // CLOSED
    this.isConnected = false;
  }
}

/**
 * Teste de estabilidade de conexões SSE
 * Este teste mantém múltiplas conexões SSE ativas por um longo período
 * e monitora desconexões inesperadas e latência de heartbeats.
 */
describe("SSE Stability Test", () => {
  // Timeout longo para o teste de duração
  jest.setTimeout(config.testDuration + 10000);

  // Estatísticas de teste
  const stats = {
    connections: 0,
    disconnections: 0,
    heartbeats: 0,
    heartbeatLatencies: [] as number[],
    errors: 0,
    messageCount: 0,
  };

  // Array para armazenar conexões
  const connections: {
    id: string;
    source: TestEventSource;
    lastHeartbeat: number;
  }[] = [];

  // Inicializar conexões
  beforeAll(() => {
    log(
      `Iniciando teste com ${config.connectionCount} conexões por ${
        config.testDuration / 1000 / 60
      } minutos`
    );

    // Criar conexões
    for (let i = 0; i < config.connectionCount; i++) {
      const connectionId = `test-${Date.now()}-${i}`;
      const url = `${config.baseUrl}/api/v1/stream/${connectionId}`;

      log(`Estabelecendo conexão ${i + 1}/${config.connectionCount}: ${url}`);

      const source = new TestEventSource(url);
      const connection = {
        id: connectionId,
        source,
        lastHeartbeat: Date.now(),
      };

      // Configurar listeners
      source.onopen = () => {
        log(`Conexão estabelecida: ${connectionId}`);
        stats.connections++;
      };

      source.onerror = (error: Error) => {
        log(`Erro na conexão ${connectionId}: ${error.message}`, "error");
        stats.errors++;
      };

      source.onmessage = (event: EventSourceMessage) => {
        const now = Date.now();
        stats.messageCount++;

        try {
          const data = JSON.parse(event.data);

          // Detectar heartbeats
          if (data && data.type === "heartbeat") {
            const latency = now - connection.lastHeartbeat;
            stats.heartbeatLatencies.push(latency);
            stats.heartbeats++;
            connection.lastHeartbeat = now;
          }
        } catch (error) {
          log(
            `Erro ao processar mensagem: ${(error as Error).message}`,
            "error"
          );
        }
      };

      // Configurar evento de fechamento
      source.addEventListener("close", () => {
        log(`Conexão fechada: ${connectionId}`);
        stats.disconnections++;
      });

      connections.push(connection);
    }
  });

  // Executar teste de longa duração
  test("deve manter conexões estáveis por longo período", (done) => {
    const startTime = Date.now();
    let lastLogTime = startTime;

    // Intervalo para logs periódicos
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMinutes = (now - startTime) / 60000;
      const avgLatency =
        stats.heartbeatLatencies.length > 0
          ? stats.heartbeatLatencies.reduce((a, b) => a + b, 0) /
            stats.heartbeatLatencies.length
          : 0;

      // Log de estatísticas
      log(`
=== Status após ${elapsedMinutes.toFixed(2)} minutos ===
Conexões estabelecidas: ${stats.connections}/${config.connectionCount}
Desconexões inesperadas: ${stats.disconnections}
Taxa de desconexão: ${(
        (stats.disconnections / config.connectionCount) *
        100
      ).toFixed(2)}%
Heartbeats recebidos: ${stats.heartbeats}
Latência média de heartbeat: ${avgLatency.toFixed(2)}ms
Mensagens totais recebidas: ${stats.messageCount}
Erros: ${stats.errors}
      `);

      // Verificar memória
      const memUsage = process.memoryUsage();
      log(
        `Uso de memória: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(
          memUsage.heapTotal /
          1024 /
          1024
        ).toFixed(2)}MB`
      );

      lastLogTime = now;

      // Finalizar o teste se o tempo configurado foi atingido
      if (now - startTime >= config.testDuration) {
        clearInterval(interval);
        finishTest(done);
      }
    }, config.logInterval);
  });

  // Limpar recursos após o teste
  afterAll(() => {
    // Fechar todas as conexões
    connections.forEach((connection) => {
      connection.source.close();
    });

    // Fechar log stream
    logStream.end();
  });

  // Finalizar teste com verificações
  function finishTest(done: jest.DoneCallback) {
    // Calcular estatísticas finais
    const disconnectionRate = stats.disconnections / config.connectionCount;
    const avgLatency =
      stats.heartbeatLatencies.length > 0
        ? stats.heartbeatLatencies.reduce((a, b) => a + b, 0) /
          stats.heartbeatLatencies.length
        : 0;

    log(`=== Resultados Finais ===
Taxa de desconexão: ${(disconnectionRate * 100).toFixed(2)}%
Latência média de heartbeat: ${avgLatency.toFixed(2)}ms
    `);

    // Verificações de sucesso
    try {
      expect(disconnectionRate).toBeLessThan(0.001);
      expect(avgLatency).toBeLessThan(50);
      done();
    } catch (error) {
      done(error);
    }
  }

  // Função de log para console e arquivo
  function log(message: string, level: "log" | "error" | "warn" = "log") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;

    // Log para console
    console[level](logMessage);

    // Log para arquivo
    logStream.write(logMessage + "\n");
  }
});
