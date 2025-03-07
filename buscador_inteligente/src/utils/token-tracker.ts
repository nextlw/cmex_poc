import { EventEmitter } from "events";

/**
 * Interface para armazenar informações de uso de tokens por modelo
 */
interface TokenUsage {
  [modelName: string]: number;
}

/**
 * Classe para rastrear o uso de tokens pelos modelos de IA
 */
export class TokenTracker extends EventEmitter {
  private usage: TokenUsage = {};
  private tokenBudget?: number;

  /**
   * Construtor da classe
   * @param tokenBudget Orçamento opcional de tokens para este rastreador
   */
  constructor(tokenBudget?: number) {
    super();
    this.tokenBudget = tokenBudget;
  }

  /**
   * Adiciona tokens ao contador total (método simplificado)
   * @param modelName Nome do modelo
   * @param count Número de tokens a adicionar
   */
  addTokens(modelName: string, count: number): void {
    if (!this.usage[modelName]) {
      this.usage[modelName] = 0;
    }
    this.usage[modelName] += count;
    this.emit("tokensAdded", { modelName, count });
  }

  /**
   * Método de compatibilidade com código existente
   * @param model Nome do modelo
   * @param promptTokens Número de tokens de prompt
   * @param completionTokens Número de tokens de completamento
   */
  registerTokenUsage(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): void {
    const totalTokens = promptTokens + completionTokens;
    this.addTokens(model, totalTokens);

    // Emite evento de uso no formato antigo para compatibilidade
    this.emit("usage", {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp: new Date(),
    });
  }

  /**
   * Rastreia o uso de tokens para uma ferramenta ou modelo específico
   * @param source Nome da fonte (agente, ferramenta ou modelo)
   * @param tokens Número de tokens utilizados
   */
  trackUsage(source: string, tokens: number): void {
    this.addTokens(source, tokens);

    // Verifica se o orçamento foi excedido
    if (this.tokenBudget && this.getTotalUsage() > this.tokenBudget) {
      this.emit("budgetExceeded", {
        budget: this.tokenBudget,
        current: this.getTotalUsage(),
      });
    }
  }

  /**
   * Imprime um resumo do uso de tokens no console
   */
  printSummary(): void {
    console.log("=== Resumo de Uso de Tokens ===");
    const usage = this.getUsageByModel();

    Object.entries(usage).forEach(([source, tokens]) => {
      console.log(`${source}: ${tokens} tokens`);
    });

    console.log(`Total: ${this.getTotalUsage()} tokens`);

    if (this.tokenBudget) {
      const percentUsed = Math.round(
        (this.getTotalUsage() / this.tokenBudget) * 100
      );
      console.log(
        `Orçamento: ${this.getTotalUsage()}/${
          this.tokenBudget
        } (${percentUsed}%)`
      );
    }

    console.log("===============================");
  }

  /**
   * Obtém o total de tokens usados
   * @returns Número total de tokens
   */
  getTotalUsage(): number {
    return Object.values(this.usage).reduce((total, count) => total + count, 0);
  }

  /**
   * Obtém o histórico de uso de tokens
   * @returns Objeto com o histórico de uso
   */
  getUsageByModel(modelName?: string): TokenUsage {
    if (modelName) {
      return { [modelName]: this.usage[modelName] || 0 };
    }
    return { ...this.usage };
  }

  /**
   * Limpa o histórico de uso
   */
  resetUsage(): void {
    this.usage = {};
    this.emit("usageReset");
  }
}
