import React from "react";
import ReactMarkdown from "react-markdown";
import { ThinkingSectionProps } from "./types";
import "./styles.css";

/**
 * Componente que exibe uma seção de "pensamento" do modelo que pode ser expandida/contraída
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const ThinkingSection: React.FC<ThinkingSectionProps> = ({
  content,
  isExpanded,
  onToggle,
  modelName = "",
  title = "Mostrar pensamento",
}) => {
  if (!content) return null;

  return (
    <div className="thinking-section">
      <div className="thinking-header" onClick={onToggle}>
        <span className="thinking-title">
          {isExpanded ? "Ocultar pensamento" : title}
        </span>
        {modelName && <span className="thinking-model">{modelName}</span>}
        <span
          className={`thinking-toggle-icon ${isExpanded ? "expanded" : ""}`}
        >
          {isExpanded ? "▼" : "►"}
        </span>
      </div>

      <div className={`thinking-content ${isExpanded ? "expanded" : ""}`}>
        <div className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ThinkingSection;
