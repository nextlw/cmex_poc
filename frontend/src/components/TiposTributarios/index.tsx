import React from 'react';
import { TiposTributariosProps, EstadoTributario, TipoTributario } from './types';
import './styles.css';

const TIPOS = [
  { id: 'monofasico', label: 'Monofásico' },
  { id: 'aliquota_zero', label: 'Alíquota Zero' },
  { id: 'isento', label: 'Isento' },
  { id: 'suspenso', label: 'Suspenso' }
] as const;

const TiposTributarios: React.FC<TiposTributariosProps> = ({ 
  estados, 
  temResposta 
}) => {
  // Função para determinar o estado do tipo tributário
  const getEstadoTributario = (id: TipoTributario): EstadoTributario => {
    // Se não temos resposta da API ou estados é null, mostra estado default (cinza)
    if (!temResposta || !estados) {
      return EstadoTributario.DEFAULT;
    }

    // Se temos resposta, verifica se o estado é true (verde) ou false (vermelho)
    return estados[id] ? EstadoTributario.VERDADEIRO : EstadoTributario.FALSO;
  };

  return (
    <div className="tipos-tributarios">
      {TIPOS.map(({ id, label }) => (
        <div
          key={id}
          className={`tipo-tributario-card ${getEstadoTributario(id as TipoTributario)}`}
          title={`${label} - ${estados?.[id as TipoTributario] ? 'Aplicável' : 'Não aplicável'}`}
        >
          <span className="tipo-tributario-label">{label}</span>
          <span className="tipo-tributario-badge" />
        </div>
      ))}
    </div>
  );
};

export default TiposTributarios; 