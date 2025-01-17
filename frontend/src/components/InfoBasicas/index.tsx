import React from "react";
import { InfoBasicasProps } from "./types";
import "./styles.css";
import { BsMotherboard } from "react-icons/bs";
import InputField from "../InputField";

const InfoBasicas: React.FC<InfoBasicasProps> = ({ ncm, descricao }) => {
  return (
    <div className="info-bas h-full">
      <div className="flex w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
          <BsMotherboard /> Informações Básicas
        </h3>
      </div>
      <hr className="border-gray-600 my-4" />
      <div className="space-y-4">
        <div className="info-basicas-item">
          <InputField 
            value={ncm} 
            onChange={() => {}} 
            readOnly={true}
            label="NCM:"
            showInnerLabel={true}
            placeholder=""
          />
        </div>
        <div className="info-basicas-item">
        <InputField 
            value={descricao} 
            onChange={() => {}} 
            readOnly={true}
            label="DESCRIÇÃO:"
            showInnerLabel={true}
            placeholder=""
          />
        </div>
      </div>
    </div>
  );
};

export default InfoBasicas;
