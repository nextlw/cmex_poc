import React, { useState } from "react";
import Header from "../../components/Header";
import PageHeader from "../../components/PageHeader";
import { PiListStarFill } from "react-icons/pi";
import "./styles.css";
import SearchResults from "../../components/SearchResults";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";

const BuscaPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nex-0.3-Preview-2024"
  );
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());


  const handleSearch = async () => {
    if (!search) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://api-comexstat.mdic.gov.br/tables/nbm?search=${search}&language=pt&page=1&perPage=50&add=ncm`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data && data.data && Array.isArray(data.data.list)) {
        const formattedResults = data.data.list.map((item: any) => ({
          noNCM: item.noNCM || '',
          unit: item.unit || '',
          nbm: item.nbm || '',
          coNbm: item.coNbm || '',
          coNcm: item.coNcm || '',
          url: `https://portalunico.siscomex.gov.br/classif/#/sumario?perfil=publico&ncm=${item.coNcm}`
        }));
        
        setResults(formattedResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col container-full items-center">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={(value) => setSelectedModel(value)}
      />

      <div className="container max-w-7xl">
        <PageHeader
          icon={<PiListStarFill />}
          title="Busca de Produtos importados"
          icon_size="26px"
        />

        <div className="flex flex-col items-center max-w-7xl w-full">
          <div className="flex gap-4 mb-8 w-full max-w-7xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Digite o nome do produto..."
              className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="flex gap-2">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholderText="Data Inicial"
                locale={ptBR}
              />
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                className="p-2 border border-gray-600 rounded-md bg-gray-800 text-white w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholderText="Data Final"
                locale={ptBR}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-300"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          <div className="w-full">
            <SearchResults results={results} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuscaPage;
