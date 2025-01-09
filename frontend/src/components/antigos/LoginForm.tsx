import React, { useState, useCallback, useMemo, useEffect } from "react";
import { SugerirNCM } from "../../types";
import axiosInstance from "../../axiosConfig";
import InputAi from "./InputAi";
import Button from "../Button";
import { BiSearch } from "react-icons/bi";
import BoxdeImpostos from "../BoxdeImpostos";
import InputField from "../InputField";
import { BiUser } from "react-icons/bi"; // Exemplo de ícone
import { BiChevronDown, BiChevronUp, BiChevronRight } from "react-icons/bi"; // Importar ícones para expandir/recolher
import debounce from "lodash.debounce"; // Importar debounce
import InfoBasicas from "../InfoBasicas";
import Atributos from "../Atributos";
import TabelaICMS from "../TabelaICMS";

const LoginForm: React.FC = () => {
  const [pesquisa, setPesquisa] = useState("");
  const [sugerirNCM, setSugerirNCM] = useState<SugerirNCM[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buscarValor, setBuscarValor] = useState("");
  const [isTabelaICMSOpen, setIsTabelaICMSOpen] = useState(false); // Estado para controlar a expansão da tabela

  const handleSearch = async () => {
    if (pesquisa.length < 3) {
      setSugerirNCM([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/gemini", {
        consulta: pesquisa,
      });
      setSugerirNCM(response.data);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedHandleSearch = useMemo(() => debounce(handleSearch, 3000), []);

  useEffect(() => {
    return () => {
      debouncedHandleSearch.cancel();
    };
  }, []);

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

          <div className="mt-8 space-y-6">
            {sugerirNCM.map((item, index) => (
              <div
                key={index}
                className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm mt-4"
              >
                <InfoBasicas ncm={item.ncm} description={item.description} />

                <div className="mt-4">
                  <Atributos
                    attributes={item.attributes}
                    tipiAttributes={item.tipi_attributes}
                    isLoading={isLoading}
                  />
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Classificação Tributária
                  </h3>
                  {/* Garantir que seja 'classificacao' em vez de 'classificacao_tributaria' (ou vice-versa) 
                     conforme o que o componente BoxdeImpostos aceitar */}
                  <BoxdeImpostos
                    classificacao={
                      item.classificacao_tributaria || {
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
                      }
                    }
                  />
                </div>
              </div>
            ))}
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
