import React, { useEffect, useState } from 'react';
import { DocsAPI, DocCategory } from '../../api/docs';
import { FiFolder } from 'react-icons/fi';

interface DocSidebarProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
}

const DocSidebar: React.FC<DocSidebarProps> = ({ selectedCategory, onCategorySelect }) => {
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const data = await DocsAPI.getAll();
        setCategories(data);
        setError(null);
        
        // Selecionar a primeira categoria automaticamente se nenhuma estiver selecionada
        if (!selectedCategory && data.length > 0) {
          onCategorySelect(data[0].name);
        }
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        setError('Não foi possível carregar as categorias.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [onCategorySelect, selectedCategory]);

  if (isLoading) {
    return (
      <div className="doc-sidebar">
        <div className="flex justify-center items-center h-full">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-sidebar">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="doc-sidebar">
      <h2>Documentação</h2>
      
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.id} className="doc-section">
            <div 
              className={`doc-item flex items-center gap-2 ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => onCategorySelect(category.name)}
            >
              <FiFolder size={16} />
              <span>{category.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocSidebar; 