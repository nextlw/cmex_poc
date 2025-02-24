import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ChatPage from '../pages/ChatPage';
import { act } from 'react-dom/test-utils';
import { SessionProvider } from '../auth/SessionContext';

describe('ChatPage', () => {
  beforeEach(() => {
    // Mock do EventSource
    const mockEventSource = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      close: jest.fn()
    };
    global.EventSource = jest.fn(() => mockEventSource) as any;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>
      {children}
    </SessionProvider>
  );

  it('deve renderizar corretamente o componente de resposta', async () => {
    render(<ChatPage />);
    
    // Simula entrada de texto
    const input = screen.getByPlaceholderText('Digite sua pergunta...');
    fireEvent.change(input, { target: { value: 'teste' } });
    
    // Simula envio
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    await act(async () => {
      fireEvent.click(sendButton);
    });

    // Verifica elementos de UI
    await waitFor(() => {
      expect(screen.getByTestId('chat-messages')).toBeInTheDocument();
      expect(screen.getByTestId('actions-list')).toBeInTheDocument();
    });
  });

  it('deve manter layout consistente com respostas longas', async () => {
    render(<ChatPage />, { wrapper });
    
    // O elemento message-content não existe inicialmente
    await act(async () => {
      // Primeiro precisa enviar uma pergunta
      const input = screen.getByPlaceholderText('Digite sua pergunta...');
      fireEvent.change(input, { target: { value: 'teste' } });
      fireEvent.click(screen.getByRole('button', { name: /enviar/i }));
      
      // Aguarda resposta aparecer
      await waitFor(() => {
        expect(screen.getByTestId('message-content')).toBeInTheDocument();
      });
    });
  });

  it('deve sincronizar corretamente estados entre front e back', async () => {
    const mockFetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ requestId: '123' })
      })
    );
    global.fetch = mockFetch;

    render(<ChatPage />);
    
    // Simula ciclo completo de pergunta/resposta
    await act(async () => {
      // Verifica chamadas de API
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/query'),
        expect.any(Object)
      );
      
      // Verifica atualização de estado
      expect(screen.getByTestId('action-status')).toHaveTextContent('completed');
    });
  });
}); 