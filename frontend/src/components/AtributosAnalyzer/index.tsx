import React, { useState, useEffect } from "react";
import { AtributosNCMService } from "../../services/atributos-ncm-service";
import { ResultadoAnaliseAtributos } from "../../agents/AtributosNCMAgent";
import "./styles.css";
import { AtributoNCM } from "../../types/atributos";

interface AtributosAnalyzerProps {
  ncmCode: string;
  contexto?: Record<string, any>;
  onAtributosSelected?: (atributos: AtributoNCM[]) => void;
}

const AtributosAnalyzer: React.FC<AtributosAnalyzerProps> = ({
  ncmCode,
  contexto,
  onAtributosSelected,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAnaliseAtributos | null>(
    null
  );
  const [filtroOrgao, setFiltroOrgao] = useState<string | null>(null);

  const atributosService = new AtributosNCMService("local");

  useEffect(() => {
    if (ncmCode) {
      analisarAtributos();
    }
  }, [ncmCode, contexto]);

  const analisarAtributos = async () => {
    if (!ncmCode) return;

    setLoading(true);
    setError(null);

    try {
      const result = await atributosService.analisarAtributosNCM(
        ncmCode,
        contexto
      );
      setResultado(result);

      if (onAtributosSelected) {
        onAtributosSelected(result.atributosSelecionados);
      }
    } catch (err) {
      console.error("Erro ao analisar atributos NCM:", err);
      setError("Não foi possível analisar os atributos para esta NCM.");
    } finally {
      setLoading(false);
    }
  };

  const renderAtributo = (atributo: AtributoNCM) => (
    <div
      key={atributo.codigo}
      className={`atributo-item ${
        atributo.obrigatorio ? "obrigatorio" : "opcional"
      }`}
      title={atributo.nome}
    >
      <div className="atributo-header">
        <span className="atributo-codigo">{atributo.codigo}</span>
        <span className="atributo-obrigatorio">
          {atributo.obrigatorio ? "Obrigatório" : "Opcional"}
        </span>
      </div>
      <div className="atributo-nome">{atributo.nomeApresentacao}</div>
      <div className="atributo-meta">
        <span className="atributo-tipo">{atributo.formaPreenchimento}</span>
        <span className="atributo-orgaos">{atributo.orgaos.join(", ")}</span>
      </div>
    </div>
  );

  const renderFiltroOrgaos = () => {
    if (!resultado) return null;

    const orgaos = Object.keys(resultado.agrupamentos.porOrgao);
    if (orgaos.length === 0) return null;

    return (
      <div className="filtro-orgaos">
        <select
          value={filtroOrgao || ""}
          onChange={(e) => setFiltroOrgao(e.target.value || null)}
          className="filtro-select"
        >
          <option value="">Todos os órgãos</option>
          {orgaos.map((orgao) => (
            <option key={orgao} value={orgao}>
              {orgao}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const getAtributosFiltrados = (): AtributoNCM[] => {
    if (!resultado) return [];

    if (filtroOrgao) {
      return resultado.agrupamentos.porOrgao[filtroOrgao] || [];
    }

    return resultado.atributosSelecionados;
  };

  if (loading) {
    return (
      <div className="atributos-analyzer-loading">
        Analisando atributos para NCM {ncmCode}...
      </div>
    );
  }

  if (error) {
    return <div className="atributos-analyzer-error">{error}</div>;
  }

  if (!resultado) {
    return (
      <div className="atributos-analyzer-empty">Sem análise disponível</div>
    );
  }

  const atributosFiltrados = getAtributosFiltrados();

  return (
    <div className="atributos-analyzer-container">
      <div className="atributos-analyzer-header">
        <h3>Análise de Atributos NCM {ncmCode}</h3>
        <div className="atributos-analyzer-metricas">
          <span className="metrica">
            <strong>Total:</strong> {resultado.metricas.totalAnalisados}
          </span>
          <span className="metrica">
            <strong>Selecionados:</strong>{" "}
            {resultado.metricas.totalSelecionados}
          </span>
          <span className="metrica">
            <strong>Cobertura:</strong>{" "}
            {resultado.metricas.percentualSelecionado}%
          </span>
        </div>
      </div>

      <div className="atributos-analyzer-recomendacoes">
        <h4>Recomendações</h4>
        <ul>
          {resultado.recomendacoes.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>

      <div className="atributos-analyzer-controles">{renderFiltroOrgaos()}</div>

      <div className="atributos-analyzer-lista">
        {atributosFiltrados.length > 0 ? (
          <div className="atributos-grid">
            {atributosFiltrados.map(renderAtributo)}
          </div>
        ) : (
          <div className="atributos-empty">
            Nenhum atributo encontrado com os filtros atuais.
          </div>
        )}
      </div>
    </div>
  );
};

export default AtributosAnalyzer;
