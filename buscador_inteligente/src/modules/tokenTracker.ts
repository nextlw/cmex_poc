import { EventEmitter } from "events";

interface TokenUsage {
  [modelName: string]: number;
}

export class TokenTracker extends EventEmitter {
  private usage: TokenUsage = {};

  constructor() {
    super();
  }

  addTokens(modelName: string, count: number): void {
    if (!this.usage[modelName]) {
      this.usage[modelName] = 0;
    }
    this.usage[modelName] += count;
    this.emit("tokensAdded", { modelName, count });
  }

  getUsageByModel(modelName?: string): TokenUsage {
    if (modelName) {
      return { [modelName]: this.usage[modelName] || 0 };
    }
    return { ...this.usage };
  }

  resetUsage(): void {
    this.usage = {};
    this.emit("usageReset");
  }
}
