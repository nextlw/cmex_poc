import React, { useState } from "react";
import { FaSpinner } from "react-icons/fa";
import AiIcon from "./AiIcon";

interface AppleStyleInputProps {
  width?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  readOnly?: boolean;
}

const AppleStyleInput: React.FC<AppleStyleInputProps> = ({
  width,
  placeholder = "Descreva o seu produto",
  value,
  onChange,
  onKeyDown,
  onBlur,
  isLoading = false,
  readOnly = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Impede o comportamento padrão de recarregar a página
      if (onKeyDown) {
        onKeyDown(e); // Chama a função onKeyDown passada como prop
      }
    }
  };

  return (
    <div style={{ width: width || "100%" }}>
      <div className={`animate-glow py-2 ${isLoading ? "is-glowing" : ""}`}>
        <AiIcon
          className="ai-icon"
          style={{
            position: "absolute",
            left: "16px",
            top: "47%",
            transform: "translateY(-50%)",
            translate: "2s",
          }}
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder={placeholder}
          // className="glowing-input"
          className={`glowing-input py-2 ${isLoading ? "is-glowing" : ""}`}
          readOnly={readOnly}
          style={{ paddingLeft: "48px" }} // 16px (espaço do ícone) + 16px (espaço do texto) + 16px (padding interno)
        />
        {isLoading && <FaSpinner className="loading-icon" />}
      </div>
    </div>
  );
};

export default AppleStyleInput;
