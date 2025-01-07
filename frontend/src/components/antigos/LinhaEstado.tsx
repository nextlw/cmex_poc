import React from "react";
import { EstadoICMS } from "../../types";

interface LinhaEstadoProps {
  estado: EstadoICMS;
}

const LinhaEstado: React.FC<LinhaEstadoProps> = ({ estado }) => {
  return (
    <li
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.1)",
        padding: "8px",
        marginBottom: "8px",
        borderRadius: "8px",
      }}
    >
      {estado.nome}: {estado.icms}
    </li>
  );
};

export default LinhaEstado;
