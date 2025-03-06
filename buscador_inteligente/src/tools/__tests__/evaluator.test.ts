import { evaluateAnswer } from "../evaluator";
import { TokenTracker } from "../../utils/token-tracker";
import { ActionTracker } from "../../utils/action-tracker";

describe("evaluateAnswer", () => {
  it("should evaluate answer definitiveness", async () => {
    const tokenTracker = new TokenTracker();
    const actionTracker = new ActionTracker({ requestId: "test-request" });
    const trackers: [TokenTracker, ActionTracker] = [
      tokenTracker,
      actionTracker,
    ];

    const { response } = await evaluateAnswer(
      "What is TypeScript?",
      {
        action: "answer",
        answer:
          "TypeScript is a strongly typed programming language that builds on JavaScript.",
        references: [],
        think: "This is a definitive answer about TypeScript",
      },
      { types: ["definitive"], languageStyle: "technical" },
      trackers
    );

    expect(response).toHaveProperty("pass");
    expect(response).toHaveProperty("think");
  });
});
