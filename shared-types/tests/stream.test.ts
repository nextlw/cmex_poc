import { expect, describe, it } from 'vitest';
import { 
  transformStreamMessageType,
  transformStreamMessage,
  BackendStreamMessageType,
  FrontendStreamMessageType
} from '../src/stream';

describe('Stream Transformers', () => {
  describe('transformStreamMessageType', () => {
    it('deve manter os tipos de mensagem válidos inalterados', () => {
      const validTypes: BackendStreamMessageType[] = ['progress', 'answer', 'error', 'thinking'];
      
      validTypes.forEach(type => {
        const result = transformStreamMessageType(type);
        expect(result).toBe(type);
      });
    });

    it('deve lidar com tipos de mensagem inválidos', () => {
      // @ts-ignore - testando com valor inválido propositalmente
      const result = transformStreamMessageType('invalid_type');
      
      // Deve retornar um tipo válido como fallback
      expect(['progress', 'answer', 'error', 'thinking']).toContain(result);
    });
  });

  describe('transformStreamMessage', () => {
    it('deve transformar uma mensagem de stream corretamente', () => {
      const backendMessage = {
        id: '123',
        type: 'progress' as BackendStreamMessageType,
        content: 'Processando sua consulta...',
        timestamp: '2023-06-15T14:30:00Z',
        metadata: {
          queryId: 'q-456',
          progress: 0.5
        }
      };

      const result = transformStreamMessage(backendMessage);
      
      expect(result).toEqual({
        id: '123',
        type: 'progress',
        content: 'Processando sua consulta...',
        timestamp: '2023-06-15T14:30:00Z',
        metadata: {
          queryId: 'q-456',
          progress: 0.5
        }
      });
    });

    it('deve transformar o tipo da mensagem quando necessário', () => {
      const backendMessage = {
        id: '123',
        // simulando um tipo que precisaria ser transformado, se existisse
        // @ts-ignore - testando um cenário hipotético
        type: 'processing' as BackendStreamMessageType,
        content: 'Processando sua consulta...',
        timestamp: '2023-06-15T14:30:00Z'
      };

      const result = transformStreamMessage(backendMessage);
      
      // Assumindo que 'processing' seria transformado para 'progress'
      expect(['progress', 'answer', 'error', 'thinking']).toContain(result.type);
    });

    it('deve lidar com mensagens inválidas', () => {
      const invalidMessage = {
        // id está faltando
        type: 'invalid_type',
        // content está faltando
        timestamp: 'data inválida'
      };

      // @ts-ignore - testando com objeto inválido propositalmente
      const result = transformStreamMessage(invalidMessage);
      
      // Verificar se retornou valores razoáveis mesmo com entrada inválida
      expect(result.id).toBeTruthy(); // algum id foi gerado
      expect(['progress', 'answer', 'error', 'thinking']).toContain(result.type);
      expect(result.content).toBeTruthy(); // algum conteúdo fallback
      expect(typeof result.timestamp).toBe('string'); // algum timestamp válido foi gerado
    });

    it('deve preservar metadados válidos', () => {
      const backendMessage = {
        id: '123',
        type: 'progress' as BackendStreamMessageType,
        content: 'Processando sua consulta...',
        timestamp: '2023-06-15T14:30:00Z',
        metadata: {
          queryId: 'q-456',
          progress: 0.5,
          customField: 'valor personalizado'
        }
      };

      const result = transformStreamMessage(backendMessage);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.queryId).toBe('q-456');
      expect(result.metadata?.progress).toBe(0.5);
      expect(result.metadata?.customField).toBe('valor personalizado');
    });

    it('deve lidar com metadados inválidos', () => {
      const messageWithInvalidMetadata = {
        id: '123',
        type: 'progress' as BackendStreamMessageType,
        content: 'Processando sua consulta...',
        timestamp: '2023-06-15T14:30:00Z',
        metadata: null
      };

      // @ts-ignore - testando com metadados inválidos propositalmente
      const result = transformStreamMessage(messageWithInvalidMetadata);
      
      // Deve ter uma estrutura de metadados válida ou undefined
      if (result.metadata !== undefined) {
        expect(typeof result.metadata).toBe('object');
      }
    });
  });
}); 