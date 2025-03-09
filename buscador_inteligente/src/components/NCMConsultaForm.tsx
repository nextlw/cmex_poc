import React, { useState, FormEvent, CSSProperties } from 'react';
import DeepResearchToggle from './DeepResearchToggle';

interface FormData {
  consulta: string;
  estadoOrigem: string;
  operacao: string;
  regimeTributario: string;
  tributacao: string;
  modelo: string;
  useDeepResearch: boolean;
}

interface NCMConsultaFormProps {
  onSubmit?: (data: FormData) => void;
  onResult?: (result: any) => void;
  initialData?: Partial<FormData>;
}

/**
 * Componente para formulário de consulta NCM
 */
const NCMConsultaForm: React.FC<NCMConsultaFormProps> = ({
  onSubmit,
  onResult,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<FormData>({
    consulta: '',
    estadoOrigem: 'SP',
    operacao: '',
    regimeTributario: '',
    tributacao: '',
    modelo: 'Qwen2.5-7b-instruct-1m',
    useDeepResearch: false,
    ...initialData
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const modelos = [
    { id: 'Qwen2.5-7b-instruct-1m', nome: 'Qwen 2.5', descricao: 'Modelo local para consultas rápidas' },
    { id: 'Nex-0.1-Pro-2024', nome: 'Nex 0.1 Pro', descricao: 'Alta precisão (GPT-4)' },
    { id: 'Nex-0.3-Preview-2024', nome: 'Nex 0.3', descricao: 'Equilíbrio entre precisão e performance (Claude)' },
    { id: 'Nex-0.5-Preview-2025', nome: 'Nex 0.5', descricao: 'Eficiência e performance (Deepseek)' }
  ];

  // Estilos inline
  const formStyle: CSSProperties = {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
  };
  
  const formGroupStyle: CSSProperties = {
    marginBottom: '1rem'
  };
  
  const formRowStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem'
  };
  
  const labelStyle: CSSProperties = {
    display: 'block',
    marginBottom: '0.25rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#333'
  };
  
  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '0.875rem'
  };
  
  const submitButtonStyle: CSSProperties = {
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s'
  };
  
  const submitButtonDisabledStyle: CSSProperties = {
    backgroundColor: '#b3d1f7',
    cursor: 'not-allowed'
  };
  
  const errorMessageStyle: CSSProperties = {
    color: '#e74c3c',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  };
  
  const resultadoContainerStyle: CSSProperties = {
    marginTop: '2rem',
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '1rem',
    backgroundColor: '#f9f9f9'
  };
  
  const resultadoTitleStyle: CSSProperties = {
    marginTop: 0,
    color: '#333',
    fontSize: '1.25rem'
  };
  
  const resultadoHeaderStyle: CSSProperties = {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem'
  };
  
  const ncmBoxStyle: CSSProperties = {
    backgroundColor: '#4a90e2',
    color: 'white',
    borderRadius: '4px',
    padding: '0.5rem 1rem',
    display: 'flex',
    flexDirection: 'column'
  };
  
  const ncmLabelStyle: CSSProperties = {
    fontSize: '0.75rem',
    opacity: 0.8
  };
  
  const ncmValueStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  };
  
  const confiancaBoxStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };
  
  const confiancaLabelStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: '#666',
    marginBottom: '0.25rem'
  };
  
  const confiancaBarStyle: CSSProperties = {
    height: '0.75rem',
    backgroundColor: '#eee',
    borderRadius: '4px',
    overflow: 'hidden'
  };
  
  const getConfiancaValueStyle = (percentagem: number): CSSProperties => ({
    height: '100%',
    width: `${percentagem}%`,
    backgroundColor: '#4caf50',
    borderRadius: '4px',
    position: 'relative'
  });
  
  const resultadoSectionStyle: CSSProperties = {
    marginBottom: '1.5rem'
  };
  
  const sectionTitleStyle: CSSProperties = {
    marginTop: 0,
    marginBottom: '0.5rem',
    color: '#333',
    fontSize: '1rem'
  };
  
  const sectionContentStyle: CSSProperties = {
    margin: 0,
    color: '#444'
  };
  
  const sectionListStyle: CSSProperties = {
    margin: 0,
    paddingLeft: '1.25rem'
  };
  
  const sectionListItemStyle: CSSProperties = {
    marginBottom: '0.25rem'
  };
  
  const impostosTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse'
  };
  
  const impostosTableCellStyle: CSSProperties = {
    padding: '0.5rem',
    textAlign: 'left',
    borderBottom: '1px solid #eee'
  };
  
  const impostosTableHeaderStyle: CSSProperties = {
    ...impostosTableCellStyle,
    fontWeight: 500,
    width: '120px'
  };
  
  const validacaoInfoStyle: CSSProperties = {
    marginBottom: '0.5rem'
  };
  
  const validacaoLabelStyle: CSSProperties = {
    fontWeight: 500,
    marginRight: '0.5rem'
  };
  
  const observacoesTitleStyle: CSSProperties = {
    margin: '0.5rem 0',
    fontSize: '0.875rem',
    color: '#555'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeepResearchChange = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, useDeepResearch: enabled }));
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
      const response = await fetch('/api/v1/ncm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao consultar NCM');
      }
      
      const data = await response.json();
      setResultado(data);
      
      // Notifica o callback de resultado se fornecido
      if (onResult) {
        onResult(data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar NCM');
      console.error('Erro na consulta:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formStyle} className="ncm-consulta-form">
      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle} className="form-group">
          <label style={labelStyle} htmlFor="consulta">Descrição do Produto*</label>
          <textarea
            id="consulta"
            name="consulta"
            value={formData.consulta}
            onChange={handleInputChange}
            placeholder="Descreva o produto em detalhes (ex: Camisa polo masculina em malha 100% algodão)"
            required
            rows={3}
            style={inputStyle}
          />
        </div>
        
        <div style={formRowStyle} className="form-row">
          <div style={formGroupStyle} className="form-group">
            <label style={labelStyle} htmlFor="estadoOrigem">Estado de Origem*</label>
            <select
              id="estadoOrigem"
              name="estadoOrigem"
              value={formData.estadoOrigem}
              onChange={handleInputChange}
              required
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              {/* Adicionar outros estados */}
            </select>
          </div>
          
          <div style={formGroupStyle} className="form-group">
            <label style={labelStyle} htmlFor="operacao">Operação</label>
            <select
              id="operacao"
              name="operacao"
              value={formData.operacao}
              onChange={handleInputChange}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              <option value="Venda">Venda</option>
              <option value="Revenda">Revenda</option>
              <option value="Industrialização">Industrialização</option>
              <option value="Exportação">Exportação</option>
            </select>
          </div>
        </div>
        
        <div style={formRowStyle} className="form-row">
          <div style={formGroupStyle} className="form-group">
            <label style={labelStyle} htmlFor="regimeTributario">Regime Tributário</label>
            <select
              id="regimeTributario"
              name="regimeTributario"
              value={formData.regimeTributario}
              onChange={handleInputChange}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              <option value="Simples Nacional">Simples Nacional</option>
              <option value="Lucro Presumido">Lucro Presumido</option>
              <option value="Lucro Real">Lucro Real</option>
            </select>
          </div>
          
          <div style={formGroupStyle} className="form-group">
            <label style={labelStyle} htmlFor="tributacao">Tributação</label>
            <select
              id="tributacao"
              name="tributacao"
              value={formData.tributacao}
              onChange={handleInputChange}
              style={inputStyle}
            >
              <option value="">Selecione...</option>
              <option value="Normal">Normal</option>
              <option value="Substituição Tributária">Substituição Tributária</option>
              <option value="Isento">Isento</option>
              <option value="Não Tributado">Não Tributado</option>
            </select>
          </div>
        </div>
        
        <div style={formGroupStyle} className="form-group">
          <label style={labelStyle} htmlFor="modelo">Modelo de IA*</label>
          <select
            id="modelo"
            name="modelo"
            value={formData.modelo}
            onChange={handleInputChange}
            required
            style={inputStyle}
          >
            {modelos.map(modelo => (
              <option key={modelo.id} value={modelo.id}>
                {modelo.nome} - {modelo.descricao}
              </option>
            ))}
          </select>
        </div>
        
        <div style={formGroupStyle} className="form-group">
          <DeepResearchToggle
            enabled={formData.useDeepResearch}
            onChange={handleDeepResearchChange}
            helpText="Ative para análise profunda e verificação adicional dos resultados"
          />
        </div>
        
        {error && <div style={errorMessageStyle} className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
            style={{
              ...submitButtonStyle,
              ...(loading ? submitButtonDisabledStyle : {})
            }}
          >
            {loading ? 'Consultando...' : 'Consultar NCM'}
          </button>
        </div>
      </form>
      
      {resultado && (
        <div style={resultadoContainerStyle} className="resultado-container">
          <h3 style={resultadoTitleStyle}>Resultado da Consulta</h3>
          
          <div style={resultadoHeaderStyle} className="resultado-header">
            <div style={ncmBoxStyle} className="ncm-box">
              <span style={ncmLabelStyle} className="label">NCM</span>
              <span style={ncmValueStyle} className="value">{resultado.ncm}</span>
            </div>
            
            {resultado.validacao_profunda && (
              <div style={confiancaBoxStyle} className="confianca-box">
                <span style={confiancaLabelStyle} className="label">Confiança</span>
                <div style={confiancaBarStyle} className="confianca-bar">
                  <div 
                    className="confianca-value" 
                    style={getConfiancaValueStyle(resultado.validacao_profunda.confianca)}
                    data-value={`${resultado.validacao_profunda.confianca}%`}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div style={resultadoSectionStyle} className="resultado-section">
            <h4 style={sectionTitleStyle}>Descrição</h4>
            <p style={sectionContentStyle}>{resultado.descricao}</p>
          </div>
          
          {resultado.atributos && resultado.atributos.length > 0 && (
            <div style={resultadoSectionStyle} className="resultado-section">
              <h4 style={sectionTitleStyle}>Atributos do Produto</h4>
              <ul style={sectionListStyle}>
                {resultado.atributos.map((atributo: string, index: number) => (
                  <li key={index} style={sectionListItemStyle}>{atributo}</li>
                ))}
              </ul>
            </div>
          )}
          
          {resultado.valores_de_impostos && (
            <div style={resultadoSectionStyle} className="resultado-section impostos">
              <h4 style={sectionTitleStyle}>Valores de Impostos</h4>
              <table style={impostosTableStyle}>
                <tbody>
                  {Object.entries(resultado.valores_de_impostos).map(([imposto, valor]: [string, any]) => (
                    <tr key={imposto}>
                      <th style={impostosTableHeaderStyle}>{imposto.toUpperCase()}</th>
                      <td style={impostosTableCellStyle}>
                        {typeof valor === 'object' 
                          ? Object.entries(valor).map(([uf, val]) => `${uf}: ${val}`).join(', ')
                          : valor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {resultado.validacao_profunda && (
            <div style={resultadoSectionStyle} className="resultado-section validacao">
              <h4 style={sectionTitleStyle}>Validação DeepResearch</h4>
              <div style={validacaoInfoStyle} className="validacao-info">
                <span style={validacaoLabelStyle} className="label">Modelo utilizado:</span>
                <span className="value">{resultado.validacao_profunda.modelo_utilizado}</span>
              </div>
              
              {resultado.observacoes_deep_research && (
                <div className="observacoes">
                  <h5 style={observacoesTitleStyle}>Observações</h5>
                  <ul style={sectionListStyle}>
                    {resultado.observacoes_deep_research.map((obs: string, index: number) => (
                      <li key={index} style={sectionListItemStyle}>{obs}</li>
                    ))}
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