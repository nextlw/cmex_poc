import {
  transformStreamMessageType,
  transformStreamMessageData,
  transformStreamMessage,
  BackendStreamMessageType,
  FrontendStreamMessageType
} from '../streamMessageTransformers';

// Mock do transformTokenTracker para isolar os testes
import { vi } from 'vitest';

vi.mock('../tokenTrackerTransformers', () => ({
  transformTokenTracker: vi.fn(() => ({ 
    usage: [], 
    totalTokens: 0 
  }))
}));

describe('StreamMessage Transformers', () => {
  describe('transformStreamMessageType', () => {
    it('deve manter tipos básicos compatíveis inalterados', () => {
      const result: FrontendStreamMessageType = transformStreamMessageType('progress' as BackendStreamMessageType);
      expect(result).toBe('progress');
      
      const result2: FrontendStreamMessageType = transformStreamMessageType('answer' as BackendStreamMessageType);
      expect(result2).toBe('answer');
      
      const result3: FrontendStreamMessageType = transformStreamMessageType('error' as BackendStreamMessageType);
      expect(result3).toBe('error');
      
      const result4: FrontendStreamMessageType = transformStreamMessageType('connected' as BackendStreamMessageType);
      expect(result4).toBe('connected');
    });

    it('deve transformar tipos específicos do backend para progress', () => {
      const result: FrontendStreamMessageType = transformStreamMessageType('search' as BackendStreamMessageType);
      expect(result).toBe('progress');
      
      const result2: FrontendStreamMessageType = transformStreamMessageType('reflect' as BackendStreamMessageType);
      expect(result2).toBe('progress');
      
      const result3: FrontendStreamMessageType = transformStreamMessageType('visit' as BackendStreamMessageType);
      expect(result3).toBe('progress');
      
      const result4: FrontendStreamMessageType = transformStreamMessageType('log' as BackendStreamMessageType);
      expect(result4).toBe('progress');
    });
  });

  describe('transformStreamMessageData', () => {
    it('deve transformar dados para tipo error', () => {
      const result = transformStreamMessageData('error', 'Erro de teste');
      expect(result).toEqual({ error: 'Erro de teste' });
    });

    it('deve transformar dados para tipo answer', () => {
      const result = transformStreamMessageData('answer', 'Resposta de teste');
      expect(result).toEqual({ 
        action: 'answer',
        answer: 'Resposta de teste' 
      });
    });

    it('deve transformar dados estruturados para tipo answer', () => {
      const result = transformStreamMessageData('answer', { 
        answer: 'Resposta estruturada' 
      });
      expect(result).toEqual({ 
        action: 'answer',
        answer: 'Resposta estruturada' 
      });
    });

    it('deve transformar dados para tipo search', () => {
      const result = transformStreamMessageData('search', 'termo de busca');
      expect(result).toEqual({ 
        action: 'search',
        searchQuery: 'termo de busca' 
      });
    });

    it('deve transformar dados estruturados para tipo search', () => {
      const result = transformStreamMessageData('search', { 
        query: 'termo de busca estruturada' 
      });
      expect(result).toEqual({ 
        action: 'search',
        searchQuery: 'termo de busca estruturada' 
      });
    });

    it('deve transformar dados para tipo reflect', () => {
      const result = transformStreamMessageData('reflect', 'pensamento');
      expect(result).toEqual({ 
        action: 'reflect',
        think: 'pensamento' 
      });
    });
  });

  describe('transformStreamMessage', () => {
    it('deve transformar uma mensagem completa corretamente', () => {
      const backendMessage = {
        type: 'search',
        data: 'buscar produtos',
        trackers: {
          tokenTracker: {
            usages: [{ tool: 'search', tokens: 10 }]
          },
          actionTracker: {
            think: 'Pensando...',
            action: 'search',
            totalStep: 1,
            badAttempts: 0
          }
        }
      };

      const result = transformStreamMessage(backendMessage);
      
      expect(result).toEqual({
        type: 'progress', // search é mapeado para progress
        data: { 
          action: 'search',
          searchQuery: 'buscar produtos' 
        },
        trackers: {
          tokenTracker: { 
            usage: [], 
            totalTokens: 0 
          },
          actionTracker: {
            think: 'Pensando...',
            action: 'search',
            totalStep: 1,
            badAttempts: 0
          }
        }
      });
    });

    it('deve retornar null para mensagens nulas', () => {
      const result = transformStreamMessage(null);
      expect(result).toBeNull();
    });

    it('deve lidar com erros de transformação e retornar uma mensagem de erro', () => {
      // @ts-ignore
      const result = transformStreamMessage({ type: 'invalid_type' });
      
      expect(result.type).toBe('error');
      expect(result.data.error).toBe('Erro ao processar a mensagem do servidor');
    });
  });
}); 