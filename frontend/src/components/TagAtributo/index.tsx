import React from "react";
import {
  FaFileImport,
  FaFileExport,
  FaGlobeAmericas,
  FaCheckCircle,
} from "react-icons/fa";
import {
  BsListCheck,
  BsToggleOn,
  BsTextParagraph,
  BsCalendarDate,
} from "react-icons/bs";
import { TbNumbers, TbSitemap } from "react-icons/tb";
import { RiErrorWarningFill } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import "./styles.css";
import { TagAtributoProps } from "./types";
import { FormaPreenchimento, Modalidade } from "../../types/atributos";

// Interface para o modo legado (definida localmente)
interface LegacyTagAtributoProps {
  atributo: string;
  onRemove?: (atributo: string) => void;
}

// Componente de tooltip customizado simples
const CustomTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  dark?: boolean;
}> = ({ content, children, dark = false }) => {
  return (
    <div
      className={`tooltip-container ${dark ? "dark" : ""}`}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={(e) => {
        const tooltip = e.currentTarget.querySelector(
          ".tooltip-text"
        ) as HTMLElement;
        if (tooltip) {
          tooltip.style.visibility = "visible";
          tooltip.style.opacity = "1";
        }
      }}
      onMouseLeave={(e) => {
        const tooltip = e.currentTarget.querySelector(
          ".tooltip-text"
        ) as HTMLElement;
        if (tooltip) {
          tooltip.style.visibility = "hidden";
          tooltip.style.opacity = "0";
        }
      }}
    >
      {children}
      <span
        className="tooltip-text"
        style={{
          visibility: "hidden",
          position: "absolute",
          zIndex: 1,
          bottom: "125%",
          left: "50%",
          marginLeft: "-60px",
          backgroundColor: dark ? "#000" : "#fff",
          color: dark ? "#fff" : "#000",
          textAlign: "center",
          padding: "5px 8px",
          borderRadius: "6px",
          width: "120px",
          fontSize: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          opacity: 0,
          transition: "opacity 0.3s",
        }}
      >
        {content}
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            marginLeft: "-5px",
            borderWidth: "5px",
            borderStyle: "solid",
            borderColor: `${
              dark ? "#000" : "#fff"
            } transparent transparent transparent`,
          }}
        ></div>
      </span>
    </div>
  );
};

// Estilos para os ícones
const iconStyles = {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    cursor: "help",
  },
  modalidade: {
    color: "#0066cc",
    marginRight: "6px",
  },
  forma: {
    color: "#555555",
    marginLeft: "6px",
  },
  obrigatorioTrue: {
    color: "#cc0000",
    marginLeft: "6px",
  },
  obrigatorioFalse: {
    color: "#00cc00",
    marginLeft: "6px",
  },
};

