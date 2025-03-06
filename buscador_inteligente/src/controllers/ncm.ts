// Importação das dependências
import { Request, Response } from 'express';
import { LocalModelClient } from '../tools/local-model-client';
import { 
  USE_LOCAL_MODEL,
  LOCAL_MODEL_ENDPOINT
} from '../config';
import axios from 'axios';
import { TokenTracker } from '../utils/token-tracker';

// Criação de uma instância compartilhada do TokenTracker
const tokenTracker = new TokenTracker();

// Interface para os parâmetros da consulta de produto
export interface ConsultaProduto {
  consulta: string;
  estadoOrigem: string;
  operacao?: string;
  regimeTributario?: string;
  tributacao?: string;
  modelo: string;
}

// Mapeamento dos modelos para as funções que os processam
const funcoes_modelos: Record<string, (consulta: ConsultaProduto) => Promise<any>> = {
  'Nex-0.1-Pro-2024': obterSugestoesGPT4,
  'Nex-0.3-Preview-2024': obterSugestoesClaude,
  'Nex-0.5-Preview-2025': obterSugestoesDeepseek,
  'Qwen2.5-7b-instruct-1m': obterSugestoesQwen,
};

// Constantes para a API
const ERROR_MESSAGES = {
  model_error: 'Erro ao processar consulta com o modelo',
  invalid_model: 'Modelo não encontrado ou inválido',
  invalid_request: 'Requisição inválida',
  server_error: 'Erro interno do servidor'
};

/**
 * Formatação do prompt para consulta de NCM
 * @param consulta Objeto com os dados da consulta
 * @returns Prompt formatado
 */
function format_prompt(consulta: ConsultaProduto): string {
  return `
    Você é um especialista em classificação NCM e tributação de produtos.
    Analise o seguinte produto e procure na tabela TIPI.
    Produto: ${consulta.consulta}
        Estado de origem: ${consulta.estadoOrigem}
        Operação: ${consulta.operacao || "Não informado"}
        Regime tributário: ${consulta.regimeTributario || "Não informado"}
        Tributação: ${consulta.tributacao || "Não informado"}
    
    Retorne APENAS um JSON, **SEM** texto adicional, no seguinte formato:
    {
        "ncm": "XX.XX.XX.XX",
        "descricao": "Uma breve descrição do produto com base nas características da ncm encontrada",
        "atributos": ["...cada atributo deve ter como foco o produto que será cadastrado na duimp no novo sistema do governo CISCOMEX"],
        "atributos_tipi": ["...cada atributo deve der retirado do que tem daquela ncm na tabela tipi 2024"],
        "valores_de_impostos": {
            "ipi": "valor real do IPI",
            "icms": {"estado": "valor real do ICMS"},
            "pis": "valor real do PIS",
            "cofins": "valor real do COFINS"
        },
        "classificacao_tributaria": {
            "tipo_classificacao_tributario": {
                "tipo_tributario_ativo": "Como especialista tributário, analise cuidadosamente as tabelas EFD Contribuições da Receita Federal utilizando o ncm que você encontrou e as características do produto, operação e enquadramento nas tabelas acima.
            Utilize as tabelas 4.3.1 a 4.3.6 do Manual EFD Contribuições para determinar o tipo tributário.
            - Considere:
                * Tabela 4.3.1: Tabela Código de Situação Tributária – CST PIS/PAS
                * Tabela 4.3.2: Tabela Código de Situação Tributária – CST COFINS
                * Tabela 4.3.3: Tabela Código de Contribuição Social Apurada
                * Tabela 4.3.4: Tabela Código de Tipo de Crédito
                * Tabela 4.3.5: Tabela Código de Base de Cálculo do Crédito
                * Tabela 4.3.6: Tabela Código de Ajuste de Contribuição ou Crédito",
                "justificativa": "Explique detalhadamente o motivo da escolha deste tipo tributário, citando as características do produto, legislação aplicável e tabelas consultadas."
            },
            "ipi_entrada": "valor real do IPI na entrada",
            "ipi_saida": "valor real do IPI na saída",
            "pis_entrada": "valor real do PIS na entrada",
            "pis_saida": "valor real do PIS na saída",
            "cofins_entrada": "valor real do COFINS na entrada",
            "cofins_saida": "valor real do COFINS na saída",
            "cst_entrada": "valor real do CST de entrada",
            "cst_saida": "valor real do CST de saída"
        }
    }
  `;
}

/**
 * Função para processar a resposta do modelo
 * @param content Conteúdo da resposta
 * @returns Resposta processada
 */
function processarRespostaModelo(content: string): any {
  try {
    // Remove texto adicional antes e depois do JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Nenhum JSON encontrado na resposta');
    }
    
    const jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Erro ao processar resposta JSON:', error);
    return {
      error: 'Erro ao processar resposta do modelo',
      raw_response: content
    };
  }
}

/**
 * Função para obter sugestões usando o modelo local Qwen
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesQwen(consulta: ConsultaProduto): Promise<any> {
  try {
    // Se estamos em ambiente de desenvolvimento e falhamos em conectar ao modelo local
    // podemos retornar uma resposta mockada para testes
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_RESPONSES === 'true') {
      console.log('Usando resposta mockada para ambiente de desenvolvimento');
      
      // Simulando um delay para tornar o mock mais realista
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Resposta de exemplo para testes
      return {
        ncm: "61.05.10.00",
        descricao: "Camisa polo masculina, confeccionada em malha de algodão, com gola e abertura frontal parcial com fechamento por botões.",
        atributos: [
          "Confeccionada em malha de algodão",
          "Gola polo com fechamento por botões",
          "Manga curta",
          "Para uso masculino",
          "Produto acabado, pronto para uso"
        ],
        atributos_tipi: [
          "Camisas de malha, de algodão, de uso masculino",
          "Produto do capítulo 61 - Vestuário e seus acessórios, de malha",
          "Produto da posição 61.05 - Camisas de malha, de uso masculino"
        ],
        valores_de_impostos: {
          ipi: "0%",
          icms: {"SP": "18%"},
          pis: "1,65%",
          cofins: "7,6%"
        },
        classificacao_tributaria: {
          tipo_classificacao_tributario: {
            tipo_tributario_ativo: "CST 01 - Operação Tributável com Alíquota Básica",
            justificativa: "Produto nacional tributado normalmente, sem benefícios fiscais específicos. A classificação como CST 01 é devido à natureza do produto como vestuário acabado, tributado pelas alíquotas básicas de PIS (1,65%) e COFINS (7,6%), sem direito a crédito específico."
          },
          ipi_entrada: "0%",
          ipi_saida: "0%",
          pis_entrada: "1,65%",
          pis_saida: "1,65%",
          cofins_entrada: "7,6%",
          cofins_saida: "7,6%",
          cst_entrada: "01",
          cst_saida: "01"
        }
      };
    }
    
    // Criação do cliente do modelo local
    const localClient = new LocalModelClient(LOCAL_MODEL_ENDPOINT);
    
    // Formatação do prompt
    const prompt = format_prompt(consulta);
    
    // Configuração do sistema
    const systemMessage = "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada.";
    
    // Geração da resposta
    const model = localClient.getGenerativeModel({
      model: "qwen2.5-7b-instruct-1m", 
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096
      }
    });
    
    const response = await model.generateContent({
      contents: [
        { role: "system", parts: [{ text: systemMessage }] },
        { role: "user", parts: [{ text: prompt }] }
      ]
    });
    
    const responseContent = response.response?.text() || '';
    
    // Processamento da resposta
    const resultado = processarRespostaModelo(responseContent);
    
    // Registrar uso de tokens
    tokenTracker.registerTokenUsage(
      "Qwen2.5-7b-instruct-1m",
      Math.round(consulta.consulta.length * 1.5),  // Estimativa de tokens de entrada
      Math.round(responseContent.length * 0.5)     // Estimativa de tokens de saída
    );
    
    return resultado;
  } catch (error) {
    console.error('Erro ao processar modelo local:', error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando o modelo GPT-4
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesGPT4(consulta: ConsultaProduto): Promise<any> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error('API key para OpenAI não encontrada');
    }
    
    const prompt = format_prompt(consulta);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4096
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    const content = response.data.choices[0].message.content.trim();
    const resultado = processarRespostaModelo(content);
    
    // Registrar uso de tokens
    tokenTracker.registerTokenUsage(
      "gpt-4",
      response.data.usage.prompt_tokens,
      response.data.usage.completion_tokens
    );
    
    return resultado;
  } catch (error) {
    console.error('Erro ao processar modelo GPT-4:', error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando o modelo Claude
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesClaude(consulta: ConsultaProduto): Promise<any> {
  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error('API key para Anthropic não encontrada');
    }
    
    const prompt = format_prompt(consulta);
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4096
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    const content = response.data.content[0].text;
    const resultado = processarRespostaModelo(content);
    
    // Registrar uso de tokens
    tokenTracker.registerTokenUsage(
      "claude-3-opus-20240229",
      response.data.usage.input_tokens,
      response.data.usage.output_tokens
    );
    
    return resultado;
  } catch (error) {
    console.error('Erro ao processar modelo Claude:', error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando o modelo Deepseek
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesDeepseek(consulta: ConsultaProduto): Promise<any> {
  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_BASE = process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1';
    
    if (!DEEPSEEK_API_KEY) {
      throw new Error('API key para Deepseek não encontrada');
    }
    
    const prompt = format_prompt(consulta);
    
    const response = await axios.post(
      `${DEEPSEEK_API_BASE}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4096
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );
    
    const content = response.data.choices[0].message.content.trim();
    const resultado = processarRespostaModelo(content);
    
    // Registrar uso de tokens
    tokenTracker.registerTokenUsage(
      "deepseek-chat",
      response.data.usage.prompt_tokens,
      response.data.usage.completion_tokens
    );
    
    return resultado;
  } catch (error) {
    console.error('Erro ao processar modelo Deepseek:', error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Handler para a rota de consulta de NCM
 * @param req Requisição
 * @param res Resposta
 */
export async function consultarNCM(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  
  try {
    const consulta = req.body as ConsultaProduto;
    
    // Validação dos dados da requisição
    if (!consulta.consulta || !consulta.estadoOrigem || !consulta.modelo) {
      res.status(400).json({
        status_code: 400,
        errors: [{
          loc: ["body"],
          msg: "Dados obrigatórios não fornecidos",
          type: "error.invalid_request",
          ctx: { dados_fornecidos: Object.keys(consulta) }
        }],
        message: ERROR_MESSAGES.invalid_request,
        error_type: "invalid_request"
      });
      return;
    }
    
    // Verifica se é ambiente de desenvolvimento e se deve usar modelo local
    const useLocal = USE_LOCAL_MODEL && process.env.NODE_ENV === 'development';
    
    // Seleciona a função a ser executada de acordo com o modelo
    let funcaoEscolhida = funcoes_modelos[consulta.modelo];
    
    // Se estiver em ambiente de desenvolvimento e useLocal for true, força o uso do modelo local
    if (useLocal) {
      console.log('Usando modelo local em ambiente de desenvolvimento');
      funcaoEscolhida = obterSugestoesQwen;
    }
    
    // Verifica se o modelo escolhido é válido
    if (!funcaoEscolhida) {
      res.status(400).json({
        status_code: 400,
        errors: [{
          loc: ["body", "modelo"],
          msg: "Modelo não encontrado ou inválido",
          type: "error.invalid_value",
          ctx: { valor_fornecido: consulta.modelo }
        }],
        message: ERROR_MESSAGES.invalid_model,
        error_type: "invalid_value"
      });
      return;
    }
    
    // Executa a função do modelo selecionado
    const resultado = await funcaoEscolhida(consulta);
    
    // Calcula o tempo decorrido
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000; // em segundos
    
    // Log de duração da consulta
    console.log(`Consulta NCM concluída em ${elapsedTime.toFixed(2)}s (modelo: ${consulta.modelo})`);
    
    // Envio da resposta
    res.status(200).json(resultado);
    
  } catch (error: any) {
    console.error('Erro na consulta de NCM:', error);
    
    // Formata a resposta de erro
    res.status(500).json({
      status_code: 500,
      errors: [{
        loc: ["server"],
        msg: error.message || ERROR_MESSAGES.server_error,
        type: "error.server_error"
      }],
      message: error.message || ERROR_MESSAGES.server_error,
      error_type: "server_error"
    });
  }
} 