import React, { useState, useEffect } from 'react';
import { AtributosProps } from './types';
import './styles.css';
import { BsBoxes } from 'react-icons/bs';
import TagAtributo from '../TagAtributo';

const Atributos: React.FC<AtributosProps> = ({
  atributos = [],
  atributos_tipi = [],
  isLoading = false,
}) => {
  const [listaAtributos, setListaAtributos] = useState<string[]>(atributos);
  const [listaAtributosTipi, setListaAtributosTipi] = useState<string[]>(atributos_tipi);

  // Atualiza os estados quando as props mudarem
  useEffect(() => {
    setListaAtributos(atributos);
    setListaAtributosTipi(atributos_tipi);
  }, [atributos, atributos_tipi]);

  const removerAtributo = (atributoRemovido: string) => {
    setListaAtributos((prevAtributos) =>
      prevAtributos.filter((atributo) => atributo !== atributoRemovido)
    );
  };

  const removerAtributoTipi = (atributoRemovido: string) => {
    setListaAtributosTipi((prevAtributos) =>
      prevAtributos.filter((atributo) => atributo !== atributoRemovido)
    );
  };

  if (isLoading) {
    return <div>Carregando atributos...</div>;
  }

  const temAtributos = listaAtributos.length > 0;
  const temAtributosTipi = listaAtributosTipi.length > 0;

  if (!temAtributos && !temAtributosTipi) {
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

      {temAtributosTipi && (
        <div>
          <h3 className="text-[var(--color-atributos-text)] text-sm pb-2">Atributos TIPI</h3>
          <ul className="atributos-item space-y-1 w-full flex flex-wrap gap-2 text-sm items-baseline justify-start">
            {listaAtributosTipi.map((atributo, index) => (
              <TagAtributo
                key={`tipi-${index}`}
                atributo={atributo}
                onRemove={removerAtributoTipi}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Atributos;
