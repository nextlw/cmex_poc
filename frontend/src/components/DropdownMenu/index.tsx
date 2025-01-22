import React, { useState } from "react";
import "./styles.css";
import {
  DropdownMenuProps,
  stateOptions,
  operationOptions,
  regimeOptions,
} from "./types";
import Select from "../Select";

const DropdownMenu: React.FC<DropdownMenuProps> = ({ onSelectionChange }) => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
  const handleChange = () => {
    onSelectionChange({
      estadoOrigem: selectedState,
      operacao: selectedOperation,
      regimeTributario: selectedRegime,
    });
  };

  return (
    <div className="dropdown-menu">
      <div className="dropdown-menu-row">
        <div className="dropdown-menu-item">
          <Select
            label="Origem do produto"
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
        
        <div className="dropdown-menu-item">
          <Select
            label="Operação do produto"
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
        
        <div className="dropdown-menu-item">
          <Select
            label="Regime tributário"
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
      </div>
    </div>
  );
};

export default DropdownMenu;
