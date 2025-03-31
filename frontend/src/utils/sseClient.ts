/**
 * Cliente SSE com suporte a reconexão automática
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private baseUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private initialReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeout = 65000; // 65 segundos
  private lastMessageTime = 0;
  private listeners: Record<string, Array<(data: any) => void>> = {};
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private connectionStatus: ConnectionStatus = {
    status: "disconnected",
    attempts: 0,
  };

  constructor(
    baseUrl: string,
    options?: {
      maxReconnectAttempts?: number;
      initialReconnectDelay?: number;
      maxReconnectDelay?: number;
      heartbeatTimeout?: number;
    }
  ) {
    this.baseUrl = baseUrl;

    if (options) {
      this.maxReconnectAttempts =
        options.maxReconnectAttempts || this.maxReconnectAttempts;
      this.initialReconnectDelay =
        options.initialReconnectDelay || this.initialReconnectDelay;
      this.maxReconnectDelay =
        options.maxReconnectDelay || this.maxReconnectDelay;
      this.heartbeatTimeout = options.heartbeatTimeout || this.heartbeatTimeout;
    }
  }

  /**
   * Conecta ao endpoint SSE
   * @param endpoint O endpoint SSE relativo à baseUrl
   */
  public connect(endpoint: string): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.updateStatus({
      status: "connecting",
      attempts: this.reconnectAttempts + 1,
    });

    try {
      const url = `${this.baseUrl}${endpoint}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log("Conexão SSE estabelecida");
        this.reconnectAttempts = 0;
        this.lastMessageTime = Date.now();
        this.updateStatus({
          status: "connected",
          attempts: 0,
        });
        this.startHeartbeatCheck();
      };

      this.eventSource.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        console.log("Mensagem SSE recebida:", event.data);

        try {
          const data = JSON.parse(event.data);
          // Notificar listeners do evento 'message'
          this.notifyListeners("message", data);

          // Se a mensagem tem um tipo, notificar os listeners desse tipo específico
          if (data.type) {
            this.notifyListeners(data.type, data);
          }

          logSSEEvent(event.type, event.data);
        } catch (error) {
          console.error("Erro ao processar mensagem SSE:", error);
          this.notifyListeners("error", {
            error: "Erro ao processar mensagem",
            originalData: event.data,
          });
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("Erro na conexão SSE:", error);

        // Atualizar status
        this.updateStatus({
          status: "error",
          attempts: this.reconnectAttempts,
          lastError: error ? String(error) : "Erro desconhecido",
        });

        this.disconnect();

        // Tentar reconectar
        this.scheduleReconnect(endpoint);
      };

      // Configurar listeners para eventos nomeados
      if (this.listeners) {
        Object.keys(this.listeners).forEach((eventName) => {
          if (
            eventName !== "message" &&
            eventName !== "error" &&
            this.eventSource
          ) {
            this.eventSource.addEventListener(eventName, (event: any) => {
              try {
                const data = JSON.parse(event.data);
                this.notifyListeners(eventName, data);
              } catch (error) {
                console.error(
                  `Erro ao processar evento "${eventName}":`,
                  error
                );
              }
            });
          }
        });
      }
    } catch (error) {
      console.error("Erro ao criar conexão SSE:", error);
      this.updateStatus({
        status: "error",
        attempts: this.reconnectAttempts,
        lastError: error ? String(error) : "Erro desconhecido",
      });

      this.scheduleReconnect(endpoint);
    }
  }

  /**
   * Desconecta do servidor SSE
   */
  public disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.updateStatus({
      status: "disconnected",
      attempts: 0,
    });
  }

  /**
   * Adiciona um listener para um tipo específico de evento
   * @param eventName Nome do evento
   * @param callback Função de callback que recebe os dados do evento
   */
  public on(eventName: string, callback: (data: any) => void): void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(callback);

    // Se já estamos conectados e é um evento personalizado, adicionar o listener
    if (
      this.eventSource &&
      this.connectionStatus.status === "connected" &&
      eventName !== "message" &&
      eventName !== "error"
    ) {
      this.eventSource.addEventListener(eventName, (event: any) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (error) {
          console.error(`Erro ao processar evento "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Remove um listener para um tipo específico de evento
   * @param eventName Nome do evento
   * @param callback Função de callback a ser removida
   */
  public off(eventName: string, callback: (data: any) => void): void {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Adiciona um listener para mudanças de status de conexão
   * @param callback Função de callback que recebe o status de conexão
   */
  public onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusListeners.push(callback);
    // Notificar imediatamente com o status atual
    callback(this.connectionStatus);
  }

  /**
   * Remove um listener de status de conexão
   * @param callback Função de callback a ser removida
   */
  public offStatusChange(callback: (status: ConnectionStatus) => void): void {
    this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
  }

  /**
   * Retorna o status atual da conexão
   */
  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Notifica todos os listeners de um evento específico
   * @param eventName Nome do evento
   * @param data Dados do evento
   */
  private notifyListeners(eventName: string, data: any): void {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro em listener para "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Atualiza o status da conexão e notifica os listeners
   * @param status Novo status de conexão
   */
  private updateStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusListeners.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error("Erro em statusListener:", error);
      }
    });
  }

  /**
   * Agenda uma tentativa de reconexão
   * @param endpoint Endpoint SSE para reconectar
   */
  private scheduleReconnect(endpoint: string): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay = Math.min(
        this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        this.maxReconnectDelay
      );

      console.log(
        `Tentando reconectar em ${delay / 1000} segundos (tentativa ${
          this.reconnectAttempts
        }/${this.maxReconnectAttempts})...`
      );

      this.updateStatus({
        status: "reconnecting",
        attempts: this.reconnectAttempts,
        lastError: this.connectionStatus.lastError,
      });

      this.reconnectTimer = setTimeout(() => {
        this.connect(endpoint);
      }, delay);
    } else {
      console.error(
        `Desistindo após ${this.maxReconnectAttempts} tentativas de reconexão.`
      );
      this.updateStatus({
        status: "failed",
        attempts: this.reconnectAttempts,
        lastError: `Máximo de ${this.maxReconnectAttempts} tentativas de reconexão atingido`,
      });
    }
  }

  /**
   * Inicia verificação de heartbeat para detectar conexões mortas
   */
  private startHeartbeatCheck(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastMessageTime > this.heartbeatTimeout) {
        console.warn(
          `Heartbeat timeout após ${
            this.heartbeatTimeout / 1000
          } segundos sem mensagens.`
        );

        this.updateStatus({
          status: "error",
          attempts: this.reconnectAttempts,
          lastError: "Timeout de heartbeat",
        });

        // Forçar desconexão e reconexão
        if (this.eventSource) {
          const currentUrl = this.eventSource.url;
          const endpoint = currentUrl.replace(this.baseUrl, "");
          this.disconnect();
          this.connect(endpoint);
        }
      }
    }, 5000); // Verificar a cada 5 segundos
  }
}

/**
 * Tipo para o status de conexão SSE
 */
export interface ConnectionStatus {
  status:
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error"
    | "failed";
  attempts: number;
  lastError?: string;
}

/**
 * Cria uma instância de SSEClient com a configuração padrão
 * @param baseUrl URL base do servidor SSE
 */
export const createSSEClient = (baseUrl: string): SSEClient => {
  return new SSEClient(baseUrl);
};

export default SSEClient;

const DEBUG_SSE =
  process.env.NODE_ENV === "development" &&
  localStorage.getItem("DEBUG_SSE") === "true";

function logSSEEvent(type: string, data: any) {
  if (DEBUG_SSE) {
    console.group(`%cSSE Event: ${type}`, "color: #4285f4; font-weight: bold;");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Data:", data);
    console.groupEnd();
  }
}
