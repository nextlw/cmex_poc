import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessageProps } from './types';
import './styles.css';

const ChatMessage: React.FC<ChatMessageProps> = ({ type, content, isTyping, data, step }) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>("");
  const reasoningSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reasoningSectionRef.current) {
      reasoningSectionRef.current.scrollTop = reasoningSectionRef.current.scrollHeight;
    }
  }, [displayedContent]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(
        type === "log" ? (
          <pre>{content}</pre>
        ) : type === "response" || type === "answer" ? (
          <>
            {data?.reasoning && (
              <div className="reasoning-section" ref={reasoningSectionRef}>
                <ReactMarkdown>{data.reasoning}</ReactMarkdown>
                {data.urls && data.urls.length > 0 && (
                  <div className="url-list">
                    <h4>URLs sendo processadas:</h4>
                    {data.urls.map((url: string, urlIndex: number) => (
                      <div key={urlIndex} className="url-item">
                        <div className="spinner" />
                        <span>{new URL(url).hostname}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={type === "answer" ? "final-answer" : ""}>
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )
      );
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= content.length) {
        setDisplayedContent(
          type === "log" ? (
            <pre>{content.slice(0, index)}</pre>
          ) : type === "response" || type === "answer" ? (
            <>
              {data?.reasoning && (
                <div className="reasoning-section" ref={reasoningSectionRef}>
                  <ReactMarkdown>{data.reasoning.slice(0, index)}</ReactMarkdown>
                  {data.urls && data.urls.length > 0 && (
                    <div className="url-list">
                      <h4>URLs sendo processadas:</h4>
                      {data.urls.map((url: string, urlIndex: number) => (
                        <div key={urlIndex} className="url-item">
                          <div className="spinner" />
                          <span>{new URL(url).hostname}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className={type === "answer" ? "final-answer" : ""}>
                <ReactMarkdown>{content.slice(0, index)}</ReactMarkdown>
              </div>
            </>
          ) : (
            <ReactMarkdown>{content.slice(0, index)}</ReactMarkdown>
          )
        );
        index += 3;
      } else {
        clearInterval(timer);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [content, isTyping, type, data]);

  const messageClass = `chat-message ${type} ${isTyping ? "typing" : ""} ${type === "answer" ? "final-answer" : ""}`;

  return (
    <div className={messageClass} id={`step-${step}`}>
      {type === "query" && <div className="query-label">Pergunta</div>}
      {type === "step" && <div className="step-label">Pensando</div>}
      {type === "response" && <div className="response-label">Resposta</div>}
      {type === "answer" && <div className="response-label">Resposta Final</div>}
      {type === "error" && <div className="error-label">Erro</div>}
      {type === "reflect" && <div className="reflect-label">Reflexão</div>}
      {type === "connected" && <div className="step-label">Conectado</div>}
      {type === "log" && <div className="log-label">Log do Servidor</div>}
      <div className="message-content">{displayedContent}</div>
    </div>
  );
};

export default ChatMessage; 