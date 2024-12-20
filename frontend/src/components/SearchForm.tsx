import React, { useState } from "react";
import { Suggestion } from "../types";
import axiosInstance from "../axiosConfig";
import InputAi from "./InputAi";
import Button from "./Button";
import { BiSearch, BiUser } from "react-icons/bi";
import TaxRatesDisplay from "./TaxRatesDisplay";
import InputField from "./InputField";

const LoginForm: React.FC = () => {
  // Estados do componente
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");

  // Função para realizar a busca de sugestões
  const handleSearch = async () => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post<Suggestion[]>("/openai", {
        query: query,
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manipuladores de eventos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
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
          {/* Título */}
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Busca Inteligente de NCM
          </h2>

          {/* Campo de busca com InputAi */}
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

          {/* Lista de sugestões */}
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

          {/* Detalhes da sugestão selecionada */}
          {suggestions.length > 0 && (
            <div className="mt-8 space-y-6">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Informações básicas e atributos */}
                    <div className="space-y-6">
                      {/* Informações Básicas */}
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

                      {/* Atributos do Produto */}
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">
                          Atributos do Produto
                        </h3>
                        <div className="space-y-4">
                          {/* Características Gerais */}
                          <div>
                            <h4 className="text-gray-400 mb-2">
                              Características Gerais
                            </h4>
                            {suggestion.attributes.length > 0 ? (
                              <ul className="list-disc list-inside text-gray-300">
                                {suggestion.attributes.map((attr, i) => (
                                  <li key={i}>{attr}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400">
                                Nenhuma característica disponível.
                              </p>
                            )}
                          </div>

                          {/* Atributos TIPI */}
                          <div>
                            <h4 className="text-gray-400 mb-2">
                              Atributos TIPI
                            </h4>
                            {suggestion.tipi_attributes.length > 0 ? (
                              <ul className="list-disc list-inside text-gray-300">
                                {suggestion.tipi_attributes.map((attr, i) => (
                                  <li key={i}>{attr}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400">
                                Nenhum atributo TIPI disponível.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alíquotas Tributárias */}
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

        {/* Campo de feedback */}
        <div className="flex gap-2 pt-10">
          <InputField
            width="100%"
            placeholder="Nos conte como foi a sua pesquisa"
            value={searchValue}
            onChange={handleSearchChange}
            readOnly={false}
            icon={<BiUser />}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
