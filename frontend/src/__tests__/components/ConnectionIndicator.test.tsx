import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ConnectionIndicator from "../../components/ConnectionIndicator";
import { ConnectionStatus } from "../../utils/sseClient";

describe("ConnectionIndicator Component", () => {
  test('renderiza corretamente no estado "connected"', () => {
    render(<ConnectionIndicator status="connected" showText={true} />);

    // Verifica se o texto correto está presente
    expect(screen.getByText("Conectado")).toBeInTheDocument();

    // Verifica se o componente tem a classe correta
    expect(screen.getByTestId("connection-indicator")).toHaveClass("connected");

    // Verifica se o dot está presente e tem a classe correta
    const dot = screen.getByTestId("connection-dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("connected");
  });

  test('renderiza corretamente no estado "connecting"', () => {
    render(<ConnectionIndicator status="connecting" showText={true} />);

    // Verifica se o texto correto está presente
    expect(screen.getByText("Conectando...")).toBeInTheDocument();

    // Verifica se o componente tem a classe correta
    expect(screen.getByTestId("connection-indicator")).toHaveClass(
      "connecting"
    );
  });

  test('renderiza corretamente no estado "disconnected"', () => {
    render(<ConnectionIndicator status="disconnected" showText={true} />);

    expect(screen.getByText("Desconectado")).toBeInTheDocument();
    expect(screen.getByTestId("connection-indicator")).toHaveClass(
      "disconnected"
    );
  });

  test('renderiza corretamente no estado "error"', () => {
    const errorMessage = "Falha na conexão";
    render(
      <ConnectionIndicator
        status="error"
        lastError={errorMessage}
        showText={true}
      />
    );

    expect(screen.getByText("Erro")).toBeInTheDocument();
    expect(screen.getByTestId("connection-indicator")).toHaveClass("error");

    // Verifica se o tooltip contém a mensagem de erro
    const indicator = screen.getByTestId("connection-indicator");
    expect(indicator).toHaveAttribute(
      "title",
      expect.stringContaining(errorMessage)
    );
  });

  test("renderiza apenas o dot quando showText é false", () => {
    render(<ConnectionIndicator status="connected" showText={false} />);

    // Verifica se o dot está presente
    expect(screen.getByTestId("connection-dot")).toBeInTheDocument();

    // Verifica se o texto não está presente
    expect(screen.queryByTestId("connection-text")).not.toBeInTheDocument();
  });

  test("renderiza com texto quando showText é true", () => {
    render(<ConnectionIndicator status="connected" showText={true} />);

    // Verifica se o dot está presente
    expect(screen.getByTestId("connection-dot")).toBeInTheDocument();

    // Verifica se o texto está presente
    expect(screen.getByTestId("connection-text")).toBeInTheDocument();
  });

  test("renderiza com showText=false por padrão", () => {
    render(<ConnectionIndicator status="connected" />);

    // Verifica se o dot está presente
    expect(screen.getByTestId("connection-dot")).toBeInTheDocument();

    // Verifica se o texto não está presente
    expect(screen.queryByTestId("connection-text")).not.toBeInTheDocument();
  });
});
