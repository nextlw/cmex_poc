import { analyzeSteps } from "../error-analyzer";

describe("analyzeSteps", () => {
  it("should analyze error steps", async () => {
    const { analysis } = await analyzeSteps([
      "Step 1: Search failed",
      "Step 2: Invalid query",
    ]);
    const analysisObj = JSON.parse(analysis);
    expect(analysisObj.data).toBeDefined();
    expect(analysisObj.data.think).toBeDefined();
    expect(analysisObj.data.answer).toBeDefined();
  });
});
