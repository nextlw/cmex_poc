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
  const [ncmInput, setNcmInput] = useState(ncm || "");
  const [helpText, setHelpText] = useState<string>("");
  const [isValidNcm, setIsValidNcm] = useState<boolean>(true);
  const [maskType, setMaskType] = useState<
    "capitulo" | "posicao" | "subposicao" | "item_completo" | null
  >(null);

  // Função para aplicar a máscara ao NCM
  const applyNcmMask = (value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, "");
    // Limita a 8 dígitos
    return numericValue.slice(0, 8);
  };

  // Função para validar o formato do NCM
  const validateNcmFormat = (value: string) => {
    const validLengths = [2, 4, 6, 8];
    return validLengths.includes(value.length) || value.length === 0;
  };

  // Função para atualizar o texto de ajuda e o tipo de máscara com base no comprimento do NCM
  const updateHelpTextAndMaskType = (value: string) => {
    if (!value) {
      setHelpText("");
      setMaskType(null);
      return;
    }

    switch (value.length) {
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

  const handleNcmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyNcmMask(e.target.value);
    setNcmInput(maskedValue);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
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
              value={ncmInput}
              onChange={handleNcmChange}
              onKeyPress={handleKeyPress}
              className={`ncm-input ${!isValidNcm ? "ncm-input-error" : ""}`}
              placeholder="Digite o código NCM (2, 4, 6 ou 8 dígitos)"
              pattern="\d{2}|\d{4}|\d{6}|\d{8}"
              title="Insira 2, 4, 6 ou 8 dígitos"
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
