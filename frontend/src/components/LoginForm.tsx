import React, { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import AppleStyleInput from "./AppleStyleInput";
import ProgressBar from "./ProgressBar";
import { Suggestion } from "../types";
import axiosInstance from "../axiosConfig"; // Importa a instância configurada do axios

const LoginForm: React.FC = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resetTime, setResetTime] = useState(false);
  const [selectedFilters] = useState<string[]>([
    "NCM",
    "Atributos",
    "Matéria prima",
  ]);

  const fetchSuggestions = async (value: string) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setResetTime(false);
    try {
      const response = await axiosInstance.post("/openai", {
        // Usa a instância configurada do axios
        query: value,
      });

      const data = response.data;
      setSuggestions(data);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setIsLoading(false);
      setResetTime(true);
    }
  };

  const debouncedFetch = useRef(
    debounce((value: string) => {
      fetchSuggestions(value);
    }, 500)
  ).current;

  useEffect(() => {
    if (query) {
      debouncedFetch(query);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.description);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <form className="space-y-6">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Busca Inteligente de NCM
          </h2>

          <div className="search-container py-4">
            <AppleStyleInput
              width="100%"
              value={query}
              onChange={handleChange}
              isLoading={isLoading}
              placeholder="Digite o nome do produto"
            />
          </div>

          {/* Barra de progresso */}
          <ProgressBar isLoading={isLoading} resetTime={resetTime} />

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filter) => (
              <span key={filter} className="filter-chip">
                {filter}
              </span>
            ))}
          </div>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="suggestions-container">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <span className="font-medium">{suggestion.ncm}</span>
                  <span className="mx-2">-</span>
                  <span>{suggestion.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Área de resultados selecionados */}
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg backdrop-blur-sm">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
