import { PiListStarFill } from "react-icons/pi";
import "./styles.css";
import { HistoricoItem } from "./types";


// Importa o React e os hooks necessários
import React, { useState, useMemo, useEffect } from "react";
// Importa o tipo SugerirNCM do arquivo types
import { SugerirNCM } from "./types";
// Importa a instância do axios configurada
import axiosInstance from "../../axiosConfig";
// Importa o componente InputAi
import InputAi from "../../components/InputAi";
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
import PageHeader from "../../components/PageHeader";
import { AiFillCodeSandboxCircle } from "react-icons/ai";
import "../../styles/grid.css";

// Define o componente HomePage como um componente funcional React
const Comex: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      console.log("Buscando histórico..."); // Debug
      const response = await axiosInstance.get("/historico");
      console.log("Resposta do histórico:", response.data); // Debug

      if (Array.isArray(response.data)) {
        setHistorico(
          response.data.sort(
            (a: HistoricoItem, b: HistoricoItem) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
      } else {
        console.error("Dados do histórico não são um array:", response.data);
        setHistorico([]);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setHistorico([]);
    } finally {
      setIsLoading(false);
    }
  };


const HomePage: React.FC = () => {
  const [pesquisa, setPesquisa] = useState("");

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
      let response;
      let modeloUsado = selectedModel;

      // Envia os dados para a rota de queries
      response = await axiosInstance.post("/queries", {
        consulta: pesquisa,
        modelo: modeloUsado,
        ...dropdownSelection,
      });

      console.log("Resposta do backend:", response.data);
      setSugerirNCM(response.data);

      // Salva no histórico
      try {
        await axiosInstance.post("/historico", {
          ...response.data[0], // Pega o primeiro resultado
          modelo: modeloUsado,
          timestamp: new Date().toISOString(),
          consulta: pesquisa,
          ...dropdownSelection,
        });
      } catch (historyError) {
        console.error("Erro ao salvar no histórico:", historyError);
        // Não exibimos erro ao usuário pois a consulta principal funcionou
      }
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBuscarValor(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Retorna a estrutura visual do componente
  return (
    <div className="min-h-screen">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={handleModelChange}
      />
      
      <div className="grid-container">
        <div className="col-span-12">
          <PageHeader
            icon={<AiFillCodeSandboxCircle />}
            title="Busca Inteligente de NCM"
            icon_size="40px"
          />
        </div>

        <div className="col-span-12 -mt-4">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="box-conteiner-search">
              <div className="shadow-input">
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
              
              <div className="grid-container p-4 pb-2">
                <div className="col-span-12">
                  <DropdownMenu onSelectionChange={handleDropdownChange} />
                </div>
              </div>
            </div>

            <div className="gap-4 space-y-4">
              {sugerirNCM.map((item, index) => (
                <div key={index} className="box-page">
                  <div className="box-page grid-container-inner">
                    <div className="page-item col-span-6 mobile-col-span-4 w-full">
                      <InfoBasicas ncm={item.ncm} descricao={item.descricao} />
                    </div>
                    <div className="page-item col-span-6 mobile-col-span-4 w-full">
                      <Atributos
                        atributos={item.atributos}
                        atributos_tipi={item.atributos_tipi}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                  <div className="col-span-12 box-page">
                    <BoxdeImpostos classificacao={item.classificacao_tributaria} />
                  </div>
                </div>
              ))}

              <div className="grid-container-inner">
                <div className="col-span-12">
                  <div className="box-conteiner-dados gap-4">
                    <div
                      className="flex items-center cursor-pointer gap-2">
                      <h3 className="text-xl font-semibold mr-2">
                        Tabela ICMS
                      </h3>
                      <span>
                        <table className="box-table table-auto text-sm">
                          <thead>
                            <tr className="text-white">
                              <th>ID</th>
                              <th>Modelo</th>
                              <th>NCM</th>
                              <th>Descrição</th>
                              <th>Atributos</th>
                              <th>Atributos TIPI</th>
                              <th>IPI</th>
                              <th>ICMS</th>
                              <th>PIS</th>
                              <th>COFINS</th>
                              <th>Data/Hora</th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr className="text-white border-b border-gray-700">
                                <td colSpan={11} className="px-4 py-8 text-center">
                                  <div className="loading-spinner"></div>
                                  Carregando histórico...
                                </td>
                              </tr>
                            ) : historico.length === 0 ? (
                              <tr className="text-white border-b border-gray-700">
                                <td colSpan={11} className="px-4 py-8 text-center">
                                  Nenhum registro encontrado
                                </td>
                              </tr>
                            ) : (
                              historico.map((item) => (
                                <tr
                                  key={item.id}
                                  className="text-white border-b border-gray-700"
                                >
                                  <td>{item.id}</td>
                                  <td>
                                    <span
                                      className={`modelo-badge modelo-${item.modelo.toLowerCase()}`}
                                    >
                                      {item.modelo}
                                    </span>
                                  </td>
                                  <td>{item.ncm}</td>
                                  <td className="truncate-cell" data-full-text={item.descricao}>
                                    {item.descricao}
                                  </td>
                                  <td
                                    className="truncate-cell"
                                    data-full-text={item.atributos.join(", ")}
                                  >
                                    {item.atributos.join(", ")}
                                  </td>
                                  <td
                                    className="truncate-cell"
                                    data-full-text={item.atributos_tipi.join(", ")}
                                  >
                                    {item.atributos_tipi.join(", ")}
                                  </td>
                                  <td>{item.valores_de_impostos.ipi}</td>
                                  <td>
                                    {Object.entries(item.valores_de_impostos.icms || {})
                                      .map(([estado, valor]) => `${estado}: ${valor}`)
                                      .join(", ")}
                                  </td>
                                  <td>{item.valores_de_impostos.pis}</td>
                                  <td>{item.valores_de_impostos.cofins}</td>
                                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid-container-inner">
                <div className="col-span-12">
                  <div className="box-conteiner-dados">
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
export default Comex;
