require("dotenv").config();

// Configuração global de timeout
jest.setTimeout(30000);

// Limpeza após cada teste
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Função auxiliar para serialização segura de objetos
global.safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
      return value;
    }
    return value;
  });
};

// Funções auxiliares para mock de respostas de API
global.mockApiResponse = (data, status = 200) => {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config: {},
  };
};

global.mockApiError = (message, status = 500) => {
  return {
    message,
    status,
    statusText: "Error",
    headers: {},
    config: {},
  };
};

// Configuração do ambiente
process.env.NODE_ENV = "test";

// Suprime logs durante os testes
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
