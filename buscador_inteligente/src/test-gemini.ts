import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { ENV } from './config';

// Carrega variáveis de ambiente
dotenv.config();

// Teste de conexão com a API do Gemini
async function testGeminiConnection() {
  console.log('Iniciando teste de conexão com a API do Gemini...');
  
  // Tenta obter a chave da API do Gemini
  const geminiApiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!geminiApiKey) {
    console.error('API key para Gemini não encontrada em nenhuma fonte');
    console.log('Fontes verificadas:');
    console.log('- ENV.GEMINI_API_KEY:', ENV.GEMINI_API_KEY ? 'Presente' : 'Ausente');
    console.log('- process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Presente' : 'Ausente');
    console.log('- process.env.GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Presente' : 'Ausente');
    
    // Verifica se temos JINA_API_KEY como alternativa
    if (process.env.JINA_API_KEY) {
      console.log('Encontrada JINA_API_KEY, tentando usar como alternativa...');
      await testWithKey(process.env.JINA_API_KEY);
    } else {
      console.error('Nenhuma chave API válida encontrada para testes.');
      process.exit(1);
    }
  } else {
    console.log('Chave API do Gemini encontrada, testando conexão...');
    await testWithKey(geminiApiKey);
  }
}

async function testWithKey(apiKey: string) {
  try {
    // Inicializa o cliente da Google
    const googleClient = new GoogleGenerativeAI(apiKey);
    console.log('Cliente GoogleGenerativeAI inicializado com sucesso');
    
    // Cria uma instância de modelo generativo
    const model = googleClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Modelo gemini-2.0-flash criado com sucesso');
    
    // Tenta gerar conteúdo com o modelo
    console.log('Gerando conteúdo de teste...');
    const result = await model.generateContent('Olá, pode me dizer qual é a capital do Brasil?');
    
    // Obtém a resposta
    const response = await result.response;
    const text = await response.text();
    
    console.log('Resposta recebida do Gemini:');
    console.log('-----------------------------');
    console.log(text);
    console.log('-----------------------------');
    
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao testar conexão com Gemini:', error);
    process.exit(1);
  }
}

// Executa o teste
testGeminiConnection().catch(console.error); 