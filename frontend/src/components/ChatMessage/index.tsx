import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { ChatMessageProps } from "./types";
import { ThinkingSection, ModelIndicator, ReferencesSection } from "..";
import { Reference } from "../ReferencesSection/types";
import "./styles.css";

const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  isTyping,
  data,
  step,
  modelName,
}) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>("");
  const [showDebug, setShowDebug] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const [isReferencesExpanded, setIsReferencesExpanded] = useState(false);
  const reasoningSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reasoningSectionRef.current) {
      reasoningSectionRef.current.scrollTop =
        reasoningSectionRef.current.scrollHeight;
    }
  }, [displayedContent]);

  // Converter referências para o formato esperado pelo componente ReferencesSection
  const formatReferences = useCallback((): Reference[] => {
    if (!data?.references || !Array.isArray(data.references)) return [];

    return data.references.map((ref: any) => ({
      url: ref.url || "",
      title: ref.title || "",
      exactQuote: ref.exactQuote || ref.quote || "",
      content: ref.content || "",
    }));
  }, [data?.references]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(
        type === "log" ? (
          <pre>{content}</pre>
        ) : type === "response" || type === "answer" ? (
          <>
            {data?.think && (
              <ThinkingSection
                content={data.think}
                isExpanded={isThinkingExpanded}
                onToggle={() => setIsThinkingExpanded(!isThinkingExpanded)}
                modelName={modelName}
              />
            )}

            <div className={type === "answer" ? "final-answer" : ""}>
              {modelName && (
                <div className="model-indicator-container">
                  <ModelIndicator modelName={modelName} size="small" />
                </div>
              )}

              <ReactMarkdown>{content}</ReactMarkdown>

              {data?.references && data.references.length > 0 && (
                <ReferencesSection
                  references={formatReferences()}
                  isExpanded={isReferencesExpanded}
                  onToggle={() =>
                    setIsReferencesExpanded(!isReferencesExpanded)
                  }
                />
              )}

              {process.env.NODE_ENV === "development" && data?.trackers && (
                <div className="debug-section">
                  <button
                    className="toggle-debug-btn"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    {showDebug ? "Esconder" : "Mostrar"} informações de
                    depuração
                  </button>

                  {showDebug && (
                    <pre className="debug-info">
                      {JSON.stringify(data.trackers, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </>
        ) : type === "reflect" ? (
          <div className="reflect-content">
            <ReactMarkdown>{content}</ReactMarkdown>

            {data?.questionsToAnswer && data.questionsToAnswer.length > 0 && (
              <div className="questions-section">
                <h4>Questões para investigar:</h4>
                <ul>
                  {data.questionsToAnswer.map(
                    (question: string, idx: number) => (
                      <li key={idx}>{question}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : type === "search" ? (
          <div className="search-content">
            <div className="search-query">
              <strong>Pesquisando:</strong>{" "}
              {data?.searchQuery || data?.query || content}
            </div>
            {data?.urls && data.urls.length > 0 && (
              <div className="url-list">
                <h4>URLs encontradas:</h4>
                {data.urls.map((url: string, urlIndex: number) => (
                  <div key={urlIndex} className="url-item">
                    <span>
                      {url && url.startsWith("http")
                        ? new URL(url).hostname
                        : url}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : type === "visit" ? (
          <div className="visit-content">
            <div className="visit-url">
              <strong>Visitando:</strong> {data?.url || content}
            </div>
            {data?.content && (
              <div className="visit-extract">
                <h4>Conteúdo extraído:</h4>
                <div className="content-preview">
                  {data.content.substring(0, 200)}...
                </div>
              </div>
            )}
          </div>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )
      );
    }
  }, [
    isTyping,
    content,
    data,
    type,
    isThinkingExpanded,
    isReferencesExpanded,
    modelName,
    formatReferences,
    showDebug,
  ]);

  const messageClasses = [
    "chat-message",
    type,
    isTyping ? "typing" : "",
    step !== undefined ? `step-${step}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={messageClasses}>
      <div className="message-content">
        {isTyping ? (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        ) : (
          displayedContent
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
