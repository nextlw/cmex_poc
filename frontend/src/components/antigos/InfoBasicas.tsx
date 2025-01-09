import React from "react";
import { SugerirNCM } from "../../types";

interface InfoBasicasProps {
  ncm: string;
  description: string; // Mudado de descricao para description
}

const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, description }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-white mb-4">
        Informações Básicas
      </h3>
      <p className="text-gray-300">
        <span className="font-medium">NCM:</span> {ncm}
      </p>
      <p className="text-gray-300">
        <span className="font-medium">Descrição:</span> {description}
      </p>
    </div>
  );
};

export default InfoBasicas;
