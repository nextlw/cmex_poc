import React from "react";
import { InfoBasicasProps } from "./types";
import "./styles.css";
import { BsBoxes } from "react-icons/bs";

const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, descricao }) => {
  return (
    <div className="info-basicas h-full">
      <div className="flex items-center w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
          <BsBoxes /> Informações Básicas
        </h3>
      </div>
      <hr className="border-gray-600 my-4" />
      <div className="flex flex-col gap-4">
        <div className="flex w-full">
          <span className="box-resultado text-gray-300 font-medium mr-2 flex w-full gap-1">
            NCM: <span>{ncm}</span>
          </span>
        </div>
        <div className="flex items-center">
          <span className="box-resultado text-gray-300 font-medium mr-2 flex w-full gap-1">
            Descrição: <span>{descricao}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default InfoBasicas;
