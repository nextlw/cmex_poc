import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { FaSpinner } from "react-icons/fa";

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

// Animação do movimento do gradiente radial ao longo da borda
const animateGradient = keyframes`
  0% {
    border-image-source: radial-gradient(circle at 0% 0%, red, orange, purple, green, blue, purple);
    box-shadow: inset 0 0 red;
  }
  25% {
    border-image-source: radial-gradient(circle at 100% 0%, red, orange, purple, blue, purple);
    box-shadow: inset 1 0 orange;
  }
  50% {
    border-image-source: radial-gradient(circle at 100% 100%, red, orange, purple, blue, purple);
    box-shadow: inset 1 1 green;
  }
  75% {
    border-image-source: radial-gradient(circle at 0% 100%, red, orange, purple, blue, purple);
  }
  100% {
    border-image-source: radial-gradient(circle at 0% 0%, red, orange, purple, green, blue, purple);
    box-shadow: inset 0 0 purple;
  }
`;

// Animação de rotação para o ícone de carregamento
const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Estilização do campo de entrada com animação
const InputContainer = styled.div<{ width?: string }>`
  display: inline-block;
  position: relative;
  width: ${(props) => props.width || "100%"};
`;

const GlowingInput = styled.input<{ isGlowing: boolean }>`
  width: 100%;
  padding: 16px;
  padding-right: 20px; /* Espaço para o ícone de carregamento */
  outline: none;
  background-color: #1c1c1e;
  color: white;
  font-size: 16px;
  transition: border-color ease-in-out 2s;
  border-image-slice: 1;
  border-width: 0.5px;
  border-style: transparent;
  animation: ${(props) => (props.isGlowing ? animateGradient : "none")} 10s
    linear infinite;
  animation-timing-function: linear;

  &:focus {
    animation: ${animateGradient} 3s linear infinite;
    border-width: 1px;
  }
`;

const LoadingIcon = styled(FaSpinner)<{ isLoading: boolean }>`
  position: absolute;
  left: 100%;
  right: 8%;
  top: 35%;
  transform: translateY(-30%);
  color: gray;
  animation: ${spin} 1s linear infinite;
  display: ${(props) =>
    props.isLoading ? "block" : "none"}; /* Controla a visibilidade do ícone */
`;

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
  const [isGlowing, setIsGlowing] = useState(false);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && onKeyDown) {
      setIsGlowing(true);
      onKeyDown(event);
    }
  };

  const handleBlur = () => {
    setIsGlowing(false);
    if (onBlur) onBlur();
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
      }}
    >
      <InputContainer width={width}>
        <GlowingInput
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          placeholder={placeholder}
          isGlowing={isGlowing}
          readOnly={readOnly}
        />
        <LoadingIcon isLoading={isLoading} />
      </InputContainer>
    </div>
  );
};

export default AppleStyleInput;
