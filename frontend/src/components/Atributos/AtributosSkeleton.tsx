import React from "react";
import "./styles.css";
import { BsBoxes } from "react-icons/bs";
import Skeleton from "../Skeleton";

const AtributosSkeleton: React.FC = () => {
  return (
    <div className="box-atributos-container h-full w-full">
      <div className="flex items-center w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
          <BsBoxes /> Atributos
        </h3>
      </div>
      <hr className="border-gray-600 my-3" />
      <div className="space-y-4 w-full">
        <div className="space-y-2">
          <div className="skeleton-input">
            <Skeleton height="20px" />
          </div>
          <div className="skeleton-input">
            <Skeleton height="20px" />
          </div>
          <div className="skeleton-input">
            <Skeleton height="20px" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtributosSkeleton;
