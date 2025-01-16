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
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
  const [selectedReduction, setSelectedReduction] = useState<string | null>(null);

  const handleChange = () => {
    onSelectionChange({
      estadoOrigem: selectedState,
      operacao: selectedOperation,
      regimeTributario: selectedRegime,
      reducaoOuIsencao: selectedReduction,
    });
  };

  return (
    <div className="dropdown-menu">
      <div className="grid-container-inner">
        <div className="col-span-3 tablet-col-span-3 mobile-col-span-4">
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
        </div>
        <div className="col-span-3 tablet-col-span-3 mobile-col-span-4">
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
        </div>
        <div className="col-span-3 tablet-col-span-3 mobile-col-span-4">
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
        </div>
        <div className="col-span-3 tablet-col-span-3 mobile-col-span-4">
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
    </div>
  );
};

export default DropdownMenu;
