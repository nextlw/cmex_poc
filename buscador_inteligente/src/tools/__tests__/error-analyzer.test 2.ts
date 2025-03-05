import { analyzeSteps } from '../error-analyzer';

describe('analyzeSteps', () => {
  it('should analyze error steps', async () => {
    const { analysis } = await analyzeSteps(['Step 1: Search failed', 'Step 2: Invalid query']);
    const response = JSON.parse(analysis);
    expect(response.data).toHaveProperty('think');
    expect(response.data).toHaveProperty('answer');
  });
});
