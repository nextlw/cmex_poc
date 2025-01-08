// Importa o React e os hooks necessários
import React, { useState, useMemo, useEffect } from "react";
// Importa o tipo de modelos e a função Select do arquivo Select
import Select from "../../components/Select";
import { Option, Modelos } from "../../components/Select/types";
// Importa o tipo SugerirNCM do arquivo types
import { SugerirNCM } from "./types";
// Importa a instância do axios configurada
import axiosInstance from "../../axiosConfig";
// Importa o componente InputAi
import InputAi from "../../components/InputAi";
// Importa o componente Button
import Button from "../../components/Button";
// Importa o ícone BiSearch da biblioteca react-icons
import { BiSearch } from "react-icons/bi";
// Importa o componente BoxdeImpostos
import BoxdeImpostos from "../../components/BoxdeImpostos";
// Importa o componente InputField
import InputField from "../../components/InputField";
// Importa o ícone BiUser da biblioteca react-icons
import { BiUser } from "react-icons/bi";
// Importa o componente TabelaICMS
import TabelaICMS from "../../components/TabelaICMS";
// Importa os ícones BiChevronDown e BiChevronRight da biblioteca react-icons
import { BiChevronDown, BiChevronRight } from "react-icons/bi";
// Importa a função debounce da biblioteca lodash.debounce
import debounce from "lodash.debounce";
// Importa o componente InfoBasicas
import InfoBasicas from "../../components/InfoBasicas";
// Importa o componente Atributos
import Atributos from "../../components/Atributos";
// Importa os estilos CSS
import "./styles.css";
// Importa o componente DropdownMenu
import DropdownMenu from "../../components/DropdownMenu";
// Importa o tipo SelectionData do DropdownMenu
import { SelectionData } from "../../components/DropdownMenu/types";
import Header from "../../components/Header";

// Define o componente HomePage como um componente funcional React
const HomePage: React.FC = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [dropdownSelection, setDropdownSelection] =
    useState<SelectionData | null>(null);
  const [sugerirNCM, setSugerirNCM] = useState<SugerirNCM[]>([
    {
      ncm: "",
      descricao: "",
      atributos: [],
      atributos_tipi: [],
      classificacao_tributaria: {
        monofasico: false,
        aliquota_zero: false,
        ipi_entrada: "",
        ipi_saida: "",
        pis_entrada: "",
        pis_saida: "",
        cofins_entrada: "",
        cofins_saida: "",
        cst_entrada: "",
        cst_saida: "",
      },
      valores_de_impostos: {
        ipi: "",
        icms: {},
        pis: "",
        cofins: "",
      },
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscarValor, setBuscarValor] = useState("");
  const [isTabelaICMSOpen, setIsTabelaICMSOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDropdownChange = (selection: SelectionData) => {
    setDropdownSelection(selection);
  };

  const handleModelChange = (value: string | null) => {
    setSelectedModel(value);
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
      console.log("Resposta do backend:", response.data);
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

  // Retorna a estrutura visual do componente
  return (
    <div className="min-h-screen">
      <Header selectedModel={selectedModel} onModelChange={handleModelChange} />
      <div className="p-1">
        <div className="max-w-4xl mx-auto">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
            <div className="space-y-4">
              <div>
                <DropdownMenu onSelectionChange={handleDropdownChange} />
              </div>
              <div className="box-conteiner mt-8 space-y-6">
                {sugerirNCM.map((item, index) => (
                  <div key={index} className="rounded-lg backdrop-blur-sm mt-4">
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
                  <span className="text-gray-500 ml-2">
                    Clique para expandir
                  </span>
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
          {errorMessage && sugerirNCM.length === 0 && (
            <div className="mensagem-erro">{errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Exporta o componente HomePage como default
export default HomePage;
