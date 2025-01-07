import React from "react";
import { LinhaEstadoProps } from "./types";
import "./LinhaEstado.css";

const LinhaEstado: React.FC<LinhaEstadoProps> = ({ estado }) => {
  return (
    <li className="linha-estado">
      <span>{estado.nome}</span>
      <span>{estado.icms}</span>
    </li>
  );
};

export default LinhaEstado;
