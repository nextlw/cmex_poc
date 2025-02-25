import React from "react";
import "./styles.css";
import { BsMotherboard } from "react-icons/bs";
import Skeleton from "../Skeleton";

const InfoBasicasSkeleton: React.FC = () => {
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
          <div className="input-field">
            <label className="text-gray-300">NCM:</label>
            <div className="skeleton-input">
              <Skeleton height="20px" />
            </div>
          </div>
        </div>
        <div className="flex-grow min-h-0">
          <div className="input-field">
            <label className="text-gray-300">Descrição:</label>
            <div className="skeleton-input" style={{ height: '76px' }}>
              <Skeleton height="58px" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoBasicasSkeleton; 