import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import React, { useState, ChangeEvent, KeyboardEvent, useEffect, useRef } from 'react';
import InputAi from '../../components/InputAi';
import './styles.css';
import { PiListStarFill } from "react-icons/pi";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface Message {
  type: 'query' | 'step' | 'response' | 'error' | 'connected' | 'reflect' | 'log';
  content: string;
  isTyping?: boolean;
}

interface Reference {
  exactQuote: string;
  url: string;
}

interface AgentState {
  question?: string;
  messages: Message[];
  finalResult?: any;
}

const formatMessageContent = (content: string): React.ReactNode => {
  // Regex para identificar URLs nas referências
  const urlRegex = /Fonte: (https?:\/\/[^\s\n]+)/g;
  
  if (!content.includes('Fonte:')) {
    return content;
  }

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(content)) !== null) {
    // Adiciona o texto antes do link
    parts.push(content.slice(lastIndex, match.index + 7)); // +7 para incluir "Fonte: "
    
    // Adiciona o link
    parts.push(
      <a
        key={match.index}
        href={match[1]}
        target="_blank"
        rel="noopener noreferrer"
        className="message-link"
      >
        {match[1]}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Adiciona o restante do texto
  parts.push(content.slice(lastIndex));

  return <>{parts}</>;
};

const ChatMessage: React.FC<Message> = ({ type, content, isTyping }) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>('');

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(formatMessageContent(content));
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= content.length) {
        setDisplayedContent(formatMessageContent(content.slice(0, index)));
        index += 3;
      } else {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content, isTyping]);

  return (
    <div className={`chat-message ${type} ${isTyping ? 'typing' : ''}`}>
      {type === 'query' && <div className="query-label">Pergunta</div>}
      {type === 'step' && <div className="step-label">Pensando</div>}
      {type === 'response' && <div className="response-label">Resposta</div>}
      {type === 'error' && <div className="error-label">Erro</div>}
      {type === 'reflect' && <div className="reflect-label">Reflexão</div>}
      {type === 'connected' && <div className="step-label">Conectado</div>}
      {type === 'log' && <div className="log-label">Log do Servidor</div>}
      <div className="message-content">{displayedContent}</div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5-7b-instruct-1m");
  const [loading, setLoading] = useState(false);
  const [waitingResponse, setWaitingResponse] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [agentState, setAgentState] = useState<AgentState>({
    messages: []
  });
  const [showWelcome, setShowWelcome] = useState(true);

  const handleClear = () => {
    // Fecha qualquer conexão EventSource existente
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Reseta todos os estados
    setLoading(false);
    setWaitingResponse(false);
    setInputValue('');
    setAgentState({
      question: undefined,
      messages: [],
      finalResult: undefined
    });
    setShowWelcome(true);
  };

  const sendQuestion = async (question: string) => {
    try {
      setWaitingResponse(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          q: question,
          model: selectedModel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao enviar pergunta: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Resposta do servidor:', data);
      return data.requestId;
    } catch (error) {
      console.error('Erro detalhado:', error);
      setAgentState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          type: 'error',
          content: `Erro ao enviar pergunta: ${error}`,
          isTyping: true
        }]
      }));
      return null;
    }
  };

  const handleLoadingEnd = () => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const startEventStream = async (requestId: string) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const eventSource = new EventSource(`${API_URL}/api/v1/stream/${requestId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = async (event) => {
      try {
        if (!event.data) {
          console.warn('Dados vazios recebidos do evento');
          return;
        }

        const data = JSON.parse(event.data);
        console.log('Evento recebido:', data);

        if (!data) {
          console.warn('Dados inválidos após parse');
          return;
        }

        setWaitingResponse(false);

        setAgentState((prevState: AgentState) => {
          const newState = { ...prevState };
          let messages = [...prevState.messages];

          switch (data.type) {
            case 'connected':
              messages.push({
                type: 'step',
                content: '🔌 Conectado ao servidor',
                isTyping: true
              });
              break;

            case 'progress':
              if (data.data?.actionState?.action === 'search') {
                const newMessage = {
                  type: 'step' as const,
                  content: `🔍 Buscando: "${data.data.actionState.searchQuery}"`,
                  isTyping: true
                };
                
                if (data.data.actionState.think) {
                  messages.push({
                    type: 'step' as const,
                    content: `💭 Pensando: ${data.data.actionState.think}`,
                    isTyping: true
                  });
                }
                
                // Mantém mensagens anteriores sem animação
                messages = messages.map(msg => ({...msg, isTyping: false}));
                messages.push(newMessage);
              } else if (data.data?.action === 'answer') {
                if (data.data.think) {
                  messages.push({
                    type: 'step',
                    content: `💭 Pensamento: ${data.data.think}`,
                    isTyping: true
                  });
                }
                messages = [
                  ...messages.map(msg => ({...msg, isTyping: false})),
                  {
                    type: 'response',
                    content: `✅ ${data.data.answer}`,
                    isTyping: true
                  }
                ];
                if (data.data.references?.length) {
                  messages.push({
                    type: 'response',
                    content: '📚 Referências:\n' + data.data.references.map((ref: Reference) => 
                      `- ${ref.exactQuote}\n  Fonte: ${ref.url}`
                    ).join('\n'),
                    isTyping: true
                  });
                }
              } else if (data.data?.action === 'reflect') {
                if (data.data.think) {
                  messages.push({
                    type: 'step',
                    content: `💭 Reflexão: ${data.data.think}`,
                    isTyping: true
                  });
                }
                if (data.data.questionsToAnswer?.length) {
                  messages.push({
                    type: 'reflect',
                    content: '❓ Questões a serem respondidas:\n' + data.data.questionsToAnswer.map((q: string) => 
                      `- ${q}`
                    ).join('\n'),
                    isTyping: true
                  });
                }
              }
              break;

            case 'error':
              messages.push({
                type: 'error',
                content: `❌ Erro: ${data.data.error}`,
                isTyping: true
              });
              break;
          }

          newState.messages = messages;
          return newState;
        });

        if (data.type === 'answer') {
          eventSource.close();
          eventSourceRef.current = null;
          setLoading(false);
          handleLoadingEnd();
        }

      } catch (error) {
        console.error('Erro ao processar evento:', error, '\nDados recebidos:', event.data);
        setAgentState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            type: 'error',
            content: `Erro ao processar resposta: ${error}`,
            isTyping: true
          }]
        }));
        setLoading(false);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      getTaskResult(requestId);
      setLoading(false);
    };
  };

  const getTaskResult = async (requestId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/v1/task/${requestId}`);
      if (!response.ok) {
        throw new Error('Erro ao obter resultado');
      }

      const data = await response.json();
      setAgentState((prevState: AgentState) => {
        const newState = {
          ...prevState,
          finalResult: data
        };
        return newState;
      });
      setLoading(false);
      handleLoadingEnd();
    } catch (error) {
      console.error('Erro:', error);
      setAgentState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          type: 'error',
          content: `Erro ao obter resultado: ${error}`,
          isTyping: true
        }]
      }));
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    setLoading(true);
    setAgentState(prev => ({
      ...prev,
      question: inputValue,
      messages: [...prev.messages, {
        type: 'query',
        content: inputValue,
        isTyping: false
      }]
    }));
    
    const requestId = await sendQuestion(inputValue);
    if (requestId) {
      await startEventStream(requestId);
      setInputValue('');
      setShowWelcome(false);
    } else {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Conexão SSE para logs
    // const logEventSource = new EventSource(`${API_URL}/api/v1/logs/stream`);
    
    // Conexão WebSocket para atualizações do agente
    const ws = new WebSocket(`${API_URL.replace('http', 'ws')}/api/v1/stream`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Mantenha o tratamento existente das mensagens (linhas 182-298)
        setAgentState(prevState => {
          const newState = { ...prevState };
          let messages = [...prevState.messages];
          
          // Processamento das mensagens do WebSocket (mantenha a lógica existente)
          switch (data.type) {
            case 'progress':
            case 'connected':
            case 'error':
            case 'answer':
              // ... tratamento existente das mensagens ...
          }
          
          newState.messages = messages;
          return newState;
        });
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    return () => {
      // logEventSource.close();
      ws.close();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col container-full items-center">
      <Header
        selectedModel={selectedModel}
        onModelChange={(value: string | null) => value && setSelectedModel(value)}
        modeloSelecionado={selectedModel}
        aoMudarModelo={(value: string | null) => value && setSelectedModel(value)}
      />
      <div className="container max-w-7xl">
        <div className="page-header-container">
          <PageHeader
            icon={<PiListStarFill />}
            title="Chat com IA"
            icon_size="26px"
          />
          <button
            onClick={handleClear}
            style={{ 
              color: '#ff4444',
              marginLeft: '10px',
              padding: '5px 10px',
              border: '1px solid #ff4444',
              borderRadius: '4px'
            }}
          >
            Limpar Chat
          </button>
        </div>
        <div className="pb-8 shadow-lg shadow-inherit rounded-lg">
            <InputAi
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              isLoading={loading}
              placeholder="Digite sua pergunta..."
            />
          </div>
        <div className="chat-content">
          <div className="chat-messages">
            {showWelcome && agentState.messages.length === 0 && (
              <div className="welcome-message">
                Bem-vindo! Como posso ajudar você hoje?
                <div className="blinking-cursor"></div>
              </div>
            )}
            {agentState.messages.map((message, index) => (
              <ChatMessage key={index} {...message} />
            ))}
          </div>
          {waitingResponse ? (
            <div className="loading-overlay animate-fadeIn">
              <div className="loading-container">
                <DotLottieReact
                  src="https://lottie.host/28852c3d-fe13-41ae-81fa-fa3fd2261002/i5R35o9aOB.lottie"
                  loop
                  autoplay
                  speed={2}
                  className="animate-fadeIn"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 