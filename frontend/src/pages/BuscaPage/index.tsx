import React, { useState } from "react";
import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import { PiListStarFill } from "react-icons/pi";
import "./styles.css";
import { BuscaItem } from "./types";
import axiosInstance from "../../axiosConfig";
import InputSearch from "../../components/InputSearch";

const BuscaPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nex-0.3-Preview-2024"
  );

  return (
    <div className="flex flex-col container-full items-center">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={(value) => setSelectedModel(value)}
      />

      <div className="container">
      <PageHeader
          icon={<PiListStarFill />}
          title="Histórico de Consultas"
          icon_size="26px"
        />

        <div className="flex flex-col items-center">
          <InputSearch value={""} onChange={function (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
            throw new Error("Function not implemented.");
          } } />
        </div>
      </div>
    </div>
  );
};

export default BuscaPage;
