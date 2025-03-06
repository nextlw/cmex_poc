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
  FiX,
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
// Importação do transformador de mensagens de streaming
import { transformStreamMessage } from "../../utils/transformers/streamMessageTransformers";

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
    return (
      <span className="action-status completed" data-testid="action-status">
        ✓
      </span>
    );
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
  // Garante que actions é sempre um array válido
  const safeActions = Array.isArray(actions) ? actions : [];

  // Verifica se startTime é uma data válida
  const isValidDate = startTime && !isNaN(new Date(startTime).getTime());

  const elapsedTime = isValidDate
    ? formatDistanceToNow(new Date(startTime), { locale: ptBR })
    : "0";

  const hasMultipleSteps =
    safeActions.filter((a) => a.status !== "waiting").length > 1;
  const mainSteps = safeActions.filter((action) =>
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
      data-testid="actions-list"
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
              {typeof elapsedTime === "string"
                ? elapsedTime.replace(" segundos", "").replace(" minutos", "m")
                : "0s"}
            </span>
            <span className="stat-item-label">s</span>
          </div>
          <div className="stat-item">
            <FiDatabase />
            <span>{urlCount || 0}</span>
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
  const [startTime, setStartTime] = useState<Date | undefined>(undefined);
  const [urlCount, setUrlCount] = useState(0);
  const [defaultSteps, setDefaultSteps] = useState<ActionItem[]>(DEFAULT_STEPS);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<QuerySession | null>(
    null
  );
  const [newQuery, setNewQuery] = useState<QueryHistoryItem | null>(null);

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
                  eventData.trackers?.actionState?.think ||
                  eventData.data?.think ||
                  "Atualizando..."
                }`,
                isTyping: false,
                data: {
                  reasoning:
                    eventData.trackers?.actionState?.accumulatedReasoning,
                  searchQuery: eventData.trackers?.actionState?.searchQuery,
                  questionsToAnswer:
                    eventData.trackers?.actionState?.questionsToAnswer,
                  urls: eventData.trackers?.actionState?.urlsToVisit,
                  outputs: eventData.outputs || [],
                },
              },
            ],
          }));
        }
      } catch (error) {
        console.error("Erro ao processar evento do console:", error);
      }
    }
  };

  const handleClear = async () => {
    // Fecha qualquer conexão EventSource existente
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Limpar o localStorage
    localStorage.removeItem("currentQueryId");

    // Criar uma nova pesquisa padrão no histórico
    try {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";

      // Gerar um ID único para a nova pesquisa
      const newQueryId = `new-${Date.now()}`;

      // Criar objeto de nova pesquisa
      const newQueryObj = {
        id: newQueryId,
        title: "Nova pesquisa",
        timestamp: new Date().toISOString(),
        status: "in_progress" as const,
        question: "",
      };

      // Salvar no backend
      await fetch(`${API_URL}/api/v1/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQueryObj),
      });

      // Salvar o ID da consulta atual no localStorage
      localStorage.setItem("currentQueryId", newQueryId);

      // Disparar um evento personalizado para notificar o componente QueryHistory
      const customEvent = new CustomEvent("queryHistoryUpdated", {
        detail: { newQuery: newQueryObj },
      });
      window.dispatchEvent(customEvent);

      // Definir a nova query no estado para ser passada ao componente QueryHistory
      setNewQuery(newQueryObj);
    } catch (error) {
      console.error("Erro ao criar nova pesquisa:", error);
    }

    // Reiniciar todos os estados
    setAgentState({
      question: "",
      messages: [],
    });
    setInputValue("");
    setIsLoading(false);
    setStartTime(undefined);
    setUrlCount(0);
    setActions([]);
    setDefaultSteps(DEFAULT_STEPS);
    setActiveActionIndex(0);
    setShowWelcome(true);
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
        // Verifica se o evento contém dados válidos antes de processar
        if (
          !event.data ||
          typeof event.data !== "string" ||
          event.data.trim() === ""
        ) {
          console.warn("Evento recebido com dados vazios ou inválidos.");
          return;
        }

        // Verifica se não é um HTML (resposta de erro)
        if (
          event.data.trim().startsWith("<!DOCTYPE") ||
          event.data.trim().startsWith("<html")
        ) {
          console.error(
            "Recebido HTML em vez de JSON:",
            event.data.substring(0, 100) + "..."
          );

          setAgentState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                type: "error",
                content:
                  "❌ Erro de comunicação com o servidor. Tente novamente mais tarde.",
                isTyping: false,
                step: prev.messages.length + 1,
              },
            ],
          }));

          return;
        }

        const rawData = JSON.parse(event.data);
        console.log("Dados brutos parseados:", rawData);

        // Verificar se temos uma resposta direta com informações úteis antes de transformar
        if (
          rawData.action === "reflect" ||
          rawData.action === "search" ||
          rawData.action === "visit"
        ) {
          // Processar diretamente o formato raw quando contiver informações úteis
          setAgentState((prev) => {
            const messages = [...prev.messages];
            let content = "";

            if (rawData.action === "reflect") {
              content = `💭 Pensando: ${rawData.think || "..."}\n`;

              if (
                rawData.questionsToAnswer &&
                Array.isArray(rawData.questionsToAnswer)
              ) {
                content += "\n❓ Questões para investigar:\n";
                rawData.questionsToAnswer.forEach((q: string) => {
                  content += `- ${q}\n`;
                });
              }
            } else if (rawData.action === "search") {
              content = `🔍 Buscando: "${
                rawData.query || rawData.searchQuery || "..."
              }"`;
            } else if (rawData.action === "visit") {
              content = `🌐 Visitando: ${rawData.url || "..."}\n`;
              if (rawData.content) {
                content += `📄 Conteúdo: ${rawData.content.substring(
                  0,
                  100
                )}...`;
              }
            }

            messages.push({
              type: rawData.action,
              content: content,
              isTyping: false,
              data: rawData,
              step: prev.messages.length + 1,
            });

            return {
              ...prev,
              messages: messages,
            };
          });

          return; // Sair após processar diretamente
        }

        // Aplicar o transformador para outros tipos de mensagens
        const data = transformStreamMessage(rawData);
        console.log("Dados transformados:", data);

        // Registra os dados brutos para depuração
        setAgentState((prev) => {
          const newState = { ...prev };
          let messages = [...prev.messages];

          // Salva os dados brutos como um log para depuração se necessário
          if (process.env.NODE_ENV === "development") {
            messages.push({
              type: "log",
              content: `Debug - Dados brutos SSE: ${JSON.stringify(
                data,
                null,
                2
              )}`,
              isTyping: false,
              step: prev.messages.length + 1,
            });
          }

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

                // Verifica se existem outputs adicionais para mostrar
                if (data.outputs && data.outputs.length > 0) {
                  content += "\n📋 Saídas adicionais:\n";
                  data.outputs.forEach((output: any, idx: number) => {
                    content += `Output ${idx + 1}: ${JSON.stringify(output)}\n`;
                  });
                }

                addMessage({
                  type: "step",
                  content,
                  isTyping: true,
                  data: {
                    reasoning: accumulatedReasoning,
                    urls: urlsToVisit,
                    outputs: data.outputs,
                    trackers: data.trackers,
                  },
                });
              } else if (data.data) {
                // Caso o actionState não esteja disponível, tenta usar os dados diretos
                let content = "";

                // Tentar extrair informações úteis dos dados
                if (typeof data.data === "object") {
                  if (data.data.think) content += `💭 ${data.data.think}\n`;
                  if (data.data.query || data.data.searchQuery)
                    content += `🔍 Buscando: "${
                      data.data.query || data.data.searchQuery
                    }"\n`;
                  if (
                    data.data.questionsToAnswer &&
                    Array.isArray(data.data.questionsToAnswer)
                  ) {
                    content += "❓ Questões para investigar:\n";
                    data.data.questionsToAnswer.forEach((q: string) => {
                      content += `- ${q}\n`;
                    });
                  }
                }

                // Se não conseguiu extrair nada útil, usa a mensagem genérica
                if (!content.trim()) {
                  content =
                    typeof data.data === "string"
                      ? data.data
                      : `🔄 ${data.data.message || JSON.stringify(data.data)}`;
                }

                addMessage({
                  type: "step",
                  content: content,
                  isTyping: false,
                  data: {
                    ...data.data,
                    trackers: data.trackers,
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
                    trackers: data.trackers,
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

            case "search":
            case "reflect":
            case "visit":
              // Processar mensagens de outros tipos de ação
              let actionContent = "";

              if (
                data.type === "reflect" &&
                data.data &&
                typeof data.data === "object"
              ) {
                if (data.data.think)
                  actionContent += `💭 Pensando: ${data.data.think}\n`;
                if (
                  data.data.questionsToAnswer &&
                  Array.isArray(data.data.questionsToAnswer)
                ) {
                  actionContent += "\n❓ Questões para investigar:\n";
                  data.data.questionsToAnswer.forEach((q: string) => {
                    actionContent += `- ${q}\n`;
                  });
                }
              } else if (
                data.type === "search" &&
                data.data &&
                typeof data.data === "object"
              ) {
                actionContent = `🔍 Buscando: "${
                  data.data.query || data.data.searchQuery || "..."
                }"`;
              } else if (
                data.type === "visit" &&
                data.data &&
                typeof data.data === "object"
              ) {
                actionContent = `🌐 Visitando: ${data.data.url || "..."}\n`;
              } else {
                actionContent =
                  typeof data.data === "string"
                    ? data.data
                    : `🔍 ${data.data.message || JSON.stringify(data.data)}`;
              }

              addMessage({
                type: data.type,
                content: actionContent,
                isTyping: false,
                data: {
                  ...data.data,
                  trackers: data.trackers,
                },
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
    try {
      // Criar uma cópia do estado atual para evitar problemas de concorrência
      const currentMessages = [...agentState.messages];
      const currentActions = [...actions];
      const currentUrlCount = urlCount;
      const currentStartTime = startTime;

      const session: QuerySession = {
        id: requestId,
        question: inputValue,
        timestamp: new Date().toISOString(),
        status: "in_progress",
        steps: currentMessages.map((message, index) => ({
          id: index + 1,
          type: message.type,
          content: message.content,
          timestamp: new Date().toISOString(),
          data: message.data,
          action: currentActions[index] || defaultSteps[index],
        })),
        metadata: {
          model: selectedModel,
          totalTokens: 0,
          elapsedTime: currentStartTime
            ? formatDistanceToNow(currentStartTime, { locale: ptBR })
            : "0",
          urlCount: currentUrlCount,
        },
      };

      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/v1/queries/${requestId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        throw new Error(`Erro ao salvar sessão: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar sessão:", error);
      // Aqui poderíamos implementar uma lógica de retry ou notificação ao usuário
      return false;
    }
  };

  // Função para carregar uma sessão de consulta existente
  const loadSession = async (requestId: string) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      const response = await fetch(
        `${API_URL}/api/v1/queries/${requestId}/session`
      );

      if (!response.ok) {
        throw new Error(`Sessão não encontrada: ${response.statusText}`);
      }

      const session: QuerySession = await response.json();

      // Validar dados essenciais da sessão
      if (!session || !session.id || !session.question) {
        throw new Error("Dados da sessão inválidos ou incompletos");
      }

      // Validar e processar os steps
      if (!Array.isArray(session.steps)) {
        throw new Error("Formato inválido dos steps da sessão");
      }

      // Restaurar o estado do agente com validação
      setAgentState((prev) => ({
        ...prev,
        question: session.question,
        messages: session.steps.map((step) => ({
          type: step.type,
          content: step.content || "",
          isTyping: false,
          data: step.data || {},
          step: step.id,
        })),
      }));

      // Restaurar o valor do input e interface
      setInputValue(session.question || "");
      setShowWelcome(false);

      // Restaurar as ações com validação
      if (session.steps && session.steps.length > 0) {
        const validActions = session.steps
          .filter((step) => step.action && typeof step.action === "object")
          .map((step) => step.action!);

        if (validActions.length > 0) {
          setActions(validActions);
        }
      }

      // Restaurar os metadados com validação
      if (session.metadata) {
        if (typeof session.metadata.urlCount === "number") {
          setUrlCount(session.metadata.urlCount);
        }

        if (session.metadata.elapsedTime) {
          try {
            const now = new Date();
            const elapsed = session.metadata.elapsedTime.replace(/[^0-9]/g, "");
            const elapsedMs = parseInt(elapsed) * 60 * 1000;
            const startTimeDate = new Date(now.getTime() - elapsedMs);
            setStartTime(startTimeDate);
          } catch (error) {
            console.error("Erro ao processar tempo decorrido:", error);
          }
        }
      }

      // Se a sessão ainda está em andamento, reconectar ao EventSource
      if (session.status === "in_progress") {
        await startEventStream(requestId);
      }

      return true;
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
      // Limpar o localStorage se a sessão não foi encontrada
      localStorage.removeItem("currentQueryId");
      return false;
    }
  };

  // Atualiza o handleSend para salvar o ID da sessão no localStorage
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

    try {
      // Sempre criar uma nova query
      const requestId = await sendQuestion(inputValue);

      if (requestId) {
        // Salva o ID da consulta atual no localStorage
        localStorage.setItem("currentQueryId", requestId);

        await saveSession(requestId); // Salva a sessão inicial
        await startEventStream(requestId);
        setInputValue("");
        setShowWelcome(false);
      } else {
        throw new Error("Falha ao criar nova query");
      }
    } catch (error) {
      console.error("Erro ao processar query:", error);
      setIsLoading(false);
      // Adicionar notificação de erro ao usuário aqui se necessário
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
    const stepElement = document.getElementById(`step-${index + 1}`);
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Efeito para atualizar o activeActionIndex quando novas ações são adicionadas
  useEffect(() => {
    // Seleciona automaticamente a ação mais recente
    const totalActions = [...defaultSteps, ...actions].filter(
      (action) => action.status !== "waiting"
    ).length;

    if (totalActions > 0) {
      setActiveActionIndex(totalActions - 1);
    }
  }, [defaultSteps, actions]);

  // Efeito para rolar para a mensagem mais recente
  useEffect(() => {
    if (agentState.messages.length > 0) {
      // Encontra o último elemento de mensagem
      const lastMessageElement = document.querySelector(
        `[data-message-id="message-${agentState.messages.length}"]`
      );
      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }
  }, [agentState.messages]);

  // Efeito para limpar a sobrescrita do console.log ao desmontar o componente
  useEffect(() => {
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // Efeito para verificar e restaurar uma sessão em andamento
  useEffect(() => {
    const currentQueryId = localStorage.getItem("currentQueryId");
    if (currentQueryId) {
      console.log("Restaurando sessão:", currentQueryId);
      // Indicar que está carregando enquanto restaura a sessão
      setIsLoading(true);

      // Tentar carregar a sessão do servidor
      loadSession(currentQueryId).then((success) => {
        if (success) {
          // Adicionar mensagem informando sobre a restauração da sessão
          setAgentState((prev) => ({
            ...prev,
            messages: [
              ...prev.messages,
              {
                type: "connected",
                content:
                  "🔄 Sessão restaurada automaticamente. Continuando de onde parou.",
                isTyping: false,
                step: prev.messages.length + 1,
              },
            ],
          }));
        } else {
          // Se não foi possível restaurar a sessão, limpar o estado
          handleClear();
        }
        setIsLoading(false);
      });
    }
  }, []); // Executar apenas uma vez na montagem do componente

  // Adicionar um useEffect para criar uma nova pesquisa quando a página carregar
  useEffect(() => {
    const createDefaultQuery = async () => {
      const currentQueryId = localStorage.getItem("currentQueryId");

      // Se não houver consulta atual no localStorage, criar uma nova
      if (!currentQueryId) {
        handleClear();
      }
    };

    createDefaultQuery();
  }, []); // Executar apenas uma vez na montagem do componente

  // Adiciono a função para cancelar a pesquisa
  const handleCancelSearch = async () => {
    // Fecha a conexão com o EventSource, se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Obtém o ID da consulta atual do localStorage
    const currentQueryId = localStorage.getItem("currentQueryId");

    if (currentQueryId) {
      try {
        const API_URL =
          import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
        const API_FASTAPI =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

        // Tenta cancelar via FastAPI primeiro, para interromper qualquer processamento no backend Python
        try {
          await fetch(`${API_FASTAPI}/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Adiciona token se autenticado
            },
            body: JSON.stringify({ requestId: currentQueryId }),
          });
          console.log("Solicitação de cancelamento enviada ao FastAPI");
        } catch (error) {
          console.error("Erro ao cancelar via FastAPI:", error);
        }

        // Depois tenta usar a rota de cancelamento direta do serviço Node.js
        const cancelResponse = await fetch(`${API_URL}/api/v1/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId: currentQueryId }),
        });

        if (cancelResponse.ok) {
          console.log("Pesquisa cancelada com sucesso no Node.js");
        } else {
          // Se a rota de cancelamento falhar, tenta mover para a lixeira
          console.log(
            "Falha ao cancelar a consulta, tentando outras abordagens"
          );
          const trashResponse = await fetch(`${API_URL}/api/v1/trash-query`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: currentQueryId }),
          });

          // Se a rota trash-query falhar, atualiza o status para cancelled
          if (!trashResponse.ok) {
            console.log(
              "Falha ao excluir a consulta, atualizando status para cancelled"
            );
            await fetch(`${API_URL}/api/v1/queries/${currentQueryId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
              }),
            });
          } else {
            console.log("Consulta movida para a lixeira com sucesso");
          }
        }
      } catch (error) {
        console.error("Erro ao cancelar a consulta:", error);
      }
    }

    // Adiciona uma mensagem de erro informando que a pesquisa foi cancelada
    setAgentState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          type: "error",
          content: "A pesquisa foi cancelada pelo usuário.",
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    // Marca como não carregando mais
    setIsLoading(false);
  };

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
        newQuery={newQuery || undefined}
        onNewQueryAdded={() => setNewQuery(null)}
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
            <div className="button-container">
              <button
                onClick={handleClear}
                className="action-button select-button"
                title="Limpar esta pesquisa e iniciar uma nova"
              >
                Nova Pesquisa
              </button>
            </div>
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

          {/* Título da pergunta atual */}
          {agentState.question && !showWelcome && (
            <div className="query-title-container">
              <h1 className="query-title">{agentState.question}</h1>
              {isLoading && (
                <button
                  className="cancel-search-button"
                  onClick={handleCancelSearch}
                  title="Cancelar esta pesquisa"
                >
                  <FiX /> Cancelar
                </button>
              )}
            </div>
          )}

          <div className="chat-content">
            <div className="chat-messages" data-testid="chat-messages">
              <ActionsList
                actions={
                  actions && actions.length
                    ? [...defaultSteps, ...actions]
                    : defaultSteps
                }
                onActionClick={handleActionClick}
                startTime={startTime}
                urlCount={urlCount}
                activeActionIndex={activeActionIndex}
                setActiveActionIndex={setActiveActionIndex}
              />
              <div className="content-area">
                {showWelcome && agentState.messages.length === 0 && (
                  <div className="welcome-message">
                    Bem-vindo! Como posso ajudar você hoje?
                  </div>
                )}
                {!showWelcome && agentState.messages.length === 0 && (
                  <div className="empty-state-message">
                    <p>
                      Nenhuma mensagem para exibir. Tente fazer uma pergunta.
                    </p>
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
