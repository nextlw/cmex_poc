// Importação das dependências
import { Request, Response, NextFunction } from "express";
import { LocalModelClient } from "../tools/local-model-client";
import { USE_LOCAL_MODEL, LOCAL_MODEL_ENDPOINT, ENV } from "../config";
import axios from "axios";
import { TokenTracker } from "../utils/token-tracker";
import httpClient from "../utils/http-client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FastApiNCMResult } from "../types/globalTypes";

// Interface personalizada para estender o Request do Express
interface CustomRequest extends Request {
  fastApiResult?: FastApiNCMResult | null;
}

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
  autocomplete?: boolean;
  useDeepResearch?: boolean;
}

// Mapeamento dos modelos para as funções que os processam
const funcoes_modelos: Record<
  string,
  (consulta: ConsultaProduto) => Promise<any>
> = {
  "Nex-0.1-Pro-2024": obterSugestoesGPT4,
  "Nex-0.3-Preview-2024": obterSugestoesClaude,
  "Nex-0.5-Preview-2025": obterSugestoesDeepseek,
  "Qwen2.5-7b-instruct-1m": obterSugestoesQwen,
};

// Constantes para a API
const ERROR_MESSAGES = {
  model_error: "Erro ao processar consulta com o modelo",
  invalid_model: "Modelo não encontrado ou inválido",
  invalid_request: "Requisição inválida",
  server_error: "Erro interno do servidor",
};

/**
 * Formatação do prompt para consulta de NCM
 * @param consulta Objeto com os dados da consulta
 * @returns Prompt formatado
 */
function format_prompt(consulta: ConsultaProduto): string {
  const {
    consulta: descricaoProduto,
    estadoOrigem = "Não informado",
    operacao = "Não informado",
    regimeTributario = "Não informado",
    tributacao = "Não informado",
  } = consulta;

  return `
Você é um especialista em Classificação Fiscal de Mercadorias, com conhecimento amplo do Sistema Harmonizado (SH), da Nomenclatura Comum do Mercosul (NCM) e da Tabela de Incidência do Imposto sobre Produtos Industrializados (TIPI).

Sua tarefa é classificar o seguinte produto de acordo com sua NCM correta, descrevendo o raciocínio utilizado e listando as principais características que justificam a classificação.
IMPORTANTE!
1. Código NCM completo (8 dígitos)
2. Descrição oficial do NCM
3. Atributos relevantes do produto para esta classificação
4. Quando disponíveis, os atributos específicos mencionados nas Notas Explicativas da TIPI para este NCM
5. Valores padrão de impostos aplicáveis (IPI, ICMS, PIS e COFINS)

!RESPONDA EM JSON EXATAMENTE COM A SEGUINTE ESTRUTURA!:
PRODUTO A SER CLASSIFICADO: "${descricaoProduto}"

PARÂMETROS ADICIONAIS:
- Estado de origem: ${estadoOrigem}
- Operação: ${operacao}
- Regime tributário: ${regimeTributario}
- Tributação: ${tributacao}

Você DEVE retornar APENAS um JSON válido com a seguinte estrutura EXATA, sem comentários adicionais:

{
  "step": número (0-5 indicando o passo atual do processamento),
  "completed": booleano (true se o processamento estiver concluído),
  "result": [
    {
      "ncm": string (código NCM),
      "descricao": string (descrição do NCM),
      "atributos": array de strings ou null,
      "classificacao_tributaria": {
        "ipi_entrada": string,
        "ipi_saida": string,
        "pis_entrada": string,
        "pis_saida": string,
        "cofins_entrada": string,
        "cofins_saida": string,
        "cst_entrada": string,
        "cst_saida": string
      },
      "valores_de_impostos": {
        "ipi": string,
        "pis": string,
        "cofins": string,
        "icms": { <código-estado>: string, ... }
      }
    }
  ],
  "validationStatus": {
    "infoBasicas": {
      "validated": booleano,
      "loading": booleano
    },
    "atributos": {
      "validated": booleano,
      "loading": booleano
    },
    "tributacao": {
      "validated": booleano,
      "loading": booleano
    }
  }
}

Durante o processamento, preencha apenas os campos validados e defina os campos correspondentes como "validated": true. Mantenha os campos ainda não processados como null.

A cada etapa, atualize o campo "step" e o status de validação dos componentes correspondentes.
`;
}

/**
 * Função para processar a resposta do modelo
 * @param content Conteúdo da resposta
 * @returns Resposta processada
 */
function processarRespostaModelo(content: string): any {
  try {
    // Tenta extrair JSON usando regex para remover textos adicionais
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonContent = jsonMatch[0];
      const resultado = JSON.parse(jsonContent);

      // Validação básica do formato
      if (
        !resultado.step ||
        !resultado.completed ||
        !resultado.result ||
        !resultado.validationStatus
      ) {
        throw new Error("Formato de resposta inválido");
      }

      return resultado;
    }

    // Se não encontrou com regex, tenta fazer parse direto
    const resultado = JSON.parse(content);

    // Validação básica do formato
    if (
      !resultado.step ||
      !resultado.completed ||
      !resultado.result ||
      !resultado.validationStatus
    ) {
      throw new Error("Formato de resposta inválido");
    }

    return resultado;
  } catch (error) {
    console.error("Erro ao processar resposta do modelo:", error);
    return {
      step: 0,
      completed: false,
      result: [
        {
          ncm: "",
          descricao: "",
          atributos: null,
          classificacao_tributaria: {
            ipi_entrada: "",
            ipi_saida: "",
            pis_entrada: "",
            pis_saida: "",
            cofins_entrada: "",
            cofins_saida: "",
            cst_entrada: "",
            cst_saida: "",
          },
          valores_de_impostos: {
            ipi: "",
            pis: "",
            cofins: "",
            icms: {},
          },
        },
      ],
      validationStatus: {
        infoBasicas: {
          validated: false,
          loading: true,
        },
        atributos: {
          validated: false,
          loading: false,
        },
        tributacao: {
          validated: false,
          loading: false,
        },
      },
    };
  }
}

/**
 * Função para obter sugestões usando o modelo local Qwen
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesQwen(
  consulta: ConsultaProduto
): Promise<any> {
  try {
    // Se estamos em ambiente de desenvolvimento e falhamos em conectar ao modelo local
    // podemos retornar uma resposta mockada para testes
    if (
      process.env.NODE_ENV === "development" &&
      process.env.MOCK_RESPONSES === "true"
    ) {
      console.log("Usando resposta mockada para ambiente de desenvolvimento");

      // Simulando um delay para tornar o mock mais realista
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Resposta de exemplo para testes
      return {
        ncm: "61.05.10.00",
        descricao:
          "Camisa polo masculina, confeccionada em malha de algodão, com gola e abertura frontal parcial com fechamento por botões.",
        atributos: [
          "Confeccionada em malha de algodão",
          "Gola polo com fechamento por botões",
          "Manga curta",
          "Para uso masculino",
          "Produto acabado, pronto para uso",
        ],
        atributos_tipi: [
          "Camisas de malha, de algodão, de uso masculino",
          "Produto do capítulo 61 - Vestuário e seus acessórios, de malha",
          "Produto da posição 61.05 - Camisas de malha, de uso masculino",
        ],
        valores_de_impostos: {
          ipi: "0%",
          icms: { SP: "18%" },
          pis: "1,65%",
          cofins: "7,6%",
        },
        classificacao_tributaria: {
          tipo_classificacao_tributario: {
            tipo_tributario_ativo:
              "CST 01 - Operação Tributável com Alíquota Básica",
            justificativa:
              "Produto nacional tributado normalmente, sem benefícios fiscais específicos. A classificação como CST 01 é devido à natureza do produto como vestuário acabado, tributado pelas alíquotas básicas de PIS (1,65%) e COFINS (7,6%), sem direito a crédito específico.",
          },
          ipi_entrada: "0%",
          ipi_saida: "0%",
          pis_entrada: "1,65%",
          pis_saida: "1,65%",
          cofins_entrada: "7,6%",
          cofins_saida: "7,6%",
          cst_entrada: "01",
          cst_saida: "01",
        },
      };
    }

    // Criação do cliente do modelo local
    const localClient = new LocalModelClient(LOCAL_MODEL_ENDPOINT);

    // Formatação do prompt
    const prompt = format_prompt(consulta);

    // Configuração do sistema e prompt combinado
    const systemMessage =
      "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada.";
    const fullPrompt = `${systemMessage}\n\n${prompt}`;

    // Geração da resposta
    const model = localClient.getGenerativeModel({
      model: "qwen2.5-7b-instruct-1m",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    });

    // Faz a chamada à API usando o formato correto para versão 0.24.0
    const response = await model.generateContent(fullPrompt);

    const responseContent = response.response?.text() || "";

    // Processamento da resposta
    const resultado = processarRespostaModelo(responseContent);

    // Registrar uso de tokens
    tokenTracker.registerTokenUsage(
      "Qwen2.5-7b-instruct-1m",
      Math.round(consulta.consulta.length * 1.5), // Estimativa de tokens de entrada
      Math.round(responseContent.length * 0.5) // Estimativa de tokens de saída
    );

    return resultado;
  } catch (error) {
    console.error("Erro ao processar modelo local:", error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando o modelo GPT-4
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesGPT4(
  consulta: ConsultaProduto
): Promise<any> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      throw new Error("API key para OpenAI não encontrada");
    }

    const prompt = format_prompt(consulta);

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
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
    console.error("Erro ao processar modelo GPT-4:", error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando o modelo Claude
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesClaude(
  consulta: ConsultaProduto
): Promise<any> {
  try {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      throw new Error("API key para Anthropic não encontrada");
    }

    const prompt = format_prompt(consulta);

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-opus-20240229",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
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
    console.error("Erro ao processar modelo Claude:", error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando o modelo Deepseek
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesDeepseek(
  consulta: ConsultaProduto
): Promise<any> {
  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_BASE =
      process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1";

    if (!DEEPSEEK_API_KEY) {
      throw new Error("API key para DeepSeek não encontrada");
    }

    const prompt = format_prompt(consulta);

    const response = await axios.post(
      `${DEEPSEEK_API_BASE}/chat/completions`,
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Você é um assistente especializado em classificação fiscal. Responda sempre em JSON válido seguindo exatamente a estrutura solicitada.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 1.3,
        max_tokens: 700,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
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
    console.error("Erro ao processar modelo DeepSeek:", error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

/**
 * Função para obter sugestões usando modelos Gemini
 * @param consulta Objeto com os dados da consulta
 * @returns Resposta do modelo
 */
export async function obterSugestoesGemini(
  consulta: ConsultaProduto
): Promise<any> {
  try {
    // Obter a chave da API Gemini de várias fontes possíveis
    const GEMINI_API_KEY =
      ENV.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.JINA_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("API key para Gemini não encontrada");
    }

    const prompt = format_prompt(consulta);

    // Determinar qual modelo usar baseado no parâmetro 'modelo'
    let modeloGemini = "gemini-1.5-pro"; // padrão

    // Mapeamento de nomes de modelos
    const modelNameMap: Record<string, string> = {
      "Gemini-1.5-flash": "gemini-1.5-flash",
      "Gemini-1.5-pro": "gemini-1.5-pro",
      "Gemini-2.0-flash": "gemini-2.0-flash",
      "Nexcode-0.1-BETA": "gemini-1.5-pro", // alias para o padrão
    };

    if (modelNameMap[consulta.modelo]) {
      modeloGemini = modelNameMap[consulta.modelo];
    }

    console.log(`Usando modelo Gemini: ${modeloGemini}`);

    // Inicializar o cliente do Google
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modeloGemini });

    // Fazer a chamada à API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = await response.text();

    const resultado = processarRespostaModelo(content);

    // Estimativa de uso de tokens (não é fornecido pela API do Gemini)
    const promptTokens = prompt.length / 4; // Estimativa simples baseada em caracteres
    const completionTokens = content.length / 4;

    tokenTracker.registerTokenUsage(
      modeloGemini,
      promptTokens,
      completionTokens
    );

    return resultado;
  } catch (error) {
    console.error("Erro ao processar modelo Gemini:", error);
    throw new Error(ERROR_MESSAGES.model_error);
  }
}

// Adiciona os modelos Gemini ao mapeamento de funções
funcoes_modelos["Gemini-1.5-flash"] = obterSugestoesGemini;
funcoes_modelos["Gemini-1.5-pro"] = obterSugestoesGemini;
funcoes_modelos["Gemini-2.0-flash"] = obterSugestoesGemini;
funcoes_modelos["Nexcode-0.1-BETA"] = obterSugestoesGemini;

/**
 * Controlador para consulta de NCM
 */
export async function consultarNCM(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const startTime = Date.now();

  try {
    const consulta = req.body as ConsultaProduto;

    // Validação dos dados da requisição
    if (!consulta.consulta || !consulta.estadoOrigem || !consulta.modelo) {
      res.status(400).json({
        status_code: 400,
        errors: [
          {
            loc: ["body"],
            msg: "Dados obrigatórios não fornecidos",
            type: "error.invalid_request",
            ctx: { dados_fornecidos: Object.keys(consulta) },
          },
        ],
        message: ERROR_MESSAGES.invalid_request,
        error_type: "invalid_request",
      });
      return;
    }

    // Verifica se é ambiente de desenvolvimento e se deve usar modelo local
    const useLocal = USE_LOCAL_MODEL && process.env.NODE_ENV === "development";

    // Seleciona a função a ser executada de acordo com o modelo
    let funcaoEscolhida = funcoes_modelos[consulta.modelo];

    // Se estiver em ambiente de desenvolvimento e useLocal for true, força o uso do modelo local
    if (useLocal) {
      console.log("Usando modelo local em ambiente de desenvolvimento");
      funcaoEscolhida = obterSugestoesQwen;
    }

    // Verifica se o modelo escolhido é válido
    if (!funcaoEscolhida) {
      res.status(400).json({
        status_code: 400,
        errors: [
          {
            loc: ["body", "modelo"],
            msg: "Modelo não encontrado ou inválido",
            type: "error.invalid_value",
            ctx: { valor_fornecido: consulta.modelo },
          },
        ],
        message: ERROR_MESSAGES.invalid_model,
        error_type: "invalid_value",
      });
      return;
    }

    // Executa a função do modelo selecionado
    const resultado = await funcaoEscolhida(consulta);

    // Calcula o tempo decorrido
    const endTime = Date.now();
    const elapsedTime = (endTime - startTime) / 1000; // em segundos

    // Log de duração da consulta
    console.log(
      `Consulta NCM concluída em ${elapsedTime.toFixed(2)}s (modelo: ${
        consulta.modelo
      })`
    );

    // Envio da resposta
    res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro na consulta de NCM:", error);

    // Formata a resposta de erro
    res.status(500).json({
      status_code: 500,
      errors: [
        {
          loc: ["server"],
          msg: error.message || ERROR_MESSAGES.server_error,
          type: "error.server_error",
        },
      ],
      message: error.message || ERROR_MESSAGES.server_error,
      error_type: "server_error",
    });
  }
}

/**
 * Router para consultas NCM
 */
export async function ncmRouter(
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { useDeepResearch } = req.body;

    console.log(
      `Roteamento de consulta NCM: useDeepResearch=${useDeepResearch}`
    );

    // Se estamos em modo de desenvolvimento com mock ativado, usa o controlador NCM padrão
    if (
      process.env.NODE_ENV === "development" &&
      process.env.MOCK_RESPONSES === "true"
    ) {
      console.log("Usando controlador NCM mockado");
      await consultarNCM(req, res);
      return;
    }

    if (useDeepResearch) {
      // Para consultas com Deep Research:
      // 1. Primeiro chama a FastAPI
      // 2. Passa a resposta para o processamento DeepResearch

      const { consulta, modelo, ...outrosParams } = req.body;

      // Corrige a propriedade modelo de Qwen2.5 para qwen2.5 para compatibilidade
      // com a API Python que usa minúsculas
      const modeloAjustado =
        modelo === "Qwen2.5-7b-instruct-1m" ? "qwen2.5-7b-instruct-1m" : modelo;

      // FastAPI para processar a consulta
      try {
        const resposta = await httpClient.post("/consultas", {
          consulta,
          modelo: modeloAjustado,
          ...outrosParams,
        });

        // Armazena o resultado da FastAPI para uso pelo DeepResearch
        req.fastApiResult = resposta.data;

        // Passa para o próximo middleware (DeepResearch)
        next();
      } catch (error) {
        console.error("Erro na chamada à FastAPI:", error);

        // Se houver erro na chamada à FastAPI, continua com DeepResearch mesmo sem dados
        req.fastApiResult = null;
        next();
      }
    } else {
      // Para consultas sem Deep Research, passa direto para a FastAPI
      const { consulta, modelo, ...outrosParams } = req.body;

      // Corrige a propriedade modelo para compatibilidade com FastAPI
      const modeloAjustado =
        modelo === "Qwen2.5-7b-instruct-1m" ? "qwen2.5-7b-instruct-1m" : modelo;

      try {
        const resposta = await httpClient.post("/consultas", {
          consulta,
          modelo: modeloAjustado,
          ...outrosParams,
        });

        // Adiciona metadados e retorna
        const resultado = {
          ...resposta.data,
          _meta: {
            fonte: "fastapi",
            timestamp: new Date().toISOString(),
          },
        };

        res.status(200).json(resultado);
      } catch (error: any) {
        console.error("Erro na chamada à FastAPI:", error);

        // Retorna o erro da FastAPI ou um erro genérico
        const statusCode = error.response?.status || 500;
        const errorData = error.response?.data || {
          status_code: statusCode,
          errors: [
            {
              loc: ["fastapi"],
              msg: "Erro no serviço FastAPI",
              type: "error.fastapi_error",
            },
          ],
          message: "Erro no serviço FastAPI",
          error_type: "external_service_error",
        };

        res.status(statusCode).json(errorData);
      }
    }
  } catch (error) {
    console.error("Erro no roteamento NCM:", error);
    next(error);
  }
}
