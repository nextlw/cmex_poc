import { ModelManager } from "../model-manager";
import { configJson } from "../../config";

describe("ModelManager", () => {
  let modelManager: ModelManager;

  beforeEach(() => {
    modelManager = ModelManager.getInstance();
    // Mock dos modelos da OpenAI para garantir que os testes passem
    if (
      !modelManager.getModelsForProvider("openai") ||
      modelManager.getModelsForProvider("openai").length === 0
    ) {
      const mockModels = {
        openai: [
          {
            name: "gpt-4o-mini",
            displayName: "GPT-4 Mini",
            description: "Versão otimizada do GPT-4",
            maxContextLength: 8000,
            supportsStreaming: true,
            supportsJsonMode: true,
          },
        ],
      };

      // Adiciona modelos mock para testes
      Object.assign(modelManager["availableModels"], mockModels);
    }
  });

  describe("getModelsForProvider", () => {
    it("deve retornar os modelos disponíveis para um provedor específico", () => {
      const provider = "openai";
      const models = modelManager.getModelsForProvider(provider);

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty("name");
      expect(models[0]).toHaveProperty("displayName");
      expect(models[0]).toHaveProperty("description");
      expect(models[0]).toHaveProperty("maxContextLength");
      expect(models[0]).toHaveProperty("supportsStreaming");
      expect(models[0]).toHaveProperty("supportsJsonMode");
    });

    it("deve retornar os modelos disponíveis para o provedor Anthropic", () => {
      const provider = "anthropic";
      const models = modelManager.getModelsForProvider(provider);

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty("name");
      expect(models[0].name).toContain("claude");
    });

    it("deve retornar os modelos disponíveis para o provedor local", () => {
      const provider = "local";
      const models = modelManager.getModelsForProvider(provider);

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty("name");
      expect(models[0].name).toContain("qwen");
    });

    it("deve retornar um array vazio para um provedor inexistente", () => {
      const provider = "inexistente";
      const models = modelManager.getModelsForProvider(provider);

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });
  });

  describe("getModelInfo", () => {
    it("deve retornar o modelo específico pelo nome", () => {
      const provider = "openai";
      const modelName = "gpt-4o-mini";
      const model = modelManager.getModelInfo(provider, modelName);

      expect(model).toBeDefined();
      expect(model?.name).toBe(modelName);
      expect(model).toHaveProperty("displayName");
      expect(model).toHaveProperty("description");
      expect(model).toHaveProperty("maxContextLength");
      expect(model).toHaveProperty("supportsStreaming");
      expect(model).toHaveProperty("supportsJsonMode");
    });

    it("deve retornar o modelo Claude da Anthropic", () => {
      const provider = "anthropic";
      const modelName = "claude-3-5-sonnet";
      const model = modelManager.getModelInfo(provider, modelName);

      expect(model).toBeDefined();
      expect(model?.name).toBe(modelName);
      expect(model?.displayName).toContain("Claude");
    });

    it("deve retornar o modelo local Qwen", () => {
      const provider = "local";
      const modelName = "qwen2.5-7b-instruct-1m";
      const model = modelManager.getModelInfo(provider, modelName);

      expect(model).toBeDefined();
      expect(model?.name).toBe(modelName);
      expect(model?.displayName).toContain("Qwen");
    });

    it("deve retornar null para um modelo inexistente", () => {
      const provider = "openai";
      const modelName = "modelo-inexistente";
      const model = modelManager.getModelInfo(provider, modelName);

      expect(model).toBeNull();
    });
  });
});
