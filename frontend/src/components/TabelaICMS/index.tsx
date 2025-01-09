import React, { useState, useEffect } from "react";
import CardRegiao from "../CardRegiao";
import { RegiaoICMS } from "./types";
import Papa from "papaparse";
import "./styles.css";

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
          regioes[regiao].estados.push({
            nome: estado,
            icms: Number(icms),
          });
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


    <div className="grid md:grid-cols-2">
      {regioesICMS.map((regiao, index) => (
        <CardRegiao key={index} regiao={regiao} />
      ))}
    </div>


  );
};

export default TabelaICMS;
