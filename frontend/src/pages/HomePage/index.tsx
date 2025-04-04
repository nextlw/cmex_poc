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
import {
  normalizeResponse,
  DeepResearchResponse,
} from "../../utils/llm-json-normalizer";

// Define o componente HomePage como um componente funcional React
const HomePage: React.FC = () => {
  // Recupera o estado inicial do localStorage ou usa o valor padrão
  const [pesquisa, setPesquisa] = useState("");

  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nex-0.5-Preview-2025"
  );

  const [dropdownSelection, setDropdownSelection] =
    useState<SelectionData | null>(null);

  const [sugerirNCM, setSugerirNCM] = useState<SugerirNCM[]>([
    {
      ncm: "",
      descricao: "",
      atributos: [],
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
      requestId: undefined,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [buscarValor, setBuscarValor] = useState("");
  const [isTabelaICMSOpen, setIsTabelaICMSOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [useDeepResearch, setUseDeepResearch] = useState<boolean>(false);

  const [deepResearchRequestId, setDeepResearchRequestId] = useState<
    string | null
  >(null);

  const [isDeepResearchProcessing, setIsDeepResearchProcessing] =
    useState(false);

  const [showDeepResearchSidebar, setShowDeepResearchSidebar] = useState(false);

  // Estado para controlar quando o InputAi deve sair do loading
  const [inputAiLoading, setInputAiLoading] = useState(false);

  const [infoBasicasLoading, setInfoBasicasLoading] = useState(false);
  const [atributosLoading, setAtributosLoading] = useState(false);
  const [tributacaoLoading, setTributacaoLoading] = useState(false);

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

    // Ativar todos os estados de loading
    setInputAiLoading(true);
    setInfoBasicasLoading(true);
    setAtributosLoading(true);
    setTributacaoLoading(true);

    if (pesquisa.length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para a busca.");

      // Desativa o loading pois não chegou a iniciar uma requisição
      setInputAiLoading(false);
      setInfoBasicasLoading(false);
      setAtributosLoading(false);
      setTributacaoLoading(false);
      return;
    }

    try {
      let response;
      let modeloUsado = selectedModel;
      let isPesquisaNCM =
        pesquisa.startsWith("NCM:") || ncmSugerido.startsWith("NCM:");

      // Extrair o código NCM se estiver no formato "NCM: 12345678"
      let consulta = ncmSugerido
        ? `${pesquisa} com NCM sugerido ${ncmSugerido}`
        : pesquisa;

      if (isPesquisaNCM) {
        // Se for pesquisa direta por NCM, extrai o código e formata adequadamente
        const ncmCode = pesquisa.startsWith("NCM:")
          ? pesquisa.substring(4).trim()
          : ncmSugerido.substring(4).trim();
        consulta = `Código NCM ${ncmCode}`;
      }

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
        setIsDeepResearchProcessing(true);
        setShowDeepResearchSidebar(true);
      }

      console.log("Enviando request:", requestData);

      response = await axiosInstance.post("/queries", requestData);

      console.log("Resposta do backend:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Normalizar a resposta
        const normalizedData: DeepResearchResponse = normalizeResponse(
          response.data
        );
        setSugerirNCM(normalizedData.result);

        if (useDeepResearch) {
          // MODO DEEP RESEARCH ATIVO:
          // Manter TODOS os loadings ativos, eles serão desativados pelo onProcessComplete
          setInputAiLoading(true);
          setInfoBasicasLoading(true);
          setAtributosLoading(true);
          setTributacaoLoading(true);

          // Iniciar monitoramento do DeepResearch
          setIsDeepResearchProcessing(true);
          setShowDeepResearchSidebar(true);
          if (normalizedData.requestId) {
            setDeepResearchRequestId(normalizedData.requestId);
            console.log("ID da tarefa DeepResearch:", normalizedData.requestId);
          }
        } else {
          // MODO DEEP RESEARCH INATIVO:
          // Desativar loadings com base na resposta inicial (que é a final neste caso)
          setInputAiLoading(false);

          // CORREÇÃO: Desativar loadings incondicionalmente pois a resposta é final
          setInfoBasicasLoading(false);
          setAtributosLoading(false);
          setTributacaoLoading(false);

          // Garantir que a sidebar e o estado de processamento estejam desativados
          setIsDeepResearchProcessing(false);
          setShowDeepResearchSidebar(false);
          setDeepResearchRequestId(null);
        }
      } else if (response.data && response.data.error) {
        console.error("Erro retornado pelo servidor:", response.data.error);
        setErrorMessage(`Erro ao processar: ${response.data.error}`);
        setSugerirNCM([]);

        // Apenas desativa o loading se for um erro fatal que não permite continuar
        if (!useDeepResearch) {
          setInputAiLoading(false);
        }

        setInfoBasicasLoading(false);
        setAtributosLoading(false);
        setTributacaoLoading(false);
      } else {
        console.error("Resposta inesperada do servidor:", response.data);
        setErrorMessage(
          "Erro inesperado ao processar a consulta. Tente novamente."
        );
        setSugerirNCM([]);

        // Apenas desativa o loading se for um erro fatal que não permite continuar
        if (!useDeepResearch) {
          setInputAiLoading(false);
        }

        setInfoBasicasLoading(false);
        setAtributosLoading(false);
        setTributacaoLoading(false);
      }
    } catch (error: any) {
      console.error("Erro ao buscar sugestões:", error);

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

      // Desativa o loading mesmo no caso de DeepResearch ativo,
      // pois um erro de requisição é fatal para o processo
      setInputAiLoading(false);
      setInfoBasicasLoading(false);
      setAtributosLoading(false);
      setTributacaoLoading(false);
    }
  };

  // Função para realizar a busca com base na máscara do NCM
  const handleMaskedSearch = async (
    ncm: string,
    maskType: "capitulo" | "posicao" | "subposicao" | "item_completo"
  ) => {
    setErrorMessage(null);
    setShowAutoComplete(false);
    setAutoCompleteData([]);

    // Ativar todos os estados de loading
    setInputAiLoading(true);
    setInfoBasicasLoading(true);
    setAtributosLoading(true);
    setTributacaoLoading(true);

    try {
      // Criar um prompt específico com base no tipo de máscara
      let prompt = "";
      switch (maskType) {
        case "capitulo":
          prompt = `Buscar pelo capítulo NCM ${ncm}`;
          break;
        case "posicao":
          prompt = `Buscar pela posição NCM ${ncm}`;
          break;
        case "subposicao":
          prompt = `Buscar pela subposição NCM ${ncm}`;
          break;
        case "item_completo":
          prompt = `Buscar pelo código NCM completo ${ncm}`;
          break;
      }

      // Configurar os dados da requisição
      const requestData: any = {
        consulta: prompt,
        autocomplete: false,
        modelo: selectedModel,
        ...dropdownSelection,
      };

      // Verifica se deve usar DeepResearch direto na requisição inicial
      if (useDeepResearch) {
        requestData.useDeepResearch = true;
        setIsDeepResearchProcessing(true);
        setShowDeepResearchSidebar(true);
      }

      console.log(`Enviando busca por ${maskType} NCM ${ncm}:`, requestData);

      const response = await axiosInstance.post("/queries", requestData);

      console.log("Resposta do backend:", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Normalizar a resposta
        const normalizedData: DeepResearchResponse = normalizeResponse(
          response.data
        );
        setSugerirNCM(normalizedData.result);

        if (useDeepResearch) {
          // MODO DEEP RESEARCH ATIVO:
          // Manter TODOS os loadings ativos, eles serão desativados pelo onProcessComplete
          setInputAiLoading(true);
          setInfoBasicasLoading(true);
          setAtributosLoading(true);
          setTributacaoLoading(true);

          // Iniciar monitoramento do DeepResearch
          setIsDeepResearchProcessing(true);
          setShowDeepResearchSidebar(true);
          if (normalizedData.requestId) {
            setDeepResearchRequestId(normalizedData.requestId);
            console.log("ID da tarefa DeepResearch:", normalizedData.requestId);
          }
        } else {
          // MODO DEEP RESEARCH INATIVO:
          // Desativar loadings com base na resposta inicial (que é a final neste caso)
          setInputAiLoading(false);
          setInfoBasicasLoading(false);
          setAtributosLoading(false);
          setTributacaoLoading(false);

          // Garantir que a sidebar e o estado de processamento estejam desativados
          setIsDeepResearchProcessing(false);
          setShowDeepResearchSidebar(false);
          setDeepResearchRequestId(null);
        }
      } else if (response.data && response.data.error) {
        console.error("Erro retornado pelo servidor:", response.data.error);
        setErrorMessage(`Erro ao processar: ${response.data.error}`);
        setSugerirNCM([]);

        setInputAiLoading(false);
        setInfoBasicasLoading(false);
        setAtributosLoading(false);
        setTributacaoLoading(false);
      } else {
        console.error("Resposta inesperada do servidor:", response.data);
        setErrorMessage(
          "Erro inesperado ao processar a consulta. Tente novamente."
        );
        setSugerirNCM([]);

        setInputAiLoading(false);
        setInfoBasicasLoading(false);
        setAtributosLoading(false);
        setTributacaoLoading(false);
      }
    } catch (error: any) {
      console.error("Erro na requisição:", error);
      setErrorMessage(
        `Erro ao processar: ${
          error.response?.data?.error || error.message || "Erro desconhecido"
        }`
      );

      setIsDeepResearchProcessing(false);
      setDeepResearchRequestId(null);
      setSugerirNCM([]);

      setInputAiLoading(false);
      setInfoBasicasLoading(false);
      setAtributosLoading(false);
      setTributacaoLoading(false);
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
    // Cancelar a pesquisa no backend, se houver um requestId válido
    if (deepResearchRequestId) {
      try {
        await axiosInstance.post(
          `/cancel-deepresearch/${deepResearchRequestId}`
        );
        console.log(`DeepResearch cancelado com ID: ${deepResearchRequestId}`);
      } catch (error) {
        console.error("Erro ao cancelar DeepResearch:", error);
      }
    }

    setDeepResearchRequestId(null);
    setShowDeepResearchSidebar(false);
    setIsDeepResearchProcessing(false);
    // Não desativa o loading do InputAI ao cancelar, apenas remove a sidebar
    // setInputAiLoading(false); - Removido para manter consistência

    // Usar alert em vez de toast
    alert("A pesquisa profunda foi cancelada.");
  };

  // Retorna a estrutura visual do componente
  return (
    <div className={`page ${showDeepResearchSidebar ? "with-sidebar" : ""}`}>
      {/* Sidebar para DeepResearch */}
      {showDeepResearchSidebar && (
        <DeepResearchSidebar
          isOpen={showDeepResearchSidebar}
          requestId={deepResearchRequestId}
          productName={pesquisa}
          ncmCode={sugerirNCM.length > 0 ? sugerirNCM[0].ncm : ""}
          isProcessing={isDeepResearchProcessing}
          onCancelRequest={handleCancelDeepResearch}
          onProcessComplete={() => {
            console.log(
              "DeepResearch concluído - Verificando dados antes de desativar loadings."
            );

            // Verificar se temos dados completos antes de desativar o loading
            if (
              sugerirNCM.length > 0 &&
              sugerirNCM[0].ncm &&
              sugerirNCM[0].descricao &&
              ((sugerirNCM[0].atributos &&
                sugerirNCM[0].atributos.length > 0) ||
                ((sugerirNCM[0] as any).atributos_detalhados &&
                  (sugerirNCM[0] as any).atributos_detalhados.length > 0)) &&
              sugerirNCM[0].classificacao_tributaria
            ) {
              console.log("Dados completos encontrados, desativando loadings");
              // Dados completos, podemos desativar o loading
              setInputAiLoading(false);
              setInfoBasicasLoading(false);
              setAtributosLoading(false);
              setTributacaoLoading(false);
            } else {
              console.log(
                "Dados incompletos, aguardando 1.5 segundos antes de desativar loadings"
              );
              // Dados incompletos, aguardar um pouco mais
              setTimeout(() => {
                console.log("Tempo de espera concluído, desativando loadings");
                setInputAiLoading(false);
                setInfoBasicasLoading(false);
                setAtributosLoading(false);
                setTributacaoLoading(false);
              }, 1500); // Aguardar 1.5 segundos
            }

            setIsDeepResearchProcessing(false); // Desativar o estado de processamento
          }}
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

                  {/* Mapeia os resultados */}
                  {!isLoading && sugerirNCM.length > 0 && (
                    <>
                      {sugerirNCM.map((item, index) => (
                        <div
                          key={item.ncm || index}
                          className="box-page grid grid-cols-12 gap-4"
                        >
                          {/* Bloco de status do DeepResearch (Removido/Comentado) */}
                          {/* ... código comentado ... */}

                          {/* Componente de Informações Básicas */}
                          <div className="col-span-12 md:col-span-6 page-item h-full">
                            {infoBasicasLoading ? (
                              <InfoBasicasSkeleton />
                            ) : (
                              <InfoBasicas
                                ncm={item.ncm || ""}
                                descricao={item.descricao || ""}
                                onNcmSearch={(ncmValue) => {
                                  // Pesquisa direta pela NCM
                                  console.log(
                                    "Pesquisando pela NCM:",
                                    ncmValue
                                  );
                                  // Usamos o valor do NCM diretamente na pesquisa
                                  setPesquisa("NCM: " + ncmValue);
                                  handleSearch();
                                }}
                                onMaskedSearch={(ncm, maskType) => {
                                  console.log(
                                    `Realizando busca por ${maskType} com NCM ${ncm}`
                                  );
                                  // Atualizamos o campo de pesquisa para mostrar o que estamos buscando

                                  // Formatar o NCM para exibição com pontos
                                  let formattedNcm = "";
                                  switch (maskType) {
                                    case "capitulo":
                                      formattedNcm = ncm.substring(0, 2);
                                      setPesquisa(
                                        `Capítulo NCM: ${formattedNcm}`
                                      );
                                      break;
                                    case "posicao":
                                      formattedNcm = ncm.substring(0, 4);
                                      setPesquisa(
                                        `Posição NCM: ${formattedNcm}`
                                      );
                                      break;
                                    case "subposicao":
                                      formattedNcm = `${ncm.substring(
                                        0,
                                        4
                                      )}.${ncm.substring(4, 6)}`;
                                      setPesquisa(
                                        `Subposição NCM: ${formattedNcm}`
                                      );
                                      break;
                                    case "item_completo":
                                      formattedNcm = `${ncm.substring(
                                        0,
                                        4
                                      )}.${ncm.substring(4, 6)}.${ncm.substring(
                                        6,
                                        8
                                      )}`;
                                      setPesquisa(
                                        `Código NCM completo: ${formattedNcm}`
                                      );
                                      break;
                                  }

                                  // Chamamos a função de busca com máscara usando o NCM sem pontos
                                  handleMaskedSearch(ncm, maskType);
                                }}
                              />
                            )}
                          </div>

                          {/* Componente de Atributos */}
                          <div className="col-span-12 md:col-span-6 page-item h-full">
                            {atributosLoading ? (
                              <AtributosSkeleton />
                            ) : (
                              <Atributos
                                atributos={item.atributos || []}
                                isLoading={false}
                              />
                            )}
                          </div>

                          {/* Componente de Tributação (usando BoxdeImpostos) */}
                          <div className="col-span-12 page-item">
                            {tributacaoLoading ? (
                              <BoxdeImpostosSkeleton />
                            ) : (
                              <BoxdeImpostos
                                classificacao={
                                  item.classificacao_tributaria || {}
                                }
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

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
