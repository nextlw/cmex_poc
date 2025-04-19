import { AvailableModel, configJson } from "../config";

export class ModelManager {
  private static instance: ModelManager;
  private availableModels: Record<string, AvailableModel[]>;

  private constructor() {
    // Inicializa com os modelos disponíveis do configJson
    this.availableModels = {
      gemini: configJson.available_models.gemini || [],
      openai: configJson.available_models.openai || [],
      openrouter: configJson.available_models.openrouter || [],
      anthropic: configJson.available_models.anthropic || [],
      local: configJson.available_models.local || [],
    };
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  public getAvailableModels(): Record<string, AvailableModel[]> {
    return this.availableModels;
  }

  public getModelsForProvider(provider: string): AvailableModel[] {
    return this.availableModels[provider] || [];
  }

  public getModelInfo(
    provider: string,
    modelName: string
  ): AvailableModel | null {
    const models = this.getModelsForProvider(provider);
    return models.find((m) => m.name === modelName) || null;
  }
}
