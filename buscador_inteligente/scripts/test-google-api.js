#!/usr/bin/env node

/**
 * Script para testar a chave de API do Google
 * Uso: node scripts/test-google-api.js
 */

// Carregar variáveis de ambiente
require("dotenv").config();

// Verificar se a chave existe
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("❌ GOOGLE_API_KEY não encontrada no ambiente");
  console.error(
    "Por favor, adicione GOOGLE_API_KEY=seu_valor_aqui ao arquivo .env"
  );
  process.exit(1);
}

console.log("✅ GOOGLE_API_KEY encontrada no ambiente");
console.log(
  `Chave: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
);

// Tenta importar a biblioteca
try {
  console.log("🔍 Tentando importar @google/generative-ai...");
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  console.log("✅ Biblioteca importada com sucesso");

  // Inicializa o cliente
  console.log("🔄 Inicializando cliente...");
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log("✅ Cliente inicializado com sucesso");

  // Teste simples - apenas cria o modelo
  console.log("🔄 Criando modelo gemini-1.5-pro...");
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
    },
  });
  console.log("✅ Modelo criado com sucesso");

  // Tenta uma requisição simples
  console.log("🔄 Enviando uma requisição simples...");
  model
    .generateContent("Olá, mundo!")
    .then((response) => {
      console.log("✅ Requisição bem-sucedida!");
      console.log("Resposta:");
      console.log(response.response.text());
      console.log(
        "\n✅ Teste completo: A chave de API do Google está funcionando corretamente."
      );
    })
    .catch((error) => {
      console.error("❌ Erro ao fazer a requisição:");
      console.error(error);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Erro ao importar ou inicializar:");
  console.error(error);
  process.exit(1);
}
