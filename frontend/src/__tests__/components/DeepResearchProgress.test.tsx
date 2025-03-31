import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import DeepResearchProgress from "../../components/DeepResearchProgress";
import { DeepResearchStep } from "../../components/DeepResearchProgress/types";

describe("DeepResearchProgress Component", () => {
  const mockSteps: DeepResearchStep[] = [
    { id: "step1", title: "Análise da consulta", status: "completed" },
    { id: "step2", title: "Pesquisa de fontes", status: "processing" },
    { id: "step3", title: "Formulação da resposta", status: "pending" },
  ];

  test("renderiza corretamente os passos da pesquisa", () => {
    render(
      <DeepResearchProgress
        steps={mockSteps}
        totalSteps={3}
        currentStepId="step2"
      />
    );

    // Verificar se o título está presente
    expect(screen.getByText("Progresso da Pesquisa")).toBeInTheDocument();

    // Verificar se todos os passos estão sendo renderizados
    expect(screen.getByText("Análise da consulta")).toBeInTheDocument();
    expect(screen.getByText("Pesquisa de fontes")).toBeInTheDocument();
    expect(screen.getByText("Formulação da resposta")).toBeInTheDocument();

    // Verificar se os passos têm o status correto
    const steps = screen.getAllByRole("listitem");
    expect(steps[0]).toHaveClass("completed");
    expect(steps[1]).toHaveClass("processing");
    expect(steps[2]).toHaveClass("pending");
  });

  test("não renderiza nada quando totalSteps é zero", () => {
    const { container } = render(
      <DeepResearchProgress steps={[]} totalSteps={0} />
    );

    // Usar getByTestId em vez de acessar diretamente o DOM
    expect(
      screen.queryByTestId("deep-research-progress")
    ).not.toBeInTheDocument();
  });

  test("renderiza corretamente quando currentStepId não é fornecido", () => {
    render(<DeepResearchProgress steps={mockSteps} totalSteps={3} />);

    // Verificar se o componente ainda renderiza corretamente
    expect(screen.getByText("Progresso da Pesquisa")).toBeInTheDocument();

    // O primeiro passo deve estar em progresso por padrão
    const steps = screen.getAllByRole("listitem");
    expect(steps[0]).toHaveClass("processing");
  });

  test("renderiza corretamente com um único passo", () => {
    const singleStep: DeepResearchStep[] = [
      { id: "step1", title: "Pesquisa completa", status: "completed" },
    ];

    render(
      <DeepResearchProgress
        steps={singleStep}
        totalSteps={1}
        currentStepId="step1"
      />
    );

    // Verificar se o título está presente
    expect(screen.getByText("Progresso da Pesquisa")).toBeInTheDocument();

    // Verificar se o único passo está sendo renderizado
    expect(screen.getByText("Pesquisa completa")).toBeInTheDocument();

    // Verificar se o passo tem o status correto
    const step = screen.getByRole("listitem");
    expect(step).toHaveClass("completed");
  });
});
