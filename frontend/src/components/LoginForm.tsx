import React, { useState, useCallback, useMemo } from "react";
import { SugerirNCM } from "../types";
import axiosInstance from "../axiosConfig";
import InputAi from "./InputAi";
import Button from "./Button";
import { BiSearch } from "react-icons/bi";
import BoxdeImpostos from "./BoxdeImpostos";
import InputField from "./InputField";
import { BiUser } from "react-icons/bi"; // Exemplo de ícone
import TabelaICMS from "./TabelaICMS"; // Importando o novo componente
import { BiChevronDown, BiChevronUp, BiChevronRight } from "react-icons/bi"; // Importar ícones para expandir/recolher
import debounce from "lodash.debounce"; // Importar debounce
import CardSituacao from "./CardSituacao";

const LoginForm: React.FC = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [sugerirNCM, setSugerirNCM] = useState<SugerirNCM[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscarValor, setBuscarValor] = useState("");
  const [isTabelaICMSOpen, setIsTabelaICMSOpen] = useState(false); // Estado para controlar a expansão da tabela

  const handleSearch = useCallback(async () => {
    if (pesquisa.length < 3) {
      setSugerirNCM([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/openai", {
        consulta: pesquisa,
      });
      setSugerirNCM(response.data);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pesquisa]);

  const debouncedHandleSearch = useMemo(
    () => debounce(handleSearch, 5000),
    [handleSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPesquisa(e.target.value);
    debouncedHandleSearch();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuscarValor(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSuggestionSelect = (sugerir: SugerirNCM) => {
    setPesquisa(sugerir.description);
    setSugerirNCM([]);
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
              value={pesquisa}
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
          {sugerirNCM.length > 0 && (
            <>
              <div className="container-sugestoes align-middle">
                {sugerirNCM.map((suggestion, index) => (
                  <div
                    key={index}
                    className="chip-sugestao justify-center"
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
              <CardSituacao
                classificacao={
                  // Pega a classificação tributária do primeiro resultado
                  sugerirNCM[0]?.classificacao_tributaria || {
                    monofasico: false,
                    aliquota_zero: false,
                    ipi_entrada: "não tributado",
                    ipi_saida: "não tributado",
                    pis_entrada: "não tributado",
                    pis_saida: "não tributado",
                    cofins_entrada: "não tributado",
                    cofins_saida: "não tributado",
                    cst_entrada: "sem CST",
                    cst_saida: "sem CST",
                  }
                }
              />
            </>
          )}
          <div className="mt-8 space-y-6">
            <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Informações Básicas
                    </h3>
                    <div className="space-y-2">
                      {isLoading ? (
                        <>
                          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-300">
                            <span className="font-medium">NCM:</span>{" "}
                            {sugerirNCM[0]?.ncm || ""}
                          </p>
                          <p className="text-gray-300">
                            <span className="font-medium">Descrição:</span>{" "}
                            {sugerirNCM[0]?.description || ""}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Atributos do Produto
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-gray-400 mb-2">
                          Características Gerais
                        </h4>
                        <div className="space-y-2">
                          {isLoading ? (
                            <>
                              <div className="h-4 bg-gray-700 rounded w-full"></div>
                              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                            </>
                          ) : (
                            <ul className="list-disc list-inside text-gray-300">
                              {sugerirNCM[0]?.attributes.map((attr, i) => (
                                <li key={i}>{attr}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-gray-400 mb-2">Atributos TIPI</h4>
                        <div className="space-y-2">
                          {isLoading ? (
                            <>
                              <div className="h-4 bg-gray-700 rounded w-full"></div>
                              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                            </>
                          ) : (
                            <ul className="list-disc list-inside text-gray-300">
                              {sugerirNCM[0]?.tipi_attributes.map((attr, i) => (
                                <li key={i}>{attr}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Alíquotas Tributárias
                  </h3>
                  <div className="space-y-2">
                    {isLoading ? (
                      <>
                        <div className="h-4 bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                      </>
                    ) : (
                      <BoxdeImpostos
                        ValoresdeImpostos={
                          sugerirNCM[0]?.valores_de_impostos || []
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div
              className="flex items-center cursor-pointer"
              onClick={() => setIsTabelaICMSOpen(!isTabelaICMSOpen)}
            >
              <h3 className="text-xl font-semibold text-white mr-2">
                Tabela ICMS
              </h3>
              <span className="text-white">
                {isTabelaICMSOpen ? <BiChevronDown /> : <BiChevronRight />}
              </span>
              <span className="text-gray-500 ml-2">Clique para expandir</span>
            </div>
            {isTabelaICMSOpen && (
              <div>
                <TabelaICMS />
              </div>
            )}
          </div>
        </form>
        <div className="flex gap-2 pt-10">
          <InputField
            width="100%"
            placeholder="Nos conte como foi a sua pesquisa?"
            value={buscarValor}
            onChange={handleSearchChange}
            readOnly={true}
            icon={<BiUser />}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
