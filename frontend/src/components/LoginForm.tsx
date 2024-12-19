import React, { useState } from "react";
import { Suggestion } from "../types";
import axiosInstance from "../axiosConfig";
import InputAi from "./InputAi";
import ProgressBar from "./ProgressBar";
import Button from "./Button";

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

            <Button onClick={handleSearch} isLoading={isLoading} />
          </div>

          <ProgressBar isLoading={isLoading} resetTime={resetTime} />

          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filter) => (
              <span key={filter} className="filter-chip">
                {filter}
              </span>
            ))}
          </div>

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
