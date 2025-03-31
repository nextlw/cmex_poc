import React from "react";
import { RiAiGenerate2 } from "react-icons/ri";
import { ModelIndicatorProps } from "./types";
import "./styles.css";

/**
 * Componente que exibe um indicador do modelo utilizado
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const ModelIndicator: React.FC<ModelIndicatorProps> = ({
  modelName,
  size = "medium",
  className = "",
  processingTime,
  isDefault = false,
}) => {
  // Função para formatar o tempo de processamento
  const formatProcessingTime = (time: number): string => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className={`model-indicator ${size} ${
        isDefault ? "default" : ""
      } ${className}`}
    >
      <span className="model-indicator-icon">
        <RiAiGenerate2
          size={size === "small" ? 10 : size === "large" ? 16 : 14}
        />
      </span>
      <span className="model-indicator-name">{modelName}</span>
      {processingTime && (
        <span className="model-indicator-time">
          {formatProcessingTime(processingTime)}
        </span>
      )}
    </div>
  );
};

export default ModelIndicator;
