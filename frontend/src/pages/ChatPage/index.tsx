import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import React, {
  useState,
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useRef,
} from "react";
import InputAi from "../../components/InputAi";
import "./styles.css";
import { PiListStarFill } from "react-icons/pi";
// import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ReactMarkdown from 'react-markdown';
import QueryHistory from "../../components/QueryHistory";
import {
  QueryHistoryItem,
  Message,
  AgentState,
  Reference,
  QuerySession,
  QueryStep,
} from "../../components/QueryHistory/types";
import { FiClock, FiDatabase, FiCpu, FiSearch, FiBookOpen, FiActivity, FiCompass, FiCheckCircle } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type MessageType = "query" | "step" | "error" | "response" | "connected" | "reflect" | "search" | "log" | "visit" | "answer";

const ChatMessage: React.FC<Message> = ({ type, content, isTyping, data, step }) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>("");
  const reasoningSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reasoningSectionRef.current) {
      reasoningSectionRef.current.scrollTop = reasoningSectionRef.current.scrollHeight;
    }
  }, [displayedContent]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(
        type === "response" || type === "answer" ? (
          <>
            {data?.reasoning && (
              <div className="reasoning-section" ref={reasoningSectionRef}>
                <ReactMarkdown>{data.reasoning}</ReactMarkdown>
                {data.urls && data.urls.length > 0 && (
                  <div className="url-list">
                    <h4>URLs sendo processadas:</h4>
                    {data.urls.map((url: string, urlIndex: number) => (
                      <div key={urlIndex} className="url-item">
                        <div className="spinner" />
                        <span>{new URL(url).hostname}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={type === "answer" ? "final-answer" : ""}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </>
        ) : (
          content
        )
      );
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= content.length) {
        setDisplayedContent(
          type === "response" || type === "answer" ? (
            <>
              {data?.reasoning && (
                <div className="reasoning-section" ref={reasoningSectionRef}>
                  <ReactMarkdown>{data.reasoning.slice(0, index)}</ReactMarkdown>
                  {data.urls && data.urls.length > 0 && (
                    <div className="url-list">
                      <h4>URLs sendo processadas:</h4>
                      {data.urls.map((url: string, urlIndex: number) => (
                        <div key={urlIndex} className="url-item">
                          <div className="spinner" />
                          <span>{new URL(url).hostname}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className={type === "answer" ? "final-answer" : ""}>
                <ReactMarkdown>{content.slice(0, index)}</ReactMarkdown>
              </div>
            </>
          ) : (
            content.slice(0, index)
          )
        );
        index += 3;
      } else {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content, isTyping, type, data]);

  const messageClass = `chat-message ${type} ${isTyping ? "typing" : ""} ${type === "answer" ? "final-answer" : ""}`;

  return (
    <div className={messageClass} id={`step-${step}`}>
      {type === "query" && <div className="query-label">Pergunta</div>}
      {type === "step" && <div className="step-label">Pensando</div>}
      {type === "response" && <div className="response-label">Resposta</div>}
      {type === "answer" && <div className="response-label">Resposta Final</div>}
      {type === "error" && <div className="error-label">Erro</div>}
      {type === "reflect" && <div className="reflect-label">Reflexão</div>}
      {type === "connected" && <div className="step-label">Conectado</div>}
      {type === "log" && <div className="log-label">Log do Servidor</div>}
      <div className="message-content">{displayedContent}</div>
    </div>
  );
};

interface ActionItem {
  type: string;
  title: string;
  completed: boolean;
  active: boolean;
  status: 'waiting' | 'processing' | 'completed';
  urls?: string[];
}

const ActionIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'understand':
      return <FiActivity />;
    case 'explore':
      return <FiCompass />;
    case 'think':
      return <FiActivity />;
    case 'search':
      return <FiSearch />;
    case 'read':
      return <FiBookOpen />;
    case 'answer':
      return <FiCheckCircle />;
    default:
      return <FiSearch />;
  }
};

const ActionStatus: React.FC<{ status: ActionItem['status'] }> = ({ status }) => {
  if (status === 'completed') {
    return <span className="action-status completed">✓</span>;
  }
  if (status === 'processing') {
    return (
      <span className="action-status processing">
        <div className="spinner" />
      </span>
    );
  }
  return <span className="action-status waiting">○</span>;
};

const ThinkingAnimation: React.FC = () => (
  <div className="thinking-animation">
    <div className="thinking-dot" />
    <div className="thinking-dot" />
    <div className="thinking-dot" />
  </div>
);

const ProcessingContent: React.FC<{ step: string; query?: string }> = ({ step, query }) => {
  const [calculations] = useState(() => {
    const calcs = [
      "Analisando tokens de entrada...",
      "Processando embeddings...",
      "Calculando similaridade semântica...",
      "Otimizando parâmetros...",
      "Aplicando transformações...",
    ];
    return calcs.sort(() => Math.random() - 0.5).slice(0, 3);
  });

  if (step === 'understand') {
    return (
      <div className="calculation-container">
        <p>Entendendo o que o usuário quis dizer com:</p>
        <p className="processing-text">"{query}"</p>
        <ThinkingAnimation />
      </div>
    );
  }

  if (step === 'explore') {
    return (
      <div className="calculation-container">
        {calculations.map((calc, index) => (
          <div key={index} style={{ animationDelay: `${index * 0.2}s` }}>
            {calc}
            <ThinkingAnimation />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const DEFAULT_STEPS = [
  { type: 'understand', title: 'Entendendo...', status: 'waiting', completed: false, active: false },
  { type: 'explore', title: 'Explorando...', status: 'waiting', completed: false, active: false },
  { type: 'think', title: 'Pensando...', status: 'waiting', completed: false, active: false },
  { type: 'search', title: 'Pesquisando...', status: 'waiting', completed: false, active: false },
  { type: 'read', title: 'Lendo...', status: 'waiting', completed: false, active: false }
] as ActionItem[];

const ActionsList: React.FC<{
  actions: ActionItem[];
  onActionClick: (index: number) => void;
  startTime?: Date;
  urlCount?: number;
  query?: string;
}> = ({ actions, onActionClick, startTime, urlCount = 0, query }) => {
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const elapsedTime = startTime ? formatDistanceToNow(startTime, { locale: ptBR }) : '0';
  const hasMultipleSteps = actions.filter(a => a.status !== 'waiting').length > 1;
  const mainSteps = actions.filter(action => 
    ['understand', 'explore', 'think', 'search', 'read', 'answer'].includes(action.type)
  );

  const handleActionClick = (index: number) => {
    onActionClick(index);
    const stepElement = document.getElementById(`step-${index + 1}`);
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`actions-list ${hasMultipleSteps ? 'has-multiple-steps' : ''}`}>
      <div className="session-header">
        <div className="session-title">
          <FiSearch />
          DeepSearch
        </div>
        <div className="session-stats">
          <div className="stat-item">
            <FiClock />
            <span>{elapsedTime.replace(' segundos', '').replace(' minutos', 'm')}</span>
            <span className="stat-item-label">s</span>
          </div>
          <div className="stat-item">
            <FiDatabase />
            <span>{urlCount}</span>
            <span className="stat-item-label">fontes</span>
          </div>
          <div className="stat-item">
            <FiCpu />
            <span className="stat-item-label">proc</span>
          </div>
        </div>
      </div>
      
      {mainSteps.map((action, index) => (
        <div
          key={index}
          className={`action-item ${action.completed ? 'completed' : ''} ${action.active ? 'active' : ''} ${action.status !== 'waiting' ? 'show' : ''}`}
          onClick={() => handleActionClick(index)}
        >
          <div className="action-icon">
            <ActionIcon type={action.type} />
          </div>
          <div className="action-text">
            {action.title}
            {action.type === 'search' && action.urls && action.urls.length > 0 && (
              <div className="url-list">
                {action.urls.map((url, urlIndex) => (
                  <div key={urlIndex} className="url-item">
                    <div className="spinner" />
                    <span>{new URL(url).hostname}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <ActionStatus status={action.status} />
        </div>
      ))}
    </div>
  );
};

const ChatPage: React.FC = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5-7b-instruct-1m");
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [agentState, setAgentState] = useState<AgentState>({
    messages: [],
  });
  const [showWelcome, setShowWelcome] = useState(true);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activeActionIndex, setActiveActionIndex] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | undefined>();
  const [urlCount, setUrlCount] = useState(0);
  const [defaultSteps, setDefaultSteps] = useState<ActionItem[]>(DEFAULT_STEPS);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<QuerySession | null>(null);

  const actionTitles: Record<string, string> = {
    understand: 'Entendendo...',
    explore: 'Explorando...',
    think: 'Pensando...',
    search: 'Pesquisando...',
    read: 'Lendo...',
    visit: 'Lendo...',
    answer: 'Respondendo...'
  };

  // Sobrescrever console.log para capturar eventos
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    const [firstArg] = args;
    if (typeof firstArg === "string" && firstArg.includes("Evento recebido:")) {
      try {
        const eventData = JSON.parse(firstArg.split("Evento recebido: ")[1]);
        if (eventData.type === "progress") {
          setAgentState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                type: "step",
                content: `🔄 Progresso: ${
                  eventData.trackers.actionState.think || "Atualizando..."
                }`,
                isTyping: false,
              },
            ],
          }));
        }
      } catch (error) {
        console.error("Erro ao processar evento do console:", error);
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
    setInputValue("");
    setAgentState({
      question: undefined,
      messages: [],
      finalResult: undefined,
    });
    setShowWelcome(true);
    setActions([]);
    setActiveActionIndex(0);
  };

  const sendQuestion = async (question: string) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      console.log("Enviando pergunta para:", `${API_URL}/api/v1/query`);

      const response = await fetch(`${API_URL}/api/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          q: question,
          modelo: selectedModel,
        }),
      });

      // Se quiser ler o texto para logar:
      const text = await response.text();

      // Agora parse manualmente sem chamar response.json()
      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(`Erro ao enviar pergunta: ${data.error || response.statusText}`);
      }

      if (!data.requestId) {
        throw new Error("RequestId não recebido do servidor");
      }

      return data.requestId;
    } catch (error) {
      setAgentState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            type: "error",
            content: `Erro ao enviar pergunta: ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`,
            isTyping: false,
          },
        ],
      }));
      return null;
    }
  };

  const startEventStream = async (requestId: string) => {
    const API_URL = import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_URL}/api/v1/stream/${requestId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("Conexão SSE estabelecida");
    };

    eventSource.onmessage = async (event) => {
      console.log("Evento SSE recebido:", event.data);

      if (event.data) {
        try {
          const data = JSON.parse(event.data);
          console.log("Dados do evento processados:", data);

          setAgentState((prev) => {
            const newState = { ...prev };
            let messages = [...prev.messages];

            switch (data.type) {
              case "connected":
                messages.push({
                  type: "connected",
                  content: "🔌 Conectado ao servidor",
                  isTyping: false,
                });
                break;

              case "definitive":
                if (data.data?.answer) {
                  messages.push({
                    type: "response",
                    content: `💡 Resposta definitiva: ${data.data.answer}`,
                    isTyping: false,
                  });
                }
                break;

              case "progress":
                if (data.trackers?.actionState) {
                  const { action, think, searchQuery, questionsToAnswer, accumulatedReasoning, urlsToVisit } = data.trackers.actionState;
                  
                  // Atualiza os passos padrão baseado na ação atual
                  if (action === 'search') {
                    updateDefaultSteps('search', searchQuery);
                  } else if (action === 'visit' || action === 'read') {
                    updateDefaultSteps('read');
                  } else if (action === 'reflect' || action === 'think') {
                    updateDefaultSteps('think');
                  }

                  // Atualiza a lista de ações com título simplificado
                  const actionTitle = actionTitles[action] || 'Processando...';

                  setActions(prev => {
                    const newAction: ActionItem = {
                      type: action,
                      title: actionTitle,
                      completed: false,
                      active: true,
                      status: 'processing' as const,
                      urls: action === 'visit' ? urlsToVisit : undefined
                    };

                    const updatedActions = prev.map(a => ({
                      ...a,
                      active: false,
                      completed: true,
                      status: 'completed' as const
                    }));

                    return [...updatedActions, newAction];
                  });
                  setActiveActionIndex(prev => prev + 1);

                  setAgentState((prev) => {
                    const lastMessage = prev.messages[prev.messages.length - 1];
                    const currentReasoning = lastMessage?.data?.reasoning || '';
                    
                    // Se temos accumulatedReasoning, usamos ele diretamente
                    if (accumulatedReasoning) {
                      if (lastMessage && lastMessage.type === "response") {
                        return {
                          ...prev,
                          messages: [
                            ...prev.messages.slice(0, -1),
                            {
                              ...lastMessage,
                              data: {
                                ...lastMessage.data,
                                reasoning: accumulatedReasoning
                              },
                              isTyping: true
                            }
                          ]
                        };
                      }

                      return {
                        ...prev,
                        messages: [
                          ...prev.messages,
                          {
                            type: "response" as const,
                            content: "",
                            isTyping: true,
                            data: {
                              reasoning: accumulatedReasoning
                            }
                          }
                        ]
                      };
                    }

                    // Caso contrário, construímos o novo passo com título completo
                    let newStep = '';
                    if (think) {
                      newStep += `\n### ${actionTitle.replace('...', '')}: ${think.split('\n')[0]}\n`;
                      newStep += `**Pensamento**: ${think}\n`;
                    }

                    if (action === "search" && searchQuery) {
                      newStep += `\n🔍 **Busca**: "${searchQuery}"\n`;
                    }

                    if (action === "reflect" && questionsToAnswer?.length) {
                      newStep += `\n🤔 **Questões para investigar**:\n`;
                      questionsToAnswer.forEach((q: string) => {
                        newStep += `- ${q}\n`;
                      });
                    }

                    if (action === "visit" && urlsToVisit?.length) {
                      newStep += `\n🌐 **URLs para visitar**:\n`;
                      urlsToVisit.forEach((url: string) => {
                        newStep += `- [${url}](${url})\n`;
                      });
                    }

                    // Se já existe uma mensagem de resposta, atualiza o raciocínio
                    if (lastMessage && lastMessage.type === "response") {
                      return {
                        ...prev,
                        messages: [
                          ...prev.messages.slice(0, -1),
                          {
                            ...lastMessage,
                            data: {
                              ...lastMessage.data,
                              reasoning: currentReasoning + newStep
                            },
                            isTyping: true
                          }
                        ]
                      };
                    }

                    // Se não existe, cria uma nova mensagem
                    return {
                      ...prev,
                      messages: [
                        ...prev.messages,
                        {
                          type: "response" as const,
                          content: "",
                          isTyping: true,
                          data: {
                            reasoning: newStep
                          }
                        }
                      ]
                    };
                  });
                }
                break;

              case "answer":
                if (data.data) {
                  // Marca todas as ações como completas
                  setActions(prev => prev.map(a => ({
                    ...a,
                    active: false,
                    completed: true,
                    status: 'completed' as const
                  })));

                  // Adiciona a ação final
                  setActions(prev => [...prev, {
                    type: 'answer',
                    title: 'Resposta Final',
                    completed: true,
                    active: true,
                    status: 'completed' as const
                  }]);

                  setAgentState((prev) => {
                    const lastMessage = prev.messages[prev.messages.length - 1];
                    const currentReasoning = lastMessage?.data?.reasoning || '';
                    
                    return {
                      ...prev,
                      messages: [
                        ...prev.messages,
                        {
                          type: "response" as const,
                          content: data.data.answer,
                          isTyping: false,
                          data: {
                            reasoning: currentReasoning,
                            references: data.data.references,
                            think: data.data.think
                          }
                        }
                      ]
                    };
                  });
                  setIsLoading(false);
                }
                break;

              case "error":
                console.error("Erro recebido do servidor:", data.data);
                messages.push({
                  type: "error",
                  content: `❌ Erro: ${data.data || "Erro desconhecido"}`,
                  isTyping: false,
                });
                setIsLoading(false);
                break;

              case "status":
                if (data.data?.status === "error") {
                  messages.push({
                    type: "error",
                    content: `❌ Status: ${data.data.status}`,
                    isTyping: false,
                  });
                }
                break;

              case "visit":
                if (Array.isArray(data.data?.urlList)) {
                  setUrlCount(prev => prev + data.data.urlList.length);
                  setAgentState((prev) => {
                    const lastMessage = prev.messages[prev.messages.length - 1];
                    const currentReasoning = lastMessage?.data?.reasoning || '';
                    
                    // Se temos accumulatedReasoning no tracker, usamos ele
                    if (data.trackers?.actionState?.accumulatedReasoning) {
                      if (lastMessage && lastMessage.type === "response") {
                        return {
                          ...prev,
                          messages: [
                            ...prev.messages.slice(0, -1),
                            {
                              ...lastMessage,
                              data: {
                                ...lastMessage.data,
                                reasoning: data.trackers.actionState.accumulatedReasoning
                              },
                              isTyping: true
                            }
                          ]
                        };
                      }

                      return {
                        ...prev,
                        messages: [
                          ...prev.messages,
                          {
                            type: "response" as const,
                            content: "",
                            isTyping: true,
                            data: {
                              reasoning: data.trackers.actionState.accumulatedReasoning
                            }
                          }
                        ]
                      };
                    }

                    // Caso contrário, construímos o novo passo
                    const newStep = `\n### Passo ${prev.messages.length + 1}\n` +
                      `**Ação**: Visitar URLs\n` +
                      `**URLs selecionadas**:\n${data.data.urlList.map((url: string) => `- [${url}](${url})`).join('\n')}\n`;

                    if (lastMessage && lastMessage.type === "response") {
                      return {
                        ...prev,
                        messages: [
                          ...prev.messages.slice(0, -1),
                          {
                            ...lastMessage,
                            data: {
                              ...lastMessage.data,
                              reasoning: currentReasoning + newStep
                            },
                            isTyping: true
                          }
                        ]
                      };
                    }

                    return {
                      ...prev,
                      messages: [
                        ...prev.messages,
                        {
                          type: "response" as const,
                          content: "",
                          isTyping: true,
                          data: {
                            reasoning: newStep
                          }
                        }
                      ]
                    };
                  });
                }
                break;

              default:
                console.log("Tipo de evento não tratado:", data.type);
                break;
            }

            console.log("Novo estado de mensagens:", messages);
            newState.messages = messages;
            return newState;
          });

          if (data.type === "answer" || data.type === "error") {
            console.log("Fechando conexão após receber resposta/erro");
            eventSource.close();
            eventSourceRef.current = null;
          }
        } catch (error) {
          console.error("Erro ao processar evento:", error);
          setAgentState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                type: "error",
                content: `❌ Erro ao processar evento: ${
                  error instanceof Error ? error.message : "Erro desconhecido"
                }`,
                isTyping: false,
              },
            ],
          }));
          setIsLoading(false);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error("Erro na conexão SSE:", error);
      eventSource.close();
      eventSourceRef.current = null;
      getTaskResult(requestId);
      setIsLoading(false);

      setAgentState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            type: "error",
            content: "❌ Erro na conexão com o servidor",
            isTyping: false,
          },
        ],
      }));
    };
  };

  const getTaskResult = async (requestId: string) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/v1/task/${requestId}`);
      if (!response.ok) {
        throw new Error("Erro ao obter resultado");
      }

      const data = await response.json();
      setAgentState((prevState: AgentState) => {
        const newState = {
          ...prevState,
          finalResult: data,
        };
        return newState;
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Erro:", error);
      setAgentState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            type: "error",
            content: `Erro ao obter resultado: ${error}`,
            isTyping: true,
          },
        ],
      }));
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Função para atualizar o estado dos passos padrão
  const updateDefaultSteps = (currentAction: string, query?: string) => {
    setDefaultSteps(prev => {
      let updated = false;
      return prev.map(step => {
        if (!updated) {
          if (step.status === 'waiting') {
            updated = true;
            let title = step.title;
            if (step.type === 'understand' && query) {
              title = `Entendendo "${query.slice(0, 30)}${query.length > 30 ? '...' : ''}"`;
            } else if (step.type === 'search' && query) {
              title = `Pesquisando "${query.slice(0, 30)}${query.length > 30 ? '...' : ''}"`;
            }
            return {
              ...step,
              status: 'processing' as const,
              active: true,
              title
            };
          }
          return {
            ...step,
            status: 'completed' as const,
            completed: true,
            active: false
          };
        }
        return step;
      });
    });
  };

  // Função para iniciar a sequência inicial
  const startInitialSequence = (query: string) => {
    const steps = ['understand', 'explore', 'think', 'search'];
    let currentIndex = 0;

    const sequenceInterval = setInterval(() => {
      if (currentIndex < steps.length) {
        const step = steps[currentIndex];
        setProcessingStep(step);
        updateDefaultSteps(step, query);
        currentIndex++;
      } else {
        clearInterval(sequenceInterval);
      }
    }, 1000);

    return () => clearInterval(sequenceInterval);
  };

  // Atualizar a função saveSession
  const saveSession = async (requestId: string) => {
    const session: QuerySession = {
      id: requestId,
      question: inputValue,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      steps: agentState.messages.map((message, index) => ({
        id: index + 1,
        type: message.type,
        content: message.content,
        timestamp: new Date().toISOString(),
        data: message.data,
        action: actions[index] || defaultSteps[index]
      })),
      metadata: {
        model: selectedModel,
        totalTokens: 0, // Será atualizado com o valor real
        elapsedTime: startTime ? formatDistanceToNow(startTime, { locale: ptBR }) : '0',
        urlCount
      }
    };

    try {
      const API_URL = import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      await fetch(`${API_URL}/api/v1/queries/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session)
      });
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  };

  // Função para carregar uma sessão
  const loadSession = async (requestId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/v1/queries/${requestId}`);
      if (!response.ok) throw new Error('Sessão não encontrada');
      
      const session: QuerySession = await response.json();
      setCurrentSession(session);
      
      // Restaura o estado da sessão
      setAgentState(prev => ({
        ...prev,
        messages: session.steps.map(step => ({
          type: step.type,
          content: step.content,
          isTyping: false,
          data: step.data,
          step: step.id
        }))
      }));

      // Restaura as ações
      const sessionActions = session.steps
        .filter(step => step.action)
        .map(step => step.action!);
      setActions(sessionActions);

      // Restaura os metadados
      if (session.metadata) {
        setUrlCount(session.metadata.urlCount || 0);
        if (session.metadata.elapsedTime) {
          const now = new Date();
          const elapsed = new Date(now.getTime() - parseInt(session.metadata.elapsedTime));
          setStartTime(elapsed);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    }
  };

  // Atualiza o handleSend para salvar a sessão
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setStartTime(new Date());
    setUrlCount(0);
    setDefaultSteps(DEFAULT_STEPS);
    setProcessingStep(null);
    
    startInitialSequence(inputValue);

    setAgentState((prev) => ({
      ...prev,
      question: inputValue,
      messages: [
        ...prev.messages,
        {
          type: "query",
          content: inputValue,
          isTyping: false,
          step: prev.messages.length + 1
        },
      ],
    }));

    const requestId = await sendQuestion(inputValue);
    if (requestId) {
      await saveSession(requestId); // Salva a sessão inicial
      await startEventStream(requestId);
      setInputValue("");
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

  // Atualiza o handleActionClick para carregar o conteúdo da sessão
  const handleActionClick = (index: number) => {
    setActiveActionIndex(index);
    if (currentSession) {
      const step = currentSession.steps[index];
      if (step) {
        const stepElement = document.getElementById(`step-${step.id}`);
        if (stepElement) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  // Atualiza o useEffect para salvar a sessão quando houver mudanças
  useEffect(() => {
    if (currentSession && agentState.messages.length > 0) {
      const session: QuerySession = {
        id: currentSession.id,
        question: inputValue,
        timestamp: new Date().toISOString(),
        status: 'in_progress',
        steps: agentState.messages.map((message, index) => ({
          id: index + 1,
          type: message.type,
          content: message.content,
          timestamp: new Date().toISOString(),
          data: message.data,
          action: actions[index] || defaultSteps[index]
        })),
        metadata: {
          model: selectedModel,
          totalTokens: 0,
          elapsedTime: startTime ? formatDistanceToNow(startTime, { locale: ptBR }) : '0',
          urlCount
        }
      };

      saveSession(currentSession.id);

      // Atualizar os passos na interface
      const steps = session.steps.filter(step => step.action);
      if (steps.length > 0) {
        setActions(steps.map(step => step.action!));
        setActiveActionIndex(steps.length - 1);
      }
    }
  }, [agentState.messages, actions, urlCount]);

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
          setAgentState((prev) => ({
            ...prev,
            messages: [
              {
                type: "query" as const,
                content: query.question || query.title,
                isTyping: false,
                step: 1
              },
              {
                type: "step" as const,
                content: `💭 Status: ${query.status}`,
                isTyping: false,
                step: 2
              },
              {
                type: "response" as const,
                content: `✅ ${query.summary || "Sem resumo disponível"}`,
                isTyping: false,
                step: 3
              },
            ],
          }));
          setShowWelcome(false);
        }}
      />
      <div className="flex flex-col container-full items-center flex-1">
        <Header
          selectedModel={selectedModel}
          onModelChange={(value: string | null) =>
            value && setSelectedModel(value)
          }
          modeloSelecionado={selectedModel}
          aoMudarModelo={(value: string | null) =>
            value && setSelectedModel(value)
          }
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
                color: "#ff4444",
                marginLeft: "10px",
                padding: "5px 10px",
                border: "1px solid #ff4444",
                borderRadius: "4px",
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
              showAutoComplete={false}
              handleAutocompleteClick={() => {}}
              isAutocompleteLoading={false}
              onClickOutside={() => {}}
            />
          </div>
          <div className="chat-content">
            <div className="chat-messages">
              <ActionsList 
                actions={[...defaultSteps, ...actions]}
                onActionClick={handleActionClick}
                startTime={startTime}
                urlCount={urlCount}
                query={inputValue}
              />
              <div className="content-area">
                {showWelcome && agentState.messages.length === 0 && (
                  <div className="welcome-message">
                    Bem-vindo! Como posso ajudar você hoje?
                  </div>
                )}
                {processingStep && (
                  <ProcessingContent step={processingStep} query={inputValue} />
                )}
                {agentState.messages.map((message, index) => (
                  <ChatMessage key={index} {...message} step={index + 1} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
