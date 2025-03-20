import React, { useEffect, useState, useRef } from "react";
import "./styles.css";
import { QueryHistoryItem, QueryHistoryProps } from "./types";
import ConfirmationModal from "../ConfirmationModal";
import { LogsResponse } from "../../types/index";
import { FiX } from "react-icons/fi";
// Importações diretas dos transformadores específicos
import { transformQueryList } from "../../utils/transformers/queryTransformers";
import { transformLogsResponse } from "../../utils/transformers/logsTransformers";

// Adicionar interface para o evento personalizado
interface QueryHistoryUpdateEvent extends Event {
  detail?: {
    newQuery: QueryHistoryItem;
  };
}

const QueryHistory: React.FC<QueryHistoryProps> = ({
  onSelectQuery,
  newQuery,
  onNewQueryAdded,
}) => {
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
  const [data, setData] = useState<LogsResponse>({ serverLogs: [] });

  // Estados para controle de seleção múltipla
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedQueries, setSelectedQueries] = useState<string[]>([]);
  const [isConfirmingMultipleDelete, setIsConfirmingMultipleDelete] =
    useState(false);
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null);

  // Determinar o estado do checkbox principal
  const determineHeaderCheckboxState = () => {
    if (selectedQueries.length === 0) return false;
    if (selectedQueries.length === queries.length) return true;
    return "indeterminate"; // Estado parcial (nem todos selecionados)
  };

  // Referência para o checkbox principal para poder manipular o estado "indeterminate"
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const fetchQueries = async () => {
    try {
      // Só definir loading como true na primeira carga
      if (queries.length === 0) {
        setLoading(true);
      }

      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";
      const response = await fetch(`${API_URL}/api/v1/queries`);

      if (!response.ok) {
        throw new Error("Falha ao carregar histórico");
      }

      const data = await response.json();
      const queriesArray = data.queries || [];

      // Aplicar transformação para garantir consistência de tipos
      const formattedQueries = transformQueryList(
        queriesArray.map((query: any) => ({
          id: query.id,
          title: query.title || "Consulta sem título",
          status: query.status,
          timestamp: query.timestamp,
          summary: query.summary,
          question: query.question,
        }))
      );

      // Comparar com o estado atual para evitar atualizações desnecessárias
      const currentIds = queries
        .map((q: QueryHistoryItem) => q.id)
        .sort()
        .join(",");
      const newIds = formattedQueries
        .map((q: any) => q.id)
        .sort()
        .join(",");

      // Só atualizar o estado se houver alguma mudança real
      if (
        currentIds !== newIds ||
        JSON.stringify(formattedQueries) !== JSON.stringify(queries)
      ) {
        setQueries(formattedQueries);
      }

      // Obter o ID da consulta atual do localStorage
      const storedQueryId = localStorage.getItem("currentQueryId");
      if (storedQueryId && storedQueryId !== currentQueryId) {
        setCurrentQueryId(storedQueryId);
      }
    } catch (error) {
      setError("Erro ao carregar histórico");
      console.error("Erro:", error);
    } finally {
      if (queries.length === 0) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQueries();

    // Configurar polling para atualizar a lista a cada 10 segundos (aumentado de 5 para 10)
    const intervalId = setInterval(() => {
      fetchQueries();
    }, 10000);

    // Limpar o intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetch("/api/v1/logs")
      .then((res) => res.json())
      .then((logsData) => {
        // Aplicar tipo 'as any' para evitar a incompatibilidade
        setData(transformLogsResponse(logsData.serverLogs || []) as any);
      })
      .catch(console.error);
  }, []);

  // Monitorar mudanças no localStorage para currentQueryId
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currentQueryId") {
        setCurrentQueryId(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Adicionar listener para o evento personalizado quando uma nova pesquisa é criada
  useEffect(() => {
    const handleNewQuery = (e: Event) => {
      const customEvent = e as QueryHistoryUpdateEvent;
      console.log("Evento de nova query recebido:", customEvent.detail);

      if (customEvent.detail?.newQuery) {
        const newQuery = customEvent.detail.newQuery;

        // Adicionar a nova query ao estado imediatamente, sem esperar o polling
        setQueries((prev) => {
          // Verificar se a query já existe (para evitar duplicação)
          const exists = prev.some((q) => q.id === newQuery.id);
          if (!exists) {
            return [newQuery, ...prev];
          }
          return prev;
        });

        // Atualizar o ID da query atual
        setCurrentQueryId(newQuery.id.toString());
      }
    };

    window.addEventListener("queryHistoryUpdated", handleNewQuery);

    return () => {
      window.removeEventListener("queryHistoryUpdated", handleNewQuery);
    };
  }, []);

  // Atualizar o estado "indeterminate" do checkbox principal
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        determineHeaderCheckboxState() === "indeterminate";
    }
  }, [selectedQueries, queries]);

  // Efeito para adicionar a nova query quando ela é recebida via props
  useEffect(() => {
    if (newQuery) {
      console.log("Nova query recebida via props:", newQuery);

      // Adicionar a nova query ao estado se ela ainda não existir
      setQueries((prev) => {
        // Verificar se a query já existe (para evitar duplicação)
        const exists = prev.some((q) => q.id === newQuery.id);
        if (!exists) {
          return [newQuery, ...prev];
        }
        return prev;
      });

      // Atualizar o ID da query atual
      setCurrentQueryId(newQuery.id.toString());

      // Notificar o componente pai que a query foi adicionada
      if (onNewQueryAdded) {
        onNewQueryAdded();
      }
    }
  }, [newQuery, onNewQueryAdded]);

  const handleQueryClick = (query: QueryHistoryItem) => {
    if (!selectionMode) {
      setSelectedQuery(query);
      onSelectQuery(query);
    }
  };

  // Função para alternar a seleção de uma query
  const toggleQuerySelection = (id: string | number) => {
    setSelectedQueries((prev) => {
      if (prev.includes(id.toString())) {
        return prev.filter((qId) => qId !== id.toString());
      } else {
        return [...prev, id.toString()];
      }
    });
  };

  // Função para alternar o modo de seleção
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    if (selectionMode) {
      // Limpar seleções ao sair do modo de seleção
      setSelectedQueries([]);
    }
  };

  // Função para selecionar/desselecionar todas as queries
  const toggleSelectAll = () => {
    if (selectedQueries.length === queries.length) {
      // Se todas estiverem selecionadas, desseleciona todas
      setSelectedQueries([]);
    } else {
      // Caso contrário, seleciona todas
      setSelectedQueries(queries.map((q) => q.id.toString()));
    }
  };

  // Função para deletar múltiplas queries
  const handleDeleteSelected = async () => {
    if (selectedQueries.length === 0) return;

    // Adiciona todas as queries selecionadas à lista de exclusão para animação
    setDeletingIds((prev) => [...prev, ...selectedQueries]);

    try {
      const API_URL =
        import.meta.env.VITE_API_LOCAL_URL || "http://localhost:3000";

      // Aplicar a flag isDeleting para mostrar a animação
      setQueries((prev) =>
        prev.map((q) =>
          selectedQueries.includes(q.id.toString())
            ? { ...q, isDeleting: true }
            : q
        )
      );

      // Para cada query selecionada, enviar requisição de exclusão
      const deletePromises = selectedQueries.map((id) =>
        fetch(`${API_URL}/api/v1/trash-query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })
      );

      // Aguardar todas as exclusões
      await Promise.all(deletePromises);

      // Aguarda duração da animação e remove as queries da lista
      setTimeout(() => {
        setQueries((prev) =>
          prev.filter((q) => !selectedQueries.includes(q.id.toString()))
        );
        setDeletingIds((prev) =>
          prev.filter((id) => !selectedQueries.includes(id.toString()))
        );
        // Limpar seleções após excluir
        setSelectedQueries([]);
        setSelectionMode(false);
      }, 500);
    } catch (error) {
      console.error("Erro ao excluir múltiplas queries:", error);
    }

    setIsConfirmingMultipleDelete(false);
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

        // Aplicar a flag isDeleting para mostrar a animação
        setQueries((prev) =>
          prev.map((q) =>
            q.id === queryToDelete.id ? { ...q, isDeleting: true } : q
          )
        );

        // Adicionar uma pequena pausa para dar tempo do backend processar
        await new Promise((resolve) => setTimeout(resolve, 300));
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
      <div className="query-history-header">
        <div className="query-history-title-container">
          {queries.length > 0 && selectionMode && (
            <input
              type="checkbox"
              ref={headerCheckboxRef}
              checked={determineHeaderCheckboxState() === true}
              onChange={toggleSelectAll}
              className="header-checkbox visible"
            />
          )}
          <h3 className="query-history-title">Histórico de pesquisas</h3>
        </div>

        {queries.length > 0 && (
          <div className="action-buttons-container">
            <button
              className={`icon-button cancel-button ${
                !selectionMode ? "hidden" : ""
              }`}
              onClick={() => {
                setSelectionMode(false);
                setSelectedQueries([]);
              }}
              title="Cancelar seleção"
              aria-hidden={!selectionMode}
            >
              <FiX />
            </button>
            <button
              className={`action-button ${
                selectionMode ? "delete-selected-button" : "select-button"
              }`}
              onClick={
                selectionMode
                  ? () => {
                      if (selectedQueries.length > 0) {
                        setIsConfirmingMultipleDelete(true);
                      } else {
                        // Sair do modo de seleção se não houver itens selecionados
                        setSelectionMode(false);
                      }
                    }
                  : toggleSelectionMode
              }
              disabled={selectionMode && selectedQueries.length === 0}
            >
              {selectionMode ? "Excluir" : "Selecionar"}
            </button>
          </div>
        )}
      </div>

      <div className="query-list">
        {queries.length === 0 ? (
          <div className="query-status">Nenhuma pergunta no histórico</div>
        ) : (
          queries.map((query) => (
            <div
              key={query.id}
              className={`query-item ${
                selectedQuery?.id === query.id ? "selected" : ""
              } ${deletingIds.includes(query.id) ? "deleting" : ""} ${
                currentQueryId === query.id.toString() ? "current-query" : ""
              }`}
              onClick={() => handleQueryClick(query)}
            >
              <div className="query-header">
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={selectedQueries.includes(query.id.toString())}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleQuerySelection(query.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="query-checkbox"
                  />
                )}
                <p
                  className="query-text"
                  onClick={(e) => {
                    if (selectionMode) {
                      e.stopPropagation();
                      toggleQuerySelection(query.id);
                    }
                  }}
                >
                  {query.title}
                </p>
                {!selectionMode && (
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQueryToDelete(query);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="query-details">
                <span className="query-status" data-status={query.status}>
                  {query.status}
                </span>
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

      {isConfirmingMultipleDelete && (
        <ConfirmationModal
          isOpen={true}
          title="Confirmar Exclusão"
          queryName={`${selectedQueries.length} item(s) selecionado(s)`}
          queryId=""
          onCancel={() => setIsConfirmingMultipleDelete(false)}
          onConfirm={handleDeleteSelected}
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
