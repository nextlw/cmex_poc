import React from 'react';
import { TiposTributariosProps, EstadoTributario } from './types';
import './styles.css';

const TiposTributarios: React.FC<TiposTributariosProps> = ({ 
  classificacao,
  temResposta 
}) => {
  // Função para encontrar a classificação ativa
  const getClassificacaoAtiva = () => {
    if (!temResposta || !classificacao) return null;

    for (const grupo of Object.values(classificacao)) {
      for (const [operacao, dados] of Object.entries(grupo)) {
        if (dados.valor) {
          return {
            operacao,
            ...dados
          };
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
          classificacaoAtiva ? EstadoTributario.VERDADEIRO : EstadoTributario.DEFAULT
        }`}
        title={classificacaoAtiva?.descricao || 'Nenhuma classificação aplicável'}
      >
        <span className="tipo-tributario-label">
          {classificacaoAtiva?.operacao?.replace(/_/g, ' ') || 'Não classificado'}
        </span>
        <span className="tipo-tributario-badge">
          {classificacaoAtiva?.codigo}
        </span>
      </div>
    </div>
  );
};

export default TiposTributarios; 