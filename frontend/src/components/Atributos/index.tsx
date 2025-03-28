import React, { useState, useEffect } from "react";
import { AtributosProps } from "./types";
import "./styles.css";
import { BsBoxes } from "react-icons/bs";
import TagAtributo from "../TagAtributo";

const Atributos: React.FC<AtributosProps> = ({
  atributos = null,
  isLoading = false,
}) => {
  const [listaAtributos, setListaAtributos] = useState<string[]>(
    atributos || []
  );

  // Atualiza os estados quando as props mudarem
  useEffect(() => {
    setListaAtributos(atributos || []);
  }, [atributos]);

  const removerAtributo = (atributoRemovido: string) => {
    setListaAtributos((prevAtributos) =>
      prevAtributos.filter((atributo) => atributo !== atributoRemovido)
    );
  };

  if (isLoading) {
    return (
      <div className="box-atributos-container h-full w-full">
        <div className="flex items-center w-full">
          <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
            <BsBoxes /> Atributos
          </h3>
        </div>
        <hr className="border-gray-600 my-3" />
        <div className="flex w-full">
          <span className="text-gray-300 font-mediumflex w-full gap-1">
            Carregando atributos...
          </span>
        </div>
      </div>
    );
  }

  const temAtributos = listaAtributos.length > 0;

  if (!temAtributos) {
    return (
      <div className="box-atributos-container h-full w-full">
        <div className="flex items-center w-full">
          <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
            <BsBoxes /> Atributos
          </h3>
        </div>
        <hr className="border-gray-600 my-3" />
        <div className="flex w-full">
          <span className="text-gray-300 font-mediumflex w-full gap-1">
            Sem atributos disponíveis
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="box-atributos-container space-y-2 h-full w-full">
      {temAtributos && (
        <div className="space-y-4 w-full">
          <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
            <BsBoxes /> Atributos
          </h3>
          <hr className="border-[var(--color-border-gray)] my-3" />
          <ul className="atributos-item space-y-1 w-full flex flex-wrap gap-2 items-baseline justify-start">
            {listaAtributos.map((atributo, index) => (
              <TagAtributo
                key={`attr-${index}`}
                atributo={atributo}
                onRemove={removerAtributo}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Atributos;
