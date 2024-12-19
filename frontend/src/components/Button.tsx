import React from "react";

interface ButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

const Button: React.FC<ButtonProps> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
      w-fit al shadow-inner
      ${
        isLoading
          ? "bg-gray-900 outline-none ring-2 ring-blue-900 ring-opacity-50"
          : "bg-blue-600 outline-none ring-2 ring-blue-900 ring-opacity-50 hover:bg-blue-700 holver:outline-none hover:ring-2 hover:ring-blue-900 hover:ring-opacity-60"
      } 
      text-white rounded-full
      transition-colors duration-200 
      focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-opacity-50
      flex items-center justify-center
      `}
    >
      {isLoading ? (
        <i
          className="fas fa-spinner fa-spin p-2 px-3.5"
          style={{ animationDuration: "0.9s" }}
        ></i>
      ) : (
        <i className="bi bi-search p-2 px-3.5"></i>
      )}
    </button>
  );
};

export default Button;
