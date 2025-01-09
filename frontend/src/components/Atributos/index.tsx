import React from "react";
import { AtributosProps } from "./types";
import "./styles.css";

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
    return <div>Sem atributos disponíveis</div>;
  }

  return (
    <div className="space-y-4">
      {temAtributos && (
        <div>
          <h3 className="text-gray-400 text-sm pb-2">Atributos</h3>
          <ul className="list-disc list-inside text-gray-100 text-sm">
            {atributos.map((atributo, index) => (
              <li key={`attr-${index}`}>{atributo}</li>
            ))}
          </ul>
        </div>
      )}

      {temAtributosTipi && (
        <div>
          <h3 className="text-gray-400 text-sm pb-2">Atributos TIPI</h3>
          <ul className="list-disc list-inside text-gray-100 text-sm">
            {atributos_tipi.map((atributo, index) => (
              <li key={`tipi-${index}`}>{atributo}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Atributos;
