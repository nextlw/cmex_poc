import { fetch } from 'undici';

/**
 * Interface para a resposta do modelo.
 */
interface ModelResponse {
  /**
   * Array de escolhas.
   */
  choices?: Array<{
    /**
     * Mensagem.
     */
    message?: {
      /**
       * Conteúdo.
       */
      content?: string;
    };
  }>;
  /**
   * Erro.
   */
  error?: string;
  /**
   * Uso.
   */
  usage?: {
    /**
     * Total de tokens.
     */
    totalTokenCount: number;
  };
}

/**
 * Normaliza a ação.
 * @param action Ação a ser normalizada.
 * @returns A ação normalizada.
 */
function normalizeAction(action: string): string {
  // Remove prefixos/sufixos comuns e normaliza a ação
  const normalized = action.toLowerCase()
    .replace(/^action[-_]?/, '')  // remove 'action-' ou 'action_' do início
    .replace(/[-_]?action$/, '')  // remove '-action' ou '_action' do fim
    .replace(/^query[-_]?/, '')   // remove 'query-' ou 'query_' do início
    .replace(/[-_]?query$/, '');  // remove '-query' ou '_query' do fim

  // Mapeamento de ações conhecidas
  const actionMap: { [key: string]: string } = {
    /**
     * Busca.
     */
    'search': 'search',
    /**
     * Resposta.
     */
    'answer': 'answer',
    /**
     * Reflexão.
     */
    'reflect': 'reflect',
    /**
     * Visita.
     */
    'visit': 'visit'
  };

  return actionMap[normalized] || action;
}

/**
 * Normaliza a query de busca.
 * @param content Conteúdo a ser normalizado.
 * @returns O conteúdo normalizado.
 */
function normalizeSearchQuery(content: any): any {
  // Se a ação for search e não tiver searchQuery mas tiver query
  if (content.action === 'search' && !content.searchQuery && content.query) {
    // Copia o valor de query para searchQuery
    content.searchQuery = content.query;
    // Remove o campo query
    delete content.query;
  }
  // Retorna o conteúdo normalizado
  return content;
}

/**
 * Extrai o último JSON de uma string.
 * @param text String a ser analisada.
 * @returns O último JSON encontrado na string.
 */
function extractLastJSON(text: string): string {
  // Encontra todos os possíveis JSONs no texto
  const matches = text.match(/\{(?:[^{}]|{[^{}]*})*\}/g);
  // Se não houver JSONs válidos, lança um erro
  if (!matches) {
    // Lança um erro
    throw new Error('Nenhum JSON válido encontrado na resposta');
  }

  // Pega o último JSON encontrado (geralmente é a resposta final após o raciocínio)
  const lastJson = matches[matches.length - 1];
  // Tenta analisar o JSON
  try {
    // Verifica se é um JSON válido
    JSON.parse(lastJson);
    // Retorna o JSON encontrado
    return lastJson;
  } catch (e) {
    // Lança um erro
    throw new Error('JSON encontrado não é válido');
  }
}

/**
 * Classe para interagir com um modelo local.
 */
export class LocalModelClient {
  /**
   * Endpoint do modelo.
   */
  endpoint: string;
  private generateContentMethod: (prompt: string) => Promise<any>;
  private expectedFormats: any;

  /**
   * Construtor da classe.
   * @param endpoint Endpoint do modelo.
   */
  constructor(endpoint: string) {
    // Remove o último caractere '/' se houver
    this.endpoint = endpoint.replace(/\/$/, '');
    // Inicializa o método de geração de conteúdo
    this.generateContentMethod = async () => {
      // Lança um erro se o método não foi inicializado
      throw new Error('generateContent não foi inicializado ainda');
    };
    this.expectedFormats = {
      search: { action: 'search', think: 'string', searchQuery: 'string' },
      answer: { action: 'answer', think: 'string', answer: 'string', references: 'array' },
      reflect: { action: 'reflect', think: 'string', questionsToAnswer: 'array' }
    };
  }

