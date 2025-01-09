import React from "react"; // Importa a biblioteca React
import { BoxdeImpostosProps } from "./types"; // Importa o tipo BoxdeImpostosProps
import "./styles.css"; // Importa o arquivo de estilos CSS
import { TbReceiptTax } from "react-icons/tb"; // Importa o ícone TbReceiptTax da biblioteca react-icons

// Define o componente funcional BoxdeImpostos que recebe as propriedades do tipo BoxdeImpostosProps
const BoxdeImpostos: React.FC<BoxdeImpostosProps> = ({ classificacao }) => {
  return (
    <div className="info-basicas">
      {" "}
      {/* Define a div principal com a classe CSS "box-impostos" */}
      <div className=" gap-4 w-full">
        {" "}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white gap-2 flex items-center w-m-fit">
            <TbReceiptTax /> Classificação Tributária
          </h3>
          <div className="flex space-x-16">
            {" "}
            {/* Define uma margem superior */}
            <div className="flex space-x-4 w-full">
              {" "}
              {/* Define um layout flexível com espaçamento horizontal */}
              <div className="flex items-center w-full">
                {" "}
                {/* Define um layout flexível centralizado verticalmente */}
                <span className="box-resultado ml-2 text-gray-300 font-medium mr-2">
                  Monofásico: {/* Texto "Monofásico:" */}
                  <span
                    className={`text-${classificacao.monofasico ? "green" : "red"
                      }-500`}
                  >
                    {classificacao.monofasico ? "Sim" : "Não"}{" "}
                    {/* Exibe "Sim" ou "Não" baseado no valor de monofasico */}
                  </span>
                </span>{" "}

              </div>
              <div className="flex items-center w-full min-w-fit">
                {" "}
                {/* Define um layout flexível centralizado verticalmente */}
                <span className="box-resultado text-gray-300 font-medium  mr-2">
                  Alíquota Zero: {/* Texto "Alíquota Zero:" */}
                  <span
                    className={`text-${classificacao.aliquota_zero ? "green" : "red"
                      }-500`}
                  >
                    {classificacao.aliquota_zero ? "Sim" : "Não"}{" "}
                    {/* Exibe "Sim" ou "Não" baseado no valor de aliquota_zero */}
                  </span>
                </span>{" "}
              </div>
            </div>
          </div>
        </div>
        <hr className="border-gray-600 my-3" />
        {/* Define um grid com 2 colunas e espaçamento de 4 */}
        <div className="">
          <h4 className="text-sm text-white ml-3 mb-2 mt-3">IPI</h4>{" "}
          {/* Título da seção IPI */}
          <div className="gap-3 grid grid-cols-2 m-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="box-resultado font-medium">Entrada: {classificacao.ipi_entrada} {/* Exibe o valor de ipi_entrada */}</span>{" "}

            </p>
            <p className="text-gray-300">
              <span className="box-resultado font-medium">Saída: {classificacao.ipi_saida} {/* Exibe o valor de ipi_saida */}</span>{" "}

            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm text-white ml-3 mb-2 mt-3">PIS</h4>{" "}
          {/* Título da seção PIS */}
          <div className="gap-3 grid grid-cols-2 m-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="box-resultado font-medium">Entrada: {classificacao.pis_entrada} {/* Exibe o valor de pis_entrada */}</span>{" "}

            </p>
            <p className="text-gray-300">
              <span className="box-resultado font-medium">Saída: {classificacao.pis_saida} {/* Exibe o valor de pis_saida */}</span>{" "}

            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm text-white ml-3 mb-2 mt-3">COFINS</h4>{" "}
          {/* Título da seção COFINS */}
          <div className="gap-3 grid grid-cols-2 m-2">
            {" "}
            {/* Define um espaço vertical entre os elementos */}
            <p className="text-gray-300">
              <span className="box-resultado font-medium">Entrada: {classificacao.cofins_entrada}{" "}
                {/* Exibe o valor de cofins_entrada */}</span>{" "}

            </p>
            <p className="text-gray-300">
              <span className="box-resultado font-medium">Saída: {classificacao.cofins_saida} {/* Exibe o valor de cofins_saida */}</span>{" "}

            </p>
          </div>
          <div>
            <h4 className="text-sm text-white ml-3 mb-2 mt-3">CST</h4>{" "}
            {/* Título da seção CST */}
            <div className="gap-3 grid grid-cols-2 m-2">
              {" "}
              {/* Define um espaço vertical entre os elementos */}
              <p className="text-gray-300">
                <span className="box-resultado font-medium">Entrada: {classificacao.cst_entrada} {/* Exibe o valor de cst_entrada */}</span>{" "}

              </p>
              <p className="text-gray-300">
                <span className="box-resultado font-medium">Saída: {classificacao.cst_saida} {/* Exibe o valor de cst_saida */}</span>{" "}

              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxdeImpostos; // Exporta o componente BoxdeImpostos como padrão
