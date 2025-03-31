import { SSEClient, ConnectionStatus } from "../../utils/sseClient";

// Mock para o Event
class Event {
  type: string;

  constructor(type: string) {
    this.type = type;
  }
}

// Mock para o MessageEvent
class MessageEvent extends Event {
  data: string;

  constructor(type: string, options: { data: string }) {
    super(type);
    this.data = options.data;
  }
}

// Mock para o EventSource
class MockEventSource {
  url: string;
  onopen: Function | null = null;
  onerror: Function | null = null;
  onmessage: Function | null = null;
  eventListeners: Record<string, Function[]> = {};
  readyState: number = 0; // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  dispatchEvent(event: any) {
    const eventName = event.type;
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach((callback) => callback(event));
    }

    // Disparar handlers específicos
    if (eventName === "open" && this.onopen) {
      this.onopen(event);
    } else if (eventName === "error" && this.onerror) {
      this.onerror(event);
    } else if (eventName === "message" && this.onmessage) {
      this.onmessage(event);
    }

    return true;
  }

  close() {
    this.readyState = 2;
  }

  // Método auxiliar para testes
  simulateOpen() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  simulateError(event: any = new Event("error")) {
    this.dispatchEvent(event);
  }

  simulateMessage(data: any) {
    const event = new MessageEvent("message", { data: JSON.stringify(data) });
    this.dispatchEvent(event);
  }

  simulateNamedEvent(eventName: string, data: any) {
    const event = new MessageEvent(eventName, { data: JSON.stringify(data) });
    this.dispatchEvent(event);
  }
}

// Substituir o EventSource global pelo nosso mock
(global as any).EventSource = MockEventSource;

describe("SSEClient Integration Tests", () => {
  let sseClient: SSEClient;
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    // Inicializar um novo cliente SSE para cada teste
    sseClient = new SSEClient("/api/v1/stream");

    // Espionar o construtor do EventSource
    jest.spyOn(global, "EventSource").mockImplementation((url) => {
      mockEventSource = new MockEventSource(url as string);
      return mockEventSource as unknown as EventSource;
    });
  });

  afterEach(() => {
    // Desconectar o cliente e limpar mocks após cada teste
    sseClient.disconnect();
    jest.clearAllMocks();
  });

  test("deve conectar com sucesso ao endpoint SSE", () => {
    const requestId = "123456";
    sseClient.connect(requestId);

    // Verificar se o EventSource foi criado com a URL correta
    expect(global.EventSource).toHaveBeenCalledWith(
      `/api/v1/stream${requestId}`
    );

    // Simular a abertura da conexão
    mockEventSource.simulateOpen();

    // Verificar se o status da conexão foi atualizado
    expect(sseClient.getStatus().status).toBe("connected");
  });

  test("deve processar mensagens recebidas corretamente", () => {
    // Configurar um event listener de teste
    const messageCallback = jest.fn();
    sseClient.on("message", messageCallback);

    // Conectar e simular abertura da conexão
    sseClient.connect("123456");
    mockEventSource.simulateOpen();

    // Simular recebimento de uma mensagem
    const testMessage = { type: "response", content: "Teste de mensagem" };
    mockEventSource.simulateMessage(testMessage);

    // Verificar se o callback foi chamado com a mensagem correta
    expect(messageCallback).toHaveBeenCalledWith(
      expect.objectContaining(testMessage)
    );
  });

  test("deve lidar com erros de conexão", () => {
    // Espionar o método updateStatus
    const updateSpy = jest.spyOn(sseClient as any, "updateStatus");

    // Conectar
    sseClient.connect("123456");

    // Simular um erro de conexão
    mockEventSource.simulateError();

    // Verificar se o status da conexão foi atualizado para "error"
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        lastError: expect.any(String),
      })
    );
    expect(sseClient.getStatus().status).toBe("error");
  });

  test("deve desconectar corretamente", () => {
    // Conectar
    sseClient.connect("123456");
    mockEventSource.simulateOpen();

    // Desconectar
    sseClient.disconnect();

    // Verificar se o EventSource foi fechado e o status atualizado
    expect(sseClient.getStatus().status).toBe("disconnected");
  });

  test("deve tentar reconectar automaticamente após um erro", () => {
    // Configurar mock para o setTimeout
    jest.useFakeTimers();

    // Espionar o método de reconexão
    const reconnectSpy = jest.spyOn(sseClient as any, "scheduleReconnect");

    // Conectar
    sseClient.connect("123456");

    // Simular um erro de conexão
    mockEventSource.simulateError();

    // Avançar no tempo para disparar a tentativa de reconexão
    jest.advanceTimersByTime(1000);

    // Verificar se a reconexão foi tentada
    expect(reconnectSpy).toHaveBeenCalled();

    // Restaurar o timer original
    jest.useRealTimers();
  });

  test("deve notificar os ouvintes sobre eventos específicos do servidor", () => {
    // Configurar event listeners de teste
    const progressCallback = jest.fn();
    const thinkingCallback = jest.fn();

    sseClient.on("progress", progressCallback);
    sseClient.on("thinking", thinkingCallback);

    // Conectar e simular abertura da conexão
    sseClient.connect("123456");
    mockEventSource.simulateOpen();

    // Simular eventos nomeados
    const progressData = { step: 2, totalSteps: 5 };
    const thinkingData = { content: "Processando a consulta..." };

    mockEventSource.simulateNamedEvent("progress", progressData);
    mockEventSource.simulateNamedEvent("thinking", thinkingData);

    // Verificar se os callbacks foram chamados com os dados corretos
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining(progressData)
    );
    expect(thinkingCallback).toHaveBeenCalledWith(
      expect.objectContaining(thinkingData)
    );
  });
});
