import dotenv from "dotenv";
import path from "path";

// Carregar variáveis de ambiente
dotenv.config();

const environment = process.env.NODE_ENV || "development";
const isProduction = environment === "production";

export default {
  environment,
  isProduction,

  ai: {
    localModel: {
      path: process.env.LOCAL_MODEL_PATH || path.join(process.cwd(), "models"),
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4",
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "2048", 10),
    },
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      model: process.env.AZURE_OPENAI_MODEL,
      temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE || "0.7"),
      maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS || "2048", 10),
    },
  },

  search: {
    googleApiKey: process.env.GOOGLE_SEARCH_API_KEY,
    googleEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
  },
};
