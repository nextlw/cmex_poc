import React from "react";

interface ClassificacaoTributaria {
  monofasico: boolean;
  aliquota_zero: boolean;
  ipi_entrada: string;
  ipi_saida: string;
  pis_entrada: string;
  pis_saida: string;
  cofins_entrada: string;
  cofins_saida: string;
  cst_entrada: string;
  cst_saida: string;
}

interface CardSituacaoProps {
  classificacao: ClassificacaoTributaria;
}

const CardSituacao: React.FC<CardSituacaoProps> = ({ classificacao }) => {
  return (
    <div className="bg-gray-800/50 rounded p-4">
      <p className="text-white">
        Monofásico: {classificacao.monofasico ? "Sim" : "Não"}
      </p>
      <p className="text-white">
        Alíquota Zero: {classificacao.aliquota_zero ? "Sim" : "Não"}
      </p>
      <p className="text-white">
        IPI (Entrada/Saída): {classificacao.ipi_entrada} /{" "}
        {classificacao.ipi_saida}
      </p>
      <p className="text-white">
        PIS (Entrada/Saída): {classificacao.pis_entrada} /{" "}
        {classificacao.pis_saida}
      </p>
      <p className="text-white">
        COFINS (Entrada/Saída): {classificacao.cofins_entrada} /{" "}
        {classificacao.cofins_saida}
      </p>
      <p className="text-white">
        CST (Entrada/Saída): {classificacao.cst_entrada} /{" "}
        {classificacao.cst_saida}
      </p>
    </div>
  );
};

export default CardSituacao;
