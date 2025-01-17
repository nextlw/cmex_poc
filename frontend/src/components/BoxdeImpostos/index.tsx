import React from "react";
import { BoxdeImpostosProps } from "./types";
import "./styles.css";
import { PiSealPercentBold } from "react-icons/pi";
import InputField from "../InputField";

const BoxdeImpostos: React.FC<BoxdeImpostosProps> = ({ classificacao }) => {
  return (
    <div className="class-tributaria-title">
      <div className="flex items-center w-full">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center">
        <PiSealPercentBold /> Classificação Tributária
        </h3>
      </div>
      <hr className="border-gray-600 my-4" />
      <div className="grid-container-inner">
        <div className="box-tributaria col-span-12 tablet-col-span-12 mobile-col-span-4">
          <div className="box-tributaria-row flex flex-row gap-4 md:flex-row mobile:flex-col">
            <div className="box-tributaria-item flex flex-col w-1/2 mobile:w-full gap-4">
              <span className="box-tributaria-item box-resultado text-gray-300 font-medium flex w-full gap-1">
                Monofásico:
                <span
                  className={`text-${
                    classificacao.monofasico ? "green" : "red"
                  }-500 ml-1`}
                >
                  {classificacao.monofasico ? "Sim" : "Não"}
                </span>
              </span>

              <div className="box-tributaria-row">
                <h4 className="text-sm mb-2">IPI</h4>
                <div className="flex w-full gap-3">
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.ipi_entrada)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.ipi_saida)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                </div>
              </div>

              <div className="box-tributaria-item">
                <h4 className="text-sm mb-2">COFINS</h4>
                <div className="flex w-full gap-3">
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.cofins_entrada)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.cofins_saida)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                </div>
              </div>
            </div>

            <div className="box-tributaria-item flex flex-col w-1/2 mobile:w-full gap-4">
              <span className="box-resultado text-gray-300 font-medium flex w-full gap-1">
                Alíquota Zero:
                <span
                  className={`text-${
                    classificacao.aliquota_zero ? "green" : "red"
                  }-500 ml-1`}
                >
                  {classificacao.aliquota_zero ? "Sim" : "Não"}
                </span>
              </span>

              <div className="box-tributaria-row">
                <h4 className="text-sm mb-2">PIS</h4>
                <div className="flex w-full gap-3">
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.pis_entrada)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.pis_saida)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                </div>
              </div>

              <div className="box-tributaria-item" >
                <h4 className="text-sm mb-2">CST</h4>
                <div className="flex w-full gap-3">
                  <p className="w-1/2 text-gray-300">
                  <InputField
                    value={String(classificacao.cst_entrada)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                  <p className="w-1/2 text-gray-300">
                    <InputField
                    value={String(classificacao.cst_saida)}
                    onChange={() => {}}
                    readOnly={true}
                    label="Saída:"
                    showInnerLabel={true}
                    width="100%"
                    placeholder=""
                  />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxdeImpostos;
