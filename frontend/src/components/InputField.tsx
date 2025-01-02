import React, { useRef } from "react";

interface InputFieldProps {
  width?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  width,
  placeholder = "Digite aqui",
  value,
  onChange,
  onKeyPress,
  onBlur,
  readOnly = false,
  label,
  icon,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    containerRef.current?.classList.add("envoltorio-campo-input-focado");
  };

  const handleBlur = () => {
    containerRef.current?.classList.remove("envoltorio-campo-input-focado");
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="container-campo-input" ref={containerRef} style={{ width }}>
      {label && <label className="rotulo-campo-input">{label}</label>}
      <div className="envoltorio-campo-input">
        {icon && <span className="icone-campo-input">{icon}</span>}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          readOnly={readOnly}
          className="campo-input"
        />
      </div>
    </div>
  );
};

export default InputField;
