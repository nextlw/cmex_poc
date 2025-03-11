import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatMessage from "../../components/ChatMessage";
import { Reference } from "../../components/ReferencesSection/types";

// Mock dos componentes que são utilizados dentro do ChatMessage
jest.mock("../../components/ThinkingSection", () => {
  return {
    __esModule: true,
    default: ({ content, isExpanded, onToggle, modelName }: any) => (
      <div data-testid="thinking-section">
        <span>Pensamento do modelo: {content}</span>
        <span>Expandido: {isExpanded ? "Sim" : "Não"}</span>
        <span>Modelo: {modelName}</span>
        <button onClick={onToggle}>Toggle</button>
      </div>
    ),
  };
});

jest.mock("../../components/ModelIndicator", () => {
  return {
    __esModule: true,
    default: ({ modelName, size }: any) => (
      <div data-testid="model-indicator">
        Modelo: {modelName}, Tamanho: {size}
      </div>
    ),
  };
});

jest.mock("../../components/ReferencesSection", () => {
  return {
    __esModule: true,
    default: ({ references, isExpanded, onToggle }: any) => (
      <div data-testid="references-section">
        <span>Referências: {references.length}</span>
        <span>Expandido: {isExpanded ? "Sim" : "Não"}</span>
        <button onClick={onToggle}>Toggle</button>
      </div>
    ),
  };
});

describe("ChatMessage Component", () => {
  // Teste para mensagem de consulta (query)
  test("renderiza mensagem de consulta corretamente", () => {
    render(
      <ChatMessage
        type="query"
        content="Como classificar uma bicicleta elétrica no NCM?"
        isTyping={false}
        data={undefined}
        step={1}
      />
    );

    expect(
      screen.getByText("Como classificar uma bicicleta elétrica no NCM?")
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveClass("chat-message query");
  });

  // Teste para mensagem de resposta (response)
  test("renderiza mensagem de resposta com modelo e referências", () => {
    const mockReferences: Reference[] = [
      {
        url: "https://example.com/1",
        title: "Referência 1",
        exactQuote: "Citação exata",
        content: "Conteúdo da referência",
      },
    ];

    render(
      <ChatMessage
        type="response"
        content="Bicicletas elétricas são classificadas no NCM 8711.60.00"
        isTyping={false}
        data={{
          think: "Analisando a classificação de bicicletas elétricas...",
          references: mockReferences,
        }}
        step={2}
        modelName="claude-3-opus-20240229"
      />
    );

    // Verificar se a resposta foi renderizada
    expect(
      screen.getByText(
        "Bicicletas elétricas são classificadas no NCM 8711.60.00"
      )
    ).toBeInTheDocument();

    // Verificar se o ModelIndicator foi renderizado
    expect(screen.getByTestId("model-indicator")).toBeInTheDocument();

    // Verificar se o ThinkingSection foi renderizado
    expect(screen.getByTestId("thinking-section")).toBeInTheDocument();

    // Verificar se as referências foram renderizadas
    expect(screen.getByTestId("references-section")).toBeInTheDocument();
  });

  // Teste para mensagem em estado de "typing"
  test("renderiza o indicador de digitação quando isTyping=true", () => {
    render(
      <ChatMessage
        type="response"
        content="Carregando resposta..."
        isTyping={true}
        data={undefined}
        step={3}
      />
    );

    // Verificar se a classe "typing" foi adicionada
    expect(screen.getByRole("article")).toHaveClass("typing");

    // Verificar se o indicador de digitação está visível
    expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();
  });

  // Teste para mensagem de pesquisa (search)
  test("renderiza mensagem de pesquisa com URLs", () => {
    render(
      <ChatMessage
        type="search"
        content="Procurando informações..."
        isTyping={false}
        data={{
          searchQuery: "bicicleta elétrica NCM",
          urls: ["https://example.com/1", "https://example.com/2"],
        }}
        step={4}
      />
    );

    // Verificar se a mensagem de pesquisa foi renderizada
    expect(screen.getByText("Procurando informações...")).toBeInTheDocument();

    // Verificar se a query de pesquisa está visível
    expect(screen.getByText("bicicleta elétrica NCM")).toBeInTheDocument();

    // Verificar se as URLs estão visíveis
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  // Teste para mensagem de erro
  test("renderiza mensagem de erro corretamente", () => {
    render(
      <ChatMessage
        type="error"
        content="Ocorreu um erro durante a busca"
        isTyping={false}
        data={undefined}
        step={5}
      />
    );

    expect(
      screen.getByText("Ocorreu um erro durante a busca")
    ).toBeInTheDocument();
    expect(screen.getByRole("article")).toHaveClass("error");
  });
});
