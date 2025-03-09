import React, { useState, useEffect } from "react";
import { sendQuery, checkQueryStatus, setupSSE } from "../services/api";

interface SearchProps {
  // Adicione props conforme necessário
}

const Search: React.FC<SearchProps> = () => {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("gpt4");
  const [requestId, setRequestId] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Limpar SSE ao desmontar componente
  useEffect(() => {
    let sseConnection: { close: () => void } | null = null;

    if (requestId) {
      sseConnection = setupSSE(requestId, (data) => {
        if (data.type === "progress") {
          setUpdates((prev) => [...prev, data]);
        } else if (data.type === "result") {
          setResults(data.data);
          setLoading(false);
        } else if (data.type === "error") {
          setError(data.message || "Erro ao processar consulta");
          setLoading(false);
        }
      });
    }

    return () => {
      if (sseConnection) {
        sseConnection.close();
      }
    };
  }, [requestId]);

  // Verificar status periodicamente (fallback para SSE)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (requestId && loading) {
      interval = setInterval(async () => {
        try {
          const status = await checkQueryStatus(requestId);

          if (status.status === "completed") {
            setResults(status.results);
            setLoading(false);
            if (interval) clearInterval(interval);
          }
        } catch (error) {
          console.error("Erro ao verificar status:", error);
        }
      }, 3000); // Verificar a cada 3 segundos
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [requestId, loading]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResults(null);
    setUpdates([]);
    setError("");

    try {
      const response = await sendQuery(query, model);

      if (response.success && response.requestId) {
        setRequestId(response.requestId);
      } else {
        setError(response.error || "Erro ao iniciar consulta");
        setLoading(false);
      }
    } catch (error) {
      setError("Erro ao conectar ao servidor");
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-input">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="model-select"
        >
          <option value="gpt4">GPT-4</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="local">Modelo Local</option>
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite sua consulta..."
          className="query-input"
        />

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="search-button"
        >
          {loading ? "Pesquisando..." : "Pesquisar"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min((updates.length / 10) * 100, 90)}%` }}
            />
          </div>
          <div className="updates-container">
            {updates.slice(-3).map((update, index) => (
              <div key={index} className="update-item">
                {update.data?.message || JSON.stringify(update.data)}
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="results-container">
          {/* Renderizar resultados aqui */}
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Search;
