import { EventEmitter } from "events";

import { TokenUsage } from "../types/globalTypes";
import { LanguageModelUsage } from "ai";

export class TokenTracker extends EventEmitter {
  private usages: TokenUsage[] = [];
  private budget?: number;
  // Para compatibilidade com o código antigo
  private modelUsage: Record<string, number> = {};

  constructor(budget?: number) {
    super();
    this.budget = budget;

    if ("asyncLocalContext" in process) {
      const asyncLocalContext = process.asyncLocalContext as any;
      this.on("usage", () => {
        if (asyncLocalContext.available()) {
          asyncLocalContext.ctx.chargeAmount = this.getTotalUsage().totalTokens;
        }
      });
    }
  }

  // Método principal da nova versão
  trackUsage(tool: string, usage: LanguageModelUsage | number) {
    // Compatibilidade: Se usage for um número, convertemos para objeto LanguageModelUsage
    let usageObj: LanguageModelUsage;
    
    if (typeof usage === 'number') {
      usageObj = { 
        promptTokens: Math.floor(usage / 2), 
        completionTokens: Math.ceil(usage / 2), 
        totalTokens: usage 
      };
    } else {
      usageObj = usage;
    }
    
    const u = { tool, usage: usageObj };
    this.usages.push(u as any);
    this.emit("usage", usageObj);
    
    // Atualiza modelUsage para compatibilidade com código antigo
    this.modelUsage[tool] = (this.modelUsage[tool] || 0) + usageObj.totalTokens;
  }

  // Métodos para compatibilidade com código antigo
  addTokens(modelName: string, count: number): void {
    this.trackUsage(modelName, count);
  }

  registerTokenUsage(modelName: string, promptTokens: number, completionTokens?: number): void {
    const totalTokens = promptTokens + (completionTokens || 0);
    this.trackUsage(modelName, {
      promptTokens: promptTokens,
      completionTokens: completionTokens || 0,
      totalTokens: totalTokens
    });
  }
  
  trackTokens(data: { tool: string, tokens: number }): void {
    this.trackUsage(data.tool, data.tokens);
  }

  getUsageByModel(modelName?: string): Record<string, number> {
    if (modelName) {
      return { [modelName]: this.modelUsage[modelName] || 0 };
    }
    return { ...this.modelUsage };
  }

  // Métodos da nova versão
  getTotalUsage(): LanguageModelUsage {
    return this.usages.reduce(
      (acc, { usage }) => {
        if (usage) {
          acc.promptTokens += usage.promptTokens || 0;
          acc.completionTokens += usage.completionTokens || 0;
          acc.totalTokens += usage.totalTokens || 0;
        }
        return acc;
      },
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    );
  }

  getTotalUsageSnakeCase(): {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } {
    return this.usages.reduce(
      (acc, { usage }) => {
        if (usage) {
          acc.prompt_tokens += usage.promptTokens || 0;
          acc.completion_tokens += usage.completionTokens || 0;
          acc.total_tokens += usage.totalTokens || 0;
        }
        return acc;
      },
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    );
  }

  getUsageBreakdown(): Record<string, number> {
    return this.usages.reduce((acc, { tool, usage }) => {
      if (usage) {
        acc[tool] = (acc[tool] || 0) + (usage.totalTokens || 0);
      }
      return acc;
    }, {} as Record<string, number>);
  }

  printSummary() {
    const breakdown = this.getUsageBreakdown();
    console.log("Token Usage Summary:", {
      budget: this.budget,
      total: this.getTotalUsage(),
      breakdown,
    });
  }

  reset() {
    this.usages = [];
    this.modelUsage = {};
  }
}

// import { EventEmitter } from "events";

// import { TokenUsage } from "../types";
// import { LanguageModelUsage } from "ai";

// export class TokenTracker extends EventEmitter {
//   private usages: TokenUsage[] = [];
//   private budget?: number;

//   constructor(budget?: number) {
//     super();
//     this.budget = budget;

//     if ("asyncLocalContext" in process) {
//       const asyncLocalContext = process.asyncLocalContext as any;
//       this.on("usage", () => {
//         if (asyncLocalContext.available()) {
//           asyncLocalContext.ctx.chargeAmount = this.getTotalUsage().totalTokens;
//         }
//       });
//     }
//   }

//   trackUsage(tool: string, usage: LanguageModelUsage) {
//     const u = { tool, usage };
//     this.usages.push(u);
//     this.emit("usage", usage);
//   }

// /**
//  * Interface para armazenar informações de uso de tokens por modelo
//  */
// interface ModelTokenUsage {
//   [modelName: string]: number;
// }

// /**
//  * Interface para rastrear o uso de tokens por ferramenta
//  */
// interface ToolTokenUsage {
//   tool: string;
//   tokens: number;
// }

// /**
//  * Classe para rastrear o uso de tokens pelos modelos de IA
//  */
// export class Token_Tracker extends EventEmitter {
//   private modelUsage: ModelTokenUsage = {};
//   private toolUsages: ToolTokenUsage[] = [];
//   private totalUsage = 0;
//   private budget: number;

//   /**
//    * Construtor da classe
//    * @param budget Orçamento opcional de tokens para este rastreador
//    */
//   constructor(budget = 1_000_000) {
//     super();
//     this.budget = budget;
//   }

//   /**
//    * Adiciona tokens ao contador total (método simplificado)
//    * @param modelName Nome do modelo
//    * @param count Número de tokens a adicionar
//    */
//   addTokens(modelName: string, count: number): void {
//     this.modelUsage[modelName] = (this.modelUsage[modelName] || 0) + count;
//     this.totalUsage += count;
//     this.emit("tokensAdded", { modelName, count });
//   }

//   /**
//    * Método de compatibilidade com código existente
//    * @param model Nome do modelo
//    * @param promptTokens Número de tokens de prompt
//    * @param completionTokens Número de tokens de completamento
//    */
//   registerTokenUsage(
//     model: string,
//     promptTokens: number,
//     completionTokens: number
//   ): void {
//     const totalTokens = promptTokens + completionTokens;
//     this.addTokens(model, totalTokens);

//     // Emite evento de uso no formato antigo para compatibilidade
//     this.emit("usage", {
//       model,
//       promptTokens,
//       completionTokens,
//       totalTokens,
//       timestamp: new Date(),
//     });
//   }

//   /**
//    * Rastreia o uso de tokens para uma ferramenta ou modelo específico
//    * @param source Nome da fonte (agente, ferramenta ou modelo)
//    * @param tokens Número de tokens utilizados
//    */
//   trackUsage(tool: string, usage: LanguageModelUsage) {
//     const u = { tool, usage };
//     this.usages.push(u);
//     this.emit("usage", usage);
//   }

//   getTotalUsage(): LanguageModelUsage {
//     return this.usages.reduce(
//       (acc, { usage }) => {
//         acc.promptTokens += usage.promptTokens;
//         acc.completionTokens += usage.completionTokens;
//         acc.totalTokens += usage.totalTokens;
//         return acc;
//       },
//       { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
//     );
//   }

//   /**
//    * Rastreia o uso de tokens (método alternativo)
//    * @param usage Dados de uso de tokens
//    */
//   trackTokens(usage: { tool: string; tokens: number }): void {
//     this.trackUsage(usage.tool, usage.tokens);
//   }

//   /**
//    * Imprime um resumo do uso de tokens no console
//    */
//   printSummary(): void {
//     console.log("=== Resumo de Uso de Tokens ===");

//     // Uso por modelo
//     const modelUsage = this.getUsageByModel();
//     Object.entries(modelUsage).forEach(([source, tokens]) => {
//       console.log(`Modelo ${source}: ${tokens} tokens`);
//     });

//     // Uso por ferramenta
//     this.toolUsages.forEach(({ tool, tokens }) => {
//       console.log(`Ferramenta ${tool}: ${tokens} tokens`);
//     });

//     console.log(`Total: ${this.getTotalUsage()} tokens`);

//     if (this.budget) {
//       const percentUsed = Math.round(
//         (this.getTotalUsage() / this.budget) * 100
//       );
//       console.log(
//         `Orçamento: ${this.getTotalUsage()}/${this.budget} (${percentUsed}%)`
//       );
//     }

//     console.log("===============================");
//   }

//   /**
//    * Obtém o total de tokens usados
//    * @returns Número total de tokens
//    */
//   getTotalUsage(): number {
//     return this.totalUsage;
//   }

//   /**
//    * Obtém o histórico de uso de tokens por modelo
//    * @param modelName Nome opcional do modelo para filtrar
//    * @returns Objeto com o histórico de uso
//    */
//   getUsageByModel(modelName?: string): ModelTokenUsage {
//     if (modelName) {
//       return { [modelName]: this.modelUsage[modelName] || 0 };
//     }
//     return { ...this.modelUsage };
//   }

//   /**
//    * Obtém o histórico de uso de tokens por ferramenta
//    * @returns Array com o histórico de uso por ferramenta
//    */
//   getUsageByTool(): ToolTokenUsage[] {
//     return [...this.toolUsages];
//   }

//   /**
//    * Limpa o histórico de uso
//    */
//   resetUsage(): void {
//     this.modelUsage = {};
//     this.toolUsages = [];
//     this.totalUsage = 0;
//     this.emit("usageReset");
//   }

//   /**
//    * Retorna o orçamento disponível de tokens
//    * @returns Orçamento disponível
//    */
//   getBudget(): number {
//     return this.budget;
//   }

//   /**
//    * Define um novo orçamento de tokens
//    * @param budget Novo orçamento
//    */
//   setBudget(budget: number): void {
//     this.budget = budget;
//   }
// }
