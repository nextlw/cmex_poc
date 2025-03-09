// Arquivo barrel para exportar todos os componentes
// Isso permite importar componentes diretamente de "src/components"

// Componentes de UI básicos
export { default as InputAi } from "./InputAi";
export { default as InputField } from "./InputField";
export { default as DropdownMenu } from "./DropdownMenu";

// Componentes de layout e estrutura
export { default as Header } from "./Header";
export { default as PageHeader } from "./PageHeader";

// Componentes de informação NCM
export { default as BoxdeImpostos } from "./BoxdeImpostos";
export { default as TabelaICMS } from "./TabelaICMS";
export { default as InfoBasicas } from "./InfoBasicas";
export { default as Atributos } from "./Atributos";

// Componentes relacionados ao DeepResearch
export { default as DeepResearchToggle } from "./DeepResearchToggle";
export { default as DeepResearchSidebar } from "./DeepResearchSidebar";
export { default as DeepResearchStatus } from "./DeepResearchStatus";

// Componentes de formulário
export { default as NCMConsultaForm } from "./NCMConsultaForm";

// Componentes de exibição de dados
export { default as ReasoningBox } from "./ReasoningBox";
export { default as QueryHistory } from "./QueryHistory";
export { default as SearchResults } from "./SearchResults";

// Exportação de tipos (opcional)
export * from "./InputAi/types";
export * from "./DeepResearchToggle/types";
export * from "./DeepResearchSidebar/types";
export * from "./DeepResearchStatus/types";
export * from "./DropdownMenu/types";
export * from "./NCMConsultaForm/types";
export * from "./ReasoningBox/types";
