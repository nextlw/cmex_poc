import React, { useEffect, useState } from "react";
import "./styles.css";
import { QueryHistoryItem, QueryHistoryProps } from "./types";
import ConfirmationModal from "../ConfirmationModal";
import { LogsResponse } from "../../types/APITypes";

const QueryHistory: React.FC<QueryHistoryProps> = ({ onSelectQuery }) => {
  const [queries, setQueries] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<QueryHistoryItem | null>(
    null
  );
  const [queryToDelete, setQueryToDelete] = useState<QueryHistoryItem | null>(
    null
  );
  const [deletingIds, setDeletingIds] = useState<(string | number)[]>([]);
  const [data, setData] = useState<LogsResponse>({});

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const API_URL =
          import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
        const response = await fetch(`${API_URL}/api/v1/queries`);

        if (!response.ok) {
          throw new Error("Falha ao carregar histórico");
        }

        const data = await response.json();
        const queriesArray = data.queries || [];

        const formattedQueries = queriesArray.map((query: any) => ({
          id: query.id,
          title: query.title || "Consulta sem título",
          status: query.status,
          timestamp: query.timestamp,
          summary: query.summary,
          question: query.question,
        }));

        setQueries(formattedQueries);
      } catch (error) {
        setError("Erro ao carregar histórico");
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  useEffect(() => {
    fetch("/api/v1/logs")
      .then((res) => res.json())
      .then((logs: LogsResponse) => setData(logs))
      .catch(console.error);
  }, []);

  const handleSelectQuery = (query: QueryHistoryItem) => {
    setSelectedQuery(query);
    onSelectQuery(query);
  };

  const handleConfirmDelete = async () => {
    if (queryToDelete) {
      // Adiciona query id à lista de exclusão para aplicar animação puft
      setDeletingIds((prev) => [...prev, queryToDelete.id]);
      try {
        const API_URL =
          import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
        const response = await fetch(`${API_URL}/api/v1/trash-query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: queryToDelete.id }),
        });
        if (!response.ok) {
          throw new Error("Falha ao excluir a pesquisa");
        }
      } catch (error) {
        console.error(error);
        // Aqui você pode tratar o erro conforme necessário
      }
      // Aguarda duração da animação e remove a query da lista
      setTimeout(() => {
        setQueries((prev) => prev.filter((q) => q.id !== queryToDelete.id));
        setDeletingIds((prev) => prev.filter((id) => id !== queryToDelete.id));
      }, 500);

      setQueryToDelete(null);
    }
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
              className={`query-item ${
                selectedQuery?.id === query.id ? "selected" : ""
              } ${deletingIds.includes(query.id) ? "deleting" : ""}`}
              onClick={() => handleSelectQuery(query)}
            >
              <div
                className="query-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <p className="query-text" style={{ flex: 1 }}>
                  {query.title}
                </p>
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQueryToDelete(query);
                  }}
                  style={{ marginLeft: "8px", padding: "0 6px" }}
                >
                  ×
                </button>
              </div>
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
      {queryToDelete && (
        <ConfirmationModal
          isOpen={true}
          title="Confirmar Exclusão"
          queryName={queryToDelete.title}
          queryId={queryToDelete.id}
          onCancel={() => setQueryToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
      {data.serverLogs?.map((log, idx) => (
        <div key={idx}>
          <strong>{log.level}: </strong>
          {log.message}
        </div>
      ))}
    </div>
  );
};

export default QueryHistory;
