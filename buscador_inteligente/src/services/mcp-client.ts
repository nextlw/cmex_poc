import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";

export class MCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private buffer: string = "";
  private toolsCache: Record<string, { description: string; parameters: any }> =
    {};
  private isInitialized: boolean = false;

  constructor(private serverPath: string = "app/mcp/server.py") {
    super();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      try {
        // Inicia o processo do servidor MCP
        this.process = spawn("python", [this.serverPath]);

        // Configura handlers para stdout
        this.process.stdout?.on("data", (data) => {
          this.handleServerOutput(data.toString());
        });

        // Configura handlers para stderr
        this.process.stderr?.on("data", (data) => {
          console.error(`MCP Server Error: ${data}`);
          this.emit("error", data.toString());
        });

        // Handler para quando o processo termina
        this.process.on("close", (code) => {
          console.log(`MCP Server process exited with code ${code}`);
          this.process = null;
          this.isInitialized = false;
          this.emit("close", code);
        });

        // Busca as ferramentas disponíveis
        this.listTools()
          .then(() => {
            this.isInitialized = true;
            resolve();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleServerOutput(data: string): void {
    // Adiciona os dados ao buffer
    this.buffer += data;

    // Processa linhas completas
    const lines = this.buffer.split("\n");

    // Se não temos uma linha completa, mantém no buffer
    if (lines.length <= 1) return;

    // Processa todas as linhas completas
    this.buffer = lines.pop() || ""; // Mantém a última linha incompleta no buffer

    for (const line of lines) {
      try {
        // Tenta fazer o parse como JSON
        if (line.trim()) {
          const message = JSON.parse(line);
          this.emit("message", message);
        }
      } catch (e) {
        // Se não for JSON, emite como texto
        if (line.trim()) {
          this.emit("text", line);
        }
      }
    }
  }

  async listTools(): Promise<
    Record<string, { description: string; parameters: any }>
  > {
    if (!this.process) {
      await this.initialize();
    }

    // Se já temos as ferramentas em cache, retorna-as
    if (Object.keys(this.toolsCache).length > 0) {
      return this.toolsCache;
    }

    return new Promise((resolve, reject) => {
      // Envia comando para listar ferramentas
      const listToolsCommand = {
        jsonrpc: "2.0",
        method: "system.listMethods",
        params: [],
        id: Date.now(),
      };

      // Handler para processar a resposta
      const messageHandler = (message: any) => {
        if (message.id === listToolsCommand.id) {
          this.removeListener("message", messageHandler);

          // Busca detalhes de cada ferramenta
          const tools = message.result || [];
          const toolPromises = tools.map((toolName: string) =>
            this.getToolDetails(toolName)
          );

          Promise.all(toolPromises)
            .then(() => {
              resolve(this.toolsCache);
            })
            .catch(reject);
        }
      };

      // Registra o handler
      this.on("message", messageHandler);

      // Envia o comando
      this.send(listToolsCommand);
    });
  }

  private async getToolDetails(toolName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Envia comando para obter detalhes da ferramenta
      const getToolCommand = {
        jsonrpc: "2.0",
        method: "system.methodHelp",
        params: [toolName],
        id: `help_${Date.now()}`,
      };

      // Handler para processar a resposta
      const messageHandler = (message: any) => {
        if (message.id === getToolCommand.id) {
          this.removeListener("message", messageHandler);

          // Armazena os detalhes da ferramenta
          this.toolsCache[toolName] = {
            description: message.result || "",
            parameters: {},
          };

          // Obtém os parâmetros da ferramenta
          this.getToolParameters(toolName)
            .then(() => {
              resolve();
            })
            .catch(reject);
        }
      };

      // Registra o handler
      this.on("message", messageHandler);

      // Envia o comando
      this.send(getToolCommand);
    });
  }

  private async getToolParameters(toolName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Envia comando para obter parâmetros da ferramenta
      const getParamsCommand = {
        jsonrpc: "2.0",
        method: "system.methodSignature",
        params: [toolName],
        id: `params_${Date.now()}`,
      };

      // Handler para processar a resposta
      const messageHandler = (message: any) => {
        if (message.id === getParamsCommand.id) {
          this.removeListener("message", messageHandler);

          // Armazena os parâmetros da ferramenta
          if (this.toolsCache[toolName]) {
            this.toolsCache[toolName].parameters = message.result || {};
          }

          resolve();
        }
      };

      // Registra o handler
      this.on("message", messageHandler);

      // Envia o comando
      this.send(getParamsCommand);
    });
  }

  async executeTool(
    toolName: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    if (!this.process) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      // Envia comando para executar a ferramenta
      const executeCommand = {
        jsonrpc: "2.0",
        method: toolName,
        params: [params],
        id: `exec_${Date.now()}`,
      };

      // Handler para processar a resposta
      const messageHandler = (message: any) => {
        if (message.id === executeCommand.id) {
          this.removeListener("message", messageHandler);

          if (message.error) {
            reject(
              new Error(message.error.message || "Erro ao executar ferramenta")
            );
          } else {
            resolve(message.result);
          }
        }
      };

      // Registra o handler
      this.on("message", messageHandler);

      // Envia o comando
      this.send(executeCommand);
    });
  }

  private send(command: any): void {
    if (!this.process || !this.process.stdin) {
      throw new Error("MCP Server process not initialized");
    }

    // Envia o comando para o processo
    this.process.stdin.write(JSON.stringify(command) + "\n");
  }

  async close(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.isInitialized = false;
    }
  }
}
