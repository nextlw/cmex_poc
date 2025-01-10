import React from "react";
import { CardRegiaoProps, UF } from "./types";
import "./styles.css";

const CardRegiao: React.FC<CardRegiaoProps> = ({ regiao }) => {
  const renderEstado = (estado: UF) => (
    <li className="container-sugestoes mb-2" key={estado.nome}>
      {estado.nome}: {estado.icms}%
    </li>
  );

  return (
    <div className="rounded-lg p-3">
      <h3 className="text-gray-400 text-sm pb-2">{regiao.nome}</h3>
      <ul className="list-disc list-inside text-gray-100 text-sm">
        {regiao.estados.map(renderEstado)}
      </ul>
    </div>
  );
};

export default CardRegiao;
