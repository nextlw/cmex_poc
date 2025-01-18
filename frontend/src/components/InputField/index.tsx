import React, { useRef, useEffect } from "react";
import { InputFieldProps } from "./types";
import "./styles.css";

const InputField: React.FC<InputFieldProps> = ({
  width,
  height,
  placeholder = "Digite aqui",
  value,
  onChange,
  readOnly = false,
  label,
  icon,
  showInnerLabel = false,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const isMultiline = className?.includes("multiline");

  return (
    <div ref={containerRef} style={{ width: width || "100%", height }}>
      {!showInnerLabel && label && <label>{label}</label>}
      <div className="envoltorio-campo-input" ref={inputWrapperRef}>
        {icon && <span className="icone-campo-input">{icon}</span>}
        <div className="campo-input-container">
          {showInnerLabel && label && (
            <span className="inner-label">{label}</span>
          )}
          {isMultiline ? (
            <textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onFocus={handleFocus}
              readOnly={readOnly}
              className={`campo-input ${className}`}
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onFocus={handleFocus}
              readOnly={readOnly}
              className={`campo-input ${className}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InputField;
