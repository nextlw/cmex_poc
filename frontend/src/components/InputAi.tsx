import React, { useState, useEffect, useRef } from "react";

interface InputAiProps {
  width?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  disabled?: boolean;
}

const InputAi: React.FC<InputAiProps> = ({
  width,
  placeholder = "Descreva o seu produto",
  value,
  onChange,
  onKeyPress,
  onBlur,
  isLoading = false,
  readOnly = false,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLElement>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleFocus = () => {
    if (!overlayRef.current?.classList.contains("loading")) {
      overlayRef.current?.classList.add("focused");
      inputWrapperRef.current?.classList.add("focused");
      iconRef.current?.classList.add("focused");
      overlayRef.current!.style.animation = "none";
      containerRef.current!.style.animation = "none";
    }
  };

  const handleBlur = () => {
    overlayRef.current?.classList.remove("focused");
    inputWrapperRef.current?.classList.remove("focused");
    iconRef.current?.classList.remove("focused");
    overlayRef.current!.style.animation = "none";
    containerRef.current!.style.animation = "none";
    if (onBlur) {
      onBlur();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      overlayRef.current?.classList.remove("focused");
      overlayRef.current?.classList.add("loading");
      overlayRef.current!.style.animation = "moveGradient 2s linear infinite";
      containerRef.current!.style.animation =
        "glowingBorder 4s ease-in-out infinite";
      iconRef.current?.classList.add("loading");
      iconRef.current!.style.animation = "moveGradient 2s linear infinite";

      if (onKeyPress) {
        onKeyPress(e);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        overlayRef.current?.classList.remove("loading");
        inputRef.current?.classList.remove("focused");
        overlayRef.current!.style.animation = "none";
        containerRef.current!.style.animation = "none";
        iconRef.current?.classList.remove("loading");
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [loadingTimeout]);

  useEffect(() => {
    if (!isLoading) {
      overlayRef.current?.classList.remove("loading");
      overlayRef.current!.style.animation = "none";
      containerRef.current!.style.animation = "none";
      iconRef.current?.classList.remove("loading");
    }
  }, [isLoading]);

  return (
    <div
      className="gradient-container"
      ref={containerRef}
      style={{ width: width || "100%" }}
    >
      <div className="input-wrapper" ref={inputWrapperRef}>
        <i className="bi bi-stars" ref={iconRef}></i>
        <input
          type="text"
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled || isLoading}
        />
      </div>
      <div className="gradient-overlay" ref={overlayRef}></div>
    </div>
  );
};

export default InputAi;
