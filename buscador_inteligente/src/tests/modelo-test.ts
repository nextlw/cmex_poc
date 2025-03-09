import { ConsultaProduto } from "../types/ncm";
import {
  TokenTracker,
  DeepResearch,
  DeepResearchGemini,
  modelFactory,
} from "./modules/simplified-deepresearch";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Carregar variáveis de ambiente
dotenv.config();

// Verificar a chave de API do Google
function verificarChaveAPI(): boolean {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("❌ GOOGLE_API_KEY não encontrada no ambiente.");
    console.error(
      "Por favor, adicione GOOGLE_API_KEY=seu_valor_aqui ao arquivo .env"
    );
    return false;
  }

  console.log("✅ GOOGLE_API_KEY encontrada no ambiente!");
  console.log(
    `Chave: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
  );
  return true;
}

// Produto de teste
const testProduct = {
  name: "Camisa Polo",
  description:
    "Camisa polo masculina 100% algodão, manga curta, com 3 botões frontais e logotipo bordado.",
  expectedNCM: "6105.10.00",
};

// Função para testar o modelo Gemini
async function testarModeloGemini() {
  console.log(
    `\n🧪 Testando modelo Gemini com produto: "${testProduct.description}"\n`
  );

  const tokenTracker = new TokenTracker();

  // Criar uma consulta com base no produto
  const consulta: ConsultaProduto = {
    consulta: testProduct.description,
    estadoOrigem: "SP",
    operacao: "venda",
    regimeTributario: "simples",
    tributacao: "normal",
    modelo: "gemini-1.5-pro",
    useDeepResearch: true,
  };

  try {
    // Criar a instância do modelo
    const modelo = new DeepResearchGemini(tokenTracker, null, consulta);

    // Iniciando o teste
    console.log("📊 Iniciando análise...");
    const startTime = Date.now();

    // Executar a análise
    const result = await modelo.analisar();

    // Calculando o tempo de resposta
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    // Verificar se o NCM retornado corresponde ao esperado
    const resultNcm = result.ncm_code || "";
    const expectedNcm = testProduct.expectedNCM;
    const isCorrect =
      resultNcm.replace(/[^\d]/g, "") === expectedNcm.replace(/[^\d]/g, "");

    console.log("\n📋 Resultado do teste:");
    console.log(`NCM Esperado: ${expectedNcm}`);
    console.log(`NCM Obtido: ${resultNcm}`);
    console.log(`Correto: ${isCorrect ? "✅ Sim" : "❌ Não"}`);
    console.log(
      `Tempo de processamento: ${processingTime.toFixed(2)} segundos`
    );
    console.log(`Confiança: ${result.confidence || "N/A"}`);

    // Gerar relatório
    const reportDir = path.join(process.cwd(), "docs");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const reportPath = path.join(reportDir, `teste-gemini-${today}.md`);

    const reportContent = `# Teste do Modelo Gemini

**Data:** ${today}

## Produto Testado

"${testProduct.description}"

## Resultado

- **NCM Esperado:** ${expectedNcm}
- **NCM Obtido:** ${resultNcm}
- **Resultado:** ${isCorrect ? "✅ Correto" : "❌ Incorreto"}
- **Tempo de processamento:** ${processingTime.toFixed(2)} segundos
- **Confiança:** ${result.confidence || "N/A"}

## Detalhes da Resposta

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`

## Conclusão

O modelo Gemini ${
      isCorrect ? "classificou corretamente" : "não classificou corretamente"
    } o produto no código NCM esperado. O tempo de resposta foi de ${processingTime.toFixed(
      2
    )} segundos.
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📝 Relatório gerado em: ${reportPath}`);

    return { result, isCorrect, processingTime };
  } catch (error) {
    console.error("❌ Erro ao testar modelo Gemini:", error);
    throw error;
  }
}

// Executar o teste
async function executarTeste() {
  if (!verificarChaveAPI()) {
    process.exit(1);
  }

  try {
    await testarModeloGemini();
    console.log("\n✅ Teste concluído com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro durante o teste:", error);
    process.exit(1);
  }
}

// Iniciar o teste
executarTeste();
