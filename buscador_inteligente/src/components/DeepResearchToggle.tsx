import React, { CSSProperties } from 'react';

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
  helpText = "Ative para análise profunda e validação adicional dos resultados"
}) => {
  // Estilos inline com tipos explícitos
  const containerStyle: CSSProperties = {
    margin: '1rem 0',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
  };
  
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  };
  
  const labelStyle: CSSProperties = {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#333'
  };
  
  const baseButtonStyle: CSSProperties = {
    backgroundColor: '#e0e0e0',
    color: '#666',
    border: 'none',
    borderRadius: '20px',
    padding: '0.4rem 1rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  };
  
  const activeStyle: CSSProperties = {
    backgroundColor: '#add8e6',
    color: '#333'
  };
  
  const disabledStyle: CSSProperties = {
    opacity: 0.6,
    cursor: 'not-allowed'
  };
  
  const helpTextStyle: CSSProperties = {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: '#666'
  };

  // Combina os estilos base com os condicionais
  const buttonStyle: CSSProperties = {
    ...baseButtonStyle,
    ...(enabled ? activeStyle : {}),
    ...(disabled ? disabledStyle : {})
  };

  return (
    <div style={containerStyle} className="deep-research-toggle">
      <div style={headerStyle} className="toggle-header">
        <span style={labelStyle} className="toggle-label">{label}</span>
        <button
          type="button"
          style={buttonStyle}
          className={`toggle-button ${enabled ? 'toggle-active' : ''} ${disabled ? 'toggle-disabled' : ''}`}
          onClick={() => !disabled && onChange(!enabled)}
          disabled={disabled}
          aria-pressed={enabled}
          title={disabled ? "Esta opção não está disponível no momento" : ""}
        >
          {enabled ? 'Ativado' : 'Desativado'}
        </button>
      </div>
      {helpText && <small style={helpTextStyle} className="toggle-help">{helpText}</small>}
    </div>
  );
};

export default DeepResearchToggle; 