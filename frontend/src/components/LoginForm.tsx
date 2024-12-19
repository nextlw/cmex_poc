import React, { useState } from "react";
import { Suggestion } from "../types";
import axiosInstance from "../axiosConfig";
import InputAi from "./InputAi";
import Button from "./Button";
import { BiSearch } from "react-icons/bi";
import TaxRatesDisplay from "./TaxRatesDisplay";

const LoginForm: React.FC = () => {
  const [resetTime, setResetTime] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters] = useState<string[]>([
    "NCM",
    "Atributos",
    "Matéria prima",
  ]);

  const handleSearch = async () => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setResetTime(true);
    try {
      const response = await axiosInstance.post("/openai", {
        query: query,
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setIsLoading(false);
      setResetTime(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.description);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Busca Inteligente de NCM
          </h2>

          <div className="flex gap-2">
            <InputAi
              width="100%"
              value={query}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              isLoading={isLoading}
              placeholder="Digite o nome do produto"
            />

            <Button
              onClick={handleSearch}
              isLoading={isLoading}
              icon={<BiSearch />}
            />
          </div>

          {/* <ProgressBar isLoading={isLoading} resetTime={resetTime} /> */}

          {/* <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filter) => (
              <span key={filter} className="filter-chip">
                {filter}
              </span>
            ))}
          </div> */}

          {suggestions.length > 0 && (
            <div className="suggestions-container align-middle">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-chip justify-center"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="font-medium justify-center">
                    {suggestion.ncm}
                  </span>
                  <span className="mx-2 justify-center">-</span>
                  <span>{suggestion.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* <div className="mt-8 p-4 bg-gray-800/50 rounded-lg backdrop-blur-sm">
            <h3 className="text-white text-lg font-semibold mb-4">
              Resultado da Busca
            </h3>
            <div className="space-y-2">
              {query && (
                <div className="text-gray-300">
                  Produto selecionado:{" "}
                  <span className="text-white">{query}</span>
                </div>
              )}
            </div>
          </div> */}

          {suggestions.length > 0 && (
            <div className="mt-8 space-y-6">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Informações básicas */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">
                          Informações Básicas
                        </h3>
                        <div className="space-y-2">
                          <p className="text-gray-300">
                            <span className="font-medium">NCM:</span>{" "}
                            {suggestion.ncm}
                          </p>
                          <p className="text-gray-300">
                            <span className="font-medium">Descrição:</span>{" "}
                            {suggestion.description}
                          </p>
                        </div>
                      </div>

                      {/* Atributos */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">
                          Atributos do Produto
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-gray-400 mb-2">
                              Características Gerais
                            </h4>
                            <ul className="list-disc list-inside text-gray-300">
                              {suggestion.attributes.map((attr, i) => (
                                <li key={i}>{attr}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-gray-400 mb-2">
                              Atributos TIPI
                            </h4>
                            <ul className="list-disc list-inside text-gray-300">
                              {suggestion.tipi_attributes.map((attr, i) => (
                                <li key={i}>{attr}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alíquotas */}
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4">
                        Alíquotas Tributárias
                      </h3>
                      <TaxRatesDisplay taxRates={suggestion.tax_rates} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
