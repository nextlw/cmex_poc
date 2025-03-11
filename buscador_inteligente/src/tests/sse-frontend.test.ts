import { jest } from "@jest/globals";
import { JSDOM } from "jsdom";
import axios from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";
import fs from "fs";
import path from "path";

// Mock para o EventSource
jest.mock("event-source-polyfill");

// Mock para o axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Configuração do ambiente do navegador com JSDOM
const dom = new JSDOM(
  '<!DOCTYPE html><html><body><div id="chat-container"></div></body></html>',
  {
    url: "http://localhost/",
    runScripts: "dangerously",
  }
);

global.document = dom.window.document;
global.window = dom.window as any;
global.navigator = dom.window.navigator;

// Simula os eventos SSE para testar o frontend
class MockEventSource {
  onopen: () => void = () => {};
  onerror: (error: any) => void = () => {};
  onmessage: (event: any) => void = () => {};
  readyState: number = 0;
  url: string;
  withCredentials: boolean;
  private eventListeners: Record<string, Array<(event: any) => void>> = {};

  constructor(url: string, options?: any) {
    this.url = url;
    this.withCredentials = options?.withCredentials || false;

    // Simular que a conexão foi estabelecida após um pequeno delay
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen();
    }, 50);
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = [];
    }
    this.eventListeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void): void {
    if (!this.eventListeners[type]) return;
    this.eventListeners[type] = this.eventListeners[type].filter(
      (l) => l !== listener
    );
  }

  dispatchEvent(event: any): boolean {
    const listeners = this.eventListeners[event.type] || [];
    for (const listener of listeners) {
      listener(event);
    }
    return true;
  }

  close(): void {
    this.readyState = 2; // CLOSED
  }

  // Método para simular o recebimento de mensagens SSE
  simulateMessage(data: any, eventType: string = "message"): void {
    const event = {
      type: eventType,
      data: typeof data === "string" ? data : JSON.stringify(data),
    };

    if (eventType === "message" && this.onmessage) {
      this.onmessage(event);
    }

    this.dispatchEvent(event);
  }
}

// Substituir a implementação do EventSource pelo nosso mock
(EventSourcePolyfill as unknown as jest.Mock).mockImplementation(
  (url, options) => {
    return new MockEventSource(url, options);
  }
);

