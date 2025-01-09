import React from "react";
import { CardSituacaoProps } from "./types";
import "./CardSituacao.css";

const CardSituacao: React.FC<CardSituacaoProps> = ({ situacao, descricao }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm mt-4">
      <h3 className="text-xl font-semibold text-white mb-2">{situacao}</h3>
      <p className="text-white">{descricao}</p>
    </div>
  );
};

export default CardSituacao;
