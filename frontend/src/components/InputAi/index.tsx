import React, { useState, useEffect, useRef } from "react";
import "./styles.css";
import { InputAiProps } from "./types";
import Button from "../Button";
import { BiSearch } from "react-icons/bi";

/**
 * Componente de entrada que exibe animações visuais em diferentes estados de foco e carregamento.
 * Útil para capturar descrições ou textos relacionados a produtos.
 *
 * @component
 *
 * @typedef {Object} InputAiProps
 * @property {string} [width] - Largura opcional do componente. Caso não seja fornecida, utiliza 100%.
 * @property {string} [placeholder="Descreva o seu produto"] - Texto exibido quando o campo está vazio.
 * @property {string} value - Valor atual do campo de texto.
 * @property {React.ChangeEventHandler<HTMLInputElement>} onChange - Função de callback chamada quando há alteração no valor do campo.
 * @property {React.KeyboardEventHandler<HTMLInputElement>} [onKeyPress] - Função de callback chamada ao pressionar uma tecla. Aqui, a tecla "Enter" dispara tratamentos específicos.
 * @property {() => void} [onBlur] - Função de callback chamada quando o campo perde o foco.
 * @property {boolean} [isLoading=false] - Indica se o componente deve exibir animações de carregamento (loading).
 * @property {boolean} [readOnly=false] - Define se o campo está desabilitado para edição.
 *
 * @example
 * <InputAi
 *   width="50%"
 *   placeholder="Digite aqui..."
 *   value={valor}
 *   onChange={(e) => setValor(e.target.value)}
 *   isLoading={false}
 * />
 *
 * @remarks
 * - O componente utiliza diversos refs (inputRef, containerRef, overlayRef, etc.) para manipulações de estilo e animação.
 * - O efeito principal (useEffect) aplica ou remove classes CSS e animações conforme o estado de carregamento (isLoading).
 * - Ao focar no campo (handleFocus), adiciona animações visuais; ao desfocar (handleBlur), remove e executa o callback onBlur caso definido.
 * - A função handleKeyPress intercepta a tecla "Enter" para evitar envios padrão do formulário quando o campo não está em estado de carregamento.
 *
 * @returns {JSX.Element} Retorna o elemento JSX com os estilos e comportamentos descritos.
 */
const InputAi: React.FC<InputAiProps> = ({
  width,
  placeholder = "Descreva o seu produto",
  value,
  onChange,
  onKeyPress,
  onBlur,
  isLoading = false,
  onButtonClick = () => {}, // Provide default empty function
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isLoading) {
      overlayRef.current?.classList.remove("sobreposicao-gradiente-focado");
      overlayRef.current?.classList.add("sobreposicao-gradiente-carregando");
      overlayRef.current!.style.animation = "moverGradiente 2s linear infinite";
      containerRef.current!.style.animation =
        "bordaBrilhante 4s ease-in-out infinite";
      inputWrapperRef.current?.classList.add("envoltorio-input-carregando");
      iconRef.current?.classList.add("icone-carregando-carregando");
      iconRef.current!.style.animation = "moverGradiente 2s linear infinite";
    } else {
      overlayRef.current?.classList.remove("sobreposicao-gradiente-carregando");
      inputWrapperRef.current?.classList.remove("envoltorio-input-carregando");
      overlayRef.current!.style.animation = "none";
      containerRef.current!.style.animation = "none";
      iconRef.current?.classList.remove("icone-carregando-carregando");
      iconRef.current!.style.animation = "none";
    }
  }, [isLoading]);

  const handleFocus = () => {
    if (
      !overlayRef.current?.classList.contains(
        "sobreposicao-gradiente-carregando"
      )
    ) {
      overlayRef.current?.classList.add("sobreposicao-gradiente-focado");
      inputWrapperRef.current?.classList.add("envoltorio-input-focado");
      iconRef.current?.classList.add("icone-carregando-focado");
    }
  };

  const handleBlur = () => {
    overlayRef.current?.classList.remove("sobreposicao-gradiente-focado");
    inputWrapperRef.current?.classList.remove("envoltorio-input-focado");
    iconRef.current?.classList.remove("icone-carregando-focado");
    iconRef.current?.classList.remove("icone-carregando-carregando");
    if (onBlur) {
      onBlur();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      if (onKeyPress) {
        onKeyPress(e);
      }
    }
  };

  function handleSearch(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div
      className="container-gradiente"
      ref={containerRef}
      style={{ width: width || "100%" }}
    >
      <div className="envoltorio-input" ref={inputWrapperRef}>
        <i className="bi bi-stars" ref={iconRef}></i>
        <input
          type="text"
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={isLoading}
        />
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: "2px",
            bottom: "2px",
            display: "flex",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <Button
            onClick={onButtonClick} // Usa prop para o clique do botão
            isLoading={isLoading}
            icon={<BiSearch />}
            style={{
              borderRadius: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>
      </div>
      <div className="sobreposicao-gradiente" ref={overlayRef}></div>
    </div>
  );
};

export default InputAi;
