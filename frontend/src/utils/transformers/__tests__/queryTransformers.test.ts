import { 
  transformQueryStatus, 
  transformQueryObject, 
  transformQueryList,
  BackendQueryStatus,
  FrontendQueryStatus
} from '../queryTransformers';

describe('Query Transformers', () => {
  describe('transformQueryStatus', () => {
    it('deve manter o status in_progress inalterado', () => {
      const result: FrontendQueryStatus = transformQueryStatus('in_progress' as BackendQueryStatus);
      expect(result).toBe('in_progress');
    });

    it('deve converter o status processing para in_progress', () => {
      const result: FrontendQueryStatus = transformQueryStatus('processing' as BackendQueryStatus);
      expect(result).toBe('in_progress');
    });

    it('deve manter o status completed inalterado', () => {
      const result = transformQueryStatus('completed');
      expect(result).toBe('completed');
    });

    it('deve manter o status error inalterado', () => {
      const result = transformQueryStatus('error');
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
        status: 'processing',
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

    it('deve definir status como in_progress quando não fornecido', () => {
      const backendQuery = {
        id: '123',
        title: 'Teste',
        timestamp: '2023-02-25T12:00:00Z',
        question: 'Pergunta de teste?'
      };

      const result = transformQueryObject(backendQuery);
      
      expect(result.status).toBe('in_progress');
    });
  });

  describe('transformQueryList', () => {
    it('deve transformar uma lista de consultas corretamente', () => {
      const backendQueries = [
        {
          id: '123',
          title: 'Teste 1',
          timestamp: '2023-02-25T12:00:00Z',
          status: 'processing',
          question: 'Pergunta de teste 1?'
        },
        {
          id: '456',
          title: 'Teste 2',
          timestamp: '2023-02-25T13:00:00Z',
          status: 'completed',
          question: 'Pergunta de teste 2?'
        }
      ];

      const result = transformQueryList(backendQueries);
      
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('in_progress');
      expect(result[1].status).toBe('completed');
    });

    it('deve retornar um array vazio quando a entrada é um array vazio', () => {
      const result = transformQueryList([]);
      expect(result).toEqual([]);
    });
  });
}); 