import { EventEmitter } from 'events';

import { TokenUsage } from '../types';

/**
 * Rastreador de uso de tokens.
 */
export class TokenTracker extends EventEmitter {
  /**
   * Uso de tokens.
   */
  private usages: TokenUsage[] = [];
  private budget?: number;

  /**
   * Construtor.
   * @param budget Orçamento de tokens.
   */
  constructor(budget?: number) {
    // Chama o construtor da classe pai
    super();
    // Define o orçamento
    this.budget = budget;
  }

  /**
   * Rastreia o uso de tokens.
   * @param tool Ferramenta que consumiu os tokens.
   * @param tokens Número de tokens consumidos.
   */
  trackUsage(tool: string, tokens: number) {
    // Obtém o total de tokens consumidos
    const currentTotal = this.getTotalUsage();
    // Se o orçamento for excedido, exibe um erro
    if (this.budget && currentTotal + tokens > this.budget) {
      // Exibe um erro
      console.error(`Token budget exceeded: ${currentTotal + tokens} > ${this.budget}`);
    }
    // Só rastreia o uso se estiver dentro do orçamento
    if (!this.budget || currentTotal + tokens <= this.budget) {
      // Adiciona o uso de tokens
      this.usages.push({ tool, tokens });
      // Emite o evento de uso de tokens
      this.emit('usage', { tool, tokens });
    }
  }

  /**
   * Obtém o total de tokens consumidos.
   * @returns Total de tokens consumidos.
   */
  getTotalUsage(): number {
    // Retorna o total de tokens consumidos
    return this.usages.reduce((sum, usage) => sum + usage.tokens, 0);
  }

  /**
   * Obtém o total de tokens consumidos.
   * @returns Total de tokens consumidos.
   */
  getUsageBreakdown(): Record<string, number> {
    // Retorna o total de tokens consumidos
    return this.usages.reduce((acc, { tool, tokens }) => {
      // Adiciona o uso de tokens
      acc[tool] = (acc[tool] || 0) + tokens;
      // Retorna o total de tokens consumidos
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Imprime um resumo do uso de tokens.
   */
  printSummary() {
    // Obtém o total de tokens consumidos
    const breakdown = this.getUsageBreakdown();
    // Imprime o resumo
    console.log('Token Usage Summary:', {
      // Total de tokens consumidos
      total: this.getTotalUsage(),
      // Breakdown do uso de tokens
      breakdown
    });
  }

  /**
   * Reseta o rastreador de uso de tokens.
   */
  reset() {
    // Reseta o uso de tokens
    this.usages = [];
  }
}
