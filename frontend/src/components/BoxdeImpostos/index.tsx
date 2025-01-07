import React from "react"; // Importa a biblioteca React
import { BoxdeImpostosProps } from "./types"; // Importa o tipo BoxdeImpostosProps
import "./styles.css"; // Importa o arquivo de estilos CSS

// Define o componente funcional BoxdeImpostos que recebe as propriedades do tipo BoxdeImpostosProps
const BoxdeImpostos: React.FC<BoxdeImpostosProps> = ({ classificacao }) => {
  return (
    <div className="box-impostos">
      {" "}
      {/* Define a div principal com a classe CSS "box-impostos" */}
      <div className="grid grid-cols-2 gap-4">
        {" "}
        {/* Define um grid com 2 colunas e espaçamento de 4 */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">IPI</h4>{" "}
          {/* Título da seção IPI */}
          <div className="space-y-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="font-medium">Entrada:</span>{" "}
              {classificacao.ipi_entrada} {/* Exibe o valor de ipi_entrada */}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Saída:</span>{" "}
              {classificacao.ipi_saida} {/* Exibe o valor de ipi_saida */}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">PIS</h4>{" "}
          {/* Título da seção PIS */}
          <div className="space-y-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="font-medium">Entrada:</span>{" "}
              {classificacao.pis_entrada} {/* Exibe o valor de pis_entrada */}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Saída:</span>{" "}
              {classificacao.pis_saida} {/* Exibe o valor de pis_saida */}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">COFINS</h4>{" "}
          {/* Título da seção COFINS */}
          <div className="space-y-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="font-medium">Entrada:</span>{" "}
              {classificacao.cofins_entrada}{" "}
              {/* Exibe o valor de cofins_entrada */}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Saída:</span>{" "}
              {classificacao.cofins_saida} {/* Exibe o valor de cofins_saida */}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">CST</h4>{" "}
          {/* Título da seção CST */}
          <div className="space-y-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="font-medium">Entrada:</span>{" "}
              {classificacao.cst_entrada} {/* Exibe o valor de cst_entrada */}
            </p>
            <p className="text-gray-300">
              <span className="font-medium">Saída:</span>{" "}
              {classificacao.cst_saida} {/* Exibe o valor de cst_saida */}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        {" "}
        {/* Define uma margem superior */}
        <div className="flex space-x-4">
          {" "}
          {/* Define um layout flexível com espaçamento horizontal */}
          <div className="flex items-center">
            {" "}
            {/* Define um layout flexível centralizado verticalmente */}
            <span className="text-gray-300 font-medium mr-2">
              Monofásico:
            </span>{" "}
            {/* Texto "Monofásico:" */}
            <span
              className={`text-${
                classificacao.monofasico ? "green" : "red"
              }-500`}
            >
              {classificacao.monofasico ? "Sim" : "Não"}{" "}
              {/* Exibe "Sim" ou "Não" baseado no valor de monofasico */}
            </span>
          </div>
          <div className="flex items-center">
            {" "}
            {/* Define um layout flexível centralizado verticalmente */}
            <span className="text-gray-300 font-medium mr-2">
              Alíquota Zero:
            </span>{" "}
            {/* Texto "Alíquota Zero:" */}
            <span
              className={`text-${
                classificacao.aliquota_zero ? "green" : "red"
              }-500`}
            >
              {classificacao.aliquota_zero ? "Sim" : "Não"}{" "}
              {/* Exibe "Sim" ou "Não" baseado no valor de aliquota_zero */}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxdeImpostos; // Exporta o componente BoxdeImpostos como padrão
