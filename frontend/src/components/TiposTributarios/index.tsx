import React from 'react';
import { TiposTributariosProps, EstadoTributario } from './types';
import './styles.css';

const TiposTributarios: React.FC<TiposTributariosProps> = ({ 
  tipoAtivo,
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
        operacao.includes('monofasica_revenda') ||
        operacao.includes('Monofásica')) {
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

    return EstadoTributario.DEFAULT;
  };

  const estado = tipoAtivo ? determinarEstadoTributario(tipoAtivo.texto_completo || tipoAtivo.operacao || '') : EstadoTributario.DEFAULT;

  return (
    <div className="tipos-tributarios flex flex-col md:flex-row gap-4">
      <div
        className={`tipo-tributario-card gap-2 estado-${estado}`}
        title={tipoAtivo?.descricao || 'Classificação Tributária'}
      >
        <span className="tipo-tributario-label">
          {tipoAtivo?.texto_completo || 'Classificação Tributária'}
        </span>
        <span className="tipo-tributario-badge">
          {tipoAtivo?.codigo || '--'}
        </span>
      </div>

      {tipoAtivo?.justificativa && (
        <div className="tipo-tributario-justificativa">
          <span className="justificativa-label">Justificativa:</span>
          <p className="justificativa-texto">
            {tipoAtivo.justificativa}
          </p>
        </div>
      )}
    </div>
  );
};

export default TiposTributarios; 