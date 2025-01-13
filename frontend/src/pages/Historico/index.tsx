import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import { AiOutlineHistory } from "react-icons/ai";
import "./styles.css";
import { HistoricoItem } from "./types";
import axiosInstance from "../../axiosConfig";

const HistoricoPage: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nexcode-0.1-BETA"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      console.log("Buscando histórico..."); // Debug
      const response = await axiosInstance.get("/historico");
      console.log("Resposta do histórico:", response.data); // Debug

      if (Array.isArray(response.data)) {
        setHistorico(
          response.data.sort(
            (a: HistoricoItem, b: HistoricoItem) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
      } else {
        console.error("Dados do histórico não são um array:", response.data);
        setHistorico([]);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setHistorico([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-full">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={(value) => setSelectedModel(value)}
      />

      <div className="container">
        <PageHeader
          icon={<AiOutlineHistory size={24} />}
          title="Histórico de Consultas"
        />

        <table className="box-table table-auto text-sm">
          <thead>
            <tr className="text-white">
              <th>ID</th>
              <th>Modelo</th>
              <th>NCM</th>
              <th>Descrição</th>
              <th>Atributos</th>
              <th>Atributos TIPI</th>
              <th>IPI</th>
              <th>ICMS</th>
              <th>PIS</th>
              <th>COFINS</th>
              <th>Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr className="text-white border-b border-gray-700">
                <td colSpan={11} className="px-4 py-8 text-center">
                  <div className="loading-spinner"></div>
                  Carregando histórico...
                </td>
              </tr>
            ) : historico.length === 0 ? (
              <tr className="text-white border-b border-gray-700">
                <td colSpan={11} className="px-4 py-8 text-center">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              historico.map((item) => (
                <tr
                  key={item.id}
                  className="text-white border-b border-gray-700"
                >
                  <td>{item.id}</td>
                  <td>
                    <span
                      className={`modelo-badge modelo-${item.modelo.toLowerCase()}`}
                    >
                      {item.modelo}
                    </span>
                  </td>
                  <td>{item.ncm}</td>
                  <td className="truncate-cell" data-full-text={item.descricao}>
                    {item.descricao}
                  </td>
                  <td
                    className="truncate-cell"
                    data-full-text={item.atributos.join(", ")}
                  >
                    {item.atributos.join(", ")}
                  </td>
                  <td
                    className="truncate-cell"
                    data-full-text={item.atributos_tipi.join(", ")}
                  >
                    {item.atributos_tipi.join(", ")}
                  </td>
                  <td>{item.valores_de_impostos.ipi}</td>
                  <td>
                    {Object.entries(item.valores_de_impostos.icms || {})
                      .map(([estado, valor]) => `${estado}: ${valor}`)
                      .join(", ")}
                  </td>
                  <td>{item.valores_de_impostos.pis}</td>
                  <td>{item.valores_de_impostos.cofins}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricoPage;
