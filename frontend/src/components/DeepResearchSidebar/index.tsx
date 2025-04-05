import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../../axiosConfig";
import {
  DeepResearchSidebarProps,
  ResearchStep,
  ResearchDetail,
  ValidationResult,
  FinalReport,
  ValidationStatus,
} from "./types";
import "./styles.css";
import Spinner from "../Spinner";
import {
  FaProjectDiagram,
  FaArrowDown,
  FaArrowUp,
  FaTimes,
  FaCheck,
  FaPencilAlt,
  FaBook,
  FaFile,
  FaLightbulb,
  FaExclamationTriangle,
  FaClipboardCheck,
} from "react-icons/fa";
// import clsx from "clsx";
import { useSession } from "../../auth/SessionContext";
import AIReasoningSteps from "../ai-reasoning-steps";
import type { ReasoningStep } from "../ai-reasoning-steps";
import TagAtributo from "../TagAtributo";
import { AtributoNCM } from "../../types/atributos";
import TabelaAtributosNCM from "../TabelaAtributosNCM";

// Mensagens pré-definidas para cada etapa do processo
const PROGRESS_MESSAGES = [
  "Iniciando análise avançada com IA...",
  "Buscando dados sobre {produto} em fontes oficiais e bases governamentais...",
  "Consultando legislação e tabelas TIPI para NCM {ncm}...",
  "Analisando regulamentações específicas e notas explicativas...",
  "Verificando jurisprudência e decisões administrativas relacionadas...",
  "Validando classificação com base em critérios técnicos...",
  "Finalizando análise e preparando parecer detalhado...",
];

// Modificar o tipo do Event para incluir a propriedade data
interface SSEEvent extends Event {
  data: string;
}

