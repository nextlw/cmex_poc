import { Response } from "express";
import { EventEmitter } from "events";
import { ServerLog, StreamMessage, TrackerContext } from "../types/globalTypes";

export interface SSEConnection {
  id: string;
  res: Response;
  isAlive: boolean;
  lastPing: number;
}

export class SSEService {
  private static instance: SSEService;
  private connections: Map<string, SSEConnection>;
  private eventEmitter: EventEmitter;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.connections = new Map();
    this.eventEmitter = new EventEmitter();
    this.setupHeartbeat();
  }

  public static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
    }
    return SSEService.instance;
  }

  private setupHeartbeat() {
    // Verifica conexões a cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      this.connections.forEach((conn, id) => {
        if (now - conn.lastPing > 60000) {
          // 60 segundos sem ping
          this.closeConnection(id);
        } else if (conn.isAlive) {
          this.sendHeartbeat(conn);
        }
      });
    }, 30000);
  }

  private sendHeartbeat(connection: SSEConnection) {
    try {
      connection.res.write(":heartbeat\n\n");
    } catch (error) {
      console.error(`Erro ao enviar heartbeat para ${connection.id}:`, error);
      this.closeConnection(connection.id);
    }
  }

  public addConnection(id: string, res: Response): void {
    // Configurar headers SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    const connection: SSEConnection = {
      id,
      res,
      isAlive: true,
      lastPing: Date.now(),
    };

    this.connections.set(id, connection);

    // Configurar cleanup quando a conexão for fechada
    res.on("close", () => {
      this.closeConnection(id);
    });

    // Enviar evento de conexão estabelecida
    this.sendEvent(id, "connected", { id });
  }

  public closeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.isAlive = false;
      try {
        connection.res.end();
      } catch (error) {
        console.error(`Erro ao fechar conexão ${id}:`, error);
      }
      this.connections.delete(id);
      this.eventEmitter.emit("connection:closed", id);
    }
  }

  public sendEvent(id: string, event: string, data: any): void {
    const connection = this.connections.get(id);
    if (connection && connection.isAlive) {
      try {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        connection.res.write(message);
        connection.lastPing = Date.now();
      } catch (error) {
        console.error(`Erro ao enviar evento para ${id}:`, error);
        this.closeConnection(id);
      }
    }
  }

  public sendStreamMessage(requestId: string, data: StreamMessage): void {
    let formattedData;

    if (typeof data.data === "object" && "action" in data.data) {
      const { action } = data.data;
      switch (action) {
        case "search":
          formattedData = {
            type: "search",
            data: {
              action,
              think: data.data.think,
              searchQuery: data.data.searchQuery,
              message: `Pesquisando informações para: "${data.data.searchQuery}"`,
              searchResults: data.data.searchResults || [],
            },
            outputs: data.outputs || [],
            trackers: data.trackers,
          };
          break;

        case "answer":
          formattedData = {
            type: "answer",
            data: {
              action,
              think: data.data.think,
              answer: data.data.answer,
              references: data.data.references,
              reasoning: data.data.reasoning || data.data.accumulatedReasoning,
            },
            outputs: data.outputs || [],
            trackers: data.trackers,
          };
          break;

        case "reflect":
          formattedData = {
            type: "reflect",
            data: {
              action,
              think: data.data.think,
              questionsToAnswer: data.data.questionsToAnswer,
              message: `Refletindo sobre: ${
                data.data.questionsToAnswer
                  ? data.data.questionsToAnswer.join(", ")
                  : "a pergunta"
              }`,
            },
            outputs: data.outputs || [],
            trackers: data.trackers,
          };
          break;

        case "visit":
          formattedData = {
            type: "visit",
            data: {
              action,
              think: data.data.think,
              URLTargets: data.data.URLTargets,
              message: `Visitando URLs: ${
                data.data.URLTargets ? data.data.URLTargets.join(", ") : ""
              }`,
            },
            outputs: data.outputs || [],
            trackers: data.trackers,
          };
          break;

        default:
          formattedData = {
            type: "progress",
            data: data.data,
            outputs: data.outputs || [],
            trackers: data.trackers,
          };
      }
    } else {
      formattedData = {
        type: data.type || "progress",
        data: data.data,
        outputs: data.outputs || [],
        trackers: data.trackers,
      };
    }

    if (formattedData) {
      this.sendEvent(requestId, "message", formattedData);
    }
  }

  public sendInitialContext(requestId: string, context?: TrackerContext): void {
    const initialData = {
      type: "connected",
      requestId,
      trackers: context
        ? {
            tokenUsage: context.tokenTracker.getTotalUsage(),
            actionState: context.actionTracker.getState(),
          }
        : null,
    };
    this.sendEvent(requestId, "message", initialData);
  }

  public sendLogs(requestId: string, logs: ServerLog[]): void {
    if (logs.length > 0) {
      const logsData = {
        type: "log",
        data: `Histórico de logs recentes (${logs.length}):\n${logs
          .map(
            (log) =>
              `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`
          )
          .join("\n")}`,
        trackers: null,
      };
      this.sendEvent(requestId, "message", logsData);
    }
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public isConnected(id: string): boolean {
    const connection = this.connections.get(id);
    return connection ? connection.isAlive : false;
  }
}
