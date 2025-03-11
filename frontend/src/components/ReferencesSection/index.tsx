import React, { useMemo } from "react";
import { ReferencesSectionProps, Reference } from "./types";
import "./styles.css";

/**
 * Agrupa referências por domínio
 * @param references Array de referências
 * @returns Objeto com referências agrupadas por domínio
 */
const groupReferencesByDomain = (
  references: Reference[]
): Record<string, Reference[]> => {
  return references.reduce<Record<string, Reference[]>>((acc, ref) => {
    try {
      const domain = new URL(ref.url).hostname;
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(ref);
      return acc;
    } catch (error) {
      // Em caso de URL inválida, agrupa em "Outros"
      const domain = "Outros";
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(ref);
      return acc;
    }
  }, {});
};

/**
 * Componente que exibe referências agrupadas por domínio
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const ReferencesSection: React.FC<ReferencesSectionProps> = ({
  references,
  isExpanded,
  onToggle,
  title = "Mostrar fontes",
}) => {
  // Agrupa as referências por domínio
  const groupedReferences = useMemo(
    () => groupReferencesByDomain(references || []),
    [references]
  );

  // Não renderiza se não houver referências
  if (!references || references.length === 0) return null;

  return (
    <div className="references-section">
      <div className="references-header" onClick={onToggle}>
        <span className="references-title">
          {isExpanded ? "Ocultar fontes" : title}
        </span>
        <span className="references-count">
          {references.length} {references.length === 1 ? "fonte" : "fontes"}
        </span>
        <span
          className={`references-toggle-icon ${isExpanded ? "expanded" : ""}`}
        >
          {isExpanded ? "▼" : "►"}
        </span>
      </div>

      <div className={`references-content ${isExpanded ? "expanded" : ""}`}>
        {Object.entries(groupedReferences).map(([domain, refs]) => (
          <div key={domain} className="reference-group">
            <div className="reference-domain">{domain}</div>
            {refs.map((ref, index) => (
              <div key={index}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="reference-link"
                >
                  {ref.title || new URL(ref.url).pathname || ref.url}
                </a>
                {ref.exactQuote && (
                  <div className="reference-quote">{ref.exactQuote}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferencesSection;
