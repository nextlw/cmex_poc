import React from "react";
import { InfoBasicasProps } from "./types";
import "./styles.css";
import { FaCodeBranch } from "react-icons/fa";


const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, descricao }) => {


  return (
    <div className="info-basicas h-full flex flex-col"> {/* Adicione flex flex-col */}
  <h3 className="text-xl font-semibold text-white gap-2 flex items-center">
    <FaCodeBranch /> Informações Básicas
  </h3>
  <hr className="border-gray-600 my-3" />
  <div className="gap-2 flex flex-col flex-grow"> {/* Adicione flex-grow */}
    <p className="text-gray-300 box-resultado max-h-fit">
      <span className="font-medium">NCM:</span> {ncm}
    </p>
    <p className="text-gray-300 box-resultado flex-grow"> {/* Substitua h-full w-full por flex-grow */}
      <span className="font-medium">Descrição:</span> {descricao}
    </p>
  </div>
</div>
  );
};

export default InfoBasicas;
