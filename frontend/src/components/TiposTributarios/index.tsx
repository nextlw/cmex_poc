import React from 'react';
import { TiposTributariosProps, EstadoTributario } from './types';
import './styles.css';

const TiposTributarios: React.FC<TiposTributariosProps> = ({ 
  classificacao,
  temResposta 
}) => {
  // Função para determinar o estado do tipo tributário
  const determinarEstadoTributario = (operacao: string): EstadoTributario => {
    // Operações positivas (favoráveis ao contribuinte)
    if (operacao.includes('isenta') || 
        operacao.includes('aliquota_zero') || 
        operacao.includes('credito') ||
        operacao.includes('credito_mercado_interno') ||
        operacao.includes('credito_nao_tributado') ||
        operacao.includes('credito_exportacao') ||
        operacao.includes('credito_tributado_nao_tributado') ||
        operacao.includes('credito_tributado_exportacao') ||
        operacao.includes('credito_nao_tributado_exportacao') ||
        operacao.includes('credito_tributado_nao_tributado_exportacao')) {
      return EstadoTributario.POSITIVO;
    }
    
    // Operações que requerem atenção
    if (operacao.includes('suspensa') || 
        operacao.includes('diferenciada') ||
        operacao.includes('substituicao') ||
        operacao.includes('substituicao_tributaria') ||
        operacao.includes('monofasica_revenda')) {
      return EstadoTributario.ATENCAO;
    }
    
    // Operações negativas
    if (operacao.includes('sem_credito') || 
        operacao.includes('sem_incidencia') ||
        operacao.includes('outras_operacoes') ||
        operacao.includes('outras_entradas')) {
      return EstadoTributario.NEGATIVO;
    }
    
    // Operações neutras
    if (operacao.includes('aliquota_basica') ||
        operacao.includes('aliquota_diferenciada') ||
        operacao.includes('aliquota_unidade_medida') ||
        operacao.includes('mercado_interno') ||
        operacao.includes('nao_tributado') ||
        operacao.includes('exportacao') ||
        operacao.includes('tributado_nao_tributado') ||
        operacao.includes('tributado_exportacao') ||
        operacao.includes('nao_tributado_exportacao') ||
        operacao.includes('tributado_nao_tributado_exportacao')) {
      return EstadoTributario.NEUTRO;
    }

    // Caso padrão
    return EstadoTributario.DEFAULT;
  };

  // Função para encontrar a classificação ativa
  const getClassificacaoAtiva = () => {
    if (!temResposta || !classificacao) return null;

    for (const tipoOperacao of Object.values(classificacao)) {
      for (const grupo of Object.values(tipoOperacao)) {
        for (const [operacao, dados] of Object.entries(grupo)) {
          if (dados.valor) {
            return {
              operacao: String(operacao),
              codigo: String(dados.codigo),
              valor: Boolean(dados.valor),
              descricao: dados.descricao?.toString(),
              estado: determinarEstadoTributario(operacao)
            };
          }
        }
      }
    }
    return null;
  };

  const classificacaoAtiva = getClassificacaoAtiva();

  return (
    <div className="tipos-tributarios">
      <div
        className={`tipo-tributario-card ${
          classificacaoAtiva ? `estado-${classificacaoAtiva.estado}` : 'estado-default'
        }`}
        title={classificacaoAtiva?.descricao || 'Nenhuma classificação aplicável'}
      >
        <span className="tipo-tributario-label">
          {classificacaoAtiva?.operacao?.replace(/_/g, ' ') || 'Não classificado'}
        </span>
        <span className="tipo-tributario-badge">
          {classificacaoAtiva?.codigo || '--'}
        </span>
      </div>
    </div>
  );
};

export default TiposTributarios; 