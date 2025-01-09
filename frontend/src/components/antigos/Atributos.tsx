import React from "react";

interface AtributosProps {
  attributes: string[];
  tipiAttributes: string[];
  isLoading: boolean;
}

const Atributos: React.FC<AtributosProps> = ({
  attributes,
  tipiAttributes,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-gray-400 mb-2">Características Gerais</h4>
        <div className="space-y-2">
          {isLoading ? (
            <>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </>
          ) : (
            <ul className="list-disc list-inside text-gray-300">
              {attributes.map((attr, i) => (
                <li key={i}>{attr}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div>
        <h4 className="text-gray-400 mb-2">Atributos TIPI</h4>
        <div className="space-y-2">
          {isLoading ? (
            <>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </>
          ) : (
            <ul className="list-disc list-inside text-gray-300">
              {tipiAttributes.map((attr, i) => (
                <li key={i}>{attr}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Atributos;
