import React from "react";
import { ResultsContainerProps } from "../../types/search";
import TaxCard from "./TaxCard";
import ICMSTable from "./ICMSTable";
import { TaxType } from "../../types/search";

/**
 * Componente que exibe o estado vazio quando não há resultados
 * @param message - Mensagem personalizada a ser exibida
 */
const EmptyState: React.FC<{ message?: string }> = ({
  message = "Digite o nome do produto para ver sua classificação fiscal e tributação",
}) => (
  <div className="bg-gray-800/30 rounded-lg p-8 text-center animate-fade-in">
    <div className="text-gray-400 mb-4">
      {/* Ícone ilustrativo */}
      <svg
        className="w-16 h-16 mx-auto mb-4 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-xl font-semibold mb-2">Busque um produto</h3>
      <p>{message}</p>
    </div>
  </div>
);

/**
 * Componente que exibe o estado de carregamento
 * @param count - Número de skeletons a serem exibidos
 */
const LoadingState: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="h-4 bg-gray-800/30 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-800/30 rounded" />
          <div className="h-4 bg-gray-800/30 rounded w-5/6" />
          <div className="h-4 bg-gray-800/30 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const SuggestionCard: React.FC<{
  suggestion: ResultsContainerProps["suggestions"][0];
  onClick?: () => void;
}> = ({ suggestion, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 
      transition-colors duration-200 group"
  >
    <div className="flex items-center justify-between">
      <div>
        <span className="text-white font-medium">{suggestion.ncm}</span>
        <span className="mx-2 text-gray-400">-</span>
        <span className="text-gray-300">{suggestion.description}</span>
      </div>
      {suggestion.probability && (
        <span className="text-xs text-gray-400 group-hover:text-gray-300">
          {Math.round(suggestion.probability * 100)}% compatível
        </span>
      )}
    </div>

    {suggestion.attributes.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-2">
        {suggestion.attributes.slice(0, 3).map((attr, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-300"
          >
            {attr}
          </span>
        ))}
        {suggestion.attributes.length > 3 && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-600/50 text-gray-400">
            +{suggestion.attributes.length - 3}
          </span>
        )}
      </div>
    )}
  </button>
);

/**
 * ResultsContainer - Componente principal para exibição dos resultados da busca
 *
 * @component
 * @param {ResultsContainerProps} props - Props do componente
 * @param {TaxSuggestion[]} props.suggestions - Array de sugestões de classificação
 * @param {boolean} props.isLoading - Estado de carregamento
 * @param {function} props.onSelect - Callback para seleção de sugestão
 * @returns {JSX.Element}
 */
const ResultsContainer: React.FC<ResultsContainerProps> = ({
  suggestions,
  isLoading,
  onSelect,
}) => {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!suggestions || suggestions.length === 0) {
    return <EmptyState />;
  }

  // Ordena as sugestões por probabilidade (se disponível)
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => (b.probability || 0) - (a.probability || 0)
  );

  return (
    <div className="space-y-6">
      {/* Lista de Sugestões */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400 mb-3">
          Sugestões de Classificação
        </h3>
        <div className="space-y-2">
          {sortedSuggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              suggestion={suggestion}
              onClick={() => onSelect?.(suggestion)}
            />
          ))}
        </div>
      </div>

      {/* Detalhes da primeira sugestão */}
      {sortedSuggestions[0] && (
        <div className="bg-gray-800/50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Informações básicas */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Informações Básicas
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="font-medium">NCM:</span>{" "}
                    {sortedSuggestions[0].ncm}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-medium">Descrição:</span>{" "}
                    {sortedSuggestions[0].description}
                  </p>
                </div>
              </div>

              {/* Atributos */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Atributos</h3>
                {sortedSuggestions[0].attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-700/50 rounded p-2">
                    {attr}
                  </div>
                ))}
              </div>
            </div>

            {/* Alíquotas */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Alíquotas Tributárias
              </h3>
              <div className="space-y-4">
                <TaxCard
                  label="IPI"
                  ncm={sortedSuggestions[0].ncm}
                  taxType={TaxType.IPI}
                  attributes={sortedSuggestions[0].attributes}
                  tipiAttributes={sortedSuggestions[0].tipi_attributes}
                />
                <ICMSTable
                  icmsRates={sortedSuggestions[0].tax_rates.icms}
                  ncm={sortedSuggestions[0].ncm}
                  verificationConfig={{
                    enabled: true,
                    updateInterval: 60,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsContainer;