/**
 * Componente de sidebar para exibir a análise detalhada do DeepResearch
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const DeepResearchSidebar: React.FC<DeepResearchSidebarProps> = ({
  isOpen,
  requestId,
  productName,
  ncmCode = "",
  isProcessing,
  onCancelRequest,
  onProcessComplete,
}) => {
  const { session } = useSession();
  const [steps, setSteps] = useState<ResearchStep[]>([
    {
      id: 1,
      title: "Iniciando pesquisa",
      content: "Preparando análise detalhada do produto",
      status: "waiting",
      iterations: 0,
      minimized: true,
      hidden: false,
    },
    {
      id: 2,
      title: "Pesquisa de fontes oficiais",
      content: "Buscando informações em bases governamentais",
      status: "waiting",
      iterations: 0,
      minimized: true,
      hidden: false,
    },
    {
      id: 3,
      title: "Consulta à legislação",
      content: "Verificando notas explicativas da NCM",
      status: "waiting",
      iterations: 0,
      minimized: true,
      hidden: false,
    },
    {
      id: 4,
      title: "Análise de jurisprudência",
      content: "Buscando decisões administrativas relacionadas",
      status: "waiting",
      iterations: 0,
      minimized: true,
      hidden: false,
    },
    {
      id: 5,
      title: "Validação técnica",
      content: "Comparando características do produto com a classificação",
      status: "waiting",
      iterations: 0,
      minimized: true,
      hidden: false,
    },
    {
      id: 6,
      title: "Conclusão",
      content: "Finalizando análise e preparando parecer",
      status: "waiting",
      iterations: 0,
      minimized: true,
      hidden: false,
    },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [prevStepIndex, setPrevStepIndex] = useState(-1);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [sidebarStatus, setSidebarStatus] = useState<
    "empty" | "processing" | "completed" | "error" | null
  >("empty"); // Adicionado estado "empty" para o estado inicial
  const [statusMessage, setStatusMessage] = useState(PROGRESS_MESSAGES[0]);
  const [researchInfo, setResearchInfo] = useState<ResearchDetail[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const stepsContainerRef = useRef<HTMLUListElement>(null);

  // Estado para controlar a visibilidade do relatório vs passos
  const [showDetailedSteps, setShowDetailedSteps] = useState(false);

  // Estado para o relatório final
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);

  // Estado para controlar quais campos estão em processo de validação
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    ncmCode: true,
    ncmDescription: true,
    taxationDetails: true,
    attributes: true,
    conclusion: true,
  });

  // Estado para armazenar informações parciais durante o processamento
  const [partialInfo, setPartialInfo] = useState({
    ncmCode: ncmCode,
    ncmDescription: "",
    taxationDetails: {} as any,
    attributes: {} as Record<string, string>,
  });

  // Flag para remover o skeleton após receber a primeira resposta
  const [hasInitialData, setHasInitialData] = useState(false);

  // Estado adicional para armazenar as linhas de raciocínio e URLs sendo analisadas
  const [currentReasoning, setCurrentReasoning] = useState<string[]>([]);
  const [sourceUrls, setSourceUrls] = useState<
    { url: string; favicon?: string }[]
  >([]);

  // Referência para o EventSource
  const eventSourceRef = useRef<EventSource | null>(null);

  // Nova fila para gerenciar a exibição do raciocínio com efeito de escrita
  const [reasoningQueue, setReasoningQueue] = useState<string[]>([]);
  const [displayedReasoning, setDisplayedReasoning] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const reasoningContainerRef = useRef<HTMLDivElement>(null);

  // Efeito para processar a fila de raciocínio e criar o efeito de "digitação"
  useEffect(() => {
    // Se não temos itens na fila ou já estamos digitando, não fazer nada
    if (reasoningQueue.length === 0 || isTyping) return;

    // Pegar o próximo item da fila
    const nextReasoning = reasoningQueue[0];
    const newQueue = reasoningQueue.slice(1);
    setReasoningQueue(newQueue);

    // Iniciar o efeito de digitação
    setIsTyping(true);
    let index = 0;
    const text = nextReasoning;
    let currentText = "";

    const typingInterval = setInterval(() => {
      if (index < text.length) {
        currentText += text[index];
        setDisplayedReasoning(currentText);
        index++;

        // Rolagem automática para acompanhar o texto sendo digitado
        if (reasoningContainerRef.current) {
          reasoningContainerRef.current.scrollTop =
            reasoningContainerRef.current.scrollHeight;
        }
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);

        // Adicionar o texto completo ao estado de raciocínio atual
        setCurrentReasoning((prev) => [...prev, text]);

        // Atualizar também o passo atual para mostrar este raciocínio
        const updatedSteps = [...steps];
        const currentStepObj = updatedSteps[currentStepIndex];
        if (currentStepObj) {
          if (!currentStepObj.details) currentStepObj.details = [];
          currentStepObj.details.push({
            type: "text",
            content: text,
            source: "Raciocínio IA",
            timestamp: new Date(),
          });
          setSteps(updatedSteps);
        }
      }
    }, 15); // Velocidade da digitação - ajuste conforme necessário

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(typingInterval);
  }, [reasoningQueue, isTyping, steps, currentStepIndex]);

  // Efeito para sincronizar o estado de processamento com o InputAI
  useEffect(() => {
    if (isProcessing) {
      setSidebarStatus("processing");
    } else if (!isProcessing && !requestId) {
      setSidebarStatus("empty");
    }
  }, [isProcessing, requestId]);

  // Limpa o controlador de abort quando o componente é desmontado ou quando requestId muda
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [requestId]);

  // Efeito para verificar o status da tarefa quando o requestId muda
  useEffect(() => {
    if (!requestId) {
      // Caso não tenhamos um requestId, mostramos o estado vazio
      setSidebarStatus("empty");
      return;
    }

    // Se estiver no estado inicial/loading
    if (requestId === "loading") {
      setStatusMessage("Iniciando análise avançada com IA...");
      setCurrentStepIndex(0);

      // Garante que apenas o primeiro passo esteja expandido (se estiver ativo)
      const updatedSteps = [...steps];
      updatedSteps.forEach((step, index) => {
        // O primeiro passo só será expandido se estiver ativo
        step.minimized = index !== 0;
      });
      setSteps(updatedSteps);

      setResearchInfo([
        {
          type: "question",
          content: `Iniciando análise detalhada do produto: ${productName}`,
          timestamp: new Date(),
        },
      ]);

      // Limpar raciocínio e URLs ao iniciar nova análise
      setCurrentReasoning([]);
      setSourceUrls([]);

      return;
    }

    // Limpa o EventSource anterior se existir
    if (eventSourceRef.current) {
      console.log("Fechando conexão SSE anterior");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Determina a URL base
    const API_URL =
      import.meta.env.VITE_API_URL || "http://localhost:10000/api/v1";

    // Obter o token da sessão ou localStorage
    const token = session?.access_token || localStorage.getItem("token");
    const SSE_URL = `${API_URL}/task-status-sse/${requestId}?token=${token}`;
    console.log("Iniciando conexão SSE para URL:", SSE_URL);

    // Cria uma nova conexão EventSource
    const eventSource = new EventSource(SSE_URL);
    eventSourceRef.current = eventSource;

    // Define os handlers de eventos
    eventSource.onopen = () => {
      console.log("Conexão SSE estabelecida com sucesso");
      setHasError(false);
    };

    // Função auxiliar para extrair informações de raciocínio de diferentes formatos
    const extractThinkingContent = (data: any): string | null => {
      // Verificar se temos o formato esperado
      if (data.think && typeof data.think === "string") {
        return data.think;
      }

      // Tentar extrair de formatos de resposta JSON
      if (data.content && typeof data.content === "string") {
        try {
          // Verificar se o conteúdo é um JSON
          if (data.content.startsWith("{") || data.content.startsWith("[")) {
            const jsonContent = JSON.parse(data.content);
            if (jsonContent.think) {
              return jsonContent.think;
            }
          }
        } catch (e) {
          // Ignorar erro de parsing
        }
      }

      // Tentar extrair de um objeto data.data (às vezes o backend encapsula a resposta)
      if (data.data && typeof data.data === "object") {
        if (data.data.think) {
          return data.data.think;
        }
      }

      // Caso ainda não encontre, procurar em outros campos comuns
      const possibleFields = [
        "thinking",
        "reasoning",
        "thought",
        "raciocinio",
        "explanation",
      ];
      for (const field of possibleFields) {
        if (data[field] && typeof data[field] === "string") {
          return data[field];
        }
      }

      return null;
    };

    // Evento de status - contém dados completos do status atual
    eventSource.addEventListener("status", (event) => {
      try {
        const data = JSON.parse((event as SSEEvent).data);
        console.log("Evento STATUS recebido:", data);

        // Se recebemos dados pela primeira vez, removemos o skeleton
        if (!hasInitialData) {
          setHasInitialData(true);
        }

        // Usar a função auxiliar para extrair o conteúdo de raciocínio
        const thinkingContent = extractThinkingContent(data);
        if (thinkingContent) {
          console.log("Dados de raciocínio extraídos:", thinkingContent);
          // Em vez de atualizar diretamente o estado, adicionamos à fila
          setReasoningQueue((prev) => [...prev, thinkingContent]);
        }

        handleStatusUpdate(data);
      } catch (error) {
        console.error("Erro ao processar evento de status:", error);
      }
    });

    // Evento de atualização - pode conter atualizações parciais
    eventSource.addEventListener("update", (event) => {
      try {
        const data = JSON.parse((event as SSEEvent).data);
        console.log("Evento UPDATE recebido:", data);

        // Usar a função auxiliar para extrair o conteúdo de raciocínio
        const thinkingContent = extractThinkingContent(data);
        if (thinkingContent) {
          console.log(
            "Dados de raciocínio extraídos do UPDATE:",
            thinkingContent
          );
          // Em vez de atualizar diretamente o estado, adicionamos à fila
          setReasoningQueue((prev) => [...prev, thinkingContent]);
        }

        handleStatusUpdate(data);
      } catch (error) {
        console.error("Erro ao processar evento de atualização:", error);
      }
    });

    // Evento de erro no servidor
    eventSource.addEventListener("error", (event) => {
      try {
        const data = JSON.parse((event as SSEEvent).data);
        console.error("Erro reportado pelo servidor:", data.error);
        setHasError(true);
        setErrorMessage(data.error || "Erro na conexão com o servidor");
      } catch (error) {
        console.error("Erro ao processar evento de erro:", error);
        setHasError(true);
        setErrorMessage("Erro na conexão com o servidor");
      }
    });

    // Evento de completar ou timeout
    eventSource.addEventListener("complete", (event) => {
      try {
        const data = JSON.parse((event as SSEEvent).data);
        console.log("Processo completado", data);
        setSidebarStatus("completed");
        setIsLoading(false);

        // Apenas fechamos a conexão SSE - não chamamos onProcessComplete aqui
        // O onProcessComplete será chamado após handleCompletedProcess verificar os dados
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Chamar handleCompletedProcess com os dados recebidos
        // Este método vai checar os dados antes de chamar onProcessComplete
        handleCompletedProcess(currentStepIndex, data);
      } catch (error) {
        console.error("Erro ao processar evento complete:", error);
      }
    });

    // Evento de timeout
    eventSource.addEventListener("timeout", () => {
      console.log("Timeout atingido");
      setHasError(true);
      setErrorMessage("Tempo limite atingido");

      // Limpar a conexão SSE
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    });

    // Erros de conexão/rede
    eventSource.onerror = (error) => {
      console.error("Erro na conexão SSE:", error);
      setHasError(true);
      setErrorMessage(
        "Erro na conexão com o servidor. Verifique o console para mais detalhes."
      );
    };

    // Adicionar um timer para forçar a atualização se não recebermos dados em 5 segundos
    // Isso garante que alguns dados sejam mostrados mesmo se o SSE falhar
    const forceUpdateTimer = setTimeout(() => {
      // Verificar se já recebemos dados
      if (currentReasoning.length === 0) {
        console.log(
          "SSE parece não estar enviando dados. Forçando atualização com dados mock..."
        );

        // Criar dados mock para testes
        const mockData = {
          think:
            "Analisando o produto para validar o NCM informado. Consultando bases oficiais...",
        };

        // Adicionar à fila de raciocínio para criar efeito de escrita
        setReasoningQueue((prev) => [...prev, mockData.think]);
      }
    }, 5000);

    // Limpar o timer quando o componente for desmontado
    return () => {
      clearTimeout(forceUpdateTimer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [requestId, productName, ncmCode, session]);

  // Função para processar dados de status recebidos via SSE
  const handleStatusUpdate = (data: any) => {
    // Adicionar logs para depuração
    console.log("Dados SSE recebidos:", data);

    setHasError(false);

    // Tentar encontrar dados em formato JSON nos campos
    try {
      // Em alguns casos, o modelo pode retornar um string JSON dentro do campo data
      if (
        data.data &&
        typeof data.data === "string" &&
        (data.data.startsWith("{") || data.data.startsWith("["))
      ) {
        try {
          const jsonData = JSON.parse(data.data);
          console.log("JSON extraído de data:", jsonData);
          // Se parsear com sucesso, processar esse JSON
          if (jsonData.think) {
            console.log("Raciocínio encontrado em data.think:", jsonData.think);
            setCurrentReasoning((prev) => [...prev, jsonData.think]);
          }
          if (
            jsonData.action &&
            jsonData.action.type === "action-search" &&
            jsonData.action.searchQuery
          ) {
            // Processar searchQuery
            const queries = Array.isArray(jsonData.action.searchQuery)
              ? jsonData.action.searchQuery
              : [jsonData.action.searchQuery];

            // Transformar consultas em URLs
            const newSourceUrls = queries.map((query: string) => ({
              url: `https://www.google.com/search?q=${encodeURIComponent(
                query
              )}`,
              favicon: "https://www.google.com/favicon.ico",
            }));

            console.log("URLs extraídas de action.searchQuery:", newSourceUrls);
            setSourceUrls((prev) => [...prev, ...newSourceUrls]);
          }
        } catch (e) {
          // Ignora erro de parsing
          console.log("Erro ao parsear JSON de data:", e);
        }
      }
    } catch (e) {
      console.error("Erro ao processar JSON aninhado:", e);
    }

    // Se houver campos "action" com searchQuery, mostramos como URLs
    if (
      data.action &&
      data.action.type === "action-search" &&
      data.action.searchQuery
    ) {
      const queries = Array.isArray(data.action.searchQuery)
        ? data.action.searchQuery
        : [data.action.searchQuery];

      // Transformar as consultas de pesquisa em URLs
      const newSourceUrls = queries.map((query: string) => ({
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        favicon: "https://www.google.com/favicon.ico",
      }));

      setSourceUrls((prev) => [...prev, ...newSourceUrls]);
    }

    // Compatibilidade com o formato atual (se houver)
    if (data.currentReasoning) {
      setCurrentReasoning(data.currentReasoning);
    }

    if (data.sourceUrls) {
      setSourceUrls(data.sourceUrls);
    }

    // Atualiza informações parciais se disponíveis
    if (data.partialInfo) {
      setPartialInfo((prev) => ({
        ...prev,
        ...data.partialInfo,
      }));

      // Atualiza o estado de validação se fornecido
      if (data.validationStatus) {
        setValidationStatus((prev) => ({
          ...prev,
          ...data.validationStatus,
        }));
      }
    }

    // Atualiza a etapa atual
    const stepIndex = data.step !== undefined ? data.step : 0;
    const step = Math.min(stepIndex, PROGRESS_MESSAGES.length - 1);

    // Se o passo mudou, minimiza os passos anteriores
    if (step > currentStepIndex) {
      const updatedSteps = [...steps];
      // Minimiza todos os passos anteriores
      for (let i = 0; i < step; i++) {
        updatedSteps[i].minimized = true;
      }
      setSteps(updatedSteps);
    }

    setCurrentStepIndex(step);

    // Atualiza a mensagem principal
    if (data.currentAction) {
      setStatusMessage(data.currentAction);
    } else {
      let message = PROGRESS_MESSAGES[step]
        .replace("{produto}", productName)
        .replace("{ncm}", ncmCode);
      setStatusMessage(message);
    }

    // Atualiza o status dos passos
    updateStepsWithNewData(step, data);

    // Adiciona novas informações de pesquisa se disponíveis
    if (data.researchDetails) {
      updateResearchInfo(data);
    }

    // Verifica se o processamento foi concluído
    if (data.completed) {
      setSidebarStatus("completed");
      setIsLoading(false);

      // Não chamamos onProcessComplete diretamente aqui
      // Em vez disso, deixamos isso para handleCompletedProcess

      // Exibição do relatório final e outras ações de conclusão
      handleCompletedProcess(step, data);
    } else {
      setSidebarStatus("processing");
    }
  };

  // Função de cancelamento
  const handleCancelRequest = () => {
    // Aborta qualquer requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Chama o endpoint de cancelamento se tivermos um requestId
    if (requestId) {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3001";

      fetch(`${API_URL}/api/v1/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      })
        .then((response) => {
          if (response.ok) {
            console.log(`Requisição cancelada com sucesso: ${requestId}`);
          } else {
            console.error(`Falha ao cancelar requisição: ${requestId}`);
          }
        })
        .catch((error) => {
          console.error(`Erro ao cancelar requisição: ${error}`);
        });
    }

    // Chama o callback de cancelamento (se fornecido)
    if (onCancelRequest) {
      onCancelRequest();
    }
  };

  // Renderiza o estado vazio (empty state)
  const renderEmptyState = () => (
    <div className="deep-research-empty-state">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        <path d="M11 8a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0V8z" />
        <path d="M11 16a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" />
      </svg>
      <h3>Pesquisa Profunda</h3>
      <p>
        A análise aprofundada validará as informações em fontes oficiais e bases
        governamentais para garantir a precisão da classificação.
      </p>
    </div>
  );

  // Efeito para ajustar o conteúdo baseado no espaço disponível
  useEffect(() => {
    if (!isOpen || !sidebarRef.current || !stepsContainerRef.current) return;

    // Função para lidar com resize da janela - não ajusta mais os passos automaticamente
    const handleResize = () => {
      // Apenas atualizar se necessário, sem forçar minimização
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]); // Removendo steps e currentStepIndex das dependências para não recalcular quando os passos mudam

  // Renderiza o relatório final
  const renderFinalReport = () => {
    if (!finalReport) return null;

    return (
      <div className="deep-research-final-report">
        <div className="final-report-header">
          <div className="final-report-title">
            <FaCheck className="final-report-title-icon" />
            Análise Concluída
          </div>
        </div>

        <div className="final-report-content">
          <div className="final-classification">
            <div className="classification-header">
              <h3>Classificação Tributária</h3>
            </div>
            <div className="classification-data">
              <div className="ncm-box">
                <div className="label">
                  NCM Validado
                  {validationStatus.ncmCode && (
                    <span className="validation-spinner"></span>
                  )}
                </div>
                <div className="value">
                  {hasInitialData
                    ? partialInfo.ncmCode || finalReport.ncmCode
                    : "Carregando..."}
                </div>
              </div>
              <div className="description-box">
                <div className="label">
                  Descrição
                  {validationStatus.ncmDescription && (
                    <span className="validation-spinner"></span>
                  )}
                </div>
                <div className="value">
                  {hasInitialData
                    ? partialInfo.ncmDescription || finalReport.ncmDescription
                    : "Carregando..."}
                </div>
              </div>
            </div>

            {(finalReport.taxationDetails ||
              Object.keys(partialInfo.taxationDetails).length > 0) && (
              <div className="taxation-details">
                <h4>
                  Detalhes Tributários
                  {validationStatus.taxationDetails && (
                    <span className="validation-spinner"></span>
                  )}
                </h4>
                <div className="taxation-grid">
                  {Object.entries(
                    hasInitialData
                      ? partialInfo.taxationDetails ||
                          finalReport.taxationDetails ||
                          {}
                      : {}
                  ).map(([key, value]) => (
                    <div key={key} className="taxation-item">
                      <div className="tax-label">{key.toUpperCase()}</div>
                      <div className="tax-value">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(finalReport.attributes ||
              Object.keys(partialInfo.attributes).length > 0) && (
              <div className="product-attributes">
                <h4>
                  Atributos do Produto
                  {validationStatus.attributes && (
                    <span className="validation-spinner"></span>
                  )}
                </h4>
                <div className="attributes-grid">
                  {Object.entries(
                    hasInitialData
                      ? partialInfo.attributes || finalReport.attributes || {}
                      : {}
                  ).map(([key, value]) => (
                    <div key={key} className="attribute-item">
                      <div className="attribute-label">{key}</div>
                      <div className="attribute-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="conclusion-section">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaClipboardCheck /> Conclusão da Análise
              {validationStatus.conclusion && (
                <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                  Validado
                </span>
              )}
            </h2>
            <p>{finalReport.conclusion}</p>
          </div>
          {renderAttributeTags()}

          <div className="evidences-section">
            <h3>Evidências Principais</h3>
            <div className="evidence-list">
              {finalReport.evidences.slice(0, 3).map((evidence, index) => (
                <div key={index} className={`evidence-item ${evidence.type}`}>
                  <div className="evidence-icon">
                    {renderEvidenceIcon(evidence.type)}
                  </div>
                  <div className="evidence-content">
                    <div className="evidence-text">{evidence.content}</div>
                    <div className="evidence-source">{evidence.source}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="alternative-cases">
            <h3>Cenários Alternativos</h3>
            <div className="case-list">
              {finalReport.alternativeCases.map((altCase, index) => (
                <div key={index} className="case-item">
                  <div className="case-header">
                    {renderCaseIcon()}
                    <h4>{altCase.scenario}</h4>
                  </div>
                  <div className="case-impact">{altCase.impact}</div>
                  {altCase.suggestedNCM && (
                    <div className="case-ncm">
                      NCM Alternativo: {altCase.suggestedNCM}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            className="view-steps-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDetailedSteps(true);
            }}
          >
            <FaArrowDown />
            Ver Passos da Pesquisa (
            {steps.filter((s) => s.status === "completed").length})
          </button>
        </div>
      </div>
    );
  };

  // Função para atualizar os passos com os novos dados
  const updateStepsWithNewData = (step: number, data: any) => {
    if (step > 0) {
      const updatedSteps = [...steps];
      // Todos os passos anteriores estão completos
      for (let i = 0; i < step; i++) {
        updatedSteps[i].status = "completed";
        // Minimiza os passos anteriores
        updatedSteps[i].minimized = true;
      }
      // O passo atual está em processamento
      updatedSteps[step].status = "processing";
      // Expande o passo atual
      updatedSteps[step].minimized = false;

      // Garante que todos os passos futuros também estão minimizados
      for (let i = step + 1; i < updatedSteps.length; i++) {
        updatedSteps[i].minimized = true;
      }

      // Atualiza o conteúdo do passo atual com a mensagem de status
      updatedSteps[step].content = statusMessage;

      // Adiciona os detalhes da pesquisa ao passo atual
      if (data.researchDetails && data.researchDetails.length > 0) {
        const newDetails = data.researchDetails.map((detail: any) => ({
          type: detail.type,
          content: detail.content,
          source: detail.source,
          timestamp: new Date(),
        }));

        // Adiciona os novos detalhes apenas se não existirem já
        if (!updatedSteps[step].details) {
          updatedSteps[step].details = newDetails;
        } else {
          // Verifica se já temos esses detalhes para evitar duplicação
          const existingContents =
            updatedSteps[step].details?.map((d) => d.content) || [];
          const uniqueNewDetails = newDetails.filter(
            (detail: ResearchDetail) =>
              !existingContents.includes(detail.content)
          );

          if (uniqueNewDetails.length > 0) {
            updatedSteps[step].details = [
              ...(updatedSteps[step].details || []),
              ...uniqueNewDetails,
            ];

            // Incrementa a iteração apenas quando novos detalhes são adicionados
            updatedSteps[step].iterations =
              (updatedSteps[step].iterations || 0) + 1;
          }
        }
      }

      setSteps(updatedSteps);
    }
  };

  // Função para atualizar as informações de pesquisa
  const updateResearchInfo = (data: any) => {
    if (data.researchDetails) {
      const newDetails = data.researchDetails.map((detail: any) => ({
        type: detail.type,
        content: detail.content,
        source: detail.source,
        timestamp: new Date(),
      }));

      // Verifica se já temos esses detalhes para evitar duplicação
      const existingContents = researchInfo.map((info) => info.content);
      const uniqueNewDetails = newDetails.filter(
        (detail: ResearchDetail) => !existingContents.includes(detail.content)
      );

      if (uniqueNewDetails.length > 0) {
        setResearchInfo((prevInfo) => [...prevInfo, ...uniqueNewDetails]);
      }
    }
  };

  // Função para lidar com o processo concluído
  const handleCompletedProcess = (step: number, data: any) => {
    // Se completou, expande a última etapa e minimiza todas as outras
    const finalStepIndex = step;
    const finalUpdatedSteps = [...steps];

    finalUpdatedSteps.forEach((s, idx) => {
      // Define o status e minimização de cada passo
      s.status = idx <= finalStepIndex ? "completed" : "waiting";
      s.minimized = idx !== finalStepIndex;
      // Garante que nenhum passo tenha a propriedade hidden ativa
      s.hidden = false;
    });

    setSteps(finalUpdatedSteps);

    // Gerar relatório final com as informações coletadas
    const detailsCollected = researchInfo.filter(
      (info) => info.type !== "question"
    );

    // Processar os atributos detalhados, se disponíveis
    const detailedAttributes =
      data.detailed_attributes || data.atributos_detalhados || [];

    // Mapear os atributos para o formato esperado pelo componente TabelaAtributosNCM
    const formattedAttributes = Array.isArray(detailedAttributes)
      ? detailedAttributes.map((attr) => {
          // Verificar se o atributo já está no formato esperado
          if (attr.codigo && attr.nome && attr.modalidade) {
            return {
              ...attr,
              // Garantir que modalidade esteja em maiúsculas e seja um valor válido
              modalidade:
                attr.modalidade?.toUpperCase() === "IMPORTACAO"
                  ? "IMPORTACAO"
                  : attr.modalidade?.toUpperCase() === "EXPORTACAO"
                  ? "EXPORTACAO"
                  : "AMBOS",
              // Garantir que formaPreenchimento esteja em maiúsculas e seja um valor válido
              formaPreenchimento: [
                "LISTA_ESTATICA",
                "LISTA_DINAMICA",
                "LISTA_TABX_FILTRO",
                "BOOLEANO",
                "TEXTO",
                "NUMERO_INTEIRO",
                "NUMERO_REAL",
                "DATA",
                "DATA_HORA",
                "DOMINIO_DINAMICO",
                "COMPOSTO",
              ].includes(attr.formaPreenchimento?.toUpperCase())
                ? attr.formaPreenchimento?.toUpperCase()
                : "TEXTO",
              // Garantir que obrigatorio seja um booleano
              obrigatorio: !!attr.obrigatorio,
              // Garantir que todos os campos opcionais estejam presentes
              orientacaoPreenchimento: attr.orientacaoPreenchimento || "",
              tamanhoMaximo: attr.tamanhoMaximo || null,
              mascara: attr.mascara || null,
              casasDecimais: attr.casasDecimais || null,
              informacaoAdicional: attr.informacaoAdicional || "",
              dataInicioVigencia: attr.dataInicioVigencia || null,
              dataFimVigencia: attr.dataFimVigencia || null,
              // Garantir que campos de arrays estejam presentes
              dominio: Array.isArray(attr.dominio) ? attr.dominio : [],
              objetivos: Array.isArray(attr.objetivos) ? attr.objetivos : [],
              orgaos: Array.isArray(attr.orgaos) ? attr.orgaos : [],
              // Garantir que campos booleanos estejam presentes
              atributoCondicionante: !!attr.atributoCondicionante,
              multivalorado: !!attr.multivalorado,
              // Se nomeApresentacao não estiver presente, usar o nome
              nomeApresentacao: attr.nomeApresentacao || attr.nome || "",
            };
          }

          // Se não estiver no formato esperado, tentar converter
          return {
            codigo: attr.codigo || attr.code || "",
            nome: attr.nome || attr.name || "",
            nomeApresentacao:
              attr.nomeApresentacao || attr.presentationName || attr.nome || "",
            modalidade:
              attr.modalidade === "IMPORTACAO" ||
              attr.modalidade === "EXPORTACAO"
                ? attr.modalidade
                : "AMBOS",
            formaPreenchimento: [
              "LISTA_ESTATICA",
              "LISTA_DINAMICA",
              "LISTA_TABX_FILTRO",
              "BOOLEANO",
              "TEXTO",
              "NUMERO_INTEIRO",
              "NUMERO_REAL",
              "DATA",
              "DATA_HORA",
              "DOMINIO_DINAMICO",
              "COMPOSTO",
            ].includes(attr.formaPreenchimento?.toUpperCase())
              ? attr.formaPreenchimento?.toUpperCase()
              : "TEXTO",
            obrigatorio: !!attr.obrigatorio,
            orientacaoPreenchimento: attr.orientacaoPreenchimento || "",
            tamanhoMaximo: attr.tamanhoMaximo || null,
            mascara: attr.mascara || null,
            casasDecimais: attr.casasDecimais || null,
            informacaoAdicional: attr.informacaoAdicional || "",
            dataInicioVigencia: attr.dataInicioVigencia || null,
            dataFimVigencia: attr.dataFimVigencia || null,
            dominio: Array.isArray(attr.dominio) ? attr.dominio : [],
            objetivos: Array.isArray(attr.objetivos) ? attr.objetivos : [],
            orgaos: Array.isArray(attr.orgaos) ? attr.orgaos : [],
            atributoCondicionante: !!attr.atributoCondicionante,
            multivalorado: !!attr.multivalorado,
          };
        })
      : [];

    console.log(
      "Atributos formatados para o relatório final:",
      formattedAttributes
    );

    // Exemplo de construção do relatório final
    const report: FinalReport = {
      conclusion: `Após análise detalhada, concluímos que o produto "${productName}" está corretamente classificado com o NCM ${
        data.finalNcm || ncmCode
      }.`,
      evidences: detailsCollected
        .filter((detail) => detail.source && detail.content)
        .map((detail) => ({
          source: detail.source || "Fonte não especificada",
          content: detail.content,
          type:
            detail.content.includes("Lei") || detail.content.includes("Decreto")
              ? "law"
              : detail.content.includes("tribunal") ||
                detail.content.includes("decisão")
              ? "jurisprudence"
              : "technical",
        })),
      alternativeCases: [
        {
          scenario: "Se o produto tiver funcionalidade principal distinta",
          impact: "A classificação poderia mudar para outro capítulo da NCM",
          suggestedNCM: data.alternativeNcm || undefined,
        },
        {
          scenario: "Se o produto apresentar composição material diferente",
          impact: "Poderia haver alteração na alíquota tributária aplicável",
        },
      ],
      ncmCode: data.finalNcm || ncmCode,
      ncmDescription: data.ncmDescription || "Descrição não disponível",
      taxationDetails: data.taxationDetails || {
        ipi: "Conforme tabela TIPI",
        icms: "Conforme regulamentação estadual",
        pis: "Regime normal",
        cofins: "Regime normal",
      },
      attributes: data.attributes || {},
      detailed_attributes: formattedAttributes,
    };

    setFinalReport(report);

    // Verificar se todos os dados necessários foram carregados
    if (
      report &&
      report.ncmCode &&
      report.ncmDescription &&
      Object.keys(report.taxationDetails || {}).length > 0
    ) {
      console.log(
        "Todos os dados necessários foram carregados, finalizando loading..."
      );
      // Só chamar onProcessComplete quando todos os dados estiverem prontos
      if (onProcessComplete) {
        onProcessComplete();
      }
    } else {
      console.log(
        "Dados incompletos, aguardando mais dados antes de finalizar loading..."
      );
    }
  };

  // Helper function to map DeepResearchStep to AIReasoningStep
  const mapStepToAIReasoningStep = (
    step: ResearchStep,
    currentProcessingId: number | string | null,
    processingState: boolean
  ): ReasoningStep => {
    let status: ReasoningStep["status"] = "pending";
    if (step.status === "error") {
      status = "error";
    } else if (step.id === currentProcessingId && processingState) {
      status = "processing";
    } else if (step.status === "completed") {
      status = "completed";
    }

    // Adicionar lógica para raciocínio atual
    const details = [...(step.details || [])];

    // Se este passo for o passo atual e temos linhas de raciocínio, adiciona-as aos detalhes
    if (step.id === currentProcessingId && currentReasoning.length > 0) {
      // Mostrar no máximo 3 linhas de raciocínio para não sobrecarregar a UI
      const recentReasoning = currentReasoning.slice(-3);

      recentReasoning.forEach((line) => {
        details.push({
          type: "text", // usando "text" que é um tipo válido em vez de "reasoning"
          content: line,
          source: "AI Reasoning",
          timestamp: new Date(), // adicionando timestamp necessário
        });
      });
    }

    // Adicionar o componente de raciocínio em tempo real se for o passo atual
    if (step.id === currentProcessingId && processingState) {
      details.push({
        type: "custom",
        content: `<LiveReasoningComponent>`,
        source: "Raciocínio em tempo real",
        timestamp: new Date(),
        customRender: () => (
          <div className="live-reasoning-container">
            <div ref={reasoningContainerRef} className="live-reasoning-content">
              {displayedReasoning}
              <span className="typing-cursor"></span>
            </div>
          </div>
        ),
      });
    }

    // Se for o passo 2 (Pesquisa de fontes oficiais) e temos URLs, adiciona-as aos detalhes
    if (step.id === 2 && sourceUrls.length > 0) {
      sourceUrls.forEach((urlData) => {
        details.push({
          type: "link",
          content: urlData.url,
          source: urlData.favicon || "URL Source",
          timestamp: new Date(), // adicionando timestamp necessário
        });
      });
    }

    return {
      id: step.id,
      title: step.title,
      description: step.content, // Map content to description
      status: status,
      details: details, // Usar a versão modificada dos detalhes
    };
  };

  // Retornar uma classe baseada no status do passo
  const getStepStatusClass = (index: number) => {
    if (index < currentStepIndex) {
      return "completed";
    } else if (index === currentStepIndex) {
      return "active";
    } else if (steps[index]?.status === "error") {
      return "error";
    }
    return "";
  };

  // Renderizar o ícone correspondente ao tipo de evidência
  const renderEvidenceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "lei":
      case "law":
        return <FaBook className="evidence-icon" />;
      case "jurisprudencia":
      case "jurisprudência":
      case "jurisprudence":
        return <FaFile className="evidence-icon" />;
      case "tecnico":
      case "técnico":
      case "technical":
        return <FaPencilAlt className="evidence-icon" />;
      default:
        return <FaLightbulb className="evidence-icon" />;
    }
  };

  // Renderizar ícone para casos alternativos
  const renderCaseIcon = () => {
    return <FaExclamationTriangle />;
  };

  // Renderizar o indicador do passo
  const renderStepIndicator = (step: ResearchStep, index: number) => {
    if (index < currentStepIndex) {
      return <FaCheck />;
    }

    if (step.status === "processing") {
      return <Spinner classes="step-spinner" />;
    }

    if (step.status === "error") {
      return <FaTimes />;
    }

    return index + 1;
  };

  // Dentro do componente, antes do return principal:
  const renderStepContent = (step: ResearchStep, index: number) => {
    if (hasError) {
      return (
        <div className="deep-research-error-state">
          <FaExclamationTriangle />
          <p>{errorMessage || "Erro ao carregar dados do servidor"}</p>
        </div>
      );
    }

    if (isLoading && !step.content) {
      return <Spinner classes="step-spinner" />;
    }

    return (
      <>
        <p>{step.content}</p>
        {step.details && step.details.length > 0 && (
          <div className="deep-research-step-details">
            {step.details.map((detail, detailIndex) => (
              <div
                key={`${step.id}-${detailIndex}`}
                className="deep-research-detail"
              >
                <div className="deep-research-detail-content">
                  {detail.type === "link" && (
                    <svg
                      className="deep-research-detail-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  )}

                  {detail.type === "text" && (
                    <svg
                      className="deep-research-detail-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}

                  {detail.type === "law" && (
                    <svg
                      className="deep-research-detail-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                  )}

                  {detail.type === "question" && (
                    <svg
                      className="deep-research-detail-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}

                  {detail.type === "custom" && detail.customRender ? (
                    detail.customRender()
                  ) : (
                    <span className="deep-research-detail-text">
                      {detail.content}
                    </span>
                  )}
                </div>
                {detail.source && detail.type !== "custom" && (
                  <div className="deep-research-detail-source">
                    {detail.source}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  // Determine the overall processing state *once*
  const isCurrentlyProcessing = isLoading || sidebarStatus === "processing";

  // Adicione esta função dentro do componente DeepResearchSidebar, antes do return
  const renderAttributeTags = () => {
    if (!finalReport?.detailed_attributes?.length) {
      return null;
    }

    return (
      <div className="attributes-container my-4">
        <h3 className="text-xl font-semibold mb-2">Atributos NCM</h3>
        <TabelaAtributosNCM
          atributos={finalReport.detailed_attributes}
          isLoading={false}
          error={null}
        />
      </div>
    );
  };

  // Retorna a estrutura visual do componente
  return (
    <aside
      ref={sidebarRef}
      className={`deep-research-sidebar ${sidebarStatus || ""} ${
        !hasInitialData && sidebarStatus === "processing"
          ? "skeleton-loading"
          : ""
      }`}
    >
      <div className="deep-research-sidebar-header">
        <div className="deep-research-sidebar-title">
          <FaProjectDiagram className="deep-research-sidebar-title-icon" />
          Pesquisa Profunda
          {/* Botão de cancelamento - mostrado apenas quando está processando */}
          {(sidebarStatus === "processing" || isProcessing) && (
            <button
              className="deep-research-cancel-btn"
              onClick={handleCancelRequest}
              title="Cancelar pesquisa"
            >
              <FaTimes />
              Cancelar
            </button>
          )}
        </div>
        <div className="deep-research-sidebar-subtitle">
          Análise detalhada do produto: {productName}
        </div>
      </div>

      <div className="deep-research-sidebar-content">
        {sidebarStatus === "empty" ? (
          renderEmptyState()
        ) : sidebarStatus === "completed" && finalReport ? (
          showDetailedSteps ? (
            <div className="detailed-steps-container">
              <div className="detailed-steps-header">
                <button
                  className="back-to-summary-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDetailedSteps(false);
                  }}
                >
                  <FaArrowUp />
                  Voltar ao Resumo
                </button>
                <h3>
                  Passos da Pesquisa ({" "}
                  {steps.filter((s) => s.status === "completed").length} )
                </h3>
              </div>
              <AIReasoningSteps
                steps={steps.map((step) =>
                  mapStepToAIReasoningStep(
                    step,
                    steps[currentStepIndex]?.id,
                    isCurrentlyProcessing
                  )
                )}
                currentStepId={steps[currentStepIndex]?.id}
                isProcessing={isCurrentlyProcessing}
                title="Detalhes da Pesquisa Profunda"
                description={`Análise passo a passo para ${productName}`}
              />
            </div>
          ) : (
            renderFinalReport()
          )
        ) : (
          <AIReasoningSteps
            steps={steps.map((step) =>
              mapStepToAIReasoningStep(
                step,
                steps[currentStepIndex]?.id,
                isCurrentlyProcessing
              )
            )}
            currentStepId={steps[currentStepIndex]?.id}
            isProcessing={isCurrentlyProcessing}
            title="Pesquisa Profunda em Andamento"
            description={`Analisando ${productName}...`}
          />
        )}
      </div>
    </aside>
  );
};

export default DeepResearchSidebar;
