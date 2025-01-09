import React from "react";
import { AtributosProps } from "./types";
import "./styles.css";
import { BsBoxes } from "react-icons/bs";
import { TbSitemap } from "react-icons/tb";
import { IoClose } from "react-icons/io5";


/**
 * Componente para exibir os atributos de um produto.
 * @param {{ atributos: string[], atributos_tipi: string[], isLoading: boolean }} props
 * @prop {string[]} atributos - Atributos do produto.
 * @prop {string[]} atributos_tipi - Atributos TIPI do produto.
 * @prop {boolean} isLoading - Indica se o componente está carregando os dados.
 * @returns {JSX.Element}
 */
const Atributos: React.FC<AtributosProps> = ({
  atributos = [],
  atributos_tipi = [],
  isLoading = false,
}) => {
  if (isLoading) {
    return <div>Carregando atributos...</div>;
  }

  const temAtributos = atributos.length > 0;
  const temAtributosTipi = atributos_tipi.length > 0;

  if (!temAtributos && !temAtributosTipi) {
    return <div><h3 className="text-xl font-semibold text-white mb-2 gap-2 flex items-center">
    <BsBoxes /> Atributos
  </h3>
  <hr className="border-gray-600 my-3" />Sem atributos disponíveis</div>;
  }

  return (
    <div className="space-y-4">
      {temAtributos && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-2 gap-2 flex items-center">
          <BsBoxes /> Atributos
      </h3>
      <hr className="border-gray-600 my-3" />
          <ul className="flex flex-wrap gap-2 text-gray-100 text-sm items-start justify-start">
            {atributos.map((atributo, index) => (
              <li key={`attr-${index}`} className="item-atributos flex items-center gap-2 list-none w-fit px-2 py-1"><TbSitemap /> {atributo} <IoClose /></li>
            ))}
          </ul>
        </div>
      )}

      {temAtributosTipi && (
        <div>
          <h3 className="text-gray-400 text-sm pb-2">Atributos TIPI</h3>
          <ul className="flex flex-wrap gap-2 text-gray-100 text-sm items-start justify-start">
            {atributos_tipi.map((atributo, index) => (
              <li key={`tipi-${index}`} className="item-atributos flex items-center gap-2 list-none w-fit px-2 py-1"><TbSitemap /> {atributo} <IoClose /></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Atributos;
