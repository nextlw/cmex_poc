import React from "react";
import { InfoBasicasProps } from "./types";
import "./styles.css";
import { BsMotherboard } from "react-icons/bs";

const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, descricao }) => {
  return (
    <div className="info-bas h-full">
      <div className="flex w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
        <BsMotherboard /> Informações Básicas
        </h3>
      </div>
      <hr className="border-gray-600 my-4" />
      <div className="info-basicas space-y-4">
        <div className="info-basicas-item">
          <span className="box-resultado info-basicas-rowfont-medium mr-2 flex w-full gap-1">
            NCM: <span>{ncm}</span>
          </span>
        </div>
        <div className="info-basicas-item">
          <span className="box-resultado info-basicas-rowont-medium mr-2 flex w-full gap-1">
            Descrição: <span>{descricao}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default InfoBasicas;
