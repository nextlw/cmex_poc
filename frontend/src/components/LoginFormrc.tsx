import React, { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import AppleStyleInput from "./AppleStyleInput";
import ProgressBar from "./ProgressBar";
import { Suggestion } from "../types";
import axiosInstance from "../axiosConfig";

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
      const response = await axiosInstance.post(
        "/",
        {
          model: "gpt-4", // Ou o modelo de sua preferência
          messages: [
            {
              role: "system",
              content:
                "Você é um especialista em classificação NCM de produtos.",
            },
            {
              role: "user",
              content: `Analise o seguinte produto e forneça:
            1. O código NCM mais apropriado
            2. Uma breve descrição do produto
            3. Principais atributos

            Produto: ${value}

            Responda em formato estruturado, separando NCM e descrição.`,
            },
          ],
          max_tokens: 150,
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`, // Certifique-se de que a chave da API está configurada corretamente
          },
        }
      );

      const data = response.data.choices[0].message.content;
      const lines = data.trim().split("\n");
      const ncm = lines[0] || "";
      const description = lines[1] || "";

      setSuggestions([{ ncm, description }]);
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