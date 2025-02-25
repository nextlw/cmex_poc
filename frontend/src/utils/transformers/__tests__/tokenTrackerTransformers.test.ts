import {
  transformTokenTracker,
  TokenUsage,
  FrontendTokenTracker,
  tokenUsageSchema,
  frontendTokenTrackerSchema
} from '../tokenTrackerTransformers';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TokenTracker Transformers', () => {
  describe('transformTokenTracker', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('deve transformar um tracker de tokens completo corretamente', () => {
      // Simula a classe TokenTracker do backend
      const backendTokenTracker = {
        usages: [
          { tool: 'search', tokens: 100 } as TokenUsage,
          { tool: 'reasoning', tokens: 200 } as TokenUsage
        ],
        getTotalUsage: vi.fn().mockReturnValue(300),
        budget: 1000
      };

      const result: FrontendTokenTracker = transformTokenTracker(backendTokenTracker)!;
      
      // Validar o resultado usando os schemas
      expect(result.usage.every(usage => tokenUsageSchema.safeParse(usage).success)).toBe(true);
      expect(frontendTokenTrackerSchema.safeParse(result).success).toBe(true);
      
      expect(result).toEqual({
        usage: [
          { tool: 'search', tokens: 100 },
          { tool: 'reasoning', tokens: 200 }
        ],
        totalTokens: 300
      });
      
      // Propriedade budget não deve ser exposta
      expect(result).not.toHaveProperty('budget');
      
      // O método getTotalUsage deve ter sido chamado
      expect(backendTokenTracker.getTotalUsage).toHaveBeenCalled();
    });

    it('deve calcular o total de tokens quando getTotalUsage não está disponível', () => {
      const backendTokenTracker = {
        usages: [
          { tool: 'search', tokens: 100 },
          { tool: 'reasoning', tokens: 200 }
        ]
        // Sem o método getTotalUsage
      };

      const result = transformTokenTracker(backendTokenTracker);
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.totalTokens).toBe(300); // Soma de 100 + 200
      }
    });

    it('deve lidar com propriedades faltantes', () => {
      const backendTokenTracker = {
        // usages está ausente
      };

      const result = transformTokenTracker(backendTokenTracker);
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.usage).toEqual([]);
        expect(result.totalTokens).toBe(0);
      }
    });

    it('deve lidar com valores inválidos nas propriedades', () => {
      const backendTokenTracker = {
        usages: [
          { tool: 'search' }, // tokens ausente
          { tokens: 200 }     // tool ausente
        ]
      };

      const result = transformTokenTracker(backendTokenTracker);
      
      expect(result).not.toBeNull();
      if (result) {
        expect(result.usage[0].tool).toBe('search');
        expect(result.usage[0].tokens).toBe(0); // Default para 0
        expect(result.usage[1].tool).toBe('unknown'); // Default para 'unknown'
      }
    });

    it('deve retornar null para input null', () => {
      const result = transformTokenTracker(null);
      expect(result).toBeNull();
    });

    it('deve transformar um TokenTracker válido corretamente', () => {
      const backendTracker = {
        usages: [
          { tool: 'search', tokens: 50 },
          { tool: 'answer', tokens: 100 }
        ]
      };

      const result = transformTokenTracker(backendTracker);
      
      // Garantir que result não é nulo antes de acessar suas propriedades
      expect(result).not.toBeNull();
      if (result) {
        expect(result.usage).toHaveLength(2);
        expect(result.usage[0]).toEqual({ tokens: 50, tool: 'search' });
        expect(result.usage[1]).toEqual({ tokens: 100, tool: 'answer' });
        expect(result.totalTokens).toBe(150);
      }
    });

    it('deve lidar com um array de usages vazio', () => {
      const backendTracker = {
        usages: []
      };

      const result = transformTokenTracker(backendTracker);
      
      // Garantir que result não é nulo antes de acessar suas propriedades
      expect(result).not.toBeNull();
      if (result) {
        expect(result.usage).toHaveLength(0);
        expect(result.totalTokens).toBe(0);
      }
    });

    it('deve retornar um objeto válido mesmo com erro de validação', () => {
      // Forçar um erro de validação com um tipo inválido
      const invalidTracker = {
        usages: [
          { tool: 'search', tokens: 'invalid' } // tokens deveria ser número
        ]
      };

      // @ts-ignore - testando com valor inválido propositalmente
      const result = transformTokenTracker(invalidTracker);
      
      // Verifica se o objeto retornado é válido
      expect(result).toBeTruthy();
      if (result) {
        expect(result.totalTokens).toBe(0);
        // Neste caso, a função retorna um array com um item default em vez de um array vazio
        // o que ainda é um comportamento válido para fallback
      }
    });
  });
}); 