import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatPage from "../../pages/ChatPage";
import { SSEClient } from "../../utils/sseClient";

// Mock para o Event
class Event {
  type: string;

  constructor(type: string) {
    this.type = type;
  }
}

// Mock para o EventSource
class MockEventSource {
  onopen: Function | null = null;
  onerror: Function | null = null;
  onmessage: Function | null = null;
  readyState: number = 0;
  url: string;
  listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  dispatchEvent(event: any) {
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach((cb) => cb(event));
    }
    return true;
  }

  close() {
    this.readyState = 2;
  }
}

// Mock para o fetch
global.fetch = jest.fn();

// Mock para UUID
jest.mock("uuid", () => ({
  v4: () => "12345678-test-uuid",
}));

// Mock para SSEClient
jest.mock("../../utils/sseClient", () => {
  return {
    SSEClient: jest.fn().mockImplementation((baseUrl = "/api/v1/stream") => {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        getStatus: jest
          .fn()
          .mockReturnValue({ status: "connected", attempts: 0 }),
        on: jest.fn((event, callback) => {
          // Armazenar o callback para podermos chamá-lo nos testes
          if (event === "message") {
            (jest.fn() as any).messageCallback = callback;
          }
          return jest.fn();
        }),
        off: jest.fn(),
        onStatusChange: jest.fn(),
      };
    }),
    ConnectionStatus: {
      CONNECTED: "connected",
      CONNECTING: "connecting",
      DISCONNECTED: "disconnected",
      ERROR: "error",
    },
  };
});

// Substituir o EventSource global pelo nosso mock
(global as any).EventSource = MockEventSource;

describe("Chat Flow E2E Tests", () => {
  let mockSseClient: any;

  beforeEach(() => {
    // Limpar todos os mocks
    jest.clearAllMocks();

    // Mock das respostas da API
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, options: any) => {
        if (url.includes("/api/v1/chat")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                requestId: "12345678-test-uuid",
                message: "Consulta recebida com sucesso",
              }),
          });
        }

        return Promise.reject(new Error("URL não suportada nos testes"));
      }
    );

    // Obter a instância mockada do SSEClient
    mockSseClient = new SSEClient("/api/v1/stream");
  });

  test("deve enviar mensagem e exibir a resposta através do fluxo SSE", async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);

    // 1. Enviar uma mensagem
    const inputField = screen.getByPlaceholderText(
      "Digite sua consulta sobre classificação fiscal..."
    );
    const sendButton = screen.getByRole("button", { name: /enviar/i });

    fireEvent.change(inputField, {
      target: { value: "Como classificar uma bicicleta elétrica?" },
    });
    fireEvent.click(sendButton);

    // 2. Verificar se a mensagem foi enviada para a API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/chat"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining(
            "Como classificar uma bicicleta elétrica?"
          ),
        })
      );
    });

    // 3. Verificar se o SSEClient foi conectado com o requestId
    await waitFor(() => {
      expect(mockSseClient.connect).toHaveBeenCalledWith("12345678-test-uuid");
    });

    // 4. Simular recebimento de mensagens via SSE
    const messageCallback = (jest.fn() as any).messageCallback;

    if (!messageCallback) {
      throw new Error("MessageCallback não foi registrado corretamente");
    }

    // Simular recepção de evento de progresso da pesquisa
    act(() => {
      messageCallback({
        type: "progress",
        step: 1,
        totalSteps: 3,
        steps: [
          { id: "step1", title: "Análise da consulta", status: "current" },
          { id: "step2", title: "Pesquisa de fontes", status: "pending" },
          { id: "step3", title: "Formulação da resposta", status: "pending" },
        ],
      });
    });

    // Verificar se o componente de progresso foi atualizado
    await waitFor(() => {
      expect(screen.getByText("Análise da consulta")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Pesquisa de fontes")).toBeInTheDocument();
    });

    // Simular recepção de evento de pesquisa
    act(() => {
      messageCallback({
        type: "search",
        content: "Pesquisando por bicicletas elétricas...",
        data: {
          searchQuery: "bicicleta elétrica classificação fiscal",
          urls: ["https://example.com/1", "https://example.com/2"],
        },
      });
    });

    // Verificar se a mensagem de pesquisa foi renderizada
    await waitFor(() => {
      expect(
        screen.getByText("Pesquisando por bicicletas elétricas...")
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText("bicicleta elétrica classificação fiscal")
      ).toBeInTheDocument();
    });

    // Simular recepção de evento de pensamento
    act(() => {
      messageCallback({
        type: "thinking",
        content:
          "Analisando as fontes encontradas sobre bicicletas elétricas...",
      });
    });

    // Simular recepção da resposta final
    act(() => {
      messageCallback({
        type: "response",
        content: "Bicicletas elétricas são classificadas no NCM 8711.60.00",
        data: {
          think:
            "A classificação de bicicletas elétricas segue a posição 87.11, que inclui motocicletas e ciclos com motor auxiliar.",
          references: [
            {
              url: "https://example.com/1",
              title: "Classificação de Veículos Elétricos",
              exactQuote:
                "Bicicletas elétricas classificam-se no código 8711.60.00 da NCM",
              content:
                "O documento indica que bicicletas com motor elétrico auxiliar são classificadas na posição 8711.60.00.",
            },
          ],
        },
        modelName: "claude-3-opus-20240229",
      });
    });

    // Verificar se a resposta foi renderizada corretamente
    await waitFor(() => {
      expect(
        screen.getByText(
          "Bicicletas elétricas são classificadas no NCM 8711.60.00"
        )
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("model-indicator")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("references-section")).toBeInTheDocument();
    });
  });

  test("deve mostrar erro quando a API retorna falha", async () => {
    // Mock de erro na API
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () =>
          Promise.resolve({
            error: "Erro interno do servidor",
          }),
      });
    });

    // Renderizar o componente ChatPage
    render(<ChatPage />);

    // Enviar uma mensagem
    const inputField = screen.getByPlaceholderText(
      "Digite sua consulta sobre classificação fiscal..."
    );
    const sendButton = screen.getByRole("button", { name: /enviar/i });

    fireEvent.change(inputField, {
      target: { value: "Como classificar uma bicicleta elétrica?" },
    });
    fireEvent.click(sendButton);

    // Verificar se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText(/erro.*servidor/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      const errorMessage = screen.getByRole("article");
      expect(errorMessage).toHaveClass("error");
    });
  });
});
