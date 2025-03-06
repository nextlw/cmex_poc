import React, { useEffect, useRef } from "react";
import "./styles.css";
import { InputAiProps } from "./types";
import Button from "../Button";
import { BiSearch } from "react-icons/bi";
import Spinner from "../Spinner";
/**
 * Componente de input com animações visuais quando você interage ou quando tá carregando.
 * Perfeito pra capturar descrições ou textos de produtos.
 *
 * @component
 *
 * @typedef {Object} InputAiProps
 * @property {string} [width] - Largura opcional do componente. Se não passar nada, ele usa 100%.
 * @property {string} [placeholder="Descreva o seu produto"] - Texto que aparece quando o campo tá vazio.
 * @property {string} value - Valor atual do input.
 * @property {React.ChangeEventHandler<HTMLInputElement>} onChange - Função chamada quando o valor do campo muda.
 * @property {React.KeyboardEventHandler<HTMLInputElement>} [onKeyPress] - Função chamada ao pressionar uma tecla. A tecla "Enter" pode desencadear uma ação especial.
 * @property {() => void} [onBlur] - Função chamada quando o campo perde o foco.
 * @property {boolean} [isLoading=false] - Indica se deve mostrar as animações de carregamento.
 * @property {boolean} [readOnly=false] - Define se o campo está somente leitura.
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
 * - Usa refs (inputRef, containerRef, overlayRef, etc.) pra manipular estilos e animações.
 * - O useEffect principal adiciona ou remove classes CSS e animações baseado no estado de carregamento (isLoading).
 * - Quando você foca no campo (handleFocus), rolam umas animações; ao desfocar (handleBlur), ele remove elas e chama o onBlur se tiver.
 * - A função handleKeyPress intercepta o "Enter" pra evitar que o formulário seja enviado quando não deve.
 *
 * @returns {JSX.Element} Retorna o componente com os estilos e comportamentos definidos.
 */
const InputAi: React.FC<InputAiProps> = ({
  width,
  placeholder = "Descreva o seu produto",
  value,
  onChange,
  onKeyPress,
  onBlur,
  isLoading = false,
  onButtonClick = () => {}, // Função vazia, o botão eu implementei dentro do input de forma opcional.
  style,
  showAutoComplete,
  autoCompleteData = [],
  handleAutocompleteClick,
  isAutocompleteLoading,
  onClickOutside,
}): JSX.Element => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Objeto que mapeia os elementos e suas configurações de loading
    // Isso deixa o código mais organizado e fácil de manter
    const loadingConfig = [
      {
        ref: overlayRef,
        loadingClasses: ["sobreposicao-gradiente-carregando"],
        removeClasses: ["sobreposicao-gradiente-focado"],
        animation: "moverGradiente 2s linear infinite",
      },
      {
        ref: containerRef,
        animation: "bordaBrilhante 4s ease-in-out infinite",
      },
      {
        ref: inputWrapperRef,
        loadingClasses: ["envoltorio-input-carregando"],
      },
      {
        ref: iconRef,
        loadingClasses: ["icone-carregando-carregando"],
        animation: "moverGradiente 2s linear infinite",
      },
    ];

    // Função helper pra manipular as classes e animações
    const updateElement = (config: any, isLoading: boolean) => {
      const {
        ref,
        loadingClasses = [],
        removeClasses = [],
        animation,
      } = config;

      if (!ref.current) return;

      if (isLoading) {
        removeClasses.forEach((cls: string) =>
          ref.current.classList.remove(cls)
        );
        loadingClasses.forEach((cls: string) => ref.current.classList.add(cls));
        if (animation) ref.current.style.animation = animation;
      } else {
        loadingClasses.forEach((cls: string) =>
          ref.current.classList.remove(cls)
        );
        if (animation) ref.current.style.animation = "none";
      }
    };

    // Aplica as configurações em todos os elementos
    loadingConfig.forEach((config) => updateElement(config, isLoading));
  }, [isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside(); // Executa a função se clicar fora
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClickOutside]);

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
    // Esse array guarda todos os elementos que precisam ter suas classes removidas
    // quando o usuário tira o foco do input. Funciona assim:
    //
    // - Cada objeto no array tem:
    //   * ref: referência pro elemento DOM que queremos modificar
    //   * classes: array com os nomes das classes CSS que precisam ser removidas
    //
    // Antes eu tinha várias linhas repetidas tipo "ref.current?.classList.remove()",
    // agora com esse array:
    //   1. Organiza melhor quais elementos são afetados
    //   2. Facilita adicionar ou remover elementos no futuro
    //   3. Evita repetição de código usando loops (bem mais elegante, né?)
    const elements = [
      { ref: overlayRef, classes: ["sobreposicao-gradiente-focado"] },
      { ref: inputWrapperRef, classes: ["envoltorio-input-focado"] },
      {
        ref: iconRef,
        classes: ["icone-carregando-focado", "icone-carregando-carregando"],
      },
    ];

    elements.forEach(({ ref, classes }) => {
      classes.forEach((className) => ref.current?.classList.remove(className));
    });

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

  return (
    <>
      {/* Container principal - div externa que controla o tamanho e efeitos de borda
          - Usa a classe container-gradiente pra estilização base
          - Referenciado por containerRef pra manipular animações
          - Width pode ser customizado via props ou usa 100% como padrão
      */}
      <div
        className="container-gradiente"
        ref={containerRef}
        style={{ ...style, width: width || "100%" }}
      >
        {/* Wrapper do input - agrupa o input, ícone e botão
            - Classe envoltorio-input controla padding e posicionamento
            - Referenciado por inputWrapperRef pra animações de foco/carregamento
        */}
        <div className="envoltorio-input" ref={inputWrapperRef}>
          {/* Ícone à esquerda do input
              - Usa biblioteca bootstrap-icons (classe bi-stars)
              - Referenciado por iconRef pra animações de gradiente
          */}
          <i className="bi bi-stars" ref={iconRef}></i>

          {/* Input text principal
              - Controlado via value/onChange props
              - Handlers pra focus, blur e keypress
              - Fica readonly quando isLoading é true
          */}
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

          {/* Container do botão de busca
              - Posicionado absolutamente à direita do input
              - z-index 10 pra ficar sobre outros elementos
          */}
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
            {/* Botão de busca customizado
                - Usa componente Button reutilizável
                - Ícone de lupa da react-icons
                - Herda estado de loading do input
                - Estilizado como círculo
            */}
            <Button
              onClick={onButtonClick}
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

        {/* Camada de gradiente
            - Fica por baixo do input (z-index 0)
            - Muda de cor/animação baseado no estado (foco/carregando)
            - Referenciado por overlayRef pra controle de animações
        */}
        <div className="sobreposicao-gradiente" ref={overlayRef}></div>

        {showAutoComplete && (
          <div className="autocomplete rounded-xl flex flex-col gap-1">
            {isAutocompleteLoading && (
              <div className="h-[48px]">
                <Spinner classes="left-[50%] top-[20px]" />
              </div>
            )}
            {autoCompleteData.map((item) => (
              <button
                key={item.id}
                className="autocomplete__item rounded-md hover:bg-gray-100 flex flex-row gap-2 items-center justify-between py-4 px-3"
                onClick={() => handleAutocompleteClick(item)}
              >
                <span className="text-gray-700 font-semibold break-keep">
                  {item.resultado[0].ncm}
                </span>
                <span className="text-gray-500 break-keep leading-none flex-1 text-left">
                  {item.resultado[0].descricao}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default InputAi;
