// Adiciona as funções de teste do jest-dom
import "@testing-library/jest-dom";
import { expect } from "@jest/globals";

// Configurações para documentação de evidências
global.TEST_EVIDENCE = {
  logs: [],
  addLog: function (message) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      message: message,
    });
    console.log(`[EVIDENCE] ${message}`);
  },
};

// Mock para o console.log e console.error para não poluir a saída dos testes
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Desabilitar logs durante os testes, exceto se a variável de ambiente DEBUG estiver definida
if (!process.env.DEBUG) {
  console.log = (...args) => {
    // Mantém logs marcados como evidência
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("[EVIDENCE]")
    ) {
      originalConsoleLog(...args);
    }
  };
  console.error = (...args) => {
    // Mantém logs de erro marcados como evidência
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("[EVIDENCE]")
    ) {
      originalConsoleError(...args);
    }
  };
}

// Restaurar os métodos originais após os testes
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;

  // Salvar os logs de evidência, se houver algum
  if (global.TEST_EVIDENCE && global.TEST_EVIDENCE.logs.length > 0) {
    console.log(
      "[TEST EVIDENCE]",
      JSON.stringify(global.TEST_EVIDENCE.logs, null, 2)
    );
  }
});

// Mock para o localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(() => null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock para o matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: "mock data" }),
    text: () => Promise.resolve("mock text"),
  })
);

// Suporte a SSE
class MockEventSource {
  constructor() {
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.readyState = 0;
  }

  addEventListener(type, callback) {
    if (type === "open") this.onopen = callback;
    if (type === "message") this.onmessage = callback;
    if (type === "error") this.onerror = callback;
  }

  removeEventListener(type, callback) {
    if (type === "open" && this.onopen === callback) this.onopen = null;
    if (type === "message" && this.onmessage === callback)
      this.onmessage = null;
    if (type === "error" && this.onerror === callback) this.onerror = null;
  }

  close() {
    this.readyState = 2;
  }

  // Método de utilidade para testes
  mockOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen({});
  }

  mockMessage(data) {
    if (this.onmessage) {
      this.onmessage({
        data: typeof data === "string" ? data : JSON.stringify(data),
      });
    }
  }

  mockError() {
    if (this.onerror) this.onerror({});
  }
}

global.EventSource = MockEventSource;
