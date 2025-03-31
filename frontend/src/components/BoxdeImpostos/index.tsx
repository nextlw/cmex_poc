import React from "react";
import { BoxdeImpostosProps } from "./types";
import "./styles.css";
import { PiSealPercentBold } from "react-icons/pi";
import InputField from "../InputField";
import TiposTributarios from "../TiposTributarios";

const BoxdeImpostos: React.FC<BoxdeImpostosProps> = ({ classificacao }) => {
  // Se não houver classificação, mostra uma mensagem informativa
  if (!classificacao) {
    return (
      <div className="class-tributaria-title">
        <div className="col-span-12 w-full tablet-col-span-12 mobile-col-span-4 items-center">
          <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center style-root">
            <PiSealPercentBold /> Classificação Tributária
          </h3>
        </div>
        <hr className="border-gray-600 my-4" />
        <div className="grid-container-inner">
          <div className="box-tributaria col-span-12 tablet-col-span-12 mobile-col-span-4 p-4">
            <p className="text-gray-300">
              Informações tributárias não disponíveis
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Função para converter a string do tipo tributário em objeto
  const formatarTipoTributario = (tipoString?: string) => {
    if (!tipoString) return undefined;

    const [codigo, ...descricao] = tipoString.split(" - ");
    return {
      operacao: descricao.join(" - "),
      codigo: codigo,
      texto_completo: tipoString,
      justificativa: classificacao.tipo_classificacao_tributario?.justificativa,
    };
  };

  const tipoTributarioFormatado = formatarTipoTributario(
    classificacao.tipo_classificacao_tributario?.tipo_tributario_ativo
  );

  return (
    <div className="class-tributaria-title">
      <div className="col-span-12 w-full tablet-col-span-12 mobile-col-span-4 items-center">
        <h3 className="text-xl font-semibold color-gray-100 gap-2 flex items-center style-root">
          <PiSealPercentBold /> Classificação Tributária
        </h3>
      </div>
      <hr className="border-gray-600 my-4" />
      <div className="grid-container-inner">
        <div className="box-tributaria col-span-12 tablet-col-span-12 mobile-col-span-4">
          <TiposTributarios
            tipoAtivo={tipoTributarioFormatado}
            justificativa={
              classificacao.tipo_classificacao_tributario?.justificativa
            }
          />
          <div className="box-tributaria-row flex flex-row gap-4 md:flex-row mobile:flex-col">
            <div className="box-tributaria-item flex flex-col w-1/2 mobile:w-full gap-4">
              <div className="box-tributaria-row">
                <h4 className="text-sm mb-2">IPI</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.ipi_entrada)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Entrada:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.ipi_saida)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Saída:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                </div>
              </div>
              <div className="box-tributaria-item">
                <h4 className="text-sm mb-2">COFINS</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.cofins_entrada)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Entrada:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.cofins_saida)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Saída:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                </div>
              </div>
            </div>

            <div className="box-tributaria-item flex flex-col w-1/2 mobile:w-full mobile:flex-col gap-4">
              <div className="box-tributaria-row">
                <h4 className="text-sm mb-2">PIS</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.pis_entrada)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Entrada:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.pis_saida)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Saída:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                </div>
              </div>

              <div className="box-tributaria-item">
                <h4 className="text-sm mb-2">CST</h4>
                <div className="flex w-full gap-3">
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.cst_entrada)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Entrada:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
                  <span className="w-1/2 text-gray-300">
                    <InputField
                      value={String(classificacao.cst_saida)}
                      onChange={() => {}}
                      readOnly={true}
                      label="Saída:"
                      showInnerLabel={true}
                      width="100%"
                      placeholder=""
                    />
                  </span>
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
