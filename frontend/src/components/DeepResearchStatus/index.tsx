import React, { useState, useEffect } from "react";
import api from "../../axiosConfig";
import { DeepResearchStatusProps, ResearchInfo } from "./types";
import "./styles.css";

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
 * Componente para exibir o status atual do processo DeepResearch
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const DeepResearchStatus: React.FC<DeepResearchStatusProps> = ({
  requestId,
  productName,
  ncmCode = "",
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState(PROGRESS_MESSAGES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [researchInfo, setResearchInfo] = useState<ResearchInfo[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Verifica se já está concluído no localStorage
    const completedRequestsStr = localStorage.getItem(
      "completedDeepResearchRequests"
    );
    const completedRequests = completedRequestsStr
      ? JSON.parse(completedRequestsStr)
      : [];

    // Se esse requestId já estiver marcado como concluído, não fazemos mais verificações
    if (requestId && completedRequests.includes(requestId)) {
      setIsLoading(false);
      setIsCompleted(true);
      setStatusMessage("Análise concluída com sucesso!");
      return;
    }

    if (!requestId) return;

    let isMounted = true;
    const controller = new AbortController();

    const checkStatus = async () => {
      // Se estiver no estado de loading inicial
      if (requestId === "loading") {
        if (isMounted) {
          setStatusMessage("Iniciando análise avançada com IA...");
          setCurrentStep(0);
          setResearchInfo([
            {
              type: "question",
              content: `Iniciando análise detalhada do produto: ${productName}`,
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      try {
        // Verifica se há token no localStorage
        const session = localStorage.getItem(
          "sb-qrfxqaovpddcziulqflw-auth-token"
        );
        if (!session) {
          throw new Error("Sessão não encontrada");
        }

        const response = await api.get(`/task-status/${requestId}`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${JSON.parse(session).access_token}`,
          },
        });

        if (isMounted && response.data) {
          setHasError(false);
          const stepIndex =
            response.data.step !== undefined ? response.data.step : 0;
          const step = Math.min(stepIndex, PROGRESS_MESSAGES.length - 1);
          setCurrentStep(step);

          // Atualiza a mensagem principal
          if (response.data.currentAction) {
            setStatusMessage(response.data.currentAction);
          } else {
            let message = PROGRESS_MESSAGES[step]
              .replace("{produto}", productName)
              .replace("{ncm}", ncmCode);
            setStatusMessage(message);
          }

          // Adiciona novas informações de pesquisa se disponíveis
          if (response.data.researchDetails) {
            setResearchInfo((prevInfo) => [
              ...prevInfo,
              ...response.data.researchDetails.map((detail: any) => ({
                type: detail.type,
                content: detail.content,
                source: detail.source,
                timestamp: new Date(),
              })),
            ]);
          }

          if (!response.data.completed) {
            setTimeout(checkStatus, 2000);
          } else {
            setIsLoading(false);
            setIsCompleted(true);

            // Salva o requestId como concluído no localStorage
            const completedRequestsStr = localStorage.getItem(
              "completedDeepResearchRequests"
            );
            const completedRequests = completedRequestsStr
              ? JSON.parse(completedRequestsStr)
              : [];

            if (!completedRequests.includes(requestId)) {
              completedRequests.push(requestId);
              localStorage.setItem(
                "completedDeepResearchRequests",
                JSON.stringify(completedRequests)
              );
            }
          }
        }
      } catch (error: any) {
        console.error("Erro ao verificar status da tarefa:", error);

        // Se for erro de autenticação, tenta recarregar a página
        if (error.response?.status === 401) {
          setHasError(true);
          setStatusMessage("Erro de autenticação. Tentando reconectar...");
          // Aguarda 5 segundos antes de tentar novamente
          setTimeout(checkStatus, 5000);
        } else if (isMounted) {
          setHasError(true);
          setStatusMessage("Erro ao verificar status. Tentando novamente...");
          setTimeout(checkStatus, 3000);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [requestId, productName, ncmCode]);

  return (
    <div className="space-y-4">
      {/* Lista de Informações de Pesquisa */}
      <div className="space-y-4">
        {researchInfo.map((info, index) => (
          <div
            key={index}
            className={`p-4 ${
              index === 0 && isLoading ? "border-l-4 border-l-primary" : ""
            } 
              bg-background border border-border rounded-lg shadow-sm 
              flex items-start gap-2 break-words whitespace-normal flex-grow`}
          >
            {info.type === "link" && (
              <>
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
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
                <div className="flex-grow">
                  <p className="text-sm text-text-primary break-words whitespace-normal">
                    {info.content}
                  </p>
                  {info.source && (
                    <p className="text-xs text-text-secondary mt-1 break-words whitespace-normal">
                      {info.source}
                    </p>
                  )}
                </div>
              </>
            )}

            {info.type === "text" && (
              <>
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
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
                <p className="text-sm text-text-primary break-words whitespace-normal flex-grow">
                  {info.content}
                </p>
              </>
            )}

            {info.type === "law" && (
              <>
                <svg
                  className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
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
                <div className="flex-grow">
                  <p className="text-sm text-text-primary break-words whitespace-normal">
                    {info.content}
                  </p>
                  {info.source && (
                    <p className="text-xs text-text-secondary mt-1 break-words whitespace-normal">
                      {info.source}
                    </p>
                  )}
                </div>
              </>
            )}

            {info.type === "question" && (
              <>
                <svg
                  className={`w-5 h-5 ${
                    isLoading && index === researchInfo.length - 1
                      ? "text-primary animate-pulse"
                      : "text-primary"
                  } mt-0.5 flex-shrink-0`}
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
                <p className="text-sm text-text-primary break-words whitespace-normal flex-grow">
                  {info.content}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Barra de Progresso Fixa no Topo */}
      <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-text-primary">
            {hasError ? "Reconectando..." : statusMessage}
          </h3>
          {isLoading && (
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="w-full bg-border/50 rounded-full h-2 mb-1">
          <div
            className={`h-2 rounded-full ${
              hasError ? "bg-yellow-500" : "bg-primary"
            } transition-all ${isLoading ? "animate-pulse" : ""}`}
            style={{
              width: `${
                hasError
                  ? "100"
                  : isLoading
                  ? Math.min(
                      ((currentStep + 1) / PROGRESS_MESSAGES.length) * 100,
                      95
                    )
                  : "100"
              }%`,
            }}
          ></div>
        </div>

        <p className="text-xs text-text-secondary">
          {hasError
            ? "Tentando reconectar ao servidor..."
            : isLoading
            ? `Etapa ${currentStep + 1} de ${PROGRESS_MESSAGES.length}`
            : "Análise concluída!"}
        </p>
      </div>
    </div>
  );
};

export default DeepResearchStatus;