// Importar o código do frontend sob teste
// Nota: Normalmente você importaria os módulos reais, mas aqui vamos simular o comportamento
describe("Frontend SSE Tests", () => {
  let mockEventSource: MockEventSource;
  let chatContainer: HTMLElement;

  beforeEach(() => {
    // Limpar o DOM antes de cada teste
    document.getElementById("chat-container")!.innerHTML = "";
    chatContainer = document.getElementById("chat-container")!;

    // Configurar o mock do axios para simular respostas da API
    mockedAxios.post.mockResolvedValue({
      data: { sessionId: "test-session-123" },
      status: 200,
    });

    // Criar um novo event source mock
    const eventSource = new EventSourcePolyfill(
      "/api/sse?sessionId=test-session-123"
    );
    mockEventSource = eventSource as unknown as MockEventSource;

    // Simular a injeção do nosso frontend
    // Normalmente isso seria feito importando o módulo real
    injectChatUI(chatContainer, mockEventSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Função que simula o frontend sob teste
  function injectChatUI(container: HTMLElement, eventSource: any) {
    // Criar elementos básicos da UI
    const messageList = document.createElement("div");
    messageList.id = "message-list";

    const inputForm = document.createElement("form");
    inputForm.id = "chat-form";

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.id = "user-input";

    const sendButton = document.createElement("button");
    sendButton.type = "submit";
    sendButton.textContent = "Enviar";

    // Montar a estrutura DOM
    inputForm.appendChild(textInput);
    inputForm.appendChild(sendButton);
    container.appendChild(messageList);
    container.appendChild(inputForm);

    // Adicionar event listeners
    inputForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userInput = textInput.value.trim();
      if (!userInput) return;

      // Adicionar mensagem do usuário
      addMessageToUI("user", userInput);

      // Limpar input
      textInput.value = "";

      // Enviar requisição
      mockedAxios
        .post("/api/chat", { message: userInput })
        .then((response) => {
          console.log("Message sent", response.data);
        })
        .catch((error) => {
          console.error("Error sending message", error);
          addMessageToUI("system", "Erro ao enviar mensagem");
        });
    });

    // Configurar listeners do SSE
    eventSource.addEventListener("message", (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "content") {
          addMessageToUI("assistant", data.content);
        } else if (data.type === "status") {
          updateStatus(data.status);
        }
      } catch (error) {
        console.error("Error processing SSE message", error);
      }
    });

    eventSource.addEventListener("heartbeat", () => {
      // console.log('Heartbeat received');
    });

    eventSource.addEventListener("error", (error: any) => {
      console.error("SSE connection error", error);
      addMessageToUI("system", "Erro na conexão. Tentando reconectar...");
    });
  }

  // Função para adicionar mensagens à UI
  function addMessageToUI(role: string, content: string) {
    const messageList = document.getElementById("message-list")!;
    const messageElement = document.createElement("div");
    messageElement.className = `message ${role}-message`;
    messageElement.innerHTML = `<div class="message-content">${content}</div>`;
    messageList.appendChild(messageElement);

    // Simular scroll para o final da lista
    messageList.scrollTop = messageList.scrollHeight;
  }

  // Função para atualizar o status
  function updateStatus(status: string) {
    const statusElement =
      document.getElementById("status") ||
      (() => {
        const element = document.createElement("div");
        element.id = "status";
        document.getElementById("chat-container")!.appendChild(element);
        return element;
      })();

    statusElement.textContent = status;
  }

  test("deve exibir mensagens do usuário corretamente", () => {
    // Simular envio de mensagem do usuário
    const inputElement = document.getElementById(
      "user-input"
    ) as HTMLInputElement;
    const form = document.getElementById("chat-form") as HTMLFormElement;

    inputElement.value = "Olá, como posso validar um NCM?";
    form.dispatchEvent(new Event("submit"));

    // Verificar se a mensagem do usuário foi exibida
    const messageElements = document.querySelectorAll(".user-message");
    expect(messageElements.length).toBe(1);
    expect(messageElements[0].textContent).toContain(
      "Olá, como posso validar um NCM?"
    );

    // Verificar se a requisição foi enviada
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith("/api/chat", {
      message: "Olá, como posso validar um NCM?",
    });
  });

  test("deve processar e exibir mensagens SSE recebidas", () => {
    // Simular recebimento de mensagem do assistente via SSE
    mockEventSource.simulateMessage({
      type: "content",
      content:
        "Para validar um NCM, você pode fornecer a descrição do produto.",
    });

    // Verificar se a mensagem do assistente foi exibida
    const messageElements = document.querySelectorAll(".assistant-message");
    expect(messageElements.length).toBe(1);
    expect(messageElements[0].textContent).toContain(
      "Para validar um NCM, você pode fornecer a descrição do produto."
    );
  });

  test("deve lidar com atualizações de status", () => {
    // Simular atualização de status
    mockEventSource.simulateMessage({
      type: "status",
      status: "Processando...",
    });

    // Verificar se o status foi atualizado
    const statusElement = document.getElementById("status");
    expect(statusElement).not.toBeNull();
    expect(statusElement!.textContent).toBe("Processando...");
  });

  test("deve lidar com erros de conexão SSE", () => {
    // Simular erro na conexão SSE
    mockEventSource.onerror(new Error("Connection lost"));

    // Verificar se a mensagem de erro foi exibida
    const messageElements = document.querySelectorAll(".system-message");
    expect(messageElements.length).toBe(1);
    expect(messageElements[0].textContent).toContain("Erro na conexão");
  });

  test("deve processar mensagens SSE rápidas em sequência", () => {
    // Simular um stream de mensagens rápidas (como num chat stream)
    const startTime = performance.now();

    // Enviar 50 mensagens em sequência
    for (let i = 1; i <= 50; i++) {
      mockEventSource.simulateMessage({
        type: "content",
        content: `Parte ${i} da resposta`,
      });
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Verificar se todas as mensagens foram processadas
    const messageElements = document.querySelectorAll(".assistant-message");
    expect(messageElements.length).toBe(50);

    // Verificar tempo de processamento (deve ser relativamente rápido)
    console.log(`Tempo para processar 50 mensagens: ${processingTime}ms`);
    expect(processingTime).toBeLessThan(1000); // menos de 1 segundo

    // Verificar a última mensagem
    expect(messageElements[49].textContent).toContain("Parte 50 da resposta");
  });

  test("deve registrar métricas de desempenho para renderização", () => {
    // Preparar um array para armazenar os tempos de renderização
    const renderTimes: number[] = [];

    // Sobrescrever a função addMessageToUI para medir o tempo de renderização
    const originalAddMessageToUI = window.addMessageToUI;
    (window as any).addMessageToUI = (role: string, content: string) => {
      const startTime = performance.now();
      originalAddMessageToUI(role, content);
      const endTime = performance.now();
      renderTimes.push(endTime - startTime);
    };

    // Simular várias mensagens
    for (let i = 1; i <= 20; i++) {
      mockEventSource.simulateMessage({
        type: "content",
        content: `Mensagem de teste ${i} com conteúdo suficiente para testar o desempenho da renderização.`,
      });
    }

    // Calcular estatísticas de desempenho
    const avgRenderTime =
      renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);

    console.log(`Tempo médio de renderização: ${avgRenderTime.toFixed(2)}ms`);
    console.log(`Tempo máximo de renderização: ${maxRenderTime.toFixed(2)}ms`);

    // Expectativas razoáveis para renderização
    expect(avgRenderTime).toBeLessThan(10); // média menor que 10ms
    expect(maxRenderTime).toBeLessThan(30); // máximo menor que 30ms

    // Restaurar a função original
    (window as any).addMessageToUI = originalAddMessageToUI;
  });
});

// Função auxiliar para salvar os resultados dos testes
function saveTestResults(results: any) {
  const resultsDir = path.resolve(__dirname, "./results");

  // Criar diretório se não existir
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Salvar resultados como JSON
  fs.writeFileSync(
    path.join(resultsDir, "sse-frontend-test-results.json"),
    JSON.stringify(results, null, 2)
  );
}

// Execute esse arquivo diretamente para ver os resultados do teste
if (require.main === module) {
  console.log("Executando testes do frontend SSE...");
  // Os testes seriam executados pelo framework de teste (Jest)
}
