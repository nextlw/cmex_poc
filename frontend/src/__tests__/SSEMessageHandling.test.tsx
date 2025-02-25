import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { vi, describe, it, beforeEach, expect, afterEach } from 'vitest';
import ChatPage from '../pages/ChatPage';
import * as SessionContext from '../auth/SessionContext';
import { Session } from '@supabase/supabase-js';

// Função para criar um evento SSE mockado
const createSseEvent = (data: any) => {
  return {
    data: JSON.stringify(data)
  };
};

// Mock da sessão
const mockSession = {
  session: {
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'user'
    }
  } as unknown as Session,
  setSession: vi.fn()
};

describe('Tratamento de Mensagens SSE', () => {
  // Armazenar referência para EventSource original
  const originalEventSource = global.EventSource;
  // Criar mock para o EventSource
  let mockEventSource: any = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    onopen: null as any,
    onmessage: null as any,
    onerror: null as any
  };
  
  // Mockando fetch para simular as chamadas à API
  let mockFetch: any;
  
  beforeEach(() => {
    // Mock do useSession hook
    vi.spyOn(SessionContext, 'useSession').mockReturnValue(mockSession);
    
    // Limpar mocks entre testes
    vi.clearAllMocks();
    mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any
    };
    
    // Criar mock para o EventSource global
    global.EventSource = vi.fn(() => mockEventSource) as any;
    
    // Mock do fetch
    mockFetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/query')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ requestId: 'test-123' }))
        });
      }
      if (url.includes('/api/v1/queries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ queries: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
    global.fetch = mockFetch;
    
    // Substituir o console.log para evitar poluição no output de teste
    console.log = vi.fn();
  });
  
  afterEach(() => {
    // Restaurar o EventSource original após cada teste
    global.EventSource = originalEventSource;
    vi.restoreAllMocks();
  });
  
  it('deve processar mensagens de log corretamente', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento da mensagem
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento de log
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'log',
          data: 'Este é um log de teste'
        }));
      }
    });
    
    // Verificar se a mensagem foi exibida
    await waitFor(() => {
      expect(screen.getByText(/Este é um log de teste/i)).toBeInTheDocument();
    });
  });
  
  it('deve processar mensagens de progresso corretamente', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento da mensagem
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento de progresso
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'progress',
          trackers: {
            actionState: {
              think: 'Pensando sobre a resposta',
              searchQuery: 'consulta de teste',
              questionsToAnswer: ['Pergunta 1?', 'Pergunta 2?'],
              accumulatedReasoning: 'Raciocínio acumulado'
            }
          }
        }));
      }
    });
    
    // Verificar se as mensagens de progresso foram exibidas
    await waitFor(() => {
      expect(screen.getByText(/Pensando sobre a resposta/i)).toBeInTheDocument();
      expect(screen.getByText(/consulta de teste/i)).toBeInTheDocument();
      expect(screen.getByText(/Pergunta 1\?/i)).toBeInTheDocument();
    });
  });
  
  it('deve processar mensagens de resposta corretamente', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento da mensagem
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento de resposta
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'answer',
          data: {
            answer: 'Esta é a resposta final',
            think: 'Este é o raciocínio',
            references: [
              { exactQuote: 'Citação exata', url: 'https://exemplo.com' }
            ]
          }
        }));
      }
    });
    
    // Verificar se a resposta foi exibida
    await waitFor(() => {
      expect(screen.getByText(/Esta é a resposta final/i)).toBeInTheDocument();
    });
  });
  
  it('deve processar mensagens de erro corretamente', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento da mensagem
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento de erro
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'error',
          data: 'Erro de teste'
        }));
      }
    });
    
    // Verificar se a mensagem de erro foi exibida
    await waitFor(() => {
      expect(screen.getByText(/❌ Erro de teste/i)).toBeInTheDocument();
    });
  });
  
  it('deve fechar a conexão SSE após receber uma resposta final', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento da mensagem
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento de resposta final
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'answer',
          data: {
            answer: 'Resposta final'
          }
        }));
      }
    });
    
    // Verificar se o método close foi chamado
    await waitFor(() => {
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });
  
  it('deve tratar todos os tipos de mensagens corretamente em sequência', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento de múltiplas mensagens
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Sequência de diferentes tipos de eventos
      if (mockEventSource.onmessage) {
        // Conexão estabelecida
        mockEventSource.onmessage(createSseEvent({
          type: 'connected',
          data: 'Conexão estabelecida'
        }));
        
        // Progresso
        mockEventSource.onmessage(createSseEvent({
          type: 'progress',
          trackers: {
            actionState: {
              think: 'Analisando a pergunta',
              searchQuery: null,
              questionsToAnswer: [],
              accumulatedReasoning: ''
            }
          }
        }));
        
        // Log
        mockEventSource.onmessage(createSseEvent({
          type: 'log',
          data: 'Processando dados'
        }));
        
        // Resposta final
        mockEventSource.onmessage(createSseEvent({
          type: 'answer',
          data: {
            answer: 'Resposta completa',
            references: []
          }
        }));
      }
    });
    
    // Verificar se todas as mensagens foram tratadas
    await waitFor(() => {
      expect(screen.getByText(/Analisando a pergunta/i)).toBeInTheDocument();
      expect(screen.getByText(/Processando dados/i)).toBeInTheDocument();
      expect(screen.getByText(/Resposta completa/i)).toBeInTheDocument();
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  it('deve processar mensagens de outros tipos (search, visit, reflect) corretamente', async () => {
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento de mensagens de diferentes tipos
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento de busca (search)
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'search',
          data: {
            action: 'search',
            think: 'Pesquisando informações relevantes',
            searchQuery: 'consulta teste',
            searchResults: [
              { title: 'Resultado 1', url: 'https://exemplo1.com', description: 'Descrição 1' }
            ]
          },
          outputs: [{ tipo: 'informação adicional', conteúdo: 'teste' }],
          trackers: {
            actionState: {
              action: 'search',
              think: 'Pensando sobre a busca'
            }
          }
        }));
      }
    });
    
    // Verificar se a mensagem de busca foi exibida
    await waitFor(() => {
      expect(screen.getByText(/Pesquisando informações relevantes/i)).toBeInTheDocument();
    });
  });

  it('deve exibir informações de depuração quando disponíveis', async () => {
    // Salvar o NODE_ENV original
    const originalNodeEnv = process.env.NODE_ENV;
    // Definir NODE_ENV como 'development' para o teste
    process.env.NODE_ENV = 'development';
    
    // Renderizar o componente ChatPage
    render(<ChatPage />);
    
    // Simular a criação do EventSource e processamento da mensagem
    await act(async () => {
      // Simular a abertura da conexão
      if (mockEventSource.onopen) {
        mockEventSource.onopen();
      }
      
      // Simular um evento com dados de trackers para debugging
      if (mockEventSource.onmessage) {
        mockEventSource.onmessage(createSseEvent({
          type: 'answer',
          data: {
            answer: 'Resposta de teste com informações de debug',
            think: 'Raciocínio para depuração'
          },
          trackers: {
            tokenUsage: 1234,
            actionState: {
              totalStep: 5,
              badAttempts: 0
            }
          }
        }));
      }
    });
    
    // Verificar se a mensagem com as informações de depuração está presente
    await waitFor(() => {
      expect(screen.getByText(/Resposta de teste com informações de debug/i)).toBeInTheDocument();
      expect(screen.getByText(/Mostrar informações de depuração/i)).toBeInTheDocument();
    });
    
    // Restaurar o NODE_ENV original
    process.env.NODE_ENV = originalNodeEnv;
  });
}); 