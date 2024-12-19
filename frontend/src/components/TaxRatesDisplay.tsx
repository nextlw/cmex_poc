import React from "react";
import { TaxRates } from "../types";

interface TaxRatesDisplayProps {
  taxRates: TaxRates;
}

const TaxRatesDisplay: React.FC<TaxRatesDisplayProps> = ({ taxRates }) => {
  // Garantindo que temos um objeto ICMS válido
  const {
    icms = {},
    ipi = "0%",
    pis = "1.65%",
    cofins = "7.6%",
  } = taxRates || {};

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">IPI</p>
          <p className="text-white text-lg font-semibold">{ipi}</p>
        </div>
        <div className="flex-1 bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">PIS</p>
          <p className="text-white text-lg font-semibold">{pis}</p>
        </div>
        <div className="flex-1 bg-gray-700/50 p-3 rounded-lg">
          <p className="text-gray-400 text-sm">COFINS</p>
          <p className="text-white text-lg font-semibold">{cofins}</p>
        </div>
      </div>

      <div>
        <h4 className="text-gray-400 mb-2">ICMS por Estado</h4>
        <div className="bg-gray-700/50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
          {Object.entries(icms).length > 0 ? (
            <table className="w-full">
              <thead className="text-gray-400 text-sm sticky top-0 bg-gray-700/50">
                <tr>
                  <th className="text-left pb-2">Estado</th>
                  <th className="text-right pb-2">Alíquota</th>
                </tr>
              </thead>
              <tbody className="text-white text-sm">
                {Object.entries(icms).map(([state, rate]) => (
                  <tr key={state} className="border-t border-gray-600/50">
                    <td className="py-1.5">{state}</td>
                    <td className="text-right">{rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-400 py-4">
              Nenhuma alíquota de ICMS encontrada
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxRatesDisplay;
