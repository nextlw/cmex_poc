import React, { useState, useEffect, CSSProperties } from 'react';
import api from '../axiosConfig';

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
  "Finalizando análise e preparando parecer detalhado..."
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
  ncmCode = ""
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState(PROGRESS_MESSAGES[0]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!requestId) return;
    
    let isMounted = true;
    const controller = new AbortController();
    
    const checkStatus = async () => {
      // Se estiver no estado de loading inicial, não faz a requisição
      if (requestId === 'loading') {
        if (isMounted) {
          setStatusMessage("Iniciando análise avançada com IA...");
          setCurrentStep(0);
        }
        return;
      }

      try {
        const response = await api.get(`/task-status/${requestId}`, {
          signal: controller.signal
        });
        
        if (isMounted && response.data) {
          const stepIndex = response.data.step !== undefined 
            ? response.data.step 
            : 0;
            
          const step = Math.min(stepIndex, PROGRESS_MESSAGES.length - 1);
          setCurrentStep(step);
          
          if (response.data.currentAction) {
            setStatusMessage(response.data.currentAction);
          } else {
            let message = PROGRESS_MESSAGES[step]
              .replace('{produto}', productName)
              .replace('{ncm}', ncmCode);
            
            setStatusMessage(message);
          }
          
          if (!response.data.completed) {
            setTimeout(checkStatus, 2000);
          } else {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status da tarefa:", error);
        if (isMounted) {
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
  
  // Estilos inline com variáveis CSS para compatibilidade com o tema
  const containerStyle: CSSProperties = {
    padding: '1rem',
    backgroundColor: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
    fontSize: 'var(--font-size-sm, 0.875rem)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: 'var(--shadow-sm)'
  };
  
  return (
    <div style={containerStyle} className="deep-research-status">
      <div className={`flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`}>
        <svg 
          className="w-6 h-6 text-primary" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          />
        </svg>
      </div>
      <div className="flex-grow">
        <div className="font-medium text-sm mb-2">{statusMessage}</div>
        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out rounded-full"
            style={{ width: `${(currentStep / (PROGRESS_MESSAGES.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default DeepResearchStatus; 