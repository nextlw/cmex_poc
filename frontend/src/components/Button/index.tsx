import React from "react";
import { ButtonProps } from './types';
import "./styles.css";
import Spinner from "../Spinner";

const Button: React.FC<ButtonProps> = ({ onClick, isLoading, label, icon, size, type }) => {
  // Mantendo as classes originais do JSX, adicionando classes dinâmicas baseadas em size e type
  const className = `w-auto ${
    isLoading
      ? 'ring-opacity-50 cursor-pointer opacity-75'
      : 'bg-blue-600 outline-none ring-2 ring-blue-900 ring-opacity-50 hover:bg-blue-700 hover:outline-none hover:ring-2 hover:ring-blue-900 hover:ring-opacity-60'
  } text-white rounded-full outline-none transition-all duration-1000 push-easy flex items-center justify-center ${
    size ? `button-${size}` : ''
  } ${
    type ? `button-${type}` : ''
  }`.trim();

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={className}
      style={{ minWidth: "32px" }}
    >
      <div
        className={`
          absolute flex items-center justify-center
          transition-all duration-900 push-easy
          ${isLoading ? "opacity-100" : "opacity-0"}
        `}
        style={{ transform: "scale(0.7)" }}
      >
        <Spinner />
      </div>
      <div
        className={`
          flex items-center
          transition-all duration-900 push-easy
          ${isLoading ? "opacity-0" : "opacity-100"}
        `}
      >
        {icon && !label && <span className="p-2">{icon}</span>}
        {icon && label && <span className="p-2 px-3.5">{icon}</span>}
        {label && <span className="ml-2">{label}</span>}
      </div>
    </button>
  );
};

export default Button;
