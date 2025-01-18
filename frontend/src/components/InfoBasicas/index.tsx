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
      <div className="flex flex-col flex-grow space-y-4">
        <div className="flex-none">
          <InputField 
            value={ncm} 
            onChange={() => {}} 
            readOnly={true}
            label="NCM:"
            showInnerLabel={true}
            placeholder=""
          />
        </div>
        <div className="flex-grow min-h-0">
          <InputField 
            value={descricao} 
            onChange={() => {}} 
            readOnly={true}
            label="Descrição:"
            showInnerLabel={true}
            placeholder=""
            className="multiline"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};

export default InfoBasicas;