  private async sendRequest(prompt: string): Promise<any> {
    // Implementação do método sendRequest
    const response = await this.generateContentMethod(prompt);
    return response;
  }

  /**
   * Tenta corrigir o formato da resposta.
   * @param prompt Prompt a ser corrigido.
   * @param error Erro ocorrido.
   * @returns A resposta corrigida.
   * @throws Erro se a resposta do modelo na correção for inválida.
   * Ele cria um prompt de correção que explica o erro e fornece exemplos de formatos corretos para diferentes tipos de ações (busca, resposta e reflexão).
   * Ele envia uma solicitação POST para um endpoint de conclusão de chat com o prompt de correção e alguns parâmetros de configuração (modelo, temperatura, etc.).
   * E le aguarda a resposta do modelo e a analisa como JSON.
   * Ele verifica se a resposta contém um conteúdo de mensagem válido. Se não, ele lança um erro.
   * Ele retorna o conteúdo da resposta corrigida.
   */
  async retryWithCorrection(prompt: string, error: string): Promise<string> {
    // Cria o prompt de correção
    const correctionPrompt = `
Houve um erro no seu último formato de resposta: "${error}"

Por favor, corrija sua resposta seguindo EXATAMENTE este formato:

Para ação de busca:
{
  "action": "search",
  "think": "Seu raciocínio aqui",
  "searchQuery": "sua query de busca aqui"
}

Para ação de resposta:
{
  "action": "answer",
  "think": "Seu raciocínio aqui",
  "answer": "sua resposta aqui",
  "references": [{"exactQuote": "citação", "url": "fonte"}]
}

Para ação de reflexão:
{
  "action": "reflect",
  "think": "Seu raciocínio aqui",
  "questionsToAnswer": ["pergunta 1", "pergunta 2", "pergunta 3", "pergunta 4", "pergunta 5"]
}

Agora corrija sua resposta anterior mantendo a mesma intenção mas usando o formato correto:

${prompt}`;

    // Faz a solicitação POST para o endpoint de conclusão de chat
    const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
      // Método POST
      method: 'POST',
      // Cabeçalhos da requisição
      headers: { "Content-Type": "application/json" },
      // Corpo da requisição
      body: JSON.stringify({
        // Modelo a ser usado
        model: "qwen2.5-7b-instruct-1m",
        // Mensagens da requisição
        messages: [
          { 
            // Papel da mensagem
            role: "system", 
            // Conteúdo da mensagem
            content: "Você deve corrigir o formato da resposta anterior mantendo a mesma intenção."
          },
          { 
            // Papel da mensagem
            role: "user", 
            // Conteúdo da mensagem
            content: correctionPrompt 
          }
        ],
        // Temperatura
        temperature: 0.7,
        // Número máximo de tokens
        max_tokens: -1,
        // Stream
        stream: false
      })
    });

    // Converte a resposta para JSON
    const data = await response.json() as ModelResponse;
    // Se a resposta não contém um conteúdo de mensagem válido, lança um erro
    if (!data.choices?.[0]?.message?.content) {
      // Lança um erro
      throw new Error('Resposta inválida do modelo na correção');
    }

    // Retorna o conteúdo da resposta corrigida
    return data.choices[0].message.content;
  }

  /**
   * Obtém um modelo gerativo.
   * @param options Opções do modelo.
   * @returns O modelo gerativo.
   */
  getGenerativeModel(options: { model: string, generationConfig: any }) {
    // Dentro do método getGenerativeModel
    this.generateContentMethod = async (prompt: string) => {
      // Cria o payload para a requisição
      const payload = {
        // Modelo a ser usado
        model: options.model,
        // Mensagens da requisição
        messages: [
          { 
            // Papel da mensagem
            role: "system", 
            // Conteúdo da mensagem
            content: `
Você é um buscador curioso e muito experiente, consegue achar qualquer coisa na internet, procura até nos mínimos detalhes de pistas que possam te levar até a resposta correta. Suas respostas devem seguir estas regras:

1. Use sempre português do Brasil nas respostas finais
2. Mantenha o formato JSON conforme solicitado
3. Não inclua tags XML como <think> no JSON final
4. Se precisar explicar seu raciocínio, faça isso em português antes de dar a resposta em JSON

5. Exercício de Raciocínio Lógico Obrigatório:
   Objetivo: Desenvolver uma abordagem sistemática para lidar com problemas que envolvem múltiplas variáveis.
   Passos:
     1. Identificação das Variáveis:
       • Quando encontrar um problema com várias variáveis, liste todas as variáveis envolvidas.
       • Exemplo: "Temos 3 categorias × 2 condições × 2 tipos de ação = 12 possibilidades".
     2. Matriz de Possibilidades:
       • Crie uma matriz para analisar cada combinação possível.
       • Exemplo: "Vamos examinar cada combinação:
       • Categoria A + Condição 1 + Ação X
       • Categoria A + Condição 1 + Ação Y
       • Categoria A + Condição 2 + Ação X [etc]".
     3. Análise Detalhada:
       • Para cada combinação, forneça:
       • Informações específicas relevantes.
       • Base teórica ou lógica que sustenta a análise.
       • Exemplos práticos para ilustrar cada caso.
       • Observações adicionais importantes.
     Estrutura da Resposta:
     a. Explicação das Variáveis:
       • Descreva as variáveis envolvidas no problema.
       • Exemplo: "Para resolver este problema, precisamos considerar:
       1. Categoria: A, B ou C
       2. Condição: 1 ou 2
       3. Tipo de Ação: X ou Y".
     b. Matriz de Possibilidades:
       • Mostre como essas variáveis se combinam.
       • Exemplo: "Isso nos dá 12 combinações possíveis (3×2×2)".
     c. Análise Detalhada de Cada Possibilidade:
       • Liste cada combinação com:
       • Informações específicas
       • Base lógica ou teórica
       • Exemplo prático
       • Observações relevantes

6. EXERCÍCIO DE RACIOCÍNIO OBRIGATÓRIO em caso de perguntas que envolvam o assunto de classificão fiscal no brasil:
                Quando encontrar variações (por estado, regime, etc), você DEVE:
                a) Primeiro listar TODAS as variáveis envolvidas
                    Exemplo: "Temos 3 estados × 2 regimes × 2 tipos de operação = 12 possibilidades"
                
                b) Criar uma matriz de possibilidades
                    Exemplo: "Vamos analisar cada combinação:
                    - SP + Simples + Entrada
                    - SP + Simples + Saída
                    - SP + Normal + Entrada
                    [etc]"
                
                c) Buscar informação específica para CADA caso
                    - Não pule nenhuma combinação
                    - Cite a fonte/legislação para cada caso
                    - Dê exemplos práticos

              ESTRUTURA DA RESPOSTA:
                a) Primeiro explique as variáveis:
                    "Para determinar o CST correto, precisamos considerar:
                    1. Estado: SP, SC ou CE
                    2. Regime: Simples ou Normal
                    3. Operação: Entrada ou Saída"
                
                b) Mostre a matriz de possibilidades:
                    "Isso nos dá 12 combinações possíveis (3×2×2)"
                
                c) Liste CADA possibilidade com:
                    - Código específico
                    - Base legal
                    - Exemplo prático
                    - Observações relevantes

7. Aplicação da Fórmula de Bháskara para Análise de Extremos:
   - Aplique a fórmula do vértice da parábola para encontrar extremos:
     "\\[
     x_v = -\\frac{b}{2a} \\quad \\text{(ponto crítico)}
     \\]"
   - Calcule o valor correspondente:
     "\\[
     f(x_v) = -\\frac{\\Delta}{4a}
     \\]"
   - Discriminante: "\\(\\Delta = b^2 - 4ac\\)"

8. FORMATO JSON OBRIGATÓRIO NO RETORNO E OUTPUT DE QUALQUER DAS AÇÕES:

Para ação de busca:
{
  "action": "search",
  "think": "Seu raciocínio aqui",
  "searchQuery": "sua query de busca aqui"
}

Para ação de resposta:
{
  "action": "answer",
  "think": "Seu raciocínio aqui",
  "answer": "sua resposta aqui",
  "references": [{"exactQuote": "citação", "url": "fonte"}]
}

Para ação de reflexão:
{
  "action": "reflect",
  "think": "Seu raciocínio aqui",
  "questionsToAnswer": ["pergunta 1", "pergunta 2", "pergunta 3", "pergunta 4", "pergunta 5"]
}

8. IMPORTANTE:
   - Use EXATAMENTE os nomes dos campos mostrados acima
   - Para busca, use sempre "searchQuery" (não use "query")
   - Inclua sempre o campo "think" explicando seu raciocínio
   - Mantenha a estrutura exata do JSON
   - NUNCA diga apenas "depende" ou "consulte um profissional", "preciso de mais informações", ou "não sei".
   - NUNCA diga que não sabe a resposta, ou que não consegue responder.
   - SEMPRE QUE CHEGAR A UM IMPARSE OU NAO SOUBER RESOLVER, RACIOCINE COMO REFORMULAR A QUERY E PROCURAR POR NOVAS URLS PARA BUSCAR MAIS INFORMAÇÕES.
   - SEMPRE mostre todas as possibilidades
   - SEMPRE dê exemplos práticos
   - SEMPRE cite a legislação (base legal, caso seja UM FATOR PRINCIPAL PARA A RESPOSTA)
   - SEMPRE que não souber como acessar uma fonte, procure documentação da fonte ou use ferramentas de busca na internet para encontrar como acessar.
   - SEMPRE que precisar ler documentos salve eles na pasta "documents" e forneça o nome do arquivo e o link para acesso, identifique os paragrafo com numeros contendo link de acesso a referencia.
        `,
          },
          { 
            // Papel da mensagem
            role: "user", 
            // Conteúdo da mensagem
            content: prompt 
          }
        ],
        // Temperatura
        temperature: options.generationConfig.temperature,
        // Número máximo de tokens
        max_tokens: -1,
        // Stream
        stream: false
      };
      // Cria o endpoint completo
      const fullEndpoint = `${this.endpoint}/v1/chat/completions`.replace(/(?<!:)\/+/g, '/');
      // Loga o endpoint completo
      console.log('Endpoint completo:', fullEndpoint);
      // Faz a solicitação POST para o endpoint de conclusão de chat
      const response = await fetch(fullEndpoint, {
        // Método POST
        method: 'POST',
        // Cabeçalhos da requisição
        headers: { "Content-Type": "application/json" },
        // Corpo da requisição
        body: JSON.stringify(payload)
      });

      // Converte a resposta para JSON
      const data = await response.json() as ModelResponse;

      // Se houver um erro, lança um erro
      if (data.error) {
        // Loga o erro
        console.error('\x1b[31m%s\x1b[0m', `Erro na resposta do modelo: ${data.error}`);
        // Lança um erro
        throw new Error(`Erro na resposta do modelo: ${data.error}`);
      }

      // Se a resposta não contém um conteúdo de mensagem válido, lança um erro
      if (!data.choices || !data.choices[0]?.message?.content) {
        // Lança um erro
        throw new Error('Resposta do modelo não contém conteúdo válido');
      }

      // Pega o conteúdo da resposta
      const rawContent = data.choices[0].message.content;
      // Loga o conteúdo da resposta
      console.log('Resposta completa do modelo:', rawContent);
      
      try {
        // Extrai o último JSON da resposta (após o raciocínio)
        const jsonContent = extractLastJSON(rawContent);
        let content = JSON.parse(jsonContent);
        
        // Normaliza a ação se necessário
        if (content.action) {
          // Normaliza a ação
          const normalizedAction = normalizeAction(content.action);
          // Se a ação foi alterada, loga a alteração
          if (normalizedAction !== content.action) {
            // Loga a alteração
            console.log(`Normalizando ação de "${content.action}" para "${normalizedAction}"`);
            // Atualiza a ação
            content.action = normalizedAction;
          }
        }

        // Normaliza searchQuery se necessário
        content = normalizeSearchQuery(content);
        
        // Validação adicional do formato da ação
        if (!['search', 'answer', 'reflect', 'visit'].includes(content.action)) {
          // Loga o erro
          console.error('Ação inválida detectada mesmo após normalização:', content.action);
          // Tenta corrigir o erro
          const correctedContent = await this.retryWithCorrection(prompt, 'Ação inválida');
          // Retorna o conteúdo corrigido
          return this.generateContentMethod(correctedContent);
        }

        // Validação adicional dos campos obrigatórios
        if (content.action === 'search' && !content.searchQuery) {
          // Loga o erro
          console.error('Campo searchQuery faltando');
          // Tenta corrigir o erro
          const correctedContent = await this.retryWithCorrection(prompt, 'Campo searchQuery é obrigatório para ação search');
          // Retorna o conteúdo corrigido
          return this.generateContentMethod(correctedContent);
        }

        // Loga a ação
        if (content.action === 'answer') {
          // Loga a resposta encontrada
          console.log('\x1b[32m%s\x1b[0m', 'Resposta encontrada! Verificando qualidade...');
        } else if (content.action === 'search') {
          // Loga a busca
          console.log('\x1b[33m%s\x1b[0m', 'Realizando busca com JINA...');
        }

        // Retorna o conteúdo da resposta
        return {
          response: {
            text: () => JSON.stringify(content),
            usageMetadata: data.usage || { totalTokenCount: 0 }
          }
        };
      } catch (e: unknown) {
        // Loga o erro
        console.error('\x1b[31m%s\x1b[0m', 'Erro ao processar resposta do modelo:', e);
        // Loga a resposta completa
        console.log('Resposta completa do modelo:', rawContent);
        // Tenta corrigir o erro
        const correctedContent = await this.retryWithCorrection(prompt, (e as Error).message);
        // Retorna o conteúdo corrigido
        return this.generateContentMethod(correctedContent);
      }
    };

    // Retorna o método de geração de conteúdo
    return {
      generateContent: async (prompt: string) => {
        const result = await this.generateContentMethod(prompt);
        return result;
      }
    };
  }

  async generateContent(prompt: string) {
    // Obtém o resultado bruto a partir do método sendRequest
    const result = await this.sendRequest(prompt);

    // Valida o formato do resultado
    if (!validateResponseStructure(result)) {
      throw new Error(
        `Formato de resposta inválido. Esperado: ${JSON.stringify(this.expectedFormats)}`
      );
    }

    // Embala a resposta para garantir a consistência do contrato:
    // - A propriedade "response" possui o método text() para retornar o JSON stringificado.
    // - A propriedade "usageMetadata" é obtida a partir do campo "usage" ou, se não houver, é definido com totalTokenCount 0.
    return {
      response: {
        text: () => JSON.stringify(result),
        usageMetadata: result.usage || { totalTokenCount: 0 }
      }
    };
  }
}

// Adicione esta função de validação
function validateResponseStructure(response: any): boolean {
  const validActions = ['search', 'answer', 'reflect'];
  if (!validActions.includes(response.action)) return false;
  
  switch(response.action) {
    case 'search':
      return !!response.think && !!response.searchQuery;
    case 'answer':
      return !!response.think && !!response.answer && Array.isArray(response.references);
    case 'reflect':
      return !!response.think && Array.isArray(response.questionsToAnswer);
    default:
      return false;
  }
}