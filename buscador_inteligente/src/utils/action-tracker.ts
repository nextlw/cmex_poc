import { EventEmitter } from "events";
import { StepAction } from "../types/globalTypes";

interface ActionState {
  thisStep: StepAction;
  gaps: string[];
  badAttempts: number;
  totalStep: number;
}

/**
 * Rastreador de ações.
 */
export class ActionTracker extends EventEmitter {
  constructor(public options: { requestId: string }) {
    super();
  }

  /**
   * Estado da ação.
   */
  private state: ActionState = {
    // Passo atual.
    thisStep: { action: "answer", answer: "", references: [], think: "" },
    // Gaps.
    gaps: [],
    // Tentativas erradas.
    badAttempts: 0,
    // Passo total.
    totalStep: 0,
  };

  /**
   * Rastreia uma ação.
   * @param newState Novo estado da ação.
   */
  trackAction(newState: Partial<ActionState>) {
    // Atualiza o estado.
    this.state = { ...this.state, ...newState };
    // Emite o evento de ação.
    this.emit("action", this.state);
  }

  trackThink(think: string) {
    // only update the think field of the current state
    this.state = { ...this.state, thisStep: { ...this.state.thisStep, think } };
    this.emit("action", this.state.thisStep);
  }

  trackBadAttempt(attempt: {
    step: StepAction;
    evaluation: string;
    recap: string;
    blame: string;
    improvement: string;
  }) {
    this.state.badAttempts++;
    this.emit("bad-attempt", attempt);
  }

  /**
   * Obtém o estado atual.
   * @returns Estado atual.
   */
  getState(): ActionState {
    // Retorna o estado.
    return { ...this.state };
  }

  /**
   * Reseta o rastreador de ações.
   */
  reset() {
    // Reseta o estado.
    this.state = {
      // Passo atual.
      thisStep: { action: "answer", answer: "", references: [], think: "" },
      // Gaps.
      gaps: [],
      // Tentativas erradas.
      badAttempts: 0,
      // Passo total.
      totalStep: 0,
    };
  }
}
