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
import QueryHistory from "../../components/QueryHistory";
import {
  AgentState,
  QuerySession,
  QueryHistoryItem,
} from "../../components/QueryHistory/types";
import {
  FiClock,
  FiDatabase,
  FiCpu,
  FiSearch,
  FiBookOpen,
  FiActivity,
  FiCompass,
  FiCheckCircle,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ChatMessage from "../../components/ChatMessage";
import { ChatMessageProps } from "../../components/ChatMessage/types";
import {
  ActionItem,
  ActionIconProps,
  ActionStatusProps,
  ActionListProps,
  ProcessingContentProps,
} from "./types";

const ActionIcon: React.FC<ActionIconProps> = ({ type }) => {
  switch (type) {
    case "understand":
      return <FiActivity />;
    case "explore":
      return <FiCompass />;
    case "think":
      return <FiActivity />;
    case "search":
      return <FiSearch />;
    case "read":
      return <FiBookOpen />;
    case "answer":
      return <FiCheckCircle />;
    default:
      return <FiSearch />;
  }
};

const ActionStatus: React.FC<ActionStatusProps> = ({ status }) => {
  if (status === "completed") {
    return <span className="action-status completed">✓</span>;
  }
  if (status === "processing") {
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

const ProcessingContent: React.FC<ProcessingContentProps> = ({
  step,
  query,
}) => {
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

  if (step === "understand") {
    return (
      <div className="calculation-container">
        <p>Entendendo o que o usuário quis dizer com:</p>
        <p className="processing-text">"{query}"</p>
        <ThinkingAnimation />
      </div>
    );
  }

  if (step === "explore") {
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

const DEFAULT_STEPS: ActionItem[] = [
  {
    type: "understand",
    title: "Entendendo...",
    status: "waiting",
    completed: false,
    active: false,
  },
  {
    type: "explore",
    title: "Explorando...",
    status: "waiting",
    completed: false,
    active: false,
  },
  {
    type: "think",
    title: "Pensando...",
    status: "waiting",
    completed: false,
    active: false,
  },
  {
    type: "search",
    title: "Pesquisando...",
    status: "waiting",
    completed: false,
    active: false,
  },
  {
    type: "read",
    title: "Lendo...",
    status: "waiting",
    completed: false,
    active: false,
  },
];

const ActionsList: React.FC<ActionListProps> = ({
  actions,
  onActionClick,
  startTime,
  urlCount = 0,
  activeActionIndex,
  setActiveActionIndex,
}) => {
  const elapsedTime = startTime
    ? formatDistanceToNow(startTime, { locale: ptBR })
    : "0";
  const hasMultipleSteps =
    actions.filter((a) => a.status !== "waiting").length > 1;
  const mainSteps = actions.filter((action) =>
    ["understand", "explore", "think", "search", "read", "answer"].includes(
      action.type
    )
  );

  const handleActionClick = (index: number) => {
    onActionClick(index);
    setActiveActionIndex(index);
    const stepElement = document.getElementById(`step-${index + 1}`);
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className={`actions-list ${hasMultipleSteps ? "has-multiple-steps" : ""}`}
    >
      <div className="session-header">
        <div className="session-title">
          <FiSearch />
          DeepSearch
        </div>
        <div className="session-stats">
          <div className="stat-item">
            <FiClock />
            <span>
              {elapsedTime.replace(" segundos", "").replace(" minutos", "m")}
            </span>
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
          className={`action-item ${action.completed ? "completed" : ""} ${
            index === activeActionIndex ? "active" : ""
          } ${action.status !== "waiting" ? "show" : ""}`}
          onClick={() => handleActionClick(index)}
        >
          <div className="action-icon">
            <ActionIcon type={action.type} />
          </div>
          <div className="action-text">
            {action.title}
            {action.type === "search" &&
              action.urls &&
              action.urls.length > 0 && (
                <div className="url-list">
                  <h4>URLs sendo processadas:</h4>
                  {action.urls.map((url: string, urlIndex: number) => (
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
  const [selectedModel, setSelectedModel] = useState<string>(
    "qwen2.5-7b-instruct-1m"
  );
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
  const [currentSession] = useState<QuerySession | null>(null);

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
    setDefaultSteps(DEFAULT_STEPS);
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
        throw new Error(
          `Erro ao enviar pergunta: ${data.error || response.statusText}`
        );
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
    const API_URL =
      import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `${API_URL}/api/v1/stream/${requestId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("Conexão SSE estabelecida");
      setAgentState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            type: "connected",
            content: "🔌 Conexão estabelecida com o servidor",
            isTyping: false,
            step: prev.messages.length + 1,
          },
        ],
      }));
    };

    eventSource.onmessage = async (event) => {
      console.log("Evento recebido no cliente:", event.data);

      try {
        const data = JSON.parse(event.data);
        console.log("Dados parseados:", data);

        setAgentState((prev) => {
          const newState = { ...prev };
          let messages = [...prev.messages];

          // Função auxiliar para adicionar mensagem
          const addMessage = (messageData: Partial<ChatMessageProps>) => {
            const newMessage: ChatMessageProps = {
              type: messageData.type || "log",
              content: messageData.content || "",
              isTyping: messageData.isTyping || false,
              data: messageData.data,
              step: prev.messages.length + 1,
            };
            messages.push(newMessage);
          };

          switch (data.type) {
            case "log":
              addMessage({
                type: "log",
                content:
                  typeof data.data === "string"
                    ? data.data
                    : JSON.stringify(data.data, null, 2),
                isTyping: false,
              });
              break;

            case "progress":
              if (data.trackers?.actionState) {
                const {
                  think,
                  searchQuery,
                  questionsToAnswer,
                  accumulatedReasoning,
                  urlsToVisit,
                } = data.trackers.actionState;

                let content = "";
                if (think) content += `💭 ${think}\n`;
                if (searchQuery) content += `🔍 Buscando: "${searchQuery}"\n`;
                if (questionsToAnswer?.length) {
                  content += "❓ Questões para investigar:\n";
                  questionsToAnswer.forEach((q: string) => {
                    content += `- ${q}\n`;
                  });
                }

                addMessage({
                  type: "step",
                  content,
                  isTyping: true,
                  data: {
                    reasoning: accumulatedReasoning,
                    urls: urlsToVisit,
                  },
                });
              }
              break;

            case "answer":
              if (data.data) {
                addMessage({
                  type: "answer",
                  content: data.data.answer,
                  isTyping: false,
                  data: {
                    reasoning: data.data.think,
                    references: data.data.references,
                  },
                });
              }
              break;

            case "error":
              addMessage({
                type: "error",
                content: `❌ ${data.data || "Erro desconhecido"}`,
                isTyping: false,
              });
              break;

            default:
              // Logs gerais e outros tipos de eventos
              addMessage({
                type: "log",
                content: JSON.stringify(data, null, 2),
                isTyping: false,
              });
          }

          newState.messages = messages;
          return newState;
        });

        if (data.type === "answer" || data.type === "error") {
          console.log("Fechando conexão após receber resposta/erro");
          eventSource.close();
          eventSourceRef.current = null;
          setIsLoading(false);
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
              step: prev.messages.length + 1,
            },
          ],
        }));
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
            step: prev.messages.length + 1,
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
  const updateDefaultSteps = (query?: string) => {
    setDefaultSteps((prev) => {
      let updated = false;
      return prev.map((step) => {
        if (!updated) {
          if (step.status === "waiting") {
            updated = true;
            let title = step.title;
            if (step.type === "understand" && query) {
              title = `Entendendo "${query.slice(0, 30)}${
                query.length > 30 ? "..." : ""
              }"`;
            } else if (step.type === "search" && query) {
              title = `Pesquisando "${query.slice(0, 30)}${
                query.length > 30 ? "..." : ""
              }"`;
            }
            return {
              ...step,
              status: "processing" as const,
              active: true,
              title,
            };
          }
          return {
            ...step,
            status: "completed" as const,
            completed: true,
            active: false,
          };
        }
        return step;
      });
    });
  };

  // Função para iniciar a sequência inicial
  const startInitialSequence = (query: string) => {
    const steps = ["understand", "explore", "think", "search"];
    let currentIndex = 0;

    const sequenceInterval = setInterval(() => {
      if (currentIndex < steps.length) {
        const step = steps[currentIndex];
        setProcessingStep(step);
        updateDefaultSteps(query);
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
      status: "in_progress",
      steps: agentState.messages.map((message, index) => ({
        id: index + 1,
        type: message.type,
        content: message.content,
        timestamp: new Date().toISOString(),
        data: message.data,
        action: actions[index] || defaultSteps[index],
      })),
      metadata: {
        model: selectedModel,
        totalTokens: 0, // Será atualizado com o valor real
        elapsedTime: startTime
          ? formatDistanceToNow(startTime, { locale: ptBR })
          : "0",
        urlCount,
      },
    };

    try {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      await fetch(`${API_URL}/api/v1/queries/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(session),
      });
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
    }
  };

  // // Função para carregar uma sessão
  // const loadSession = async (requestId: string) => {
  //   try {
  //     const API_URL = import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
  //     const response = await fetch(`${API_URL}/api/v1/queries/${requestId}`);
  //     if (!response.ok) throw new Error('Sessão não encontrada');

  //     const session: QuerySession = await response.json();
  //     setCurrentSession(session);

  //     // Restaura o estado da sessão
  //     setAgentState(prev => ({
  //       ...prev,
  //       messages: session.steps.map(step => ({
  //         type: step.type,
  //         content: step.content,
  //         isTyping: false,
  //         data: step.data,
  //         step: step.id
  //       }))
  //     }));

  //     // Restaura as ações
  //     const sessionActions = session.steps
  //       .filter(step => step.action)
  //       .map(step => step.action!);
  //     setActions(sessionActions);

  //     // Restaura os metadados
  //     if (session.metadata) {
  //       setUrlCount(session.metadata.urlCount || 0);
  //       if (session.metadata.elapsedTime) {
  //         const now = new Date();
  //         const elapsed = new Date(now.getTime() - parseInt(session.metadata.elapsedTime));
  //         setStartTime(elapsed);
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Erro ao carregar sessão:', error);
  //   }
  // };

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
          step: prev.messages.length + 1,
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
          stepElement.scrollIntoView({ behavior: "smooth", block: "start" });
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
        status: "in_progress",
        steps: agentState.messages.map((message, index) => ({
          id: index + 1,
          type: message.type,
          content: message.content,
          timestamp: new Date().toISOString(),
          data: message.data,
          action: actions[index] || defaultSteps[index],
        })),
        metadata: {
          model: selectedModel,
          totalTokens: 0,
          elapsedTime: startTime
            ? formatDistanceToNow(startTime, { locale: ptBR })
            : "0",
          urlCount,
        },
      };

      saveSession(currentSession.id);

      // Atualizar os passos na interface
      const steps = session.steps.filter((step) => step.action);
      if (steps.length > 0) {
        setActions(steps.map((step) => step.action!));
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
                step: 1,
              },
              {
                type: "step" as const,
                content: `💭 Status: ${query.status}`,
                isTyping: false,
                step: 2,
              },
              {
                type: "response" as const,
                content: `✅ ${query.summary || "Sem resumo disponível"}`,
                isTyping: false,
                step: 3,
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
              title="Pesquise o que você precisar"
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
              Limpar
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
                activeActionIndex={activeActionIndex}
                setActiveActionIndex={setActiveActionIndex}
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
