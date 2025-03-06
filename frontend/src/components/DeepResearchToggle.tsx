import React, { CSSProperties } from "react";

interface DeepResearchToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  label?: string;
  helpText?: string;
}

/**
 * Componente de toggle para ativar/desativar o modo DeepResearch
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const DeepResearchToggle: React.FC<DeepResearchToggleProps> = ({
  enabled,
  onChange,
  disabled = false,
  label = "DeepResearch",
  helpText = "Ative para análise profunda e validação adicional dos resultados",
}) => {
  // Estilos inline com variáveis CSS para compatibilidade com o tema
  const containerStyle: CSSProperties = {
    margin: "0.5rem 0",
    fontFamily:
      "var(--font-family-primary, system-ui, -apple-system, sans-serif)",
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  };

  const labelStyle: CSSProperties = {
    fontSize: "var(--font-size-sm, 0.9rem)",
    fontWeight: "var(--font-weight-medium, 500)",
    color: "var(--color-text-primary, #fff)",
  };

  const baseButtonStyle: CSSProperties = {
    backgroundColor: "var(--color-background-secondary, #2a2a2a)",
    color: "var(--color-text-secondary, #ccc)",
    border: "1px solid var(--color-border, #444)",
    borderRadius: "20px",
    padding: "0.3rem 0.8rem",
    fontSize: "var(--font-size-xs, 0.8rem)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
    boxShadow: "0 1px 2px var(--color-shadow, rgba(0,0,0,0.2))",
  };

  const activeStyle: CSSProperties = {
    backgroundColor: "var(--color-primary, #2775cf)",
    color: "var(--color-white, #fff)",
    border: "1px solid var(--color-primary, #2775cf)",
  };

  const disabledStyle: CSSProperties = {
    opacity: 0.6,
    cursor: "not-allowed",
  };

  const helpTextStyle: CSSProperties = {
    display: "block",
    marginTop: "0.25rem",
    fontSize: "var(--font-size-xs, 0.75rem)",
    color: "var(--color-text-secondary, #aaa)",
  };

  // Combina os estilos base com os condicionais
  const buttonStyle: CSSProperties = {
    ...baseButtonStyle,
    ...(enabled ? activeStyle : {}),
    ...(disabled ? disabledStyle : {}),
  };

  return (
    <div style={containerStyle} className="deep-research-toggle">
      <div style={headerStyle} className="toggle-header">
        <span style={labelStyle} className="toggle-label">
          {label}
        </span>
        <button
          type="button"
          style={buttonStyle}
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
      {helpText && (
        <small style={helpTextStyle} className="toggle-help">
          {helpText}
        </small>
      )}
    </div>
  );
};

export default DeepResearchToggle;
