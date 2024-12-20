import React, { useMemo } from "react";
import {
  TaxCardProps,
  TaxType,
  TaxCalculationResult,
} from "../../types/search";
import { calculateTaxRate, getTaxRateMetadata } from "../../utils/taxRules";

// Uso do componente TaxCard
const TaxCard: React.FC<TaxCardProps> = ({
  label,
  ncm,
  attributes = [],
  tipiAttributes = [],
  taxType,
  value, // Adicione esta linha
  className = "",
}) => {
  // Usando useMemo para evitar recálculos desnecessários
  const { calculatedRate, metadata } = useMemo(() => {
    if (value) {
      // Usar value explícito se fornecido
      return {
        calculatedRate: value,
        metadata: getTaxRateMetadata(ncm, taxType, [...attributes]),
      };
    }

    try {
      const result = calculateTaxRate(
        ncm,
        taxType,
        [...attributes], // Convertendo para array mutável
        [...tipiAttributes] // Convertendo para array mutável
      );
      const meta = getTaxRateMetadata(
        ncm,
        taxType,
        [...attributes] // Convertendo para array mutável
      );
      return { calculatedRate: result, metadata: meta };
    } catch (error) {
      console.error(`Erro ao calcular alíquota para ${taxType}:`, error);
      return {
        calculatedRate: "0%",
        metadata: {
          baseRule: "Erro no cálculo",
          exceptions: [],
          legalBase: "Não foi possível determinar",
        },
      };
    }
  }, [ncm, taxType, attributes, tipiAttributes, value]);

  const isZero = calculatedRate === "0%";
  const hasExceptions = metadata.exceptions.length > 0;

  return (
    <div
      className={`
        flex-1 bg-gray-700/50 p-4 rounded-lg 
        ${isZero ? "border-l-4 border-green-500" : ""} 
        ${className}
      `}
    >
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          {hasExceptions && (
            <span className="text-yellow-400 text-xs">
              ⚠️ Exceções aplicadas
            </span>
          )}
        </div>
        <p
          className={`text-2xl font-semibold ${
            isZero ? "text-green-400" : "text-white"
          }`}
        >
          {calculatedRate}
        </p>
        {isZero && (
          <span className="text-xs text-green-400 mt-1">Alíquota Zero</span>
        )}
      </div>

      {/* Tooltip aprimorado com mais informações */}
      <div className="group relative">
        <div className="h-1 w-full mt-3 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 opacity-50" />
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-80 p-3 bg-gray-800 rounded-lg text-xs shadow-lg z-10">
          <div className="space-y-2">
            <div>
              <p className="font-medium text-white">Base Legal</p>
              <p className="text-gray-300">{metadata.legalBase}</p>
            </div>

            <div>
              <p className="font-medium text-white">Regra Base</p>
              <p className="text-gray-300">{metadata.baseRule}</p>
            </div>

            {hasExceptions && (
              <div>
                <p className="font-medium text-white">Exceções Aplicadas</p>
                <ul className="list-disc list-inside text-gray-300 mt-1">
                  {metadata.exceptions.map((exception, index) => (
                    <li key={index}>{exception}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                NCM: {ncm} | Última atualização:{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCard;
