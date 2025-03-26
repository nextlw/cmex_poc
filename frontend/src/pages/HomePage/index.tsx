// Importa o React e os hooks necessários
import React, { useState, useEffect, useRef } from "react";
// Importa tipos do arquivo types centralizado
import { SugerirNCM } from "../../types";
// Importa a instância do axios configurada
import axiosInstance from "../../axiosConfig";
// Importa os componentes necessários do barrel
import {
  InputAi,
  BoxdeImpostos,
  InputField,
  TabelaICMS,
  InfoBasicas,
  Atributos,
  DropdownMenu,
  Header,
  PageHeader,
  DeepResearchToggle,
  DeepResearchSidebar,
  SelectionData,
  AutocompleteType,
} from "../../components";
// Importa os ícones necessários
import { BiUser, BiChevronDown, BiChevronRight } from "react-icons/bi";
import { AiFillCodeSandboxCircle } from "react-icons/ai";
// Importa a função debounce da biblioteca lodash.debounce
import debounce from "lodash.debounce";
// Importa os estilos CSS
import "./styles.css";
import "../../styles/grid.css";
// Importa os componentes de skeleton
import InfoBasicasSkeleton from "../../components/InfoBasicas/InfoBasicasSkeleton";
import BoxdeImpostosSkeleton from "../../components/BoxdeImpostos/BoxdeImpostosSkeleton";
import AtributosSkeleton from "../../components/Atributos/AtributosSkeleton";

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

  const [useDeepResearch, setUseDeepResearch] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("useDeepResearch");
      // Se não existir valor no localStorage ou se o valor for null/undefined, retorna false
      return saved ? JSON.parse(saved) : false;
    } catch {
      // Se houver qualquer erro ao ler do localStorage, retorna false
      return false;
    }
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

  const [showDeepResearchSidebar, setShowDeepResearchSidebar] = useState(false);

  // Estado para controlar quando o InputAi deve sair do loading
  const [inputAiLoading, setInputAiLoading] = useState(false);

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

  // Efeito para verificar o status do DeepResearch quando o requestId muda
  useEffect(() => {
    // Reset do estado se não houver requestId
    if (!deepResearchRequestId || !isDeepResearchProcessing) {
      return;
    }

    // Em vez de verificar o status via API, vamos simplesmente garantir que a sidebar seja mostrada
    // apenas se o DeepResearch estiver ativado
    if (useDeepResearch) {
      setShowDeepResearchSidebar(true);

      // E então usamos um timer para desativar o status de loading do InputAI após um curto delay
      const timer = setTimeout(() => {
        // Não alteramos o estado setIsDeepResearchProcessing aqui para manter a sidebar ativa
        // Apenas garantimos que o InputAI não está mais no estado de loading
        setInputAiLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [deepResearchRequestId, isDeepResearchProcessing, useDeepResearch]);

  // Adicionar um efeito para monitorar o status do DeepResearch
  useEffect(() => {
    // Se não está processando DeepResearch e o loading está ativo, desativa o loading
    if (!isDeepResearchProcessing && isLoading && sugerirNCM.length > 0) {
      setIsLoading(false);
    }
  }, [isDeepResearchProcessing, sugerirNCM, isLoading]);

  // Adicionar um efeito para garantir que o skeleton seja removido quando houver dados
  useEffect(() => {
    // Se temos resultados mas o skeleton ainda está ativo, desativá-lo
    if (sugerirNCM.length > 0 && isLoading) {
      setIsLoading(false);
    }
  }, [sugerirNCM, isLoading]);

  const handleDropdownChange = (selection: SelectionData) => {
    setDropdownSelection(selection);
  };

  const handleModelChange = (value: string | null) => {
    setSelectedModel(value);
  };

  // Função personalizada para lidar com a alteração do DeepResearch
  const handleDeepResearchChange = (enabled: boolean) => {
    setUseDeepResearch(enabled);

    // Se estamos ativando o DeepResearch e temos resultados atuais
    if (enabled && sugerirNCM.length > 0 && pesquisa.length >= 3) {
      // Ativamos os indicadores visuais quando temos resultados e precisamos validá-los com DeepResearch
      setIsDeepResearchProcessing(true);
      setShowDeepResearchSidebar(true);

      // Importante: o skeleton não deve aparecer quando já temos resultados
      // pois isso impede a visualização dos componentes
      setIsLoading(false);

      // Importante: Se já temos resultados, vamos validar diretamente com DeepResearch
      // ao invés de fazer uma nova busca completa
      try {
        // Configuração para validação de resultados existentes
        const deepResearchRequestData = {
          consulta: pesquisa,
          modelo: selectedModel,
          useDeepResearch: true,
          ...dropdownSelection,
        };

        console.log(
          "Enviando request com DeepResearch para resultados existentes:",
          deepResearchRequestData
        );

        // Realiza a requisição de validação dos resultados já existentes
        axiosInstance
          .post("/queries", deepResearchRequestData)
          .then((deepResearchResponse) => {
            console.log(
              "Resposta do DeepResearch para resultados existentes:",
              deepResearchResponse.data
            );

            if (
              deepResearchResponse.data &&
              Array.isArray(deepResearchResponse.data) &&
              deepResearchResponse.data.length > 0
            ) {
              const hasDeepResearchPending = deepResearchResponse.data.some(
                (item: any) =>
                  item.validacao_deepresearch?.status === "pendente"
              );

              if (hasDeepResearchPending) {
                // Pega o requestId do primeiro item que tiver
                const requestId = deepResearchResponse.data.find(
                  (item: any) => item.validacao_deepresearch?.requestId
                )?.validacao_deepresearch?.requestId;

                if (requestId) {
                  setDeepResearchRequestId(requestId);
                  console.log(
                    "ID da tarefa DeepResearch para resultados existentes:",
                    requestId
                  );
                }
              } else {
                setIsDeepResearchProcessing(false);
                setDeepResearchRequestId(null);
              }

              // Atualizamos a lista de sugestões com os resultados enriquecidos do DeepResearch
              setSugerirNCM(deepResearchResponse.data);

              // Garantimos que o skeleton não está ativo, pois já temos dados
              setIsLoading(false);
            }
          })
          .catch((error) => {
            console.error(
              "Erro ao fazer pesquisa com DeepResearch para resultados existentes:",
              error
            );

            // Se falhar, ainda desativamos o estado de processamento
            setIsDeepResearchProcessing(false);
            setDeepResearchRequestId(null);
            setIsLoading(false);
          });
      } catch (error: any) {
        console.error(
          "Erro ao iniciar validação DeepResearch para resultados existentes:",
          error
        );
        setIsDeepResearchProcessing(false);
        setDeepResearchRequestId(null);
        setIsLoading(false);
      }
    } else if (!enabled) {
      // Se estamos desativando, limpamos os estados relacionados
      setIsDeepResearchProcessing(false);
      setDeepResearchRequestId(null);
      setShowDeepResearchSidebar(false);

      // Garantimos que o skeleton não está ativo, pois já temos dados
      if (sugerirNCM.length > 0) {
        setIsLoading(false);
      }
    }
  };

  // Função para realizar a busca com base na entrada do usuário
  const handleSearch = async (
    ncmSugerido: string = "",
    autocomplete: Boolean = false
  ) => {
    setErrorMessage(null);
    setShowAutoComplete(false);
    setAutoCompleteData([]);

    setInputAiLoading(true); // Ativa o loading do InputAi

    if (pesquisa.length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para a busca.");
      setInputAiLoading(false);
      return;
    }

    // Sempre ativa o loading para exibir o skeleton
    setIsLoading(true);

    try {
      let response;
      let modeloUsado = selectedModel;
      const consulta = ncmSugerido
        ? `${pesquisa} com NCM sugerido ${ncmSugerido}`
        : pesquisa;

      // Configura os dados da requisição
      const requestData: any = {
        consulta: consulta,
        autocomplete: autocomplete,
        modelo: modeloUsado,
        ...dropdownSelection,
      };

      // Verifica se deve usar DeepResearch direto na requisição inicial
      if (useDeepResearch) {
        requestData.useDeepResearch = true;

        // Ativa o processamento e mostra o sidebar imediatamente
        setIsDeepResearchProcessing(true);
        setShowDeepResearchSidebar(true);
      }

      console.log("Enviando request:", requestData);

      response = await axiosInstance.post("/queries", requestData);

      console.log("Resposta do backend:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Atualiza os resultados da busca
        setSugerirNCM(response.data);

        // Se estamos usando DeepResearch, precisamos verificar o estado da validação
        if (useDeepResearch) {
          const hasDeepResearchPending = response.data.some(
            (item: any) => item.validacao_deepresearch?.status === "pendente"
          );

          if (hasDeepResearchPending) {
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

          // Desativa o loading do InputAI
          setInputAiLoading(false);

          // IMPORTANTE: Como já temos dados para mostrar, desativamos o skeleton
          // mesmo que o DeepResearch ainda esteja processando
          setIsLoading(false);
        } else {
          // Se não estiver usando DeepResearch, desativa ambos os loadings
          setInputAiLoading(false);
          setIsLoading(false);

          // Garante que o sidebar está fechado
          setShowDeepResearchSidebar(false);
        }
      } else if (response.data && response.data.error) {
        // Resposta de erro do servidor
        console.error("Erro retornado pelo servidor:", response.data.error);
        setErrorMessage(`Erro ao processar: ${response.data.error}`);
        setSugerirNCM([]);
        setInputAiLoading(false);
        setIsLoading(false);
      } else {
        // Resposta inesperada
        console.error("Resposta inesperada do servidor:", response.data);
        setErrorMessage(
          "Erro inesperado ao processar a consulta. Tente novamente."
        );
        setSugerirNCM([]);
        setInputAiLoading(false);
        setIsLoading(false);
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
      setInputAiLoading(false);
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

  // Função que garante que nenhuma barra branca será exibida durante o processamento
  const ensureNoWhiteBar = () => {
    // Adiciona uma classe ao corpo que oculta qualquer elemento com texto "Análise em andamento"
    document.body.classList.add("hide-analysis-status");

    // Remove a classe após um curto período
    const timer = setTimeout(() => {
      document.body.classList.remove("hide-analysis-status");
    }, 100);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove("hide-analysis-status");
    };
  };

  // Efeito para ocultar a barra branca quando isDeepResearchProcessing muda
  useEffect(() => {
    if (isDeepResearchProcessing) {
      return ensureNoWhiteBar();
    }
  }, [isDeepResearchProcessing]);

  // Efeito para ocultar a barra branca quando useDeepResearch muda
  useEffect(() => {
    if (useDeepResearch) {
      return ensureNoWhiteBar();
    }
  }, [useDeepResearch]);

  // Função para cancelar o processo de DeepResearch
  const handleCancelDeepResearch = async () => {
    // Cancelar o processo em andamento
    setIsDeepResearchProcessing(false);

    // Remover da lista de requisições concluídas no localStorage
    if (deepResearchRequestId) {
      const completedRequestsStr = localStorage.getItem(
        "completedDeepResearchRequests"
      );
      if (completedRequestsStr) {
        const completedRequests = JSON.parse(completedRequestsStr);
        const updatedRequests = completedRequests.filter(
          (id: string) => id !== deepResearchRequestId
        );
        localStorage.setItem(
          "completedDeepResearchRequests",
          JSON.stringify(updatedRequests)
        );
      }
    }

    // Cancelar via nova API se tivermos um requestId
    if (deepResearchRequestId) {
      try {
        const API_URL =
          import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
        const API_FASTAPI =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

        // Tenta cancelar via FastAPI primeiro
        try {
          await fetch(`${API_FASTAPI}/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Adiciona token se autenticado
            },
            body: JSON.stringify({ requestId: deepResearchRequestId }),
          });
          console.log(
            "Solicitação de cancelamento de DeepResearch enviada ao FastAPI"
          );
        } catch (error) {
          console.error("Erro ao cancelar DeepResearch via FastAPI:", error);
        }

        // Depois tenta usar a rota de cancelamento direta do Node.js
        await fetch(`${API_URL}/api/v1/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requestId: deepResearchRequestId }),
        });
        console.log(`DeepResearch cancelado com ID: ${deepResearchRequestId}`);
      } catch (error) {
        console.error("Erro ao cancelar DeepResearch:", error);
      }
    }

    setDeepResearchRequestId(null);
    setShowDeepResearchSidebar(false);
    setInputAiLoading(false);

    // Usar alert em vez de toast
    alert("A pesquisa profunda foi cancelada.");
  };

  // Retorna a estrutura visual do componente
  return (
    <div className={`page ${showDeepResearchSidebar ? "with-sidebar" : ""}`}>
      {/* Nova sidebar de DeepResearch */}
      {showDeepResearchSidebar && (
        <DeepResearchSidebar
          isOpen={showDeepResearchSidebar}
          requestId={deepResearchRequestId}
          productName={pesquisa}
          ncmCode={sugerirNCM.length > 0 ? sugerirNCM[0].ncm : ""}
          isProcessing={isDeepResearchProcessing}
          onCancelRequest={handleCancelDeepResearch}
        />
      )}

      <div className="content">
        <div className="container">
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
                      isLoading={inputAiLoading}
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
                          <DropdownMenu
                            onSelectionChange={handleDropdownChange}
                          />
                        </div>
                        <div
                          className="flex-shrink-0 ml-auto"
                          style={{ minWidth: "180px" }}
                        >
                          <DeepResearchToggle
                            enabled={useDeepResearch}
                            onChange={handleDeepResearchChange}
                            label="DeepResearch IA"
                            helpText="Ativar análise detalhada com IA avançada"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="gap-4 space-y-4">
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
                              : "bg-gray-800 border border-gray-300 text-gray-800"
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
                                "confirmado" &&
                                "NCM Confirmado por DeepResearch"}
                              {item.validacao_deepresearch.status ===
                                "negado" && "NCM Contestado por DeepResearch"}
                              {item.validacao_deepresearch.status ===
                                "sugestao" &&
                                "Sugestão Alternativa por DeepResearch"}
                              {(item.validacao_deepresearch.status === "erro" ||
                                item.validacao_deepresearch.status ===
                                  "timeout") &&
                                "Validação DeepResearch Indisponível"}
                            </div>
                            {item.validacao_deepresearch.status !==
                              "pendente" && (
                              <p className="text-sm font-normal break-words whitespace-normal">
                                {item.validacao_deepresearch.mensagem}
                              </p>
                            )}
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
      </div>
    </div>
  );
};

// Exporta o componente HomePage como default
export default HomePage;
