import React, { useEffect, useState } from 'react';
import './styles.css';
import { QueryHistoryItem, QueryHistoryProps } from './types';

const QueryHistory: React.FC<QueryHistoryProps> = ({ onSelectQuery }) => {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryItem | null>(null);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/v1/queries`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar histórico');
        }
        
        const data = await response.json();
        const queriesArray = data.queries || [];
        
        const formattedQueries = queriesArray.map((query: any) => ({
          id: query.id,
          title: query.title || 'Consulta sem título',
          status: query.status,
          timestamp: query.timestamp,
          summary: query.summary,
          question: query.question
        }));
        
        setQueries(formattedQueries);
      } catch (error) {
        setError('Erro ao carregar histórico');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const handleSelectQuery = (query: QueryHistoryItem) => {
    setSelectedQuery(query);
    onSelectQuery(query);
  };

  if (loading) {
    return (
      <div className="query-history-sidebar">
        <h3 className="query-history-title">Ultimas pesquisas</h3>
        <div className="query-status">Carregando histórico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="query-history-sidebar">
        <h3 className="query-history-title">Ultimas pesquisas</h3>
        <div className="query-status error">{error}</div>
      </div>
    );
  }

  return (
    <div className="query-history-sidebar">
      <h3 className="query-history-title">Ultimas pesquisas</h3>
      <div className="query-list">
        {queries.length === 0 ? (
          <div className="query-status">Nenhuma pergunta no histórico</div>
        ) : (
          queries.map((query) => (
            <div
              key={query.id}
              className={`query-item ${selectedQuery?.id === query.id ? 'selected' : ''}`}
              onClick={() => handleSelectQuery(query)}
            >
              <p className="query-text">{query.title}</p>
              <div className="query-details">
                <span className="query-status">{query.status}</span>
                <span className="query-timestamp">
                  {new Date(query.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueryHistory; 