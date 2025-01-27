import React from 'react';
import { TiposTributariosProps } from './types';
import './styles.css';

const TiposTributarios: React.FC<TiposTributariosProps> = ({ 
  tipoAtivo,
  justificativa,
}) => {
  const justificativaDaOperacao = (justificativa: string | undefined): string => {
    return justificativa?.toLowerCase() || 'sem_justificativa';
  };

  // Função para determinar a classe CSS baseada no código tributário
  const determinarClasseTributaria = (operacao: string, codigo: string): string => {
    const operacaoLower = operacao.toLowerCase();
    const cod = codigo.padStart(2, '0'); // Garante que o código tenha 2 dígitos

    // Mapeamento de códigos para classes
    switch (cod) {
      // Operações Tributadas (01, 02, 03)
      case '01':
        return 'tributada_aliquota_basica';
      case '02':
        return 'tributada_aliquota_diferenciada';
      case '03':
        return 'tributada_aliquota_por_unidade';
      
      // Tributada Monofásica (04, 05, 06)
      case '04':
      case '05':
      case '06':
        return 'monofasica';
      
      // Isentas/Não Tributadas (07, 08)
      case '07':
        return 'isenta';
      case '08':
        return 'nao_tributada';
      
      // Suspensão (09, 50)
      case '09':
      case '50':
        return 'suspensa';
      
      // Outras Operações (49)
      case '49':
        return 'outras_operacoes';
      
      // Operações com Direito a Crédito (70, 71, 72)
      case '70':
        return 'credito_mercado_interno';
      case '71':
        return 'credito_exportacao';
      case '72':
        return 'credito_basico';
      
      // ST e Substituído (73, 74)
      case '73':
        return 'substituicao_tributaria';
      case '74':
        return 'substituido';
      
      // Exportação (75)
      case '75':
        return 'exportacao';
      
      default:
        // Tenta determinar pelo texto da operação
        if (operacaoLower.includes('isenta')) return 'isenta';
        if (operacaoLower.includes('nao_tributada')) return 'nao_tributada';
        if (operacaoLower.includes('suspensa')) return 'suspensa';
        if (operacaoLower.includes('credito')) return 'credito_basico';
        if (operacaoLower.includes('substituicao')) return 'substituicao_tributaria';
        if (operacaoLower.includes('exportacao')) return 'exportacao';
        if (operacaoLower.includes('monofasica')) return 'monofasica';
        return 'default';
    }
  };

  const classeEstado = tipoAtivo 
    ? determinarClasseTributaria(tipoAtivo.texto_completo || tipoAtivo.operacao, tipoAtivo.codigo)
    : 'default';
  
  const descricaoEstado = justificativaDaOperacao(justificativa);

  return (
    <div className="tipos-tributarios">
      <div className={`tipo-tributario-item estado-${classeEstado}`}>
        <div className="tipo-tributario-card">
          <span className="tipo-tributario-badge">
            {tipoAtivo?.codigo || '--'}
          </span>
          <span className="tipo-tributario-label">
            {tipoAtivo?.texto_completo || 'Classificação Tributária'}
          </span>
        </div>
        <div className={`tipo-tributario-card-discussao estado-${descricaoEstado}`}>
          <span className="tipo-tributario-badge-discussao">
            {justificativa || 'Descrição da Operação'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TiposTributarios; 


