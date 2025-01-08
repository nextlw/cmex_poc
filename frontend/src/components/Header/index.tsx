import React from "react";
import Select from "../Select";
import { Modelos } from "../Select/types";
import "./styles.css";

interface HeaderProps {
  selectedModel: string | null;
  onModelChange: (value: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedModel, onModelChange }) => {
  return (
    <header className="bg-slate-800 shadow-lg h-[56px] flex items-center pb-3 mb-2">
      <div className="w-full">
        <div className="mx-auto max-w-4xl px-2">
          <div className="grid grid-cols-2 px-0">
            <h1 className="text-xl font-bold text-white pt-2.5">
              Busca Inteligente de NCM
            </h1>
            <div className="w-0 ml-auto">
              {" "}
              {/* ml-auto pushes the div to the right */}
              <Select
                style={{
                  verticalAlign: "middle",
                  width: "256px",
                  height: "36px", // Altura fixa para o Select
                  minHeight: "36px", // Garante altura mínima
                }}
                label=""
                options={Modelos}
                value={selectedModel}
                onChange={onModelChange}
                placeholder="Selecione o modelo"
                handleParentChange={() => {}}
              />
            </div>
          </div>
          <div className="w-64"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
