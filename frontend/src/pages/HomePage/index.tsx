// Importa o React e os hooks necessários
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
// Importa o tipo SugerirNCM do arquivo types centralizado
import { SugerirNCM } from "../../types/index";
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
import InfoBasicasSkeleton from "../../components/InfoBasicas/InfoBasicasSkeleton";
import BoxdeImpostosSkeleton from "../../components/BoxdeImpostos/BoxdeImpostosSkeleton";
import AtributosSkeleton from "../../components/Atributos/AtributosSkeleton";
import { AutocompleteType } from "../../components/InputAi/types";
// Importa o componente DeepResearchToggle
import DeepResearchToggle from "../../components/DeepResearchToggle";
// Importa o novo componente de status
import DeepResearchStatus from "../../components/DeepResearchStatus";

// Define o componente HomePage como um componente funcional React
const HomePage: React.FC = () => {
  // Recupera o estado inicial do localStorage ou usa o valor padrão
  const [pesquisa, setPesquisa] = useState(() => {
    const saved = localStorage.getItem("lastSearch");
    return saved ? JSON.parse(saved) : "";
  });

  const [selectedModel, setSelectedModel] = useState<string | null>(() => {
    const saved = localStorage.getItem("selectedModel");
    return saved ? JSON.parse(saved) : "Nex-0.5-Preview-2025";
  });

  const [dropdownSelection, setDropdownSelection] =
    useState<SelectionData | null>(() => {
      const saved = localStorage.getItem("dropdownSelection");
      return saved ? JSON.parse(saved) : null;
    });

  const [sugerirNCM, setSugerirNCM] = useState<SugerirNCM[]>(() => {
    const saved = localStorage.getItem("sugerirNCM");
    return saved
      ? JSON.parse(saved)
      : [
          {
            ncm: "",
            descricao: "",
            atributos: [],
            atributos_tipi: [],
            classificacao_tributaria: {
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
        ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [buscarValor, setBuscarValor] = useState("");
  const [isTabelaICMSOpen, setIsTabelaICMSOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [useDeepResearch, setUseDeepResearch] = useState(() => {
    const saved = localStorage.getItem("useDeepResearch");
    return saved ? JSON.parse(saved) : false;
  });

  const [deepResearchRequestId, setDeepResearchRequestId] = useState<
    string | null
  >(() => {
    const saved = localStorage.getItem("deepResearchRequestId");
    return saved ? JSON.parse(saved) : null;
  });

  const [isDeepResearchProcessing, setIsDeepResearchProcessing] = useState(
    () => {
      const saved = localStorage.getItem("isDeepResearchProcessing");
      return saved ? JSON.parse(saved) : false;
    }
  );

  // Salva os estados no localStorage quando mudam
  useEffect(() => {
    localStorage.setItem("lastSearch", JSON.stringify(pesquisa));
  }, [pesquisa]);

  useEffect(() => {
    localStorage.setItem("selectedModel", JSON.stringify(selectedModel));
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem(
      "dropdownSelection",
      JSON.stringify(dropdownSelection)
    );
  }, [dropdownSelection]);

  useEffect(() => {
    localStorage.setItem("sugerirNCM", JSON.stringify(sugerirNCM));
  }, [sugerirNCM]);

  useEffect(() => {
    localStorage.setItem("useDeepResearch", JSON.stringify(useDeepResearch));
  }, [useDeepResearch]);

  useEffect(() => {
    localStorage.setItem(
      "deepResearchRequestId",
      JSON.stringify(deepResearchRequestId)
    );
  }, [deepResearchRequestId]);

  useEffect(() => {
    localStorage.setItem(
      "isDeepResearchProcessing",
      JSON.stringify(isDeepResearchProcessing)
    );
  }, [isDeepResearchProcessing]);

  // Se houver um DeepResearch em andamento ao carregar a página, retoma o monitoramento
  useEffect(() => {
    if (isDeepResearchProcessing && deepResearchRequestId) {
      const checkStatus = async () => {
        try {
          const response = await axiosInstance.get(
            `/task-status/${deepResearchRequestId}`
          );

          // Se a tarefa foi concluída
          if (response.data.completed) {
            setIsDeepResearchProcessing(false);
            setDeepResearchRequestId(null);

            // Atualiza os resultados
            const updatedNCM = [...sugerirNCM];
            for (const item of updatedNCM) {
              if (
                item.validacao_deepresearch?.requestId === deepResearchRequestId
              ) {
                item.validacao_deepresearch = {
                  ...item.validacao_deepresearch,
                  status: response.data.status,
                  mensagem: response.data.currentAction,
                  cor: response.data.status === "completed" ? "verde" : "cinza",
                };
              }
            }
            setSugerirNCM(updatedNCM);
          } else if (response.data.error) {
            // Se houve um erro no servidor
            console.error(
              "Erro de conexão com DeepResearch:",
              response.data.error
            );

            // Tenta novamente após 10 segundos para erros de conexão
            if (
              response.data.error === "connect_error" ||
              response.data.error === "timeout"
            ) {
              setTimeout(checkStatus, 10000);
            } else {
              // Para outros erros, atualiza o status mas mantém o processamento
              const updatedNCM = [...sugerirNCM];
              for (const item of updatedNCM) {
                if (
                  item.validacao_deepresearch?.requestId ===
                  deepResearchRequestId
                ) {
                  item.validacao_deepresearch = {
                    ...item.validacao_deepresearch,
                    mensagem:
                      response.data.currentAction ||
                      "Erro de conexão com o serviço DeepResearch",
                  };
                }
              }
              setSugerirNCM(updatedNCM);

              // Continua tentando
              setTimeout(checkStatus, 6000);
            }
          } else {
            // Se ainda está em processamento, atualiza a mensagem de status
            const updatedNCM = [...sugerirNCM];
            for (const item of updatedNCM) {
              if (
                item.validacao_deepresearch?.requestId === deepResearchRequestId
              ) {
                item.validacao_deepresearch = {
                  ...item.validacao_deepresearch,
                  mensagem:
                    response.data.currentAction || "Análise em andamento...",
                };
              }
            }
            setSugerirNCM(updatedNCM);

            // Continua verificando
            setTimeout(checkStatus, 6000);
          }
        } catch (error) {
          console.error("Erro ao verificar status do DeepResearch:", error);

          // Em caso de erro de rede, retenta após 10 segundos
          setTimeout(checkStatus, 10000);
        }
      };

      // Faz a primeira verificação imediatamente
      checkStatus();

      // Continua verificando a cada 6 segundos
      const interval = setInterval(checkStatus, 6000);
      return () => clearInterval(interval);
    }
  }, [isDeepResearchProcessing, deepResearchRequestId, sugerirNCM]);

  const handleDropdownChange = (selection: SelectionData) => {
    setDropdownSelection(selection);
  };

  const handleModelChange = (value: string | null) => {
    setSelectedModel(value);
  };

  const handleSearch = async (
    ncmSugerido: string = "",
    autocomplete: Boolean = false
  ) => {
    setErrorMessage(null);
    setShowAutoComplete(false);
    setAutoCompleteData([]);
    setDeepResearchRequestId(null);
    setIsDeepResearchProcessing(false);

    if (pesquisa.length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para a busca.");
      setSugerirNCM([]);
      return;
    }

    setIsLoading(true);

    // Se DeepResearch está ativado, já mostra o status de loading
    if (useDeepResearch) {
      setIsDeepResearchProcessing(true);
      setDeepResearchRequestId("loading"); // Usamos um ID temporário para loading
    }

    try {
      let response;
      let modeloUsado = selectedModel;
      const consulta = ncmSugerido
        ? `${pesquisa} com NCM sugerido ${ncmSugerido}`
        : pesquisa;

      const requestData = {
        consulta: consulta,
        autocomplete: autocomplete,
        modelo: modeloUsado,
        ...(useDeepResearch ? { useDeepResearch: true } : {}),
        ...dropdownSelection,
      };

      console.log("Enviando request com DeepResearch:", requestData);

      response = await axiosInstance.post("/queries", requestData);

      console.log("Resposta do backend:", response.data);

      // Se DeepResearch está ativado, verifica se há requestId na resposta
      if (
        useDeepResearch &&
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const hasDeepResearchPending = response.data.some(
          (item: any) => item.validacao_deepresearch?.status === "pendente"
        );

        if (hasDeepResearchPending) {
          setIsDeepResearchProcessing(true);
          // Pega o requestId do primeiro item que tiver
          const requestId = response.data.find(
            (item: any) => item.validacao_deepresearch?.requestId
          )?.validacao_deepresearch?.requestId;

          if (requestId) {
            setDeepResearchRequestId(requestId);
            console.log("ID da tarefa DeepResearch:", requestId);
          }
        } else {
          setIsDeepResearchProcessing(false);
          setDeepResearchRequestId(null);
        }

        setSugerirNCM(response.data);
      } else if (response.data && Array.isArray(response.data)) {
        // Resposta normal sem DeepResearch
        setSugerirNCM(response.data);
      } else if (response.data && response.data.error) {
        // Resposta de erro do servidor
        console.error("Erro retornado pelo servidor:", response.data.error);
        setErrorMessage(`Erro ao processar: ${response.data.error}`);
        setSugerirNCM([]);
      } else {
        // Resposta inesperada
        console.error("Resposta inesperada do servidor:", response.data);
        setErrorMessage(
          "Erro inesperado ao processar a consulta. Tente novamente."
        );
        setSugerirNCM([]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar sugestões:", error);

      // Mensagem de erro mais detalhada
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(`Erro: ${error.response.data.error}`);
      } else if (error.message === "Network Error") {
        setErrorMessage(
          "Erro de conexão. Verifique se o servidor está disponível."
        );
      } else {
        setErrorMessage("Erro ao buscar informações. Tente novamente.");
      }

      setIsDeepResearchProcessing(false);
      setDeepResearchRequestId(null);
      setSugerirNCM([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clickOutsideAutocomplete = () => {
    setShowAutoComplete(false);
    setAutoCompleteData([]);
  };

  // Dispara uma requisição para o endpoint de autocomplete
  const autocomplete = async (consulta: string) => {
    try {
      const response = await axiosInstance.post("/autocomplete", {
        consulta: consulta,
      });
      console.log("Resultado do autocomplete:", response.data.data);
      return response.data.data;
    } catch (error) {
      console.error("Erro no autocomplete:", error);
      return null;
    }
  };

  // Controla o estado do balão de Autocomplete
  const [showAutoComplete, setShowAutoComplete] = useState<Boolean>(false);
  const [autoCompleteData, setAutoCompleteData] = useState<
    Array<AutocompleteType>
  >([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] =
    useState<Boolean>(false);

  // Comportamento ao clicar em uma sugestão do autocomplete
  const handleAutocompleteClick = (value: AutocompleteType) => {
    handleSearch(value.resultado[0].ncm, true);
  };

  // Comportamento ao exibir o balão de autocomplete
  const debouncedHandleSearch = useRef(
    debounce(async (query: string) => {
      setIsAutocompleteLoading(true);
      setShowAutoComplete(true);

      const response = await autocomplete(query);

      // Mostra o balão de Autocomplete e preenche os dados
      if (response && response.length > 0) {
        setAutoCompleteData(response);
      } else {
        setShowAutoComplete(false);
        setAutoCompleteData([]);
      }

      setIsAutocompleteLoading(false);
    }, 500)
  ).current;

  const handleChange = (value: string) => {
    setPesquisa(value);
    setShowAutoComplete(false);
    setAutoCompleteData([]);
    if (value.length > 3) {
      debouncedHandleSearch(value);
    }
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBuscarValor(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setShowAutoComplete(false);
      setAutoCompleteData([]);
      handleSearch();
    }
  };

  // Retorna a estrutura visual do componente
  return (
    <div className="min-h-screen overflow-y-auto">
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
                  onChange={(e) => handleChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  isLoading={isLoading}
                  placeholder="Digite o nome do produto"
                  onButtonClick={handleSearch}
                  showAutoComplete={showAutoComplete}
                  autoCompleteData={autoCompleteData}
                  handleAutocompleteClick={handleAutocompleteClick}
                  isAutocompleteLoading={isAutocompleteLoading}
                  onClickOutside={clickOutsideAutocomplete}
                />
              </div>

              <div className="grid-container p-4 pb-2">
                <div className="col-span-12">
                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex-grow">
                      <DropdownMenu onSelectionChange={handleDropdownChange} />
                    </div>
                    <div
                      className="flex-shrink-0 ml-auto"
                      style={{ minWidth: "180px" }}
                    >
                      <DeepResearchToggle
                        enabled={useDeepResearch}
                        onChange={setUseDeepResearch}
                        label="DeepResearch IA"
                        helpText="Ativar análise detalhada com IA avançada"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="gap-4 space-y-4">
              {/* Indicador de DeepResearch em processamento */}
              {useDeepResearch && (isLoading || isDeepResearchProcessing) && (
                <DeepResearchStatus
                  requestId={deepResearchRequestId || "loading"}
                  productName={pesquisa}
                  ncmCode={sugerirNCM.length > 0 ? sugerirNCM[0].ncm : ""}
                />
              )}

              {/* Indicador de DeepResearch ativo (apenas quando não está processando) */}
              {useDeepResearch &&
                sugerirNCM.length > 0 &&
                !isLoading &&
                !isDeepResearchProcessing && (
                  <div className="px-4 py-2 bg-blue-900/30 border border-blue-700/50 rounded-md text-blue-200 font-medium text-sm flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Modo DeepResearch ativado
                  </div>
                )}

              {sugerirNCM.map((item, index) => (
                <div key={index} className="box-page">
                  {/* Resultado do DeepResearch se disponível */}
                  {useDeepResearch && item.validacao_deepresearch && (
                    <div
                      className={`px-4 py-3 mb-4 rounded-md text-sm font-medium flex items-start break-words whitespace-normal ${
                        item.validacao_deepresearch.cor === "verde"
                          ? "bg-green-100 border border-green-300 text-green-800"
                          : item.validacao_deepresearch.cor === "vermelho"
                          ? "bg-red-100 border border-red-300 text-red-800"
                          : item.validacao_deepresearch.cor === "amarelo"
                          ? "bg-yellow-100 border border-yellow-300 text-yellow-800"
                          : "bg-gray-100 border border-gray-300 text-gray-800"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {item.validacao_deepresearch.cor === "verde" && (
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {item.validacao_deepresearch.cor === "vermelho" && (
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                        {item.validacao_deepresearch.cor === "amarelo" && (
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        )}
                        {item.validacao_deepresearch.cor === "cinza" && (
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="font-semibold mb-1">
                          {item.validacao_deepresearch.status ===
                            "confirmado" && "NCM Confirmado por DeepResearch"}
                          {item.validacao_deepresearch.status === "negado" &&
                            "NCM Contestado por DeepResearch"}
                          {item.validacao_deepresearch.status === "sugestao" &&
                            "Sugestão Alternativa por DeepResearch"}
                          {(item.validacao_deepresearch.status === "erro" ||
                            item.validacao_deepresearch.status === "timeout") &&
                            "Validação DeepResearch Indisponível"}
                        </div>
                        <p className="text-sm font-normal break-words whitespace-normal">
                          {item.validacao_deepresearch.mensagem}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="box-page grid-container-inner">
                    <div className="page-item col-span-6 mobile-col-span-4 w-full">
                      {isLoading ? (
                        <InfoBasicasSkeleton />
                      ) : (
                        <InfoBasicas
                          ncm={item.ncm}
                          descricao={item.descricao}
                        />
                      )}
                    </div>
                    <div className="page-item col-span-6 mobile-col-span-4 w-full">
                      {isLoading ? (
                        <AtributosSkeleton />
                      ) : (
                        <Atributos
                          atributos={item.atributos}
                          atributos_tipi={item.atributos_tipi}
                          isLoading={isLoading}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-span-12 box-page">
                    {isLoading ? (
                      <BoxdeImpostosSkeleton />
                    ) : (
                      <BoxdeImpostos
                        classificacao={item.classificacao_tributaria}
                      />
                    )}
                  </div>
                </div>
              ))}

              <div className="grid-container-inner">
                <div className="col-span-12">
                  <div className="box-conteiner-dados gap-4">
                    <div
                      className="flex items-center cursor-pointer gap-2"
                      onClick={() => setIsTabelaICMSOpen(!isTabelaICMSOpen)}
                    >
                      <h3 className="text-xl font-semibold mr-2">
                        Tabela ICMS
                      </h3>
                      <span>
                        {isTabelaICMSOpen ? (
                          <BiChevronDown />
                        ) : (
                          <BiChevronRight />
                        )}
                      </span>
                      <span className="text-[var(--color-text-gray-500)] ml-2">
                        Clique para expandir
                      </span>
                    </div>
                    {isTabelaICMSOpen && (
                      <div>
                        <hr className="border-[var(--color-border-hr)] my-4" />
                        <TabelaICMS />
                      </div>
                    )}
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
export default HomePage;
