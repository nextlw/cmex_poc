import React from "react";
import { ReasoningBoxProps } from "./types";
import "./styles.css";

/**
 * Componente para exibir o raciocínio ou explicação detalhada
 *
 * @param props Propriedades do componente
 * @returns Componente JSX que exibe o raciocínio
 */
const ReasoningBox: React.FC<ReasoningBoxProps> = (props) => {
  if (!props.reasoning) return null;

  return (
    <div className="reasoning-box">
      <hr className="divider" />
      <div className="reasoning-content">{props.reasoning}</div>
    </div>
  );
};

export default ReasoningBox;
