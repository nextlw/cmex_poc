import React, { useEffect } from "react";
import { DeepResearchProgressProps, DeepResearchStep } from "./types";
import "./styles.css";

const DEBUG_PROGRESS =
  process.env.NODE_ENV === "development" &&
  localStorage.getItem("DEBUG_PROGRESS") === "true";

function logProgressChange(prevProps: any, nextProps: any) {
  if (!DEBUG_PROGRESS) return;

  const changes: Record<string, { prev: any; next: any }> = {};
  let hasChanges = false;

  ["currentStepId", "currentStep", "progress", "isProcessing"].forEach(
    (prop) => {
      if (prevProps[prop] !== nextProps[prop]) {
        changes[prop] = {
          prev: prevProps[prop],
          next: nextProps[prop],
        };
        hasChanges = true;
      }
    }
  );

  if (prevProps.steps && nextProps.steps) {
    nextProps.steps.forEach((step: any, index: number) => {
      if (
        prevProps.steps[index] &&
        prevProps.steps[index].status !== step.status
      ) {
        changes[`step_${index}_status`] = {
          prev: prevProps.steps[index].status,
          next: step.status,
        };
        hasChanges = true;
      }
    });
  }

  if (hasChanges) {
    console.group(
      "%cDeepResearchProgress Changed",
      "color: #10a37f; font-weight: bold;"
    );
    console.log("Timestamp:", new Date().toISOString());
    console.log("Changes:", changes);
    console.groupEnd();
  }
}

/**
 * Componente que exibe o progresso da análise profunda
 *
 * @param props Propriedades do componente
 * @returns Componente JSX
 */
const DeepResearchProgress: React.FC<DeepResearchProgressProps> = ({
  isProcessing = true,
  progress = 0,
  currentStep = 0,
  currentStepId,
  totalSteps = 0,
  steps,
  className = "",
  onCancel,
}) => {
  // Calcula a porcentagem de progresso
  const progressPercentage =
    totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0;

  // Se currentStepId for fornecido, encontra o índice correspondente
  const activeStep = currentStepId
    ? steps.findIndex((step) => step.id === currentStepId)
    : currentStep;

  // Se não encontrar o índice, usa o currentStep
  const currentStepIndex = activeStep >= 0 ? activeStep : currentStep;

  useEffect(() => {
    if (DEBUG_PROGRESS) {
      console.log("DeepResearchProgress rendered", {
        currentStepId,
        activeStep,
        currentStepIndex,
        isProcessing,
        progress,
        totalSteps,
        steps,
      });
    }

    return () => {
      if (DEBUG_PROGRESS) {
        console.log("DeepResearchProgress unmounted");
      }
    };
  }, [
    currentStepId,
    activeStep,
    currentStepIndex,
    isProcessing,
    progress,
    totalSteps,
    steps,
  ]);

  return (
    <div
      className={`deep-research-progress ${
        isProcessing ? "active" : ""
      } ${className}`}
    >
      <div className="progress-header">
        <span className="progress-title">Análise Profunda</span>
        {totalSteps > 0 && (
          <span className="progress-percentage">{progressPercentage}%</span>
        )}
      </div>

      {totalSteps > 0 && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <div className="progress-steps">
        {steps.map((step: DeepResearchStep, index: number) => {
          // Determina a classe de status para o step atual
          const statusClass =
            index === currentStepIndex
              ? "current"
              : index < currentStepIndex
              ? "completed"
              : "waiting";

          return (
            <div
              key={step.id}
              className={`progress-step ${statusClass} ${step.status}`}
            >
              <div className="step-indicator" />
              <div className="step-content">
                <div className="step-label">{step.title}</div>
                {step.description && (
                  <div className="step-description">{step.description}</div>
                )}
                {step.status === "error" && step.errorMessage && (
                  <div className="error-message">{step.errorMessage}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isProcessing && onCancel && (
        <button className="cancel-button" onClick={onCancel} type="button">
          Cancelar análise
        </button>
      )}
    </div>
  );
};

export default DeepResearchProgress;
