import React from "react";
import { render } from "@testing-library/react";
import ChatMessage from "../../components/ChatMessage";

// Mock dos componentes que são utilizados dentro do ChatMessage
jest.mock("../../components/ThinkingSection", () => () => (
  <div data-testid="thinking-section">Thinking Section</div>
));
jest.mock("../../components/ModelIndicator", () => () => (
  <div data-testid="model-indicator">Model Indicator</div>
));
jest.mock("../../components/ReferencesSection", () => () => (
  <div data-testid="references-section">References Section</div>
));

describe("ChatMessage Component", () => {
  test("renders without crashing", () => {
    const { container } = render(
      <ChatMessage
        type="query"
        content="Como classificar uma bicicleta elétrica no NCM?"
        isTyping={false}
        data={undefined}
        step={1}
      />
    );

    // Teste simples apenas para documentação
    expect(container).toBeTruthy();
  });
});
