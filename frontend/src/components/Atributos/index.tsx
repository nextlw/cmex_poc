import React, { useState, useEffect } from "react";
import { AtributosProps } from "./types";
import "./styles.css";
import { BsBoxes } from "react-icons/bs";
import { AtributoNCM } from "../../types/atributos";
import TabelaAtributosNCM from "../TabelaAtributosNCM";

const Atributos: React.FC<AtributosProps> = ({
  atributos = null,
  isLoading = false,
}) => {
  // Determina se devemos renderizar a tabela (formato AtributoNCM[] ou nulo)
  // ou a lista legada (formato string[])
  const renderAsTable =
    atributos === null ||
    (Array.isArray(atributos) &&
      (atributos.length === 0 || typeof atributos[0] !== "string"));

  const [currentAtributos, setCurrentAtributos] = useState<
    AtributoNCM[] | string[]
  >(atributos || []);

  useEffect(() => {
    setCurrentAtributos(atributos || []);
  }, [atributos]);

  if (isLoading) {
    return (
      <div className="box-atributos-container h-full w-full">
        <div className="w-full">
          <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
            <BsBoxes /> Atributos
          </h3>
        </div>
        <hr className="border-gray-600 my-3" />
        <div className="w-full">
          <span className="text-gray-300 font-medium w-full">
            <TabelaAtributosNCM
              atributos={currentAtributos as AtributoNCM[]}
              isLoading={true}
              error={null}
            />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="box-atributos-container space-y-2 h-full w-full">
      <div className="space-y-4 w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
          <BsBoxes /> Atributos
        </h3>
        <hr className="border-[var(--color-border-gray)] my-3" />

        {renderAsTable ? (
          // Renderiza TabelaAtributosNCM, ela cuidará do estado vazio
          <TabelaAtributosNCM
            atributos={currentAtributos as AtributoNCM[]}
            isLoading={false}
            error={null}
          />
        ) : (
          // Renderiza atributos legados (strings)
          <ul className="atributos-legacy-list w-full flex flex-wrap gap-2 items-baseline justify-start">
            {(currentAtributos as string[]).length > 0 ? (
              (currentAtributos as string[]).map((atributo, index) => (
                <li key={`attr-${index}`} className="atributo-legacy-tag">
                  {atributo}
                </li>
              ))
            ) : (
              // Mensagem para lista legada vazia
              <span className="text-gray-300 font-mediumflex w-full gap-1">
                Sem atributos disponíveis (formato legado)
              </span>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Atributos;
