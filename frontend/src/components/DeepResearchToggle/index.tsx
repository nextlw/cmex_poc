import React from "react";
import { DeepResearchToggleProps } from "./types";
import "./styles.css";

/**
 * Componente de toggle para ativar/desativar o modo DeepResearch
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const DeepResearchToggle: React.FC<DeepResearchToggleProps> = ({
  enabled = false,
  onChange,
  disabled = false,
  label = "DeepResearch",
  helpText = "Ative para análise profunda e validação adicional dos resultados",
}) => {
  return (
    <div className="deep-research-toggle">
      <div className="toggle-header">
        <span className="toggle-label">{label}</span>
        <button
          type="button"
          className={`toggle-button ${enabled ? "toggle-active" : ""} ${
            disabled ? "toggle-disabled" : ""
          }`}
          onClick={() => !disabled && onChange(!enabled)}
          disabled={disabled}
          aria-pressed={enabled}
          title={disabled ? "Esta opção não está disponível no momento" : ""}
        >
          {enabled ? "Ativado" : "Desativado"}
        </button>
      </div>
      {helpText && <small className="toggle-help">{helpText}</small>}
    </div>
  );
};

export default DeepResearchToggle;
