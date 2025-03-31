import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageGroup from "../components/MessageGroup";
import { groupMessages } from "../pages/ChatPage/utils";
import { ChatMessageProps } from "../components/ChatMessage/types";

describe("MessageGroup", () => {
  const mockMessages: ChatMessageProps[] = [
    {
      type: "query",
      content: "Olá, como posso ajudar?",
      isTyping: false,
    },
    {
      type: "thinking",
      content: "Processando sua pergunta...",
      isTyping: false,
      data: {
        think: "Analisando a pergunta...",
      },
    },
    {
      type: "answer",
      content: "Aqui está a resposta",
      isTyping: false,
      data: {
        answer: "Resposta completa",
      },
    },
    {
      type: "progress",
      content: "Analisando a consulta...",
      isTyping: false,
      data: {
        think: "Processando informações",
      },
    },
    {
      type: "progress",
      content: "Buscando referências...",
      isTyping: false,
      data: {
        think: "Pesquisando dados",
      },
    },
  ];

  it("deve agrupar mensagens corretamente por tipo", () => {
    const groups = groupMessages(mockMessages);

    expect(groups).toHaveLength(5);
    expect(groups[0].type).toBe("user");
    expect(groups[1].type).toBe("thinking");
    expect(groups[2].type).toBe("answer");
    expect(groups[3].type).toBe("progress");
    expect(groups[4].type).toBe("progress");
  });

  it("deve renderizar o grupo de mensagens do usuário com estilo correto", () => {
    const userMessages: ChatMessageProps[] = [
      {
        type: "query",
        content: "Pergunta do usuário",
        isTyping: false,
      },
    ];

    render(
      <MessageGroup
        messages={userMessages}
        groupType="user"
        title="Mensagem do Usuário"
      />
    );

    const messageGroup = screen.getByTestId("message-group");
    expect(messageGroup).toHaveClass("message-group user");
  });

  it("deve expandir/colapsar o conteúdo ao clicar no cabeçalho", () => {
    render(
      <MessageGroup
        messages={mockMessages}
        groupType="thinking"
        title="Pensando..."
        isCollapsible={true}
      />
    );

    const header = screen.getByTestId("message-group-header");
    const content = screen.getByTestId("message-group-content");

    // Inicialmente não expandido
    expect(content).not.toHaveClass("expanded");

    // Clica no cabeçalho
    fireEvent.click(header);
    expect(content).toHaveClass("expanded");

    // Clica novamente para colapsar
    fireEvent.click(header);
    expect(content).not.toHaveClass("expanded");
  });

  it("deve mostrar o contador de mensagens corretamente", () => {
    const multipleMessages: ChatMessageProps[] = [
      { type: "thinking", content: "Pensamento 1", isTyping: false },
      { type: "thinking", content: "Pensamento 2", isTyping: false },
    ];

    render(
      <MessageGroup
        messages={multipleMessages}
        groupType="thinking"
        title="Pensamentos"
      />
    );

    const counter = screen.getByTestId("message-count");
    expect(counter).toHaveTextContent("2");
  });

  it("deve renderizar o grupo de mensagens de progresso corretamente", () => {
    render(
      <MessageGroup
        messages={mockMessages}
        groupType="progress"
        title="Progresso da Pesquisa"
      />
    );

    // Verificar se o título está presente
    expect(screen.getByText("Progresso da Pesquisa")).toBeInTheDocument();

    // Verificar se as mensagens foram renderizadas
    expect(screen.getByText("Analisando a consulta...")).toBeInTheDocument();
    expect(screen.getByText("Buscando referências...")).toBeInTheDocument();

    // Verificar se o grupo tem a classe correta
    const messageGroup = screen.getByTestId("message-group");
    expect(messageGroup).toHaveClass("message-group progress");
  });

  it("deve expandir/colapsar o conteúdo quando isCollapsible=true", () => {
    render(
      <MessageGroup
        messages={mockMessages}
        groupType="progress"
        title="Progresso"
        isCollapsible={true}
      />
    );

    const header = screen.getByTestId("message-group-header");
    const content = screen.getByTestId("message-group-content");

    // Inicialmente não expandido
    expect(content).not.toHaveClass("expanded");

    // Clica no cabeçalho para expandir
    fireEvent.click(header);
    expect(content).toHaveClass("expanded");

    // Clica novamente para colapsar
    fireEvent.click(header);
    expect(content).not.toHaveClass("expanded");
  });

  it("deve mostrar o contador de mensagens", () => {
    render(
      <MessageGroup
        messages={mockMessages}
        groupType="progress"
        title="Progresso"
      />
    );

    const counter = screen.getByTestId("message-count");
    expect(counter).toHaveTextContent("2");
  });

  it("deve renderizar com estado inicial expandido quando initialExpanded=true", () => {
    render(
      <MessageGroup
        messages={mockMessages}
        groupType="progress"
        title="Progresso"
        isCollapsible={true}
        initialExpanded={true}
      />
    );

    const content = screen.getByTestId("message-group-content");
    expect(content).toHaveClass("expanded");
  });
});
