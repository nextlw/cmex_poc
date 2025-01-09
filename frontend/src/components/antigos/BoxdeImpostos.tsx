import React from "react";
import { ValoresdeImpostos } from "../../types";
import { ClassificacaoTributaria } from "../../types"; // Exemplo

interface BoxdeImpostosProps {
  valoresDeImpostos?: ValoresdeImpostos;
  classificacao?: ClassificacaoTributaria;
}

/**
 * Componente que exibe as alíquotas de impostos (IPI, PIS, COFINS e ICMS).
 *
 * @remarks
 * Recebe um objeto `taxRates` com as informações necessárias para exibir cada imposto.
 * O campo `icms` é um objeto contendo alíquotas por estado. Caso não seja fornecido,
 * esse objeto é considerado vazio.
 *
 * @param {BoxdeImpostosProps} props - Props do componente.
 * @param {ValoresdeImpostos} props.ValoresdeImpostos - Objeto que contém as alíquotas de IPI, PIS, COFINS e ICMS.
 * @returns JSX.Element - O componente que exibe as alíquotas de impostos.
 */
const BoxdeImpostos: React.FC<BoxdeImpostosProps> = ({
  valoresDeImpostos,
  classificacao,
}) => {
  // Comentário: Define as alíquotas padrão para IPI, PIS e COFINS e recebe o ICMS
  const {
    icms = {},
    ipi = "0%",
    pis = "1.65%",
    cofins = "7.6%",
  } = valoresDeImpostos || {};

  return (
    <div className="space-y-6">
      {/* Comentário: Exibição das alíquotas de IPI, PIS e COFINS em cards individuais */}
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
      {valoresDeImpostos && (
        <div>
          <p>IPI: {valoresDeImpostos.ipi}</p>
          {/* ... */}
        </div>
      )}
      {classificacao && (
        <div>
          <p>IPI Entrada: {classificacao.ipi_entrada}</p>
          {/* ... */}
        </div>
      )}
    </div>
  );
};

export default BoxdeImpostos;
