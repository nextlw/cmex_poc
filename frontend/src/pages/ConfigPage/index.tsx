import React, { useState } from "react";
import { Header, PageHeader } from "../../components";
import { RiSettings4Fill } from "react-icons/ri";
import DocList from "./DocList";
import DocViewer from "./DocViewer";
import DocSidebar from "./DocSidebar";
import Breadcrumb from "./Breadcrumb";
import { useTheme } from "../../contexts/ThemeContext";
import "./styles.css";

const ConfigPage: React.FC = () => {
  const { theme } = useTheme();
  const [selectedModel, setSelectedModel] = useState<string | null>(
    "Nex-0.5-Preview-2025"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDocPath, setSelectedDocPath] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState([
    { label: "Configurações", path: "/configuracoes" },
  ]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedDocPath(null);
    setBreadcrumbs([
      { label: "Configurações", path: "/configuracoes" },
      { label: category, path: "/configuracoes" },
    ]);
  };

  const handleDocSelect = (path: string) => {
    setSelectedDocPath(path);
    // Extrair título do documento para atualizar o breadcrumb
    const pathParts = path.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const docTitle = fileName.replace(".md", "").replace(/_/g, " ");

    setBreadcrumbs([
      { label: "Configurações", path: "/configuracoes" },
      { label: selectedCategory || "", path: "/configuracoes" },
      { label: docTitle, path: `/configuracoes/doc/${path}` },
    ]);
  };

  const handleBackToList = () => {
    setSelectedDocPath(null);
    // Restaurar breadcrumb para a categoria
    if (selectedCategory) {
      setBreadcrumbs([
        { label: "Configurações", path: "/configuracoes" },
        { label: selectedCategory, path: "/configuracoes" },
      ]);
    }
  };

  return (
    <div className="config-page">
      <Header
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        modeloSelecionado={selectedModel}
        aoMudarModelo={setSelectedModel}
      />

      <div className="config-layout">
        <aside className="config-sidebar">
          <DocSidebar
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </aside>

        <main className="config-main">
          <div className="config-header">
            <PageHeader
              icon={<RiSettings4Fill />}
              title="Configurações e Documentação"
              icon_size={24}
            />

            <Breadcrumb items={breadcrumbs} />
          </div>

          <div className="config-content">
            {selectedDocPath ? (
              <DocViewer filePath={selectedDocPath} onBack={handleBackToList} />
            ) : (
              selectedCategory && (
                <DocList
                  selectedCategory={selectedCategory}
                  onDocSelect={handleDocSelect}
                />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConfigPage;
