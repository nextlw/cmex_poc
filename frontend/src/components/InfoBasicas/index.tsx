import React from "react";
import { InfoBasicasProps } from "./types";
import "./styles.css";
import { FaCodeBranch } from "react-icons/fa";

const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, descricao }) => {
  return (
    <div className="info-basicas">
      <h3 className="text-xl font-semibold text-white mb-2 gap-2 flex items-center">
        <FaCodeBranch /> Informações Básicas
      </h3>
      <hr className="border-gray-600 my-3" />
      <div className="grid grid-rows-2">
        <p className="text-gray-300 box-resultado max-h-fit max-w-xs pb-2">
          <span className="font-medium">NCM:</span> {ncm}
        </p>
        <p className="text-gray-300 box-resultado pb-4 w-full">
          <span className="font-medium">Descrição:</span> {descricao}
        </p>
      </div>
    </div>
  );
};

export default InfoBasicas;
