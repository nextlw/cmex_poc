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
  showInnerLabel = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

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
      {!showInnerLabel && label && <label>{label}</label>}
      <div className="envoltorio-campo-input" ref={inputWrapperRef}>
        {icon && <span className="icone-campo-input">{icon}</span>}
        <div className="campo-input-container">
          {showInnerLabel && label && (
            <span className="inner-label">{label}</span>
          )}
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
    </div>
  );
};

export default InputField;
