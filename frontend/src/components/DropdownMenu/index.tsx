import React, { useState } from "react";
import "./styles.css";
import {
  DropdownMenuProps,
  stateOptions,
  operationOptions,
  regimeOptions,
  reductionOptions,
} from "./types";
import Select from "../Select";

const DropdownMenu: React.FC<DropdownMenuProps> = ({ onSelectionChange }) => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(
    null
  );
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
  const [selectedReduction, setSelectedReduction] = useState<string | null>(
    null
  );

  const handleChange = () => {
    onSelectionChange({
      estadoOrigem: selectedState,
      operacao: selectedOperation,
      regimeTributario: selectedRegime,
      reducaoOuIsencao: selectedReduction,
    });
  };

  return (
    <>
      <div>
        <div className="w-full">
          {/* <h2 className="text-md font-regular text-white">
            Selecione as opções abaixo para uma resposta mais acertiva:
          </h2> */}
        </div>
        <div className="grid grid-cols-4 gap-2 w-full">
          <Select
            label="Estado de origem do produto?"
            options={stateOptions}
            value={selectedState}
            onChange={(value) => {
              setSelectedState(value);
              handleChange();
            }}
            placeholder="Estado"
            handleParentChange={handleChange}
          />
          <Select
            label="Qual a operação do produto?"
            options={operationOptions}
            value={selectedOperation}
            onChange={(value) => {
              setSelectedOperation(value);
              handleChange();
            }}
            placeholder="Operação"
            handleParentChange={handleChange}
          />
          <Select
            label="Regime tributário da empresa?"
            options={regimeOptions}
            value={selectedRegime}
            onChange={(value) => {
              setSelectedRegime(value);
              handleChange();
            }}
            placeholder="Regime"
            handleParentChange={handleChange}
          />
          <Select
            label="Reduções ou isenções locais?"
            options={reductionOptions}
            value={selectedReduction}
            onChange={(value) => {
              setSelectedReduction(value);
              handleChange();
            }}
            placeholder="Redução ou isenções"
            handleParentChange={handleChange}
          />
        </div>
      </div>
    </>
  );
};

export default DropdownMenu;
