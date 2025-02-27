import React, { useEffect, useState } from 'react';
import { DocsAPI, DocFile } from '../../api/docs';
import { FiFileText } from 'react-icons/fi';

interface DocListProps {
  selectedCategory: string;
  onDocSelect: (path: string) => void;
}

const DocList: React.FC<DocListProps> = ({ selectedCategory, onDocSelect }) => {
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      setIsLoading(true);
      try {
        const categories = await DocsAPI.getAll();
        const category = categories.find(cat => cat.name === selectedCategory);
        
        if (category) {
          // Extrair todos os arquivos de todas as seções da categoria
          const files = category.sections.flatMap(section => 
            section.files.map(file => ({
              ...file,
              section: section.name
            }))
          );
          setDocFiles(files);
        } else {
          setDocFiles([]);
        }
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar documentos:', err);
        setError('Não foi possível carregar a lista de documentos.');
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedCategory) {
      fetchDocs();
    }
  }, [selectedCategory]);

  // Agrupar documentos por seção
  const docsBySection = docFiles.reduce((acc, doc) => {
    if (!acc[doc.section]) {
      acc[doc.section] = [];
    }
    acc[doc.section].push(doc);
    return acc;
  }, {} as Record<string, DocFile[]>);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (docFiles.length === 0) {
    return (
      <div className="text-center py-8">
        <p>Nenhum documento encontrado para esta categoria.</p>
      </div>
    );
  }

  return (
    <div className="doc-list-container">
      <h2 className="text-xl font-semibold mb-6">Documentos de {selectedCategory}</h2>
      
      {Object.entries(docsBySection).map(([section, docs]) => (
        <div key={section} className="doc-section-container mb-8">
          <h3 className="text-lg font-medium mb-4">{section}</h3>
          <div className="doc-list">
            {docs.map(doc => (
              <div 
                key={doc.id} 
                className="doc-card"
                onClick={() => onDocSelect(doc.path)}
              >
                <div className="doc-card-header">
                  <div className="flex items-center gap-2">
                    <FiFileText size={18} />
                    <h4 className="doc-card-title">{doc.title}</h4>
                  </div>
                </div>
                <div className="doc-card-body">
                  <p className="doc-card-description">{doc.preview}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocList; 