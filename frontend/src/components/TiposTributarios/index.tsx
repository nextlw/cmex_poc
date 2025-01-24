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
        operacao.includes('credito')) {
      return EstadoTributario.POSITIVO;
    }
    
    // Operações que requerem atenção
    if (operacao.includes('suspensa') || 
        operacao.includes('diferenciada') ||
        operacao.includes('substituicao')) {
      return EstadoTributario.ATENCAO;
    }
    
    // Operações negativas
    if (operacao.includes('sem_credito') || 
        operacao.includes('sem_incidencia')) {
      return EstadoTributario.NEGATIVO;
    }
    
    // Operações neutras
    return EstadoTributario.NEUTRO;
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