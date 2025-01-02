import React, { useState, useEffect } from "react";
import { RegiaoICMS } from "../types";
import CardRegiao from "./CardRegiao";
import Papa from "papaparse";

const useCarregarDadosICMS = (): RegiaoICMS[] => {
  const [regioesICMS, setRegioesICMS] = useState<RegiaoICMS[]>([]);

  useEffect(() => {
    Papa.parse("/icms.csv", {
      download: true,
      header: true,
      complete: (result) => {
        const data = result.data as any[];
        const regioes: { [key: string]: RegiaoICMS } = {};

        data.forEach((row) => {
          const { regiao, estado, icms } = row;
          if (!regioes[regiao]) {
            regioes[regiao] = { nome: regiao, estados: [] };
          }
          regioes[regiao].estados.push({ nome: estado, icms });
        });

        setRegioesICMS(Object.values(regioes));
      },
    });
  }, []);

  return regioesICMS;
};

const TabelaICMS: React.FC = () => {
  const regioesICMS = useCarregarDadosICMS();

  return (
    <div className="mt-4">
      <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {regioesICMS.map((regiao, index) => (
            <CardRegiao key={index} regiao={regiao} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabelaICMS;
