import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "../../axiosConfig";
import {
  DeepResearchSidebarProps,
  ResearchStep,
  ResearchDetail,
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
} from "react-icons/fa";
import clsx from "clsx";
import { normalizeResponse } from "../../utils/llm-json-normalizer";

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
}) => {
  const [steps, setSteps] = useState<ResearchStep[]>([
    {
      id: 1,
      title: "Iniciando pesquisa",
      content: "Preparando análise detalhada do produto",
      status: "waiting",
      iterations: 0,
      minimized: false,
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

  // Estado para controlar a validação de acordo com o esquema normalizado
  const [componentValidationStatus, setComponentValidationStatus] = useState({
    infoBasicas: { validated: false, loading: true },
    atributos: { validated: false, loading: false },
    tributacao: { validated: false, loading: false },
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

  // Efeito para sincronizar o estado de processamento com o InputAI
  useEffect(() => {
    console.log("Estado de processamento mudou:", {
      isProcessing,
      requestId,
      sidebarStatus,
    });

    if (isProcessing) {
      setSidebarStatus("processing");

      // Quando começa o processamento, garante que apenas o primeiro passo esteja expandido
      const updatedSteps = [...steps];
      updatedSteps.forEach((step, index) => {
        step.minimized = index !== 0;
      });
      setSteps(updatedSteps);
    } else if (!isProcessing && !requestId) {
      setSidebarStatus("empty");

      // No estado vazio, todos os passos estão minimizados
      const updatedSteps = [...steps];
      updatedSteps.forEach((step) => {
        step.minimized = true;
      });
      setSteps(updatedSteps);
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
    console.log("requestId mudou:", requestId, "sidebarStatus:", sidebarStatus);

    if (!requestId) {
      // Caso não tenhamos um requestId, mostramos o estado vazio
      setSidebarStatus("empty");

      // No estado vazio, todos os passos estão minimizados
      const updatedSteps = [...steps];
      updatedSteps.forEach((step) => {
        step.minimized = true;
      });
      setSteps(updatedSteps);

      return;
    }

    // Se estiver no estado inicial/loading
    if (requestId === "loading") {
      setStatusMessage("Iniciando análise avançada com IA...");
      setCurrentStepIndex(0);

      // Garante que apenas o primeiro passo esteja expandido no início
      const updatedSteps = [...steps];
      updatedSteps.forEach((step, index) => {
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
      return;
    }

    let isMounted = true;
    let intervalId: number | null = null;

    // Função para atualizar o status
    const fetchStatus = async () => {
      try {
        // Verifica se há token no localStorage
        const session = localStorage.getItem(
          "sb-qrfxqaovpddcziulqflw-auth-token"
        );
        if (!session) {
          setHasError(true);
          setErrorMessage("Sessão não encontrada");
          return;
        }

        // Extrai o token de forma mais segura
        let token;
        try {
          const parsedSession = JSON.parse(session);
          token = parsedSession.access_token;

          if (!token) {
            console.error("Token não encontrado na sessão");
            setHasError(true);
            setErrorMessage("Token de autenticação não encontrado");
            return;
          }
        } catch (parseError) {
          console.error("Erro ao fazer parse da sessão:", parseError);
          setHasError(true);
          setErrorMessage("Erro ao processar dados de autenticação");
          return;
        }

        // Fazendo uma requisição normal para o endpoint existente
        const response = await api.get(`/task-status/${requestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!isMounted) return;

        // Normaliza a resposta para lidar com possíveis inconsistências no JSON da LLM
        const normalizedData = normalizeResponse(response.data);

        // Processa a resposta normalizada
        const {
          step = 0,
          completed = false,
          validationStatus: componentStatus = {
            infoBasicas: { validated: false, loading: true },
            atributos: { validated: false, loading: false },
            tributacao: { validated: false, loading: false },
          },
          result = [],
        } = normalizedData;

        console.log("Dados normalizados:", {
          step,
          currentStep: currentStepIndex,
          completed,
          componentStatus,
        });

        setHasError(false);

        // Atualiza o estado de validação dos componentes
        setComponentValidationStatus(componentStatus);

        // Se recebemos dados pela primeira vez, removemos o skeleton
        if (!hasInitialData) {
          setHasInitialData(true);
        }

        // Atualiza informações parciais se disponíveis na resposta
        if (result.length > 0) {
          const resultData = result[0];

          // Atualiza as informações parciais baseado nos resultados
          setPartialInfo({
            ncmCode: resultData.ncm || ncmCode,
            ncmDescription: resultData.descricao || "",
            taxationDetails: {
              ipi: resultData.valores_de_impostos?.ipi || "",
              icms: resultData.valores_de_impostos?.icms || {},
              pis: resultData.valores_de_impostos?.pis || "",
              cofins: resultData.valores_de_impostos?.cofins || "",
            },
            attributes:
              resultData.atributos?.reduce(
                (acc: Record<string, string>, attr: string, index: number) => {
                  acc[`atributo_${index + 1}`] = attr;
                  return acc;
                },
                {} as Record<string, string>
              ) || {},
          });

          // Atualiza o estado de validação para a UI baseado na validação dos componentes
          setValidationStatus({
            ncmCode: componentStatus.infoBasicas.loading,
            ncmDescription: componentStatus.infoBasicas.loading,
            attributes: componentStatus.atributos.loading,
            taxationDetails: componentStatus.tributacao.loading,
            conclusion: !completed,
          });
        }

        // Atualiza os passos com base no status de validação
        updateStepsWithValidationStatus(step, componentStatus);

        // Atualiza a mensagem principal
        let message = PROGRESS_MESSAGES[
          Math.min(step, PROGRESS_MESSAGES.length - 1)
        ]
          .replace("{produto}", productName)
          .replace("{ncm}", ncmCode);
        setStatusMessage(message);

        // Adiciona novas informações de pesquisa se disponíveis
        updateResearchInfo(response.data);

        // Verifica se o processamento foi concluído
        if (completed) {
          setSidebarStatus("completed");
          setIsLoading(false);

          // Cancelar o intervalo quando completa
          if (intervalId) {
            window.clearInterval(intervalId);
            intervalId = null;
          }

          // Exibição do relatório final e outras ações de conclusão
          handleCompletedProcess(step, normalizedData);
        } else {
          setSidebarStatus("processing");
        }
      } catch (error) {
        console.error("Erro ao processar requisição:", error);
        setHasError(true);
        setErrorMessage("Erro na conexão com o servidor");
      }
    };

    // Função para atualizar os passos com base no status de validação
    const updateStepsWithValidationStatus = (
      stepIndex: number,
      componentStatus: {
        infoBasicas: { validated: boolean; loading: boolean };
        atributos: { validated: boolean; loading: boolean };
        tributacao: { validated: boolean; loading: boolean };
      }
    ) => {
      console.log(
        "Atualizando passos com stepIndex:",
        stepIndex,
        "componentStatus:",
        componentStatus
      );

      // Força progresso se o passo continuar o mesmo por muito tempo
      if (stepIndex === currentStepIndex && prevStepIndex === stepIndex) {
        // Incrementa o contador para forçar progresso
        const forceProgressionCounter =
          (window as any).forceProgressionCounter || 0;
        if (forceProgressionCounter > 5) {
          console.log("Forçando progresso para o próximo passo");
          stepIndex = Math.min(stepIndex + 1, steps.length - 1);
          (window as any).forceProgressionCounter = 0;
        } else {
          (window as any).forceProgressionCounter = forceProgressionCounter + 1;
        }
      } else {
        (window as any).forceProgressionCounter = 0;
      }

      const updatedSteps = [...steps];

      // Garante que o índice do passo seja válido
      const safeStepIndex = Math.min(Math.max(0, stepIndex), steps.length - 1);

      // Mapeamento entre os componentes e os passos
      const stepMapping = {
        infoBasicas: [0, 1], // Passos relacionados às informações básicas
        atributos: [2, 3], // Passos relacionados aos atributos
        tributacao: [4, 5], // Passos relacionados à tributação
      };

      // Atualizar cada passo com base no status do componente correspondente
      for (const [component, stepIndices] of Object.entries(stepMapping)) {
        const status =
          componentStatus[component as keyof typeof componentStatus];

        for (const idx of stepIndices) {
          if (idx < updatedSteps.length) {
            // Se o componente foi validado, marcar como completo
            if (status.validated) {
              // Se o status era processing, adiciona uma notificação de sucesso
              if (updatedSteps[idx].status === "processing") {
                updatedSteps[idx].notification = {
                  type: "success",
                  message: "Etapa concluída com sucesso",
                  duration: 3000,
                };
              }

              updatedSteps[idx].status = "completed";

              // Apenas se estiver em processamento ativo, minimiza passos anteriores
              // e não afeta passos que o usuário abriu manualmente
              if (isProcessing && idx !== safeStepIndex) {
                updatedSteps[idx].minimized =
                  idx !== prevStepIndex || updatedSteps[idx].minimized;
              }

              // Adiciona progresso 100%
              updatedSteps[idx].progress = {
                percentage: 100,
                text: "Concluído",
              };
            }
            // Se está em loading, mostrar como processando
            else if (status.loading) {
              updatedSteps[idx].status = "processing";

              // Durante o processamento ativo, expandimos apenas o passo atual
              // sem fechar os que o usuário abriu manualmente
              if (isProcessing) {
                if (idx === safeStepIndex) {
                  updatedSteps[idx].minimized = false;
                }
              }

              // Adiciona progresso parcial
              updatedSteps[idx].progress = {
                percentage:
                  idx < safeStepIndex ? 100 : idx === safeStepIndex ? 60 : 0,
                text: idx === safeStepIndex ? "Processando..." : "",
              };
            }
            // Caso contrário, está aguardando
            else {
              // Não alteramos o status para waiting se já estiver em processing/completed
              if (updatedSteps[idx].status === "waiting") {
                // Se for o passo atual ou um passo futuro que está dentro do componente atual em processamento
                if (
                  idx === safeStepIndex ||
                  (idx > safeStepIndex && stepIndices.includes(safeStepIndex))
                ) {
                  updatedSteps[idx].status = "processing";

                  // Adiciona progresso parcial para indicar que está relacionado ao componente atual
                  updatedSteps[idx].progress = {
                    percentage: idx === safeStepIndex ? 30 : 0,
                    text: idx === safeStepIndex ? "Iniciando..." : "Aguardando",
                  };
                }
              }

              // Não alteramos o estado minimizado dos passos em espera
            }
          }
        }
      }

      // Atualiza os passos baseado no passo atual
      for (let i = 0; i < updatedSteps.length; i++) {
        // Passos anteriores são sempre marcados como completos
        if (i < safeStepIndex) {
          updatedSteps[i].status = "completed";
          updatedSteps[i].progress = {
            percentage: 100,
            text: "Concluído",
          };
        }
        // O passo atual está sempre em processamento
        else if (i === safeStepIndex) {
          updatedSteps[i].status = "processing";
          // O passo atual nunca é minimizado durante o processamento
          if (isProcessing) {
            updatedSteps[i].minimized = false;
          }
          // Se não tiver progresso definido, define um padrão
          if (!updatedSteps[i].progress) {
            updatedSteps[i].progress = {
              percentage: 30,
              text: "Processando...",
            };
          }
        }
      }

      console.log(
        "Passos atualizados:",
        updatedSteps.map((s) => ({
          id: s.id,
          status: s.status,
          minimized: s.minimized,
        }))
      );

      setSteps(updatedSteps);
      setCurrentStepIndex(safeStepIndex);
      // Atualizamos o prevStepIndex para controlar as transições
      setPrevStepIndex(safeStepIndex);
    };

    // Função para atualizar as informações de pesquisa e tratar erros
    const updateResearchInfo = (data: any) => {
      try {
        if (data.error) {
          // Trata o erro e mostra notificação no passo atual
          const errorStep = [...steps];
          if (currentStepIndex >= 0 && currentStepIndex < errorStep.length) {
            errorStep[currentStepIndex].status = "error";
            errorStep[currentStepIndex].notification = {
              type: "error",
              message: data.error.message || "Erro durante o processamento",
              duration: 0, // Persistente
            };

            // Garantimos que o passo com erro esteja visível
            errorStep[currentStepIndex].minimized = false;
            setHasError(true);
            setErrorMessage(
              data.error.message || "Erro durante o processamento"
            );
          }
          setSteps(errorStep);
          console.error("Erro na resposta:", data.error);
          return;
        }

        // Processa os detalhes de pesquisa
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
            (detail: ResearchDetail) =>
              !existingContents.includes(detail.content)
          );

          // Associa os detalhes ao passo correspondente
          if (uniqueNewDetails.length > 0) {
            setResearchInfo((prevInfo) => [...prevInfo, ...uniqueNewDetails]);

            // Adiciona detalhes ao passo atual
            const updatedStepsWithDetails = [...steps];
            if (
              currentStepIndex >= 0 &&
              currentStepIndex < updatedStepsWithDetails.length
            ) {
              // Se o passo já tem detalhes, adiciona os novos
              updatedStepsWithDetails[currentStepIndex].details = [
                ...(updatedStepsWithDetails[currentStepIndex].details || []),
                ...uniqueNewDetails,
              ];

              // Incrementa o contador de iterações
              updatedStepsWithDetails[currentStepIndex].iterations =
                (updatedStepsWithDetails[currentStepIndex].iterations || 0) + 1;

              setSteps(updatedStepsWithDetails);
            }
          }
        }

        // Atualiza os dados de progresso parcial
        if (data.validationStatus && data.step !== undefined) {
          updateStepsWithValidationStatus(data.step, data.validationStatus);
        }
      } catch (error) {
        console.error("Erro ao processar resposta:", error);
        setHasError(true);
        setErrorMessage("Erro ao processar resposta do servidor");
      }
    };

    // Função para lidar com o processo concluído
    const handleCompletedProcess = (step: number, normalizedData: any) => {
      // Se completou, expande a última etapa e minimiza todas as outras
      const finalStepIndex = steps.length - 1; // Sempre mostrar o último passo na conclusão
      const finalUpdatedSteps = [...steps];

      finalUpdatedSteps.forEach((s, idx) => {
        // Define o status e minimização de cada passo
        s.status = "completed";
        s.minimized = idx !== finalStepIndex;
        // Garante que nenhum passo tenha a propriedade hidden ativa
        s.hidden = false;
      });

      setSteps(finalUpdatedSteps);

      // Extrai os dados do resultado normalizado
      const resultData =
        normalizedData.result.length > 0 ? normalizedData.result[0] : null;

      if (resultData) {
        // Gerar relatório final com as informações coletadas
        const detailsCollected = researchInfo.filter(
          (info) => info.type !== "question"
        );

        // Construção do relatório final com os dados normalizados
        const report: FinalReport = {
          conclusion: `Após análise detalhada, concluímos que o produto "${productName}" está corretamente classificado com o NCM ${
            resultData.ncm || ncmCode
          }.`,
          evidences: detailsCollected
            .filter((detail) => detail.source && detail.content)
            .map((detail) => ({
              source: detail.source || "Fonte não especificada",
              content: detail.content,
              type:
                detail.content.includes("Lei") ||
                detail.content.includes("Decreto")
                  ? "law"
                  : detail.content.includes("tribunal") ||
                    detail.content.includes("decisão")
                  ? "jurisprudence"
                  : "technical",
            })),
          alternativeCases: [
            {
              scenario: "Se o produto tiver funcionalidade principal distinta",
              impact:
                "A classificação poderia mudar para outro capítulo da NCM",
              suggestedNCM: normalizedData.alternativeNcm || undefined,
            },
            {
              scenario: "Se o produto apresentar composição material diferente",
              impact:
                "Poderia haver alteração na alíquota tributária aplicável",
            },
          ],
          ncmCode: resultData.ncm || ncmCode,
          ncmDescription: resultData.descricao || "Descrição não disponível",
          taxationDetails: {
            ipi: resultData.valores_de_impostos?.ipi || "Conforme tabela TIPI",
            icms: resultData.valores_de_impostos?.icms
              ? Object.entries(resultData.valores_de_impostos.icms)
                  .map(([estado, valor]) => `${estado}: ${valor}`)
                  .join(", ")
              : "Conforme regulamentação estadual",
            pis: resultData.valores_de_impostos?.pis || "Regime normal",
            cofins: resultData.valores_de_impostos?.cofins || "Regime normal",
            importTax: "Consultar tabela vigente",
          },
          attributes:
            resultData.atributos?.reduce(
              (acc: Record<string, string>, attr: string, index: number) => {
                acc[`atributo_${index + 1}`] = attr;
                return acc;
              },
              {} as Record<string, string>
            ) || {},
        };

        setFinalReport(report);
      }

      // Define todos os estados de validação como concluídos
      setValidationStatus({
        ncmCode: false,
        ncmDescription: false,
        taxationDetails: false,
        attributes: false,
        conclusion: false,
      });

      // Define todos os componentes como validados e não em loading
      setComponentValidationStatus({
        infoBasicas: { validated: true, loading: false },
        atributos: { validated: true, loading: false },
        tributacao: { validated: true, loading: false },
      });
    };

    // Iniciar com a primeira consulta
    fetchStatus();

    // Configurar a consulta periódica (a cada 2 segundos)
    intervalId = window.setInterval(fetchStatus, 2000);

    // Limpeza ao desmontar o componente
    return () => {
      isMounted = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [requestId, productName, ncmCode, steps]); // Adicionando steps para garantir atualização

  // Função de cancelamento
  const handleCancelRequest = () => {
    // Aborta qualquer requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Chama o endpoint de cancelamento se tivermos um requestId
    if (requestId) {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";

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
            <h3>
              Conclusão da Análise
              {validationStatus.conclusion && (
                <span className="validation-spinner"></span>
              )}
            </h3>
            <p>{finalReport.conclusion}</p>
          </div>

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

  // Renderiza os passos com cabeçalho personalizados
  const renderDetailedSteps = () => {
    return (
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
            Passos da Pesquisa (
            {steps.filter((s) => s.status === "completed").length})
          </h3>
        </div>

        <ul className="deep-research-steps" ref={stepsContainerRef}>
          {steps.map((step, index) =>
            step.hidden ? null : (
              <li
                key={step.id}
                className={`deep-research-step ${step.status} ${
                  index === currentStepIndex ? "active" : ""
                } ${step.minimized ? "minimized" : ""}`}
              >
                <div
                  className="deep-research-step-header"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Toggle minimizado para qualquer passo, permitindo que o usuário controle
                    toggleStep(index);
                  }}
                >
                  <div className="deep-research-step-indicator">
                    {renderStepIndicator(step, index)}
                  </div>
                  <div className="deep-research-step-title">
                    {step.title}
                    {step.iterations && step.iterations > 0 ? (
                      <span className="deep-research-iterations-count">
                        {step.iterations}
                      </span>
                    ) : null}
                    <button
                      className="deep-research-toggle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(index);
                      }}
                    >
                      {step.minimized ? "+" : "−"}
                    </button>
                  </div>
                </div>

                <div className="deep-research-step-content">
                  {!step.minimized && renderStepContent(step, index)}
                </div>
              </li>
            )
          )}
        </ul>
      </div>
    );
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

  // Função para alternar o estado minimizado de um passo
  const toggleStep = (index: number) => {
    const newSteps = [...steps];

    // Apenas alterna o estado minimizado do passo clicado, sem afetar os outros
    newSteps[index].minimized = !newSteps[index].minimized;

    setSteps(newSteps);
  };

  // Renderização do conteúdo do passo com melhorias visuais e feedback
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
        <p className="deep-research-step-description">{step.content}</p>

        {/* Barra de progresso, se disponível */}
        {step.progress && (
          <div className="deep-research-progress">
            <div
              className="deep-research-progress-bar"
              style={{ width: `${step.progress.percentage}%` }}
            >
              {step.progress.text && (
                <span className="deep-research-progress-text">
                  {step.progress.text}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notificação, se disponível */}
        {step.notification && (
          <div
            className={`deep-research-notification ${step.notification.type}`}
          >
            {step.notification.type === "error" && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
            {step.notification.type === "success" && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {step.notification.message}
          </div>
        )}

        {/* Detalhes do passo */}
        {step.details && step.details.length > 0 && (
          <div className="deep-research-step-details">
            {step.details.map((detail, detailIndex) => (
              <div
                key={`${step.id}-${detailIndex}`}
                className={`deep-research-detail ${detail.type}`}
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

                  <span className="deep-research-detail-text">
                    {detail.content}
                  </span>
                </div>
                {detail.source && (
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
        {/* Status atual da pesquisa - visível durante o processamento */}
        {(sidebarStatus === "processing" || isProcessing) && (
          <div className="deep-research-current-status" aria-live="polite">
            <span className="status-indicator"></span>
            {statusMessage}
          </div>
        )}
      </div>

      <div className="deep-research-sidebar-content">
        {sidebarStatus === "empty" ? (
          renderEmptyState()
        ) : sidebarStatus === "completed" && finalReport ? (
          showDetailedSteps ? (
            renderDetailedSteps()
          ) : (
            renderFinalReport()
          )
        ) : (
          <ul className="deep-research-steps" ref={stepsContainerRef}>
            {steps.map((step, index) =>
              step.hidden ? null : (
                <li
                  key={step.id}
                  className={clsx("deep-research-step", {
                    minimized: step.minimized,
                    active: index === currentStepIndex,
                    completed: index < currentStepIndex,
                    error: hasError,
                    loading: isLoading && index === currentStepIndex,
                  })}
                >
                  <div
                    className="deep-research-step-header"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Toggle minimizado para qualquer passo, permitindo que o usuário controle
                      toggleStep(index);
                    }}
                  >
                    <div className="deep-research-step-indicator">
                      {renderStepIndicator(step, index)}
                    </div>
                    <div className="deep-research-step-title">
                      {step.title}
                      {step.iterations && step.iterations > 0 ? (
                        <span className="deep-research-iterations-count">
                          {step.iterations}
                        </span>
                      ) : null}
                      <button
                        className="deep-research-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(index);
                        }}
                      >
                        {step.minimized ? "+" : "−"}
                      </button>
                    </div>
                  </div>

                  <div className="deep-research-step-content">
                    {!step.minimized && renderStepContent(step, index)}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default DeepResearchSidebar;
