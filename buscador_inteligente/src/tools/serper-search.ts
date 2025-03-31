import axios from "axios";
import { SearchResponse, SERPQuery } from "../types";

// Defina a chave API localmente (ou obtenha de outro lugar)
const SERPER_API_KEY = process.env.SERPER_API_KEY || "";

export async function serperSearch(
  query: SERPQuery
): Promise<{ response: SearchResponse }> {
  const response = await axios.post<SearchResponse>(
    "https://google.serper.dev/search",
    {
      ...query,
      autocorrect: false,
    },
    {
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `Serper search failed: ${response.status} ${response.statusText}`
    );
  }

  // Maintain the same return structure as the original code
  return { response: response.data };
}

export async function serperSearchOld(
  query: string
): Promise<{ response: SearchResponse }> {
  const response = await axios.post<SearchResponse>(
    "https://google.serper.dev/search",
    {
      q: query,
      autocorrect: false,
    },
    {
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `Serper search failed: ${response.status} ${response.statusText}`
    );
  }

  // Maintain the same return structure as the original code
  return { response: response.data };
}
