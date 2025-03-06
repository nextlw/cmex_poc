import React, { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch, FiLink, FiList, FiCheck } from 'react-icons/fi';
import './styles.css';

// Frases de raciocínio base que serão combinadas com o contexto da consulta
const baseReasoningPhrases = [
  "Analisando a consulta sobre {query}...",
  "Buscando informações relevantes sobre {query}...",
  "Verificando fontes confiáveis relacionadas a {query}...",
  "Processando dados encontrados sobre {query}...",
  "Organizando informações por relevância para {query}...",
  "Comparando diferentes perspectivas sobre {query}...",
  "Avaliando a qualidade das fontes para {query}...",
  "Identificando padrões nos dados sobre {query}...",
  "Formulando uma resposta abrangente sobre {query}...",
  "Verificando a precisão das informações sobre {query}...",
  "Refinando a resposta com base nos dados sobre {query}...",
  "Estruturando a resposta para melhor compreensão sobre {query}...",
  "Priorizando informações mais relevantes sobre {query}...",
  "Analisando contexto histórico relacionado a {query}...",
  "Considerando implicações atuais de {query}...",
  "Verificando estatísticas e tendências sobre {query}...",
  "Avaliando diferentes interpretações de {query}...",
  "Sintetizando informações de múltiplas fontes sobre {query}..."
];

interface ReasoningBoxProps {
  isProcessing: boolean;
  originalQuery: string;
  refinedQueries: string[];
  searchedLinks: string[];
  currentStep: string;
  onComplete: () => void;
}

const ReasoningBox: React.FC<ReasoningBoxProps> = ({
  isProcessing,
  originalQuery,
  refinedQueries,
  searchedLinks,
  currentStep,
  onComplete
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSections, setActiveSections] = useState<string[]>(['query', 'steps']);
  const boxRef = useRef<HTMLDivElement>(null);

  // Função para gerar frases de raciocínio contextualizadas
  const generateContextualizedPhrases = (query: string) => {
    return baseReasoningPhrases.map(phrase => 
      phrase.replace('{query}', query || 'o tema solicitado')
    );
  };

  // Função para gerenciar as seções ativas
  const updateActiveSections = (newSteps: string[], newQueries: string[], newLinks: string[]) => {
    const sections: string[] = ['query', 'steps'];
    
    if (newQueries.length > 0) {
      sections.push('refined');
    }
    
    if (newLinks.length > 0) {
      sections.push('links');
    }
    
    // Mantém apenas as 3 seções mais recentes
    if (sections.length > 3) {
      sections.splice(1, sections.length - 3);
    }
    
    setActiveSections(sections);
  };

  // Efeito para adicionar frases de raciocínio durante o processamento
  useEffect(() => {
    if (!isProcessing && !isComplete) {
      setIsComplete(true);
      setIsClosing(true);
      
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
      
      return () => clearTimeout(timer);
    }

    if (isProcessing && !isComplete) {
      setIsClosing(false);
      setIsExpanded(true);

      const contextualizedPhrases = generateContextualizedPhrases(originalQuery);
      const numPhrases = Math.floor(Math.random() * 4) + 5; // 5-8 frases
      const selectedPhrases = [...contextualizedPhrases]
        .sort(() => 0.5 - Math.random())
        .slice(0, numPhrases);
      
      selectedPhrases.push("Preparando resposta final...");
      
      setReasoningSteps(selectedPhrases);
      setCurrentStepIndex(0);

      const interval = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= selectedPhrases.length - 1) {
            clearInterval(interval);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isProcessing, isComplete, onComplete, originalQuery]);

  // Efeito para atualizar seções ativas quando houver mudanças
  useEffect(() => {
    updateActiveSections(reasoningSteps, refinedQueries, searchedLinks);
  }, [reasoningSteps, refinedQueries, searchedLinks]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isSectionActive = (section: string) => activeSections.includes(section);

  return (
    <div className={`reasoning-box ${isProcessing ? 'visible' : ''} ${isComplete ? 'complete' : ''} ${isExpanded ? 'expanded' : 'collapsed'} ${isClosing ? 'closing' : ''}`}>
      <div className="reasoning-header" onClick={toggleExpand}>
        <h3>Raciocínio em Andamento</h3>
        <div className="reasoning-header-icons">
          {isComplete && <FiCheck className="check-icon" />}
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>
      
      <div className="reasoning-content" ref={boxRef}>
        {/* Seção da Query Original */}
        <div className={`reasoning-query-section ${isSectionActive('query') ? 'reasoning-section-active' : 'reasoning-section-minimized'}`}>
          <div className="reasoning-section-title">
            <FiSearch />
            Consulta Original
          </div>
          <div className="reasoning-query-original">
            {originalQuery}
          </div>
        </div>

        {/* Seção de Queries Refinadas */}
        {refinedQueries.length > 0 && (
          <div className={`reasoning-refined-queries ${isSectionActive('refined') ? 'reasoning-section-active' : 'reasoning-section-minimized'}`}>
            <div className="reasoning-section-title">
              <FiList />
              Queries Refinadas
            </div>
            <div className="reasoning-tags">
              {refinedQueries.map((query, index) => (
                <span key={index} className="message-link-title">
                  {query}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Links */}
        {searchedLinks.length > 0 && (
          <div className={`reasoning-links ${isSectionActive('links') ? 'reasoning-section-active' : 'reasoning-section-minimized'}`}>
            <div className="reasoning-section-title">
              <FiLink />
              Links Consultados
            </div>
            <div className="reasoning-tags">
              {searchedLinks.map((link, index) => (
                <span key={index} className="message-link-title">
                  {new URL(link).hostname}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Passos */}
        <div className={`reasoning-steps-section ${isSectionActive('steps') ? 'reasoning-section-active' : 'reasoning-section-minimized'}`}>
          <div className="reasoning-section-title">
            <FiList />
            Passos
          </div>
          {reasoningSteps.slice(0, currentStepIndex + 1).map((step, index) => (
            <div 
              key={index} 
              className={`reasoning-step ${index === currentStepIndex && !isComplete ? 'current' : 'completed'}`}
            >
              {index === currentStepIndex && !isComplete ? (
                <div className="step-with-spinner">
                  <div className="spinner" />
                  <p>{step}</p>
                </div>
              ) : (
                <div className="step-completed">
                  <div className="step-dot" />
                  <p>{step}</p>
                </div>
              )}
            </div>
          ))}
          
          {currentStep && (
            <div className="reasoning-step current">
              <div className="step-with-spinner">
                <div className="spinner" />
                <p>{currentStep}</p>
              </div>
            </div>
          )}
        </div>

        {isComplete && (
          <div className="reasoning-complete-message">
            <FiCheck className="complete-icon" />
            <p>Raciocínio concluído</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReasoningBox; 