import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Tipos para documentação
export interface DocFile {
  id: string;
  title: string;
  path: string;
  preview: string;
  section: string;
  category: string;
}

export interface DocSection {
  title: string;
  files: DocFile[];
}

export interface DocCategory {
  id: string;
  name: string;
  sections: {
    name: string;
    files: DocFile[];
  }[];
}

export interface DocContent {
  content: string;
  error?: string;
}

// Caminho base para os documentos
const BASE_PATH = "/buscador_inteligente/docs";

// Estrutura das categorias e documentos baseada nos arquivos reais
const docCategories: DocCategory[] = [
  {
    id: uuidv4(),
    name: "Buscador Inteligente",
    sections: [
      {
        name: "Documentação Geral",
        files: [
          {
            id: uuidv4(),
            title: "README",
            path: `${BASE_PATH}/README.md`,
            preview: "Documentação principal do Buscador Inteligente",
            section: "Documentação Geral",
            category: "Buscador Inteligente",
          },
          {
            id: uuidv4(),
            title: "Implementação",
            path: `${BASE_PATH}/IMPLEMENTACAO.md`,
            preview: "Detalhes sobre a implementação do buscador inteligente",
            section: "Documentação Geral",
            category: "Buscador Inteligente",
          },
          {
            id: uuidv4(),
            title: "Documentação",
            path: `${BASE_PATH}/DOCS.md`,
            preview: "Informações sobre a documentação do projeto",
            section: "Documentação Geral",
            category: "Buscador Inteligente",
          },
        ],
      },
      {
        name: "Arquitetura e Modelos",
        files: [
          {
            id: uuidv4(),
            title: "Backend CMEX",
            path: `${BASE_PATH}/CMEX Backend (Buscador Inteligente).md`,
            preview: "Detalhes sobre a arquitetura do backend do CMEX",
            section: "Arquitetura e Modelos",
            category: "Buscador Inteligente",
          },
          {
            id: uuidv4(),
            title: "Modelos de IA",
            path: `${BASE_PATH}/MODELOS_IA.md`,
            preview: "Informações sobre os modelos de IA utilizados",
            section: "Arquitetura e Modelos",
            category: "Buscador Inteligente",
          },
          {
            id: uuidv4(),
            title: "Evolução do Projeto",
            path: `${BASE_PATH}/EVOLUCAO_PROJETO.md`,
            preview: "História e evolução do projeto ao longo do tempo",
            section: "Arquitetura e Modelos",
            category: "Buscador Inteligente",
          },
        ],
      },
      {
        name: "APIs e Integrações",
        files: [
          {
            id: uuidv4(),
            title: "API de Logs",
            path: `${BASE_PATH}/API_LOGS.md`,
            preview: "Documentação da API de logs do sistema",
            section: "APIs e Integrações",
            category: "Buscador Inteligente",
          },
        ],
      },
      {
        name: "Mapeamento de Tipos",
        files: [
          {
            id: uuidv4(),
            title: "Mapeamento de Tipos",
            path: `${BASE_PATH}/mapeamento-tipos.md`,
            preview: "Documentação sobre o mapeamento de tipos no sistema",
            section: "Mapeamento de Tipos",
            category: "Buscador Inteligente",
          },
          {
            id: uuidv4(),
            title: "Transformações de Tipos",
            path: `${BASE_PATH}/transformacoes-tipos.md`,
            preview: "Informações sobre transformações de tipos no sistema",
            section: "Mapeamento de Tipos",
            category: "Buscador Inteligente",
          },
        ],
      },
    ],
  },
  {
    id: uuidv4(),
    name: "Frontend",
    sections: [
      {
        name: "Documentação Geral",
        files: [
          {
            id: uuidv4(),
            title: "README Frontend",
            path: `${BASE_PATH}/frontend-README.md`,
            preview: "Documentação principal do Frontend",
            section: "Documentação Geral",
            category: "Frontend",
          },
          {
            id: uuidv4(),
            title: "Documentação Frontend",
            path: `${BASE_PATH}/frontend-DOCS.md`,
            preview: "Documentação detalhada do Frontend",
            section: "Documentação Geral",
            category: "Frontend",
          },
        ],
      },
      {
        name: "Autenticação",
        files: [
          {
            id: uuidv4(),
            title: "Arquitetura de Autenticação",
            path: `${BASE_PATH}/frontend-auth-architecture.md`,
            preview: "Documentação sobre a arquitetura de autenticação",
            section: "Autenticação",
            category: "Frontend",
          },
        ],
      },
      {
        name: "Utilitários",
        files: [
          {
            id: uuidv4(),
            title: "Transformadores",
            path: `${BASE_PATH}/frontend-utils-transformers-README.md`,
            preview: "Documentação sobre os transformadores",
            section: "Utilitários",
            category: "Frontend",
          },
          {
            id: uuidv4(),
            title: "Transformações de Tipos",
            path: `${BASE_PATH}/frontend-utils-transformers-transformacoes-tipos.md`,
            preview: "Documentação sobre transformações de tipos no frontend",
            section: "Utilitários",
            category: "Frontend",
          },
        ],
      },
    ],
  },
  {
    id: uuidv4(),
    name: "Shared Types",
    sections: [
      {
        name: "Documentação Geral",
        files: [
          {
            id: uuidv4(),
            title: "README Shared Types",
            path: `${BASE_PATH}/shared-types-README.md`,
            preview: "Documentação principal dos tipos compartilhados",
            section: "Documentação Geral",
            category: "Shared Types",
          },
          {
            id: uuidv4(),
            title: "Implementação",
            path: `${BASE_PATH}/shared-types-IMPLEMENTACAO.md`,
            preview: "Detalhes sobre a implementação dos tipos compartilhados",
            section: "Documentação Geral",
            category: "Shared Types",
          },
        ],
      },
      {
        name: "Exemplos",
        files: [
          {
            id: uuidv4(),
            title: "Exemplos de Uso",
            path: `${BASE_PATH}/shared-types-examples-README.md`,
            preview: "Exemplos de uso dos tipos compartilhados",
            section: "Exemplos",
            category: "Shared Types",
          },
        ],
      },
    ],
  },
];

// API para gerenciar os documentos
export const DocsAPI = {
  /**
   * Retorna todas as categorias de documentos e seus arquivos
   */
  getAll: () => {
    return Promise.resolve(docCategories);
  },

  /**
   * Retorna o conteúdo de um arquivo de documentação pelo caminho
   * Garante que o conteúdo Markdown seja retornado na íntegra e formatado corretamente
   * @param filePath Caminho do arquivo a ser carregado
   */
  getFileContent: async (filePath: string): Promise<string> => {
    try {
      // Normaliza o caminho para garantir que comece com /
      const cleanPath = !filePath.startsWith("/") ? `/${filePath}` : filePath;

      console.log("Carregando documento:", cleanPath);

      // Buscando o arquivo como texto puro para preservar a formatação Markdown
      const response = await axios.get(cleanPath, {
        transformResponse: [(data) => data], // Preserva o texto original sem transformação
        responseType: "text", // Garante que o retorno seja texto e não JSON
        headers: {
          "Cache-Control": "no-cache", // Evita cache para obter sempre a versão mais recente
          Pragma: "no-cache",
        },
      });

      // Verifica se o conteúdo é válido
      if (!response.data || response.data.trim() === "") {
        throw new Error("Documento vazio ou inválido");
      }

      return response.data;
    } catch (error) {
      console.error("Erro ao carregar o arquivo:", filePath, error);
      return `# Erro ao carregar o documento\n\nNão foi possível carregar o documento solicitado: ${filePath}.\n\nPor favor, verifique se o caminho está correto e tente novamente.\n\nDetalhes do erro: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`;
    }
  },
};
