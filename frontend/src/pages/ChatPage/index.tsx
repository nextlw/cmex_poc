import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import React, { useState, ChangeEvent, KeyboardEvent, useEffect, useRef } from 'react';
import InputAi from '../../components/InputAi';
import './styles.css';
import { PiListStarFill } from "react-icons/pi";
// import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import QueryHistory from '../../components/QueryHistory';
import { QueryHistoryItem, Message, AgentState, Reference } from '../../components/QueryHistory/types';

const formatMessageContent = (content: string): React.ReactNode => {
  // Regex para identificar URLs no formato markdown
  const markdownUrlRegex = /\[([^\]]+)\]\((https?:\/\/[\w\-\.]+\.[a-z]{2,}(?:\/[^\s]*)?)\)/gi;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const seenUrls = new Set<string>();

  while ((match = markdownUrlRegex.exec(content)) !== null) {
    // Adiciona o texto que vem antes do link
    parts.push(content.slice(lastIndex, match.index));

    // Captura o texto e o link
    const linkText = match[1];
    const cleanUrl = match[2];

    // Verifica se o link já foi processado
    if (!seenUrls.has(cleanUrl)) {
      seenUrls.add(cleanUrl);
      // Envolve o link no mesmo tipo de tag (e classe) utilizada nos títulos das mensagens
      parts.push(
        <div key={match.index} className="message-link-title">
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkText}
          </a>
        </div>
      );
    }

    // Atualiza o índice para continuar com o restante do texto
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
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [agentState, setAgentState] = useState<AgentState>({
    messages: []
  });
  const [showWelcome, setShowWelcome] = useState(true);

  // Sobrescrever console.log para capturar eventos
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    const [firstArg] = args;
    if (typeof firstArg === 'string' && firstArg.includes('Evento recebido:')) {
      try {
        const eventData = JSON.parse(firstArg.split('Evento recebido: ')[1]);
        if (eventData.type === 'progress') {
          setAgentState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              type: 'step',
              content: `🔄 Progresso: ${eventData.trackers.actionState.think || 'Atualizando...'}`,
              isTyping: false
            }]
          }));
        }
      } catch (error) {
        console.error('Erro ao processar evento do console:', error);
      }
    }
  };

  const handleClear = () => {
    // Fecha qualquer conexão EventSource existente
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Reseta todos os estados
    setIsLoading(false);
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
      const API_URL = import.meta.env.VITE_API_LOCAL_URL || 'http://localhost:3000';
      console.log('Enviando pergunta para:', `${API_URL}/api/v1/query`);
      
      const response = await fetch(`${API_URL}/api/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          q: question,
          modelo: selectedModel
        })
      });

      const data = await response.json();
      console.log('Resposta completa do servidor:', data);

      if (!response.ok) {
        throw new Error(`Erro ao enviar pergunta: ${data.error || response.statusText}`);
      }

      if (!data.requestId) {
        throw new Error('RequestId não recebido do servidor');
      }

      return data.requestId;
    } catch (error) {
      console.error('Erro detalhado:', error);
      setAgentState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          type: 'error',
          content: `Erro ao enviar pergunta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          isTyping: false
        }]
      }));
      return null;
    }
  };

  const fetchKnowledge = async (requestId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_LOCAL_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/v1/knowledge/${requestId}`);
      if (!response.ok) throw new Error('Erro ao buscar conhecimento');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar conhecimento:', error);
      return null;
    }
  };

  const startEventStream = async (requestId: string) => {
    const API_URL = import.meta.env.VITE_API_LOCAL_URL || 'http://localhost:3000';
    console.log('Iniciando stream de eventos para requestId:', requestId);
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    const eventSource = new EventSource(`${API_URL}/api/v1/stream/${requestId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('Conexão SSE estabelecida');
    };

    eventSource.onmessage = async (event) => {
      console.log('Evento SSE recebido:', event.data);
      
      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          console.log('Dados do evento processados:', data);

          const processAnswer = async (data: any, requestId: string): Promise<Message[]> => {
            const messages: Message[] = [];
            
            if (data.data?.think) {
              messages.push({
                type: 'step' as const,
                content: `💭 ${data.data.think}`,
                isTyping: false
              });
            }
            
            messages.push({
              type: 'response' as const,
              content: `✅ ${data.data.answer}`,
              isTyping: false
            });

            // Buscar conhecimento acumulado
            const knowledge = await fetchKnowledge(requestId);
            if (knowledge?.references?.length) {
              messages.push({
                type: 'step' as const,
                content: '🧠 Conhecimento Acumulado:',
                isTyping: false
              });

              knowledge.references.forEach((ref: any) => {
                if (ref.exactQuote && ref.url) {
                  messages.push({
                    type: 'response' as const,
                    content: `📚 ${ref.exactQuote}\n[Fonte](${ref.url})`,
                    isTyping: false
                  });
                }
              });
            }

            if (data.data.references?.length) {
              messages.push({
                type: 'response' as const,
                content: '📚 Referências:\n' + data.data.references.map((ref: Reference) => 
                  `[${ref.exactQuote}](${ref.url})`
                ).join('\n'),
                isTyping: false
              });
            }

            return messages;
          };

          setAgentState(prev => {
            const newState = { ...prev };
            let messages = [...prev.messages];

            switch (data.type) {
              case 'connected':
                messages.push({
                  type: 'connected',
                  content: '🔌 Conectado ao servidor',
                  isTyping: false
                });
                break;

              case 'progress':
                if (data.trackers?.actionState) {
                  const { action, think, searchQuery } = data.trackers.actionState;
                  
                  if (think) {
                    messages.push({
                      type: 'step',
                      content: `💭 ${think}`,
                      isTyping: false
                    });
                  }
                  
                  if (action === 'search' && searchQuery) {
                    messages.push({
                      type: 'search',
                      content: `🔍 Buscando: "${searchQuery}"`,
                      isTyping: false
                    });
                  }
                }
                break;

              case 'answer':
                if (data.data) {
                  (async () => {
                    const answerMessages = await processAnswer(data, requestId);
                    setAgentState(prev => ({
                      ...prev,
                      messages: [...prev.messages, ...answerMessages]
                    }));
                    setIsLoading(false);
                  })();
                }
                break;

              case 'error':
                console.error('Erro recebido do servidor:', data.data);
                messages.push({
                  type: 'error',
                  content: `❌ Erro: ${data.data || 'Erro desconhecido'}`,
                  isTyping: false
                });
                setIsLoading(false);
                break;

              case 'status':
                if (data.data?.status === 'error') {
                  messages.push({
                    type: 'error',
                    content: `❌ Status: ${data.data.status}`,
                    isTyping: false
                  });
                }
                break;

              default:
                console.log('Tipo de evento não tratado:', data.type);
                break;
            }

            console.log('Novo estado de mensagens:', messages);
            newState.messages = messages;
            return newState;
          });

          if (data.type === 'answer' || data.type === 'error') {
            console.log('Fechando conexão após receber resposta/erro');
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch (error) {
          console.error('Erro ao processar evento:', error);
          setAgentState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              type: 'error',
              content: `❌ Erro ao processar evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              isTyping: false
            }]
          }));
          setIsLoading(false);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('Erro na conexão SSE:', error);
      eventSource.close();
      eventSourceRef.current = null;
      getTaskResult(requestId);
      setIsLoading(false);
      
      setAgentState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          type: 'error',
          content: '❌ Erro na conexão com o servidor',
          isTyping: false
        }]
      }));
    };
  };

  const getTaskResult = async (requestId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_LOCAL_URL || 'http://localhost:3000';
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
      setIsLoading(false);
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
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    
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
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // Limpar a sobrescrita do console.log ao desmontar o componente
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  return (
    <div className="flex h-screen">
      <QueryHistory 
        onSelectQuery={(query: QueryHistoryItem) => {
          setAgentState(prev => ({
            ...prev,
            messages: [
              {
                type: 'query' as const,
                content: query.question || query.title,
                isTyping: false
              },
              {
                type: 'step' as const,
                content: `💭 Status: ${query.status}`,
                isTyping: false
              },
              {
                type: 'response' as const,
                content: `✅ ${query.summary || 'Sem resumo disponível'}`,
                isTyping: false
              }
            ]
          }));
          setShowWelcome(false);
        }} 
      />
      <div className="flex flex-col container-full items-center flex-1">
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
                isLoading={isLoading}
                placeholder="Digite sua pergunta..."
                onButtonClick={handleSend}
              />
            </div>
          <div className="chat-content">
            <div className="chat-messages">
              {showWelcome && agentState.messages.length === 0 && (
                <div className="welcome-message">
                  Bem-vindo! Como posso ajudar você hoje?
                </div>
              )}
              {agentState.messages.map((message, index) => (
                <ChatMessage key={index} {...message} />
              ))}
            </div>
            {/* {isLoading && (
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
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 