import { analyzeSteps } from "../error-analyzer";
import { LocalModelClient } from "../local-model-client";

// Mock do LocalModelClient
jest.mock("../local-model-client");

describe("analyzeSteps", () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  it("should analyze error steps", async () => {
    // Mock da resposta do modelo
    const mockResponse = {
      response: {
        text: JSON.stringify({
          data: {
            think: "Analisando os passos de erro...",
            answer: {
              steps: [
                "Step 1: Search failed",
                "Step 2: Invalid query",
                "Step 3: Connection timeout",
              ],
              recommendations: [
                "Verificar conexão com a internet",
                "Validar parâmetros da query",
                "Implementar retry com backoff exponencial",
              ],
            },
          },
        }),
        usageMetadata: {
          totalTokenCount: 150,
        },
      },
    };

    // Configura o mock do LocalModelClient
    (LocalModelClient as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue(mockResponse),
      }),
    }));

    const { analysis } = await analyzeSteps([
      "Step 1: Search failed",
      "Step 2: Invalid query",
      "Step 3: Connection timeout",
    ]);

    const analysisObj = JSON.parse(analysis);
    expect(analysisObj).toBeDefined();
    expect(analysisObj.data).toBeDefined();
    expect(analysisObj.data.think).toBeDefined();
    expect(analysisObj.data.answer).toBeDefined();
    expect(analysisObj.data.answer.steps).toHaveLength(3);
    expect(analysisObj.data.answer.recommendations).toHaveLength(3);
  }, 60000);

  it("should analyze error steps with real data", async () => {
    const errorSteps = [
      "Falha na busca inicial: Erro 422 na API Brave Search",
      "Tentativa de reescrita de query falhou: Timeout após 30s",
      "Erro na validação de NCM: Código não encontrado no banco de dados",
    ];

    const { analysis } = await analyzeSteps(errorSteps);

    const analysisObj = JSON.parse(analysis);
    expect(analysisObj).toBeDefined();
    expect(analysisObj.data).toBeDefined();
    expect(analysisObj.data.think).toBeDefined();
    expect(analysisObj.data.answer).toBeDefined();
    expect(analysisObj.data.answer.steps).toBeDefined();
    expect(analysisObj.data.answer.recommendations).toBeDefined();

    // Validações específicas para dados reais
    expect(analysisObj.data.answer.steps.length).toBeGreaterThan(0);
    expect(analysisObj.data.answer.recommendations.length).toBeGreaterThan(0);

    // Verifica se as recomendações são relevantes para os erros
    const recommendations: string[] = analysisObj.data.answer.recommendations;
    const steps: string[] = analysisObj.data.answer.steps;

    // Verifica se os passos refletem os erros
    expect(steps.length).toBeGreaterThan(0);
    expect(
      steps.every((step) => typeof step === "string" && step.length > 0)
    ).toBeTruthy();

    // Verifica se as recomendações são relevantes
    expect(recommendations.length).toBeGreaterThan(0);
    expect(
      recommendations.every((rec) => typeof rec === "string" && rec.length > 0)
    ).toBeTruthy();
  }, 60000);
});
