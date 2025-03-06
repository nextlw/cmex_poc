import React, { useState, useEffect } from "react";
import api from "../axiosConfig";

// Interface para o componente seguindo o mesmo padrão do DeepResearchToggle
interface DeepResearchStatusProps {
  requestId: string | null;
  productName: string;
  ncmCode?: string;
}

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

interface ResearchInfo {
  type: "link" | "text" | "law" | "question";
  content: string;
  source?: string;
  timestamp: Date;
}

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

  useEffect(() => {
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
                <div className="flex-grow">
                  <p className="text-sm text-text-primary break-words whitespace-normal">
                    {info.content}
                  </p>
                  {index === researchInfo.length - 1 && isLoading && (
                    <p className="text-xs text-primary mt-1 font-medium break-words whitespace-normal">
                      {statusMessage}
                    </p>
                  )}
                </div>
                {index === researchInfo.length - 1 && isLoading && (
                  <div className="ml-2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeepResearchStatus;
