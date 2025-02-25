import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessageProps } from './types';
import './styles.css';

const ChatMessage: React.FC<ChatMessageProps> = ({ type, content, isTyping, data, step }) => {
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>("");
  const [showDebug, setShowDebug] = useState(false);
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
                        <span>{url && url.startsWith('http') ? new URL(url).hostname : url}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {data.outputs && data.outputs.length > 0 && (
                  <div className="outputs-section">
                    <h4>Informações adicionais:</h4>
                    {data.outputs.map((output: any, idx: number) => (
                      <div key={idx} className="output-item">
                        <pre>{JSON.stringify(output, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={type === "answer" ? "final-answer" : ""}>
              <ReactMarkdown>{content}</ReactMarkdown>
              
              {data?.references && data.references.length > 0 && (
                <div className="references-section">
                  <h4>Referências:</h4>
                  {data.references.map((ref: any, idx: number) => (
                    <div key={idx} className="reference-item">
                      <div className="quote">{ref.exactQuote}</div>
                      <div className="source">
                        <a href={ref.url} target="_blank" rel="noopener noreferrer">
                          {ref.url && ref.url.startsWith('http') ? new URL(ref.url).hostname : ref.url}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && data?.trackers && (
                <div className="debug-section">
                  <button 
                    className="toggle-debug-btn" 
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    {showDebug ? "Esconder" : "Mostrar"} informações de depuração
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
                  {data.questionsToAnswer.map((question: string, idx: number) => (
                    <li key={idx}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-section">
                <button 
                  className="toggle-debug-btn" 
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? "Esconder" : "Mostrar"} dados completos
                </button>
                
                {showDebug && (
                  <pre className="debug-info">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : type === "search" ? (
          <div className="search-content">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-section">
                <button 
                  className="toggle-debug-btn" 
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? "Esconder" : "Mostrar"} dados completos
                </button>
                
                {showDebug && (
                  <pre className="debug-info">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : type === "visit" ? (
          <div className="visit-content">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {data?.url && (
              <div className="url-section">
                <a href={data.url} target="_blank" rel="noopener noreferrer">
                  {data.url}
                </a>
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-section">
                <button 
                  className="toggle-debug-btn" 
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? "Esconder" : "Mostrar"} dados completos
                </button>
                
                {showDebug && (
                  <pre className="debug-info">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {data?.outputs && data.outputs.length > 0 && (
              <div className="outputs-section">
                <h4>Informações adicionais:</h4>
                {data.outputs.map((output: any, idx: number) => (
                  <div key={idx} className="output-item">
                    <pre>{JSON.stringify(output, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
            
            {process.env.NODE_ENV === 'development' && data?.trackers && (
              <div className="debug-section">
                <button 
                  className="toggle-debug-btn" 
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? "Esconder" : "Mostrar"} informações de depuração
                </button>
                
                {showDebug && (
                  <pre className="debug-info">
                    {JSON.stringify(data.trackers, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </>
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
                          <span>{url && url.startsWith('http') ? new URL(url).hostname : url}</span>
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
    <div className={messageClass} id={`step-${step}`} data-message-id={`message-${step}`} data-testid={`chat-message-${step}`}>
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
      <div className="message-content" data-testid={`message-content-${type}`}>{displayedContent}</div>
    </div>
  );
};

export default ChatMessage; 