import { expect, describe, it } from 'vitest';
import { 
  transformQueryStatus, 
  transformQueryObject, 
  transformQueryList,
  BackendQueryStatus,
  FrontendQueryStatus
} from '../src/query';

describe('Query Transformers', () => {
  describe('transformQueryStatus', () => {
    it('deve manter o status in_progress inalterado', () => {
      const result = transformQueryStatus('in_progress' as BackendQueryStatus);
      expect(result).toBe('in_progress');
    });

    it('deve converter o status processing para in_progress', () => {
      const result = transformQueryStatus('processing' as BackendQueryStatus);
      expect(result).toBe('in_progress');
    });

    it('deve manter o status completed inalterado', () => {
      const result = transformQueryStatus('completed' as BackendQueryStatus);
      expect(result).toBe('completed');
    });

    it('deve manter o status error inalterado', () => {
      const result = transformQueryStatus('error' as BackendQueryStatus);
      expect(result).toBe('error');
    });

    it('deve lidar com status inválidos e retornar in_progress como fallback', () => {
      // @ts-ignore - testando com valor inválido propositalmente
      const result = transformQueryStatus('invalid_status');
      expect(result).toBe('in_progress');
    });
  });

  describe('transformQueryObject', () => {
    it('deve transformar um objeto de consulta corretamente', () => {
      const backendQuery = {
        id: '123',
        title: 'Teste',
        timestamp: '2023-02-25T12:00:00Z',
        status: 'processing' as BackendQueryStatus,
        question: 'Pergunta de teste?'
      };

      const result = transformQueryObject(backendQuery);
      
      expect(result).toEqual({
        id: '123',
        title: 'Teste',
        timestamp: '2023-02-25T12:00:00Z',
        status: 'in_progress', // processing foi convertido para in_progress
        question: 'Pergunta de teste?'
      });
    });

    it('deve lidar com objetos inválidos e fornecer valores fallback seguros', () => {
      const invalidQuery = {
        id: '123',
        // title está faltando, que é obrigatório
        timestamp: 'data inválida',
        status: 'status_inválido',
        question: ''
      };

      // @ts-ignore - testando com objeto inválido propositalmente
      const result = transformQueryObject(invalidQuery);
      
      // Verificar se retornou valores razoáveis mesmo com entrada inválida
      expect(result.id).toBe('123');
      expect(result.title).toBeTruthy(); // algum fallback para título
      expect(result.status).toBe('in_progress'); // fallback para status
      expect(typeof result.timestamp).toBe('string'); // algum timestamp válido
    });
  });

  describe('transformQueryList', () => {
    it('deve transformar uma lista de consultas corretamente', () => {
      const backendQueries = [
        {
          id: '123',
          title: 'Teste 1',
          timestamp: '2023-02-25T12:00:00Z',
          status: 'processing' as BackendQueryStatus,
          question: 'Pergunta de teste 1?'
        },
        {
          id: '456',
          title: 'Teste 2',
          timestamp: '2023-02-25T13:00:00Z',
          status: 'completed' as BackendQueryStatus,
          question: 'Pergunta de teste 2?'
        }
      ];

      const result = transformQueryList(backendQueries);
      
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('in_progress');
      expect(result[1].status).toBe('completed');
    });

    it('deve lidar com lista vazia', () => {
      const result = transformQueryList([]);
      expect(result).toEqual([]);
    });

    it('deve lidar com itens inválidos na lista', () => {
      const mixedQueries = [
        {
          id: '123',
          title: 'Válida',
          timestamp: '2023-02-25T12:00:00Z',
          status: 'completed' as BackendQueryStatus,
          question: 'Pergunta válida'
        },
        {
          id: '456',
          // dados inválidos propositalmente
          status: 'invalid',
          question: ''
        }
      ];

      // @ts-ignore - testando com objetos inválidos propositalmente
      const result = transformQueryList(mixedQueries);
      
      // Verificar se a lista ainda tem 2 itens
      expect(result).toHaveLength(2);
      // O primeiro item deve estar correto
      expect(result[0].status).toBe('completed');
      // O segundo item deve ter fallbacks razoáveis
      expect(result[1].status).toBe('in_progress');
    });
  });
}); 