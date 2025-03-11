import { braveSearch } from "../brave-search";

describe("braveSearch", () => {
  it("should return search results", async () => {
    // Verifica se a chave da API está configurada
    if (!process.env.BRAVE_API_KEY) {
      console.warn("BRAVE_API_KEY não está configurada. O teste será pulado.");
      return;
    }

    const { response } = await braveSearch("test query");
    expect(response.web.results).toBeDefined();
    expect(response.web.results.length).toBeGreaterThan(0);
    expect(response.web.results[0]).toHaveProperty("title");
    expect(response.web.results[0]).toHaveProperty("url");
    expect(response.web.results[0]).toHaveProperty("description");
  });

  it("should handle API errors gracefully", async () => {
    // Força a remoção da chave da API para testar o tratamento de erro
    const originalKey = process.env.BRAVE_API_KEY;
    process.env.BRAVE_API_KEY = "";

    try {
      await expect(braveSearch("test query")).rejects.toThrow();
    } finally {
      // Restaura a chave original
      process.env.BRAVE_API_KEY = originalKey;
    }
  });
});
