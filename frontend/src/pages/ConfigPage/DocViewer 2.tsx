import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IoIosArrowBack } from 'react-icons/io';
import { DocsAPI } from '../../api/docs';

interface DocViewerProps {
  filePath: string;
  onBack: () => void;
}

const DocViewer: React.FC<DocViewerProps> = ({ filePath, onBack }) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const data = await DocsAPI.getFileContent(filePath);
        setContent(data);
        setError(null);
        
        // Extrair título do conteúdo Markdown (primeira linha h1) ou usar o nome do arquivo
        const titleMatch = data.match(/^#\s+(.*?)$/m);
        if (titleMatch && titleMatch[1]) {
          setTitle(titleMatch[1]);
        } else {
          setTitle(getFileTitle());
        }
      } catch (err) {
        console.error('Erro ao carregar documento:', err);
        setError('Não foi possível carregar o documento.');
        setTitle(getFileTitle());
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [filePath]);

  // Extrair título do documento baseado no nome do arquivo
  const getFileTitle = () => {
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    return fileName
      .replace('.md', '')
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Manipulador de links para garantir que links relativos funcionem corretamente
  const handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    href: string
  ) => {
    // Se for link interno/âncora, deixa o comportamento padrão
    if (href.startsWith('#')) {
      return;
    }
    
    // Se for link relativo sem protocolo e não começando com /, assume que é outro arquivo MD
    if (!href.match(/^(https?:\/\/|\/|#)/)) {
      event.preventDefault();
      // TODO: Implementar navegação para outro arquivo Markdown
      console.log('Link para outro documento:', href);
    }
    
    // Links externos e absolutos mantêm o comportamento padrão
  };

  return (
    <div className="doc-viewer">
      <div className="doc-viewer-header">
        <button className="doc-viewer-back" onClick={onBack}>
          <IoIosArrowBack size={16} />
          <span>Voltar</span>
        </button>
        <h1 className="doc-viewer-title">{title}</h1>
      </div>

      <div className="doc-viewer-content">
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="loader"></div>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown
              components={{
                h1: (props) => <h1 className="doc-h1" {...props} />,
                h2: (props) => <h2 className="doc-h2" {...props} />,
                h3: (props) => <h3 className="doc-h3" {...props} />,
                h4: (props) => <h4 className="doc-h4" {...props} />,
                h5: (props) => <h5 className="doc-h5" {...props} />,
                h6: (props) => <h6 className="doc-h6" {...props} />,
                p: (props) => <p className="doc-p" {...props} />,
                blockquote: (props) => <blockquote className="doc-blockquote" {...props} />,
                ul: (props) => <ul className="doc-ul" {...props} />,
                ol: (props) => <ol className="doc-ol" {...props} />,
                li: (props) => <li className="doc-li" {...props} />,
                table: (props) => <table className="doc-table" {...props} />,
                thead: (props) => <thead className="doc-thead" {...props} />,
                tbody: (props) => <tbody className="doc-tbody" {...props} />,
                tr: (props) => <tr className="doc-tr" {...props} />,
                th: (props) => <th className="doc-th" {...props} />,
                td: (props) => <td className="doc-td" {...props} />,
                pre: (props) => <pre className="doc-pre" {...props} />,
                code: (props) => <code className="doc-code" {...props} />,
                em: (props) => <em className="doc-em" {...props} />,
                strong: (props) => <strong className="doc-strong" {...props} />,
                hr: (props) => <hr className="doc-hr" {...props} />,
                a: ({node, ...props}) => (
                  <a 
                    className="doc-link" 
                    target={props.href?.startsWith('http') ? '_blank' : undefined}
                    rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={(e) => handleLinkClick(e, props.href || '')}
                    {...props} 
                  />
                )
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocViewer; 