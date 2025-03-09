import React, { useState, useEffect } from "react";
import { Header, PageHeader } from "../../components";
import { PiListStarFill } from "react-icons/pi";
import "./styles.css";
import { HistoricoItemTratado } from "../../types";
import axiosInstance from "../../axiosConfig";
import { AxiosResponse, AxiosError } from "axios";

const HistoricoPage: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoItemTratado[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nex-0.3-Preview-2024"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    // Chama o endpoint de pesquisas
    axiosInstance
      .get("/queries")
      .then((response: AxiosResponse) => {
        console.log("GET /queries :: response ::", response);

        // Pega os dados
        if (response?.data?.data) {
          // Recupera o histórico
          const historicoBruto = response.data.data;

          // Trata os dados
          let historicoTratado = historicoBruto.map((item: any) => {
            // Monta o item
            const novoItem: HistoricoItemTratado = {
              id: item.id,
              modelo: String(item.modelo),
              criado_em: item.criado_em,
              ncm: item.resultado?.[0]?.ncm,
              descricao: item.resultado?.[0]?.descricao,
              atributos: item.resultado?.[0]?.atributos,
              atributos_tipi: item.resultado?.[0]?.atributos_tipi,
              valores_de_impostos: item.resultado?.[0]?.valores_de_impostos,
            };

            // Adiciona o item no historicoTratado
            return novoItem;
          });

          console.log("HISTÓRICO TRATADO -->", historicoTratado);

          setHistorico(historicoTratado);
        }

        // Remove o loading
        setIsLoading(false);
      })
      .catch((error: AxiosError) => {
        console.error("Error fetching histórico:", error);
        setIsLoading(false);
      });
  };

  return (
    <div
      className="flex flex-col min-h-screen w-full"
      style={{ backgroundColor: "var(--background-color-primary)" }}
    >
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={(value) => setSelectedModel(value)}
      />

      <main className="flex-1 w-full body-color p-8">
        <div className="max-w-[1400px] mx-auto">
          <PageHeader
            icon={<PiListStarFill className="stroke-thin" />}
            title="Histórico de Consultas"
            icon_size="26px"
          />

          <div className="w-full overflow-x-auto mt-6">
            <table className="box-table">
              <thead>
                <tr>
                  {/* Colunas da tabela */}
                  <th>ID</th>
                  <th>Modelo</th>
                  <th>Criado em</th>

                  {/* Coluna "resultados" */}
                  <th>Descrição</th>
                  <th>NCM</th>
                  <th>Atributos</th>
                  <th>Atributos TIPI</th>

                  {/* Coluna "valores de impostos" */}
                  <th>IPI</th>
                  <th>ICMS</th>
                  <th>PIS</th>
                  <th>COFINS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="text-center">
                      <div className="loading-spinner"></div>
                      <span style={{ color: "var(--text-color-primary)" }}>
                        Carregando histórico...
                      </span>
                    </td>
                  </tr>
                ) : historico.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center">
                      <span style={{ color: "var(--text-color-muted)" }}>
                        Nenhum registro encontrado
                      </span>
                    </td>
                  </tr>
                ) : (
                  historico.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        <span
                          className={`modelo-badge modelo-${item.modelo.toLowerCase()}`}
                        >
                          {item.modelo}
                        </span>
                      </td>
                      <td>{new Date(item.criado_em).toLocaleString()}</td>
                      <td
                        className="truncate-cell"
                        data-full-text={item.descricao}
                      >
                        {item.descricao}
                      </td>
                      <td>{item.ncm}</td>
                      <td
                        className="truncate-cell"
                        data-full-text={item.atributos?.join(", ")}
                      >
                        {item.atributos?.join(", ")}
                      </td>
                      <td
                        className="truncate-cell"
                        data-full-text={item.atributos_tipi?.join(", ")}
                      >
                        {item.atributos_tipi?.join(", ")}
                      </td>
                      <td>{item.valores_de_impostos?.ipi}</td>
                      <td>
                        {Object.entries(item.valores_de_impostos?.icms || {})
                          .map(([estado, valor]) => `${estado}: ${valor}`)
                          ?.join(", ")}
                      </td>
                      <td>{item.valores_de_impostos?.pis}</td>
                      <td>{item.valores_de_impostos?.cofins}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HistoricoPage;
