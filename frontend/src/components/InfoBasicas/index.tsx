import React from "react";
import { InfoBasicasProps } from "./types";
import "./styles.css";

const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, descricao }) => {
  return (
    <div className="info-basicas">
      <h3 className="text-xl font-semibold text-white mb-2">
        Informações Básicas
      </h3>
      <div className="space-y-2">
        <p className="text-gray-300">
          <span className="font-medium">NCM:</span> {ncm}
        </p>
        <p className="text-gray-300">
          <span className="font-medium">Descrição:</span> {descricao}
        </p>
      </div>
    </div>
  );
};

export default InfoBasicas;
