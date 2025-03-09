import React, { useState, FormEvent } from "react";
import DeepResearchToggle from "../DeepResearchToggle";
import { FormData, NCMConsultaFormProps } from "./types";
import "./styles.css";

/**
 * Componente para formulário de consulta NCM
 */
const NCMConsultaForm: React.FC<NCMConsultaFormProps> = ({
  onSubmit,
  onResult,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<FormData>({
    consulta: "",
    estadoOrigem: "SP",
    operacao: "",
    regimeTributario: "",
    tributacao: "",
    modelo: "Qwen2.5-7b-instruct-1m",
    useDeepResearch: false,
    ...initialData,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const modelos = [
    {
      id: "Qwen2.5-7b-instruct-1m",
      nome: "Qwen 2.5",
      descricao: "Modelo local para consultas rápidas",
    },
    {
      id: "Nex-0.1-Pro-2024",
      nome: "Nex 0.1 Pro",
      descricao: "Alta precisão (GPT-4)",
    },
    {
      id: "Nex-0.3-Preview-2024",
      nome: "Nex 0.3",
      descricao: "Equilíbrio entre precisão e performance (Claude)",
    },
    {
      id: "Nex-0.5-Preview-2025",
      nome: "Nex 0.5",
      descricao: "Eficiência e performance (Deepseek)",
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeepResearchChange = (enabled: boolean) => {
    setFormData((prev) => ({ ...prev, useDeepResearch: enabled }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Notifica o callback se fornecido
      if (onSubmit) {
        onSubmit(formData);
      }

      // Faz a requisição para a API
      const response = await fetch("/api/v1/ncm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao consultar NCM");
      }

      const data = await response.json();
      setResultado(data);

      // Notifica o callback de resultado se fornecido
      if (onResult) {
        onResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao consultar NCM");
      console.error("Erro na consulta:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ncm-consulta-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="consulta">Descrição do Produto*</label>
          <textarea
            id="consulta"
            name="consulta"
            value={formData.consulta}
            onChange={handleInputChange}
            placeholder="Descreva o produto em detalhes (ex: Camisa polo masculina em malha 100% algodão)"
            required
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estadoOrigem">Estado de Origem*</label>
            <select
              id="estadoOrigem"
              name="estadoOrigem"
              value={formData.estadoOrigem}
              onChange={handleInputChange}
              required
            >
              <option value="">Selecione...</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              {/* Adicionar outros estados */}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="operacao">Operação</label>
            <select
              id="operacao"
              name="operacao"
              value={formData.operacao}
              onChange={handleInputChange}
            >
              <option value="">Selecione...</option>
              <option value="Venda">Venda</option>
              <option value="Revenda">Revenda</option>
              <option value="Industrialização">Industrialização</option>
              <option value="Exportação">Exportação</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="regimeTributario">Regime Tributário</label>
            <select
              id="regimeTributario"
              name="regimeTributario"
              value={formData.regimeTributario}
              onChange={handleInputChange}
            >
              <option value="">Selecione...</option>
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
              <option value="Lucro Real">Lucro Real</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tributacao">Tributação</label>
            <select
              id="tributacao"
              name="tributacao"
              value={formData.tributacao}
              onChange={handleInputChange}
            >
              <option value="">Selecione...</option>
              <option value="Normal">Normal</option>
              <option value="Substituição Tributária">
                Substituição Tributária
              </option>
              <option value="Isento">Isento</option>
              <option value="Não Tributado">Não Tributado</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="modelo">Modelo de IA*</label>
          <select
            id="modelo"
            name="modelo"
            value={formData.modelo}
            onChange={handleInputChange}
            required
          >
            {modelos.map((modelo) => (
              <option key={modelo.id} value={modelo.id}>
                {modelo.nome} - {modelo.descricao}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <DeepResearchToggle
            enabled={formData.useDeepResearch}
            onChange={handleDeepResearchChange}
            disabled={false}
            helpText="Ative para análise profunda e verificação adicional dos resultados"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Consultando..." : "Consultar NCM"}
          </button>
        </div>
      </form>

      {resultado && (
        <div className="resultado-container">
          <h3 className="resultado-title">Resultado da Consulta</h3>

          <div className="resultado-header">
            <div className="ncm-box">
              <span className="ncm-label">NCM</span>
              <span className="ncm-value">{resultado.ncm}</span>
            </div>

            {resultado.validacao_profunda && (
              <div className="confianca-box">
                <span className="confianca-label">Confiança</span>
                <div className="confianca-bar">
                  <div
                    className="confianca-value"
                    style={{
                      width: `${resultado.validacao_profunda.confianca}%`,
                    }}
                    data-value={`${resultado.validacao_profunda.confianca}%`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="resultado-section">
            <h4 className="section-title">Descrição</h4>
            <p className="section-content">{resultado.descricao}</p>
          </div>

          {resultado.atributos && resultado.atributos.length > 0 && (
            <div className="resultado-section">
              <h4 className="section-title">Atributos do Produto</h4>
              <ul className="section-list">
                {resultado.atributos.map((atributo: string, index: number) => (
                  <li key={index} className="section-list-item">
                    {atributo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.valores_de_impostos && (
            <div className="resultado-section impostos">
              <h4 className="section-title">Valores de Impostos</h4>
              <table className="impostos-table">
                <tbody>
                  {Object.entries(resultado.valores_de_impostos).map(
                    ([imposto, valor]: [string, any]) => (
                      <tr key={imposto}>
                        <th className="impostos-table-header">
                          {imposto.toUpperCase()}
                        </th>
                        <td className="impostos-table-cell">
                          {typeof valor === "object"
                            ? Object.entries(valor)
                                .map(([uf, val]) => `${uf}: ${val}`)
                                .join(", ")
                            : valor}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {resultado.validacao_profunda && (
            <div className="resultado-section validacao">
              <h4 className="section-title">Validação DeepResearch</h4>
              <div className="validacao-info">
                <span className="validacao-label">Modelo utilizado:</span>
                <span className="validacao-value">
                  {resultado.validacao_profunda.modelo_utilizado}
                </span>
              </div>

              {resultado.observacoes_deep_research && (
                <div className="observacoes">
                  <h5 className="observacoes-title">Observações</h5>
                  <ul className="section-list">
                    {resultado.observacoes_deep_research.map(
                      (obs: string, index: number) => (
                        <li key={index} className="section-list-item">
                          {obs}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NCMConsultaForm;
