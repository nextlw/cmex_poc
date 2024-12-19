import React from "react";
import { TaxRates } from "../types";

interface TaxRatesDisplayProps {
  taxRates: TaxRates;
}

const TaxRatesDisplay: React.FC<TaxRatesDisplayProps> = ({ taxRates }) => {
  const { icms, ipi, pis, cofins } = taxRates;

  return (
    <div className="space-y-6 h-full">
      {/* IPI, PIS e COFINS */}
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

      {/* ICMS por estado */}
      <div className="flex-1">
        <h4 className="text-gray-400 mb-2">ICMS por Estado</h4>
        <div
          className="bg-gray-700/50 p-0 px-2 rounded-lg overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 900px)", minHeight: "200px" }}
        >
          <table className="w-full">
            <thead className="text-gray-400 text-sm">
              <tr>
                <th className="text-left p-3 sticky top-0 bg-gray-700 z-10">
                  Estado
                </th>
                <th className="text-right p-2 sticky top-0 bg-gray-700 z-10">
                  Alíquota
                </th>
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
        </div>
      </div>
    </div>
  );
};

export default TaxRatesDisplay;
