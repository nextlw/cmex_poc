import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface ButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, isLoading, label, icon }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
      w-auto al shadow-inner
      ${
        isLoading
          ? "bg-gray-900 outline-none ring-2 ring-blue-900 ring-opacity-50"
          : "bg-blue-600 outline-none ring-2 ring-blue-900 ring-opacity-50 hover:bg-blue-700 hover:outline-none hover:ring-2 hover:ring-blue-900 hover:ring-opacity-60"
      }
      text-white rounded-full
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-opacity-50
      flex items-center justify-center
      `}
      style={{ minWidth: "48px" }}
    >
      {isLoading ? (
        <div
          className="spinner-border text-light p-2 px-3.5"
          role="status"
          style={{ width: "1.5rem", height: "1.5rem" }}
        >
          <span className="visually-hidden">Carregando...</span>
        </div>
      ) : (
        <>
          {icon && !label && <span className="p-2">{icon}</span>}
          {icon && label && <span className="p-2 px-3.5">{icon}</span>}
          {label && <span className="ml-2">{label}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
