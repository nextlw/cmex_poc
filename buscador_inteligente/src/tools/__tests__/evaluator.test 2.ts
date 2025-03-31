import { TokenTracker } from "../../utils/token-tracker";
import { evaluateAnswer } from "../evaluator";
import { ActionTracker } from "../../utils/action-tracker";
import {
  AnswerAction,
  EvaluationCriteria,
  EvaluationType,
} from "../../types/globalTypes";

describe("evaluateAnswer", () => {
  it("should evaluate answer definitiveness", async () => {
    const tokenTracker = new TokenTracker();
    const actionTracker = new ActionTracker({ requestId: "test-request" });

    const evaluationCriteria: EvaluationCriteria = {
      types: ["definitive" as EvaluationType],
      languageStyle: "plain English",
    };

    const answerAction: AnswerAction = {
      action: "answer",
      think: "This is a clear definition of TypeScript",
      answer:
        "TypeScript is a strongly typed programming language that builds on JavaScript.",
      references: [],
    };

    const { response } = await evaluateAnswer(
      "What is TypeScript?",
      answerAction,
      evaluationCriteria,
      [tokenTracker, actionTracker]
    );

    expect(response).toHaveProperty("pass");
    expect(response).toHaveProperty("think");
  });
});
