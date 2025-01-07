import React, { useState, useMemo, useEffect } from "react";
import { SugerirNCM } from "./types";
import axiosInstance from "../../axiosConfig";
import InputAi from "../../components/InputAi";
import Button from "../../components/Button";
import { BiSearch } from "react-icons/bi";
import BoxdeImpostos from "../../components/BoxdeImpostos";
import InputField from "../../components/InputField";
import { BiUser } from "react-icons/bi";
import TabelaICMS from "../../components/TabelaICMS";
import { BiChevronDown, BiChevronRight } from "react-icons/bi";
import debounce from "lodash.debounce";
import InfoBasicas from "../../components/InfoBasicas";
import Atributos from "../../components/Atributos";
import "./styles.css";
import DropdownMenu from "../../components/DropdownMenu";
import { SelectionData } from "../../components/DropdownMenu/types";

const HomePage: React.FC = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [dropdownSelection, setDropdownSelection] =
    useState<SelectionData | null>(null);
  const [sugerirNCM, setSugerirNCM] = useState<SugerirNCM[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscarValor, setBuscarValor] = useState("");
  const [isTabelaICMSOpen, setIsTabelaICMSOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDropdownChange = (selection: SelectionData) => {
    setDropdownSelection(selection);
  };

  const handleSearch = async () => {
    setErrorMessage(null);

    if (pesquisa.length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para a busca.");
      setSugerirNCM([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/gemini", {
        consulta: pesquisa,
        ...dropdownSelection,
      });
      console.log("Resposta do backend:", response.data); // <-- LOG
      if (!response.data.precisa) {
        setErrorMessage(
          "Para uma resposta mais precisa, selecione todos os campos do dropdown."
        );
      }
      setSugerirNCM(response.data);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      setErrorMessage("Erro ao buscar informações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedHandleSearch = useMemo(
    () => debounce(handleSearch, 3000),
    [pesquisa, dropdownSelection]
  );

  useEffect(() => {
    return () => {
      debouncedHandleSearch.cancel();
    };
  }, [debouncedHandleSearch]);

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
    setPesquisa(sugerir.descricao);
    setSugerirNCM([]);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
              onButtonClick={handleSearch}
            />
          </div>
          {errorMessage && sugerirNCM.length === 0 && (
            <div className="mensagem-erro">{errorMessage}</div>
          )}
          <div className="space-y-4 p-2">
            <div>
              <DropdownMenu onSelectionChange={handleDropdownChange} />
            </div>
            <div className="mt-8 space-y-6">
              {sugerirNCM.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm mt-4"
                >
                  <InfoBasicas ncm={item.ncm} descricao={item.descricao} />

                  <div className="mt-4">
                    <Atributos
                      atributos={item.atributos}
                      atributos_tipi={item.atributos_tipi}
                      isLoading={isLoading}
                    />
                  </div>

                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Classificação Tributária
                    </h3>
                    <BoxdeImpostos
                      classificacao={item.classificacao_tributaria}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="box-conteiner p-4">
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
            <div className="box-conteiner p-4 rounded-lg w-full flex flex-col gap-4">
              <InputField
                width="100%"
                placeholder="Nos conte como foi a sua pesquisa?"
                value={buscarValor}
                onChange={handleSearchChange}
                readOnly={false}
                icon={<BiUser />}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomePage;