const TagAtributo: React.FC<TagAtributoProps | LegacyTagAtributoProps> = (
  props
) => {
  const isLegacyMode =
    "atributo" in props && typeof props.atributo === "string";

  if (isLegacyMode) {
    const { atributo, onRemove } = props as LegacyTagAtributoProps;
    return (
      <li
        style={{
          display: "flex",
          alignItems: "center",
          background: "#f5f5f5",
          borderRadius: "16px",
          padding: "4px 12px",
          margin: "4px",
          fontSize: "14px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <span style={{ ...iconStyles.base, ...iconStyles.modalidade }}>
          <TbSitemap />
        </span>
        <span style={{ margin: "0 4px", fontWeight: 500 }}>{atributo}</span>
        {onRemove && (
          <button
            onClick={() => onRemove(atributo)}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "16px",
              marginLeft: "8px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
            }}
            aria-label="Remover atributo"
          >
            <IoClose />
          </button>
        )}
      </li>
    );
  }

  const { attribute, onRemove } = props as TagAtributoProps;

  if (!attribute) {
    console.error("Propriedade attribute não foi fornecida ao TagAtributo");
    return null;
  }

  // --- Mapeamento de Ícones e Textos ---
  const getModalidadeInfo = (modalidade?: Modalidade) => {
    switch (modalidade) {
      case Modalidade.IMPORTACAO:
        return { icon: <FaFileImport />, text: "Importação" };
      case Modalidade.EXPORTACAO:
        return { icon: <FaFileExport />, text: "Exportação" };
      case Modalidade.AMBOS:
        return { icon: <FaGlobeAmericas />, text: "Importação e Exportação" };
      default:
        return { icon: null, text: "Modalidade desconhecida" };
    }
  };

  const getFormaPreenchimentoInfo = (forma?: FormaPreenchimento) => {
    switch (forma) {
      case FormaPreenchimento.LISTA_ESTATICA:
      case FormaPreenchimento.LISTA_DINAMICA:
      case FormaPreenchimento.LISTA_TABX_FILTRO:
        return { icon: <BsListCheck />, text: "Lista de opções" };
      case FormaPreenchimento.BOOLEANO:
        return { icon: <BsToggleOn />, text: "Booleano (Sim/Não)" };
      case FormaPreenchimento.TEXTO:
        return { icon: <BsTextParagraph />, text: "Texto livre" };
      case FormaPreenchimento.NUMERO_INTEIRO:
      case FormaPreenchimento.NUMERO_REAL:
        return { icon: <TbNumbers />, text: "Número" };
      case FormaPreenchimento.DATA:
      case FormaPreenchimento.DATA_HORA:
        return { icon: <BsCalendarDate />, text: "Data" };
      default:
        return { icon: null, text: "Forma desconhecida" };
    }
  };

  const getObrigatorioInfo = (obrigatorio?: boolean) => {
    if (obrigatorio === undefined) return { icon: null, text: "" };
    return obrigatorio
      ? {
          icon: <RiErrorWarningFill />,
          text: "Preenchimento obrigatório",
          style: iconStyles.obrigatorioTrue,
        }
      : {
          icon: <FaCheckCircle />,
          text: "Preenchimento opcional",
          style: iconStyles.obrigatorioFalse,
        };
  };

  const modalidadeInfo = getModalidadeInfo(attribute.modalidade);
  const formaInfo = getFormaPreenchimentoInfo(attribute.formaPreenchimento);
  const obrigatorioInfo = getObrigatorioInfo(attribute.obrigatorio);

  // --- Renderização ---
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        background: "#f5f5f5",
        borderRadius: "16px",
        padding: "4px 12px",
        margin: "4px",
        fontSize: "14px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        transition: "all 0.2s ease",
      }}
    >
      {/* 1. Ícone de Modalidade (com tooltip especial de fundo preto) */}
      {modalidadeInfo.icon && (
        <CustomTooltip content={modalidadeInfo.text} dark>
          <span style={{ ...iconStyles.base, ...iconStyles.modalidade }}>
            {modalidadeInfo.icon}
          </span>
        </CustomTooltip>
      )}

      {/* 2. Nome de Apresentação */}
      <span style={{ margin: "0 4px", fontWeight: 500 }}>
        {attribute.nomeApresentacao}
      </span>

      {/* 3. Ícone de Forma de Preenchimento */}
      {formaInfo.icon && (
        <CustomTooltip content={formaInfo.text}>
          <span style={{ ...iconStyles.base, ...iconStyles.forma }}>
            {formaInfo.icon}
          </span>
        </CustomTooltip>
      )}

      {/* 4. Ícone de Obrigatoriedade */}
      {obrigatorioInfo.icon && (
        <CustomTooltip content={obrigatorioInfo.text}>
          <span style={{ ...iconStyles.base, ...obrigatorioInfo.style }}>
            {obrigatorioInfo.icon}
          </span>
        </CustomTooltip>
      )}

      {/* Botão Remover */}
      {onRemove && (
        <button
          onClick={() => onRemove(attribute.codigo)}
          style={{
            background: "none",
            border: "none",
            color: "#888",
            cursor: "pointer",
            fontSize: "16px",
            marginLeft: "8px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
          }}
          aria-label={`Remover atributo ${attribute.nomeApresentacao}`}
        >
          <IoClose />
        </button>
      )}
    </li>
  );
};

export default TagAtributo;
