import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessageProps } from './types';
import './styles.css';
import OutputDisplay from './OutputDisplay';
import moment from 'moment';

const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content = "",
  isTyping = false,
  data = {},
  step = 0
}) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(
        type === "log" ? (
          <pre>{content}</pre>
        ) : type === "response" || type === "answer" ? (
          <>
            {data?.reasoning && (
              <div className="reasoning">
                <details>
                  <summary>Raciocínio</summary>
                  <ReactMarkdown>{data.reasoning}</ReactMarkdown>
                </details>
              </div>
            )}
            <div className={type === "answer" ? "final-answer" : ""}>
              <ReactMarkdown>{content}</ReactMarkdown>
              
              {data?.references && Array.isArray(data.references) && data.references.length > 0 && (
                <div className="references">
                  <h4>Referências:</h4>
                  <ol>
                    {data.references.map((ref, idx) => (
                      <li key={idx}>
                        <ReactMarkdown>{typeof ref === 'string' ? ref : JSON.stringify(ref)}</ReactMarkdown>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </>
        ) : type === "reflect" ? (
          <div className="reflect-content">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {data?.questionsToAnswer && Array.isArray(data.questionsToAnswer) && data.questionsToAnswer.length > 0 && (
              <div className="questions-to-answer">
                <h4>Perguntas a Responder:</h4>
                <ol>
                  {data.questionsToAnswer.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : type === "search" ? (
          <div className="search-content">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="search-debug">
                <button onClick={() => setShowDebug(!showDebug)}>
                  {showDebug ? "Esconder Detalhes" : "Mostrar Detalhes"}
                </button>
                {showDebug && (
                  <pre>{JSON.stringify(data, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        ) : type === "visit" ? (
          <div className="visit-content">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {data?.url && (
              <div className="visit-url">
                <a href={data.url} target="_blank" rel="noopener noreferrer">
                  {data.url}
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {data?.outputs && Array.isArray(data.outputs) && data.outputs.length > 0 && (
              <div className="outputs-section">
                <h4>Informações adicionais:</h4>
                {data.outputs.map((output, idx) => (
                  <OutputDisplay key={idx} output={output} />
                ))}
              </div>
            )}
          </>
        )
      );
    } else {
      let index = 0;
      const timer = setInterval(() => {
        if (content && index <= content.length) {
          setDisplayedContent(
            type === "log" ? (
              <pre>{content.slice(0, index)}</pre>
            ) : type === "response" || type === "answer" ? (
              <>
                {data?.reasoning && (
                  <div className="reasoning">
                    <details>
                      <summary>Raciocínio</summary>
                      <ReactMarkdown>{data.reasoning}</ReactMarkdown>
                    </details>
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
          index += 5;
        } else {
          clearInterval(timer);
        }
      }, 10);

      return () => clearInterval(timer);
    }
  }, [content, isTyping, type, data]);

  const messageClass = `chat-message ${type || ''} ${isTyping ? "typing" : ""} ${type === "answer" ? "final-answer" : ""}`;
  const timestamp = new Date().toISOString();

  return (
    <div 
      className={messageClass}
      id={`step-${step}`}
      data-message-id={`message-${step}`}
      data-testid={`chat-message-${step}`}
    >
      {type === "query" && <div className="query-label">Pergunta</div>}
      {type === "step" && <div className="step-label">Pensando</div>}
      {type === "response" && <div className="response-label">Resposta</div>}
      {type === "answer" && <div className="response-label">Resposta Final</div>}
      {type === "error" && <div className="error-label">Erro</div>}
      {type === "reflect" && <div className="reflect-label">Reflexão</div>}
      {type === "connected" && <div className="step-label">Conectado</div>}
      {type === "log" && <div className="log-label">Log do Servidor</div>}
      {type === "search" && <div className="search-label">Pesquisa</div>}
      {type === "visit" && <div className="visit-label">Visitando URL</div>}
      
      <div className="message-content" data-testid={`message-content-${type || 'unknown'}`}>
        <div className="message-header">
          <span className="message-sender">
            {type === 'query' ? 'Você' : 'Assistente'}
          </span>
          <span className="message-time">
            {timestamp ? moment(timestamp).format('HH:mm') : ''}
          </span>
        </div>

        <div className="message-body">
          {isTyping ? (
            <span className="typing-indicator">Digitando...</span>
          ) : (
            displayedContent
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 