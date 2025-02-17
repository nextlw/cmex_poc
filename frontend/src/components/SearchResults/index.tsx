import React from 'react';
import './styles.css';

interface SearchResult {
  noNCM: string;
  unit: string;
  nbm: string;
  coNbm: string;
  coNcm: string;
  url?: string; // URL opcional para referência
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

const formatLink = (text: string, url?: string): React.ReactNode => {
  if (!url) return text;
  
  return (
    <div className="message-link-title">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300"
      >
        {text}
      </a>
    </div>
  );
};

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
              <td className="px-6 py-4 whitespace-normal text-gray-300">
                {formatLink(result.noNCM || '-', result.url)}
              </td>
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