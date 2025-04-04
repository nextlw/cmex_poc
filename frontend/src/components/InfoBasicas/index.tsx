import React, { useState, KeyboardEvent, useEffect } from "react";
import "./styles.css";
import { InfoBasicasProps } from "./types";
import { BsInfoCircle, BsSearch } from "react-icons/bs";
import Skeleton from "../Skeleton";
import { BiStar } from "react-icons/bi";

const InfoBasicas: React.FC<InfoBasicasProps> = ({
  ncm,
  descricao,
  isLoading = false,
  onNcmSearch = () => {},
  onMaskedSearch,
}) => {
  // Estado para armazenar o valor formatado exibido no input
  const [displayValue, setDisplayValue] = useState<string>("");
  // Estado para armazenar o valor numérico sem pontos (para busca)
  const [ncmInput, setNcmInput] = useState<string>("");
  const [helpText, setHelpText] = useState<string>("");
  const [isValidNcm, setIsValidNcm] = useState<boolean>(true);
  const [maskType, setMaskType] = useState<
    "capitulo" | "posicao" | "subposicao" | "item_completo" | null
  >(null);

  // Função para remover pontos e caracteres não numéricos
  const stripNonNumeric = (value: string): string => {
    return value.replace(/\D/g, "");
  };

  // Função para aplicar a formatação com pontos
  const formatNcmWithDots = (value: string): string => {
    const numericValue = stripNonNumeric(value);
    if (!numericValue) return "";

    let formattedValue = "";

    if (numericValue.length >= 1) {
      // Adiciona os primeiros 4 dígitos (posição)
      formattedValue = numericValue.substring(0, 4);

      // Se tiver 5 ou mais dígitos, adiciona o primeiro ponto e os próximos 2 dígitos
      if (numericValue.length >= 5) {
        formattedValue += "." + numericValue.substring(4, 6);

        // Se tiver 7 ou mais dígitos, adiciona o segundo ponto e os últimos 2 dígitos
        if (numericValue.length >= 7) {
          formattedValue += "." + numericValue.substring(6, 8);
        }
      }
    }

    return formattedValue;
  };

  // Inicializa o campo com o NCM formatado, se fornecido
  useEffect(() => {
    if (ncm) {
      const numericNcm = stripNonNumeric(ncm);
      setNcmInput(numericNcm);
      setDisplayValue(formatNcmWithDots(numericNcm));
    }
  }, [ncm]);

  // Função para validar o formato do NCM
  const validateNcmFormat = (value: string): boolean => {
    const numericValue = stripNonNumeric(value);
    const validLengths = [2, 4, 6, 8];
    return (
      validLengths.includes(numericValue.length) || numericValue.length === 0
    );
  };

  // Função para atualizar o texto de ajuda e o tipo de máscara com base no comprimento do NCM
  const updateHelpTextAndMaskType = (value: string): void => {
    const numericValue = stripNonNumeric(value);
    if (!numericValue) {
      setHelpText("");
      setMaskType(null);
      return;
    }

    switch (numericValue.length) {
      case 2:
        setHelpText("Busca por Capítulo");
        setMaskType("capitulo");
        break;
      case 4:
        setHelpText("Busca por Posição");
        setMaskType("posicao");
        break;
      case 6:
        setHelpText("Busca por Subposição");
        setMaskType("subposicao");
        break;
      case 8:
        setHelpText("Busca por Item/Subitem Completo");
        setMaskType("item_completo");
        break;
      default:
        setHelpText("Formato NCM inválido. Digite 2, 4, 6 ou 8 dígitos.");
        setMaskType(null);
        break;
    }
  };

  // Atualiza o texto de ajuda quando o valor do input muda
  useEffect(() => {
    const isValid = validateNcmFormat(ncmInput);
    setIsValidNcm(isValid);
    updateHelpTextAndMaskType(ncmInput);
  }, [ncmInput]);

  const handleNcmChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const inputValue = e.target.value;
    // Remover todos os caracteres não numéricos
    const numericValue = stripNonNumeric(inputValue);
    // Limitar a 8 dígitos
    const limitedValue = numericValue.slice(0, 8);

    // Atualizar o estado numérico (para busca)
    setNcmInput(limitedValue);

    // Atualizar o valor exibido com a formatação
    setDisplayValue(formatNcmWithDots(limitedValue));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && isValidNcm && ncmInput.length > 0) {
      e.preventDefault();

      // Se onMaskedSearch estiver disponível e tivermos um tipo de máscara válido,
      // usamos a busca específica por máscara
      if (onMaskedSearch && maskType) {
        onMaskedSearch(ncmInput, maskType);
      } else {
        // Caso contrário, usamos a busca padrão
        onNcmSearch(ncmInput);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="info-bas h-full">
        <div className="flex items-center gap-2 mb-4">
          <BsInfoCircle />
          <h3 className="text-xl font-semibold">Informações Básicas</h3>
        </div>
        <hr className="border-[var(--color-border-hr)] my-4" />
        <div className="space-y-4 flex-grow">
          <div>
            <div className="text-gray-300 font-medium mb-2">NCM</div>
            <Skeleton height="24px" />
          </div>
          <div>
            <div className="text-gray-300 font-medium mb-2">Descrição</div>
            <Skeleton height="48px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="info-bas h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <BsInfoCircle />
        <h3 className="text-xl font-semibold">Informações Básicas</h3>
      </div>
      <hr className="border-[var(--color-border-hr)] my-4" />
      <div className="space-y-4 flex-grow">
        <div>
          <div className="text-gray-300 font-medium mb-2">NCM</div>
          <div className="ncm-input-container">
            <input
              type="text"
              value={displayValue}
              onChange={handleNcmChange}
              onKeyPress={handleKeyPress}
              className={`ncm-input ${!isValidNcm ? "ncm-input-error" : ""}`}
              placeholder="XXXX.XX.XX"
              title="Insira 2 (Capítulo), 4 (Posição), 6 (Subposição) ou 8 (Item Completo) dígitos"
            />
            <div className="ncm-icon">
              <BsSearch />
            </div>
          </div>
          {helpText && (
            <div
              className={`ncm-help-text ${
                !isValidNcm ? "ncm-help-text-error" : ""
              }`}
            >
              <BiStar className="help-icon" />
              <span>{helpText}</span>
            </div>
          )}
        </div>
        <div className="flex-grow">
          <div className="text-gray-300 font-medium mb-2">Descrição</div>
          <textarea
            className="descricao-textarea"
            value={descricao || "—"}
            readOnly
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default InfoBasicas;
