import React from "react";
import { RegiaoICMS } from "../types";
import LinhaEstado from "./LinhaEstado";

interface CardRegiaoProps {
  regiao: RegiaoICMS;
}

const CardRegiao: React.FC<CardRegiaoProps> = ({ regiao }) => {
  return (
    <div className="container-sugestoes rounded-lg p-3">
      <h3 className="text-gray-400 text-sm pb-2">{regiao.nome}</h3>
      <ul className="list-disc list-inside text-gray-100 text-sm">
        {regiao.estados.map((estado, index) => (
          <LinhaEstado key={index} estado={estado} />
        ))}
      </ul>
    </div>
  );
};

export default CardRegiao;
