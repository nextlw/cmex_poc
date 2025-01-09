import React, { useCallback } from "react";
import { RegiaoICMS } from "../../types";
import LinhaEstado from "../LinhaEstado";

/**
 * Componente CardRegiao
 *
 * Este componente é responsável por exibir as informações de uma região específica,
 * incluindo o nome da região e a lista de estados pertencentes a ela.
 *
 * @param {RegiaoICMS} regiao - Objeto contendo as informações da região, incluindo o nome e a lista de estados.
 *
 * @returns {JSX.Element} - Retorna um card contendo o nome da região e a lista de estados.
 */

interface CardRegiaoProps {
  regiao: RegiaoICMS;
}

const CardRegiao: React.FC<CardRegiaoProps> = React.memo(({ regiao }) => {
  const renderEstado = useCallback(
    (estado, index) => <LinhaEstado key={index} estado={estado} />,
    []
  );

  return (
    <div className="container-sugestoes rounded-lg p-3">
      <h3 className="text-gray-400 text-sm pb-2">{regiao.nome}</h3>
      <ul className="list-disc list-inside text-gray-100 text-sm">
        {regiao.estados.map(renderEstado)}
      </ul>
    </div>
  );
});

export default CardRegiao;
