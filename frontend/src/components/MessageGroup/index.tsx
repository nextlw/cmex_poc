import React, { useState } from "react";
import { MessageGroupProps } from "./types";
import ChatMessage from "../ChatMessage";
import "./styles.css";

/**
 * Componente que agrupa mensagens relacionadas por tipo ou contexto
 * Permite colapsar/expandir grupos de mensagens para melhor organização visual
 */
const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  groupType,
  title,
  isCollapsible = true,
  initialExpanded = true,
  modelName,
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Determina o título do grupo se não for fornecido
  const groupTitle = title || getDefaultTitle(groupType);

  // Função para alternar o estado expandido/colapsado
  const toggleExpanded = () => {
    if (isCollapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <div className={`message-group ${groupType}`}>
      {isCollapsible && (
        <div className="message-group-header" onClick={toggleExpanded}>
          <span className="message-group-title">{groupTitle}</span>
          <span className="message-group-count">{messages.length}</span>
          <span
            className={`message-group-toggle ${isExpanded ? "expanded" : ""}`}
          >
            {isExpanded ? "▼" : "►"}
          </span>
        </div>
      )}

      <div className={`message-group-content ${isExpanded ? "expanded" : ""}`}>
        {messages.map((message, index) => (
          <ChatMessage
            key={`${message.type}-${index}`}
            {...message}
            modelName={modelName}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Obtém o título padrão para um grupo de mensagens com base no tipo
 */
const getDefaultTitle = (groupType: MessageGroupProps["groupType"]): string => {
  switch (groupType) {
    case "thinking":
      return "Pensamento do Modelo";
    case "progress":
      return "Etapas de Processamento";
    case "answer":
      return "Resposta";
    case "error":
      return "Erro";
    case "system":
      return "Sistema";
    case "mixed":
    default:
      return "Mensagens";
  }
};

export default MessageGroup;
