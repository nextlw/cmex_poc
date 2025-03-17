import { jinaSearch } from "../jinaSearch";
import { SearchResponse } from "../../types/globalTypes";

describe("jinaSearch", () => {
  it("should return search results", async () => {
    const result = await jinaSearch("test query");
    expect(result).toBeDefined();
    expect(result.response).toBeDefined();
    expect(result.response.data).toBeDefined();
    expect(result.response.data).not.toBeNull();
    expect(Array.isArray(result.response.data)).toBe(true);
    expect(result.response.data?.length).toBeGreaterThan(0);
    expect(result.response.data?.[0]).toHaveProperty("title");
    expect(result.response.data?.[0]).toHaveProperty("url");
    expect(result.response.data?.[0]).toHaveProperty("description");
    expect(result.tokens).toBeGreaterThan(0);
  });

  it("should handle empty query", async () => {
    await expect(jinaSearch("")).rejects.toThrow("Query cannot be empty");
  });
});
