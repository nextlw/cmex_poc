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
    containerRef.current?.classList.add("inputfield-focused");
  };

  const handleBlur = () => {
    containerRef.current?.classList.remove("inputfield-focused");
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div className="inputfield-container" ref={containerRef} style={{ width }}>
      {label && <label className="inputfield-label">{label}</label>}
      <div className="inputfield-wrapper">
        {icon && <span className="inputfield-icon">{icon}</span>}
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
          className="inputfield-field"
        />
      </div>
    </div>
  );
};

export default InputField;
