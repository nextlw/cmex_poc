import React from 'react';

interface SearchResult {
  noNCM: string;
  unit: string;
  nbm: string;
  coNbm: string;
  coNcm: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading }) => {
  if (isLoading) {
    return <div className="text-center text-gray-300">Carregando...</div>;
  }

  if (results.length === 0) {
    return <div className="text-center text-gray-400">Nenhum resultado encontrado</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="min-w-full bg-gray-800">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome NCM</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unidade</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">NBM</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Código NBM</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Código NCM</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {results.map((result, index) => (
            <tr key={index} className="hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-normal text-gray-300">{result.noNCM || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{result.unit || '-'}</td>
              <td className="px-6 py-4 whitespace-normal text-gray-300">{result.nbm || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{result.coNbm || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{result.coNcm || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SearchResults; 