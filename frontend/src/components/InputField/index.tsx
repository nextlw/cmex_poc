import React, { useRef, useEffect } from "react";
import { InputFieldProps } from "./types";
import "./styles.css";

const InputField: React.FC<InputFieldProps> = ({
  width,
  placeholder = "Digite aqui",
  value,
  onChange,
  readOnly = false,
  label,
  icon,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null); // Adicionar novo ref

  const handleFocus = () => {
    inputWrapperRef.current?.classList.add("focused");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputWrapperRef.current &&
        !inputWrapperRef.current.contains(event.target as Node)
      ) {
        inputWrapperRef.current.classList.remove("focused");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width }}>
      {label && <label>{label}</label>}
      <div className="envoltorio-campo-input" ref={inputWrapperRef}>
        {icon && <span className="icone-campo-input">{icon}</span>}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          readOnly={readOnly}
          className="campo-input"
        />
      </div>
    </div>
  );
};

export default InputField;
