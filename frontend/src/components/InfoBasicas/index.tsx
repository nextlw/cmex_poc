import React from "react";
import "./styles.css";
import { InfoBasicasProps } from "./types";
import { BsInfoCircle } from "react-icons/bs";
import Skeleton from "../Skeleton";

const InfoBasicas: React.FC<InfoBasicasProps> = ({
  ncm,
  descricao,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="info-bas">
        <div className="flex items-center gap-2 mb-4">
          <BsInfoCircle />
          <h3 className="text-xl font-semibold">Informações Básicas</h3>
        </div>
        <hr className="border-[var(--color-border-hr)] my-4" />
        <div className="space-y-4">
          <div>
            <div className="text-gray-300 font-medium mb-2">NCM</div>
            <Skeleton height="24px" />
          </div>
          <div>
            <div className="text-gray-300 font-medium mb-2">Descrição</div>
            <Skeleton height="48px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="info-bas">
      <div className="flex items-center gap-2 mb-4">
        <BsInfoCircle />
        <h3 className="text-xl font-semibold">Informações Básicas</h3>
      </div>
      <hr className="border-[var(--color-border-hr)] my-4" />
      <div className="space-y-4">
        <div>
          <div className="text-gray-300 font-medium mb-2">NCM</div>
          <div>{ncm || "—"}</div>
        </div>
        <div>
          <div className="text-gray-300 font-medium mb-2">Descrição</div>
          <div>{descricao || "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default InfoBasicas;
