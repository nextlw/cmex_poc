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
      <div>
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
          <BsBoxes /> Atributos
        </h3>
        <hr className="border-gray-600 my-3" />
        Sem atributos disponíveis
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {temAtributos && (
        <div>
          <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
            <BsBoxes /> Atributos
          </h3>
          <hr className="border-[var(--color-border-gray)] my-3" />
          <ul className="flex flex-wrap gap-2 text-[var(--color-text-gray-100)] text-sm items-start justify-start">
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
          <h3 className="text-[var(--color-text-gray-400)] text-sm pb-2">Atributos TIPI</h3>
          <ul className="flex flex-wrap gap-2 text-[var(--color-text-gray-100)] text-sm items-start justify-start">
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
