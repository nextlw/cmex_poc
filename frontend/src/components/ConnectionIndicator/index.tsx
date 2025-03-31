import React from "react";
import { ConnectionIndicatorProps } from "./types";
import "./styles.css";

/**
 * Componente que exibe um indicador de status de conexão como um pequeno círculo colorido
 */
const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  attempts = 0,
  lastError,
  showText = false,
}) => {
  // Se desconectado, não mostra nada
  if (status === "disconnected") return null;

  // Determina o título (tooltip) baseado no status
  const getTooltipText = () => {
    switch (status) {
      case "connecting":
        return "Conectando ao servidor...";
      case "connected":
        return "Conectado ao servidor";
      case "reconnecting":
        return `Reconectando (tentativa ${attempts})...`;
      case "error":
        return `Erro de conexão: ${lastError || "Desconhecido"}`;
      case "failed":
        return "Falha na conexão após várias tentativas";
      default:
        return "Status desconhecido";
    }
  };

  return (
    <div className={`connection-indicator ${status}`} title={getTooltipText()}>
      <span className="connection-dot"></span>
      {showText && <span className="connection-text">{getTooltipText()}</span>}
    </div>
  );
};

export default ConnectionIndicator;
