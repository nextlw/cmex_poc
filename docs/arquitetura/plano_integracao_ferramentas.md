# Plano de Integração das Ferramentas ao Buscador Inteligente via MCP

## Fase 1: Preparação da Estrutura de Integração

1. **Criar Módulo de Ponte na Pasta Fastapi**

   - Desenvolver um serviço intermediário em Python (`ferramentas_bridge`)
   - Implementar uma API RESTful para comunicação entre o buscador e as ferramentas
   - Definir endpoints claros para invocação de ferramentas

2. **Definir Tipos Compartilhados**

   - Criar novos tipos no `shared-types` para representar:
     - Requisições de ferramentas
     - Respostas de ferramentas
     - Metadados de execução
   - Garantir que todos os tipos sejam documentados com TypeScript

3. **Configurar Cliente MCP no Buscador**
   - Implementar um cliente MCP em TypeScript para o buscador
   - Definir interfaces de comunicação com o serviço de ponte

## Fase 2: Desenvolvimento do Agente de Ferramentas

1. **Implementar Agente de Ferramentas**

   - Criar `ToolAgent` na pasta fastapi
   - Configurar conexão com o servidor MCP das ferramentas
   - Implementar lógica de delegação e processamento de resultados

2. **Desenvolver Sistema de Roteamento**

   - Criar mecanismo para rotear solicitações para ferramentas específicas
   - Implementar cache para resultados frequentes
   - Adicionar logging detalhado para depuração

3. **Implementar Processador de Resposta**
   - Criar sistema para formatar respostas das ferramentas no formato esperado pelo buscador
   - Implementar mecanismos de fallback para casos de erro

## Fase 3: Integração com o Buscador Inteligente

1. **Criar Módulo de Detecção de Necessidades**

   - Implementar analisador de consultas para identificar necessidade de ferramentas
   - Desenvolver heurísticas para reconhecimento automático de oportunidades de uso

2. **Desenvolver Adaptador de API**

   - Criar adaptador para transformar chamadas de API do buscador em formato compatível com MCP
   - Implementar tradutores bidirecionais para tipos complexos

3. **Implementar Sistema de Análise via API**
   - Criar serviço para análise de elementos de página via API
   - Desenvolver extratores de informação estruturada
   - Implementar sistema de mapeamento de elementos DOM para ações

## Fase 4: Implementação de Fluxos de Execução

1. **Fluxo de Execução Direta**

   ```mermaid
   sequenceDiagram
       participant U as Usuário
       participant BI as Buscador Inteligente
       participant BD as Bridge de Detecção
       participant TA as Tool Agent
       participant MCP as MCP Server
       participant F as Ferramentas

       U->>BI: Consulta com pedido direto
       BI->>BD: Detecta necessidade de ferramenta
       BD->>TA: Solicita execução de ferramenta
       TA->>MCP: Requisita ferramenta via MCP
       MCP->>F: Executa ferramenta
       F->>MCP: Retorna resultado
       MCP->>TA: Processa resultado
       TA->>BD: Formata resultado para BI
       BD->>BI: Entrega resultado processado
       BI->>U: Apresenta resposta final
   ```

2. **Fluxo de Execução Automática**

   ```mermaid
   sequenceDiagram
       participant U as Usuário
       participant BI as Buscador Inteligente
       participant BD as Bridge de Detecção
       participant TA as Tool Agent
       participant MCP as MCP Server
       participant F as Ferramentas

       U->>BI: Consulta sem menção a ferramenta
       BI->>BD: Análise de oportunidade
       BD->>BD: Decisão de usar ferramenta
       BD->>TA: Solicita execução automática
       TA->>MCP: Requisita ferramenta via MCP
       MCP->>F: Executa ferramenta
       F->>MCP: Retorna resultado
       MCP->>TA: Processa resultado
       TA->>BD: Formata resultado para BI
       BD->>BI: Integra resultado na resposta
       BI->>U: Apresenta resposta enriquecida
   ```

## Fase 5: Desenvolvimento de Código

1. **Criação do Serviço Bridge (Python - fastapi)**

   ```python
   # fastapi/ferramentas_bridge/service.py
   from typing import Dict, Any, Optional
   from app.agent.mcp import MCPAgent
   from shared_types.tool_request import ToolRequest, ToolResponse

   class FerramentasBridge:
       def __init__(self):
           self.agent = MCPAgent()

       async def initialize(self):
           # Conectar ao servidor MCP local
           await self.agent.initialize(
               connection_type="stdio",
               command="python",
               args=["/path/to/ferramentas/app/mcp/server.py"]
           )

       async def execute_tool(self, request: ToolRequest) -> ToolResponse:
           # Validar tipo da requisição
           # Mapear para chamada MCP
           # Executar e retornar resposta formatada
   ```

2. **Definição de Tipos Compartilhados (TypeScript - shared-types)**

   ```typescript
   // shared-types/src/tool-integration.ts
   export interface ToolRequest {
     toolName: string;
     parameters: Record<string, unknown>;
     context?: {
       query: string;
       sessionId: string;
       previousResults?: Array<unknown>;
     };
   }

   export interface ToolResponse {
     result: unknown;
     metadata: {
       executionTime: number;
       success: boolean;
       errorMessage?: string;
     };
     rawOutput?: string;
   }
   ```

3. **Cliente MCP no Buscador (TypeScript - buscador_inteligente)**

   ```typescript
   // buscador_inteligente/src/tools/mcp-client.ts
   import { ToolRequest, ToolResponse } from "@cmex/shared-types";

   export class MCPClient {
     private apiEndpoint: string;

     constructor(endpoint = "/api/tools/bridge") {
       this.apiEndpoint = endpoint;
     }

     async executeTool(request: ToolRequest): Promise<ToolResponse> {
       // Implementar chamada à API bridge
     }

     async detectToolNeed(query: string): Promise<boolean> {
       // Implementar detecção de necessidade
     }
   }
   ```

## Fase 6: Integração e Testes

1. **API Endpoints**

   - Implementar rota `/api/tools/bridge` no FastAPI
   - Configurar segurança e validação

2. **Testes Automatizados**

   - Testes unitários para cada componente
   - Testes de integração para fluxos completos
   - Testes de carga para verificar escalabilidade

3. **Documentação**
   - Documentar todos os endpoints
   - Criar exemplos de uso para cada ferramenta
   - Documentar fluxos de integração

## Fase 7: Deploy e Monitoramento

1. **Implantação Faseada**

   - Deploy inicial em ambiente de homologação
   - Testes A/B com usuários selecionados
   - Rollout gradual

2. **Monitoramento**
   - Implementar métricas de uso de ferramentas
   - Monitorar tempos de resposta
   - Acompanhar taxa de sucesso das integrações

## Considerações Finais

- O plano mantém a separação de responsabilidades conforme as regras
- Toda implementação Python está na pasta fastapi
- Os tipos são centralizados no shared-types
- A arquitetura permite que o buscador continue funcionando mesmo se o serviço de ferramentas estiver indisponível
- A análise de elementos é feita via API, não visualmente
- A solução é escalável e pode acomodar novas ferramentas no futuro

## Comparação de Formatos JSON

A seguir, uma análise comparativa dos formatos JSON usados nos dois projetos e propostas para unificação:

### Formatos Atuais

| Aspecto                     | Buscador Inteligente                                                        | Ferramentas                              | Diferenças Principais                                              |
| --------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| **Modelo**                  | `modelo: string` <br> Ex: "Qwen2.5-7b-instruct-1m"                          | Baseado em classe Message com `role`     | Buscador usa string simples, Ferramentas usa classes Pydantic      |
| **Configurações do Modelo** | Parâmetros simples no objeto JSON                                           | `class ToolChoice(str, Enum)` com opções | Ferramentas tem tipagem mais forte e configurações mais detalhadas |
| **Query**                   | Formato básico: <br> `{ "consulta": string, ... }`                          | Formato estruturado com contexto         | Ferramentas inclui contexto histórico e ferramentas disponíveis    |
| **Resposta**                | Estrutura variável baseada em: <br> `SearchResponse`, `BraveSearchResponse` | `ToolResult` padronizado                 | Ferramentas usa formato consistente com campos padrão              |
| **Ferramentas**             | Implementação ad-hoc por função                                             | `BaseTool` com schema padronizado        | Ferramentas segue padrão consistente para todas as funcionalidades |
| **Tratamento de Erros**     | Básico com mensagens e códigos                                              | Estruturado com `ToolFailure`            | Ferramentas oferece capacidades mais abrangentes para erros        |

### Proposta de Unificação de Tipos

#### 1. Modelo e Configurações

```typescript
// shared-types/src/model-config.ts
export interface ModelConfig {
  modelName: string; // Nome do modelo (ex: "gpt-4", "gemini-pro", etc)
  provider?: string; // Provedor do modelo (ex: "openai", "google", "local")
  temperature?: number; // Temperatura para geração (0.0-1.0)
  maxTokens?: number; // Máximo de tokens na resposta
  toolChoice?: "none" | "auto" | "required"; // Comportamento de escolha de ferramentas
  streamingEnabled?: boolean; // Habilitar streaming de resposta
}
```

#### 2. Formato de Requisição Unificado

```typescript
// shared-types/src/unified-request.ts
export interface UnifiedRequest {
  query: string; // Consulta principal do usuário
  modelConfig: ModelConfig; // Configuração do modelo
  context?: {
    sessionId: string; // ID da sessão para manter contexto
    messages?: Message[]; // Histórico de mensagens (opcional)
    metadata?: Record<string, unknown>; // Metadados adicionais
  };
  tools?: {
    required?: boolean; // Se ferramentas são obrigatórias
    allowedTools?: string[]; // Lista de ferramentas permitidas (vazia = todas)
    forceToolUse?: boolean; // Se deve forçar uso de ferramenta específica
  };
  domainSpecific?: {
    // Campos específicos por domínio (ex: NCM)
    estadoOrigem?: string;
    operacao?: string;
    // ...outros campos conforme necessário
  };
}
```

#### 3. Formato de Resposta Unificado

```typescript
// shared-types/src/unified-response.ts
export interface UnifiedResponse {
  // Informações principais
  responseId: string; // ID único da resposta
  query: string; // Query original

  // Resposta principal
  content: string; // Conteúdo textual da resposta
  contentType: "text" | "json" | "html" | "markdown"; // Tipo da resposta

  // Ferramentas utilizadas
  tools?: {
    used: boolean; // Se alguma ferramenta foi usada
    toolName?: string; // Nome da ferramenta usada
    toolInput?: Record<string, unknown>; // Input enviado para ferramenta
    toolOutput?: Record<string, unknown>; // Output da ferramenta
  }[];

  // Metadados de processamento
  metadata: {
    model: string; // Modelo usado
    executionTime: number; // Tempo de execução (ms)
    tokens: {
      // Informações de tokens
      input: number; // Tokens de entrada
      output: number; // Tokens de saída
      total: number; // Total de tokens
    };
  };

  // Tratamento de erros
  error?: {
    code: string; // Código do erro (ex: "tool_error", "model_error")
    message: string; // Mensagem de erro
    details?: Record<string, unknown>; // Detalhes adicionais
  };

  // Campos adicionais específicos
  references?: {
    url: string;
    title: string;
    quote?: string;
  }[];

  // Conteúdo multimídia (imagens, etc.)
  media?: {
    type: string; // Tipo de mídia
    data: string; // Dados (normalmente base64)
    alt?: string; // Texto alternativo
  }[];
}
```

#### 4. Formato para Conversão de Ferramentas

```typescript
// shared-types/src/tool-adapters.ts
export interface ToolDefinition {
  name: string; // Nome da ferramenta
  description: string; // Descrição da ferramenta
  parameters: {
    // Parâmetros no formato JSONSchema
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
  returnSchema?: {
    // Schema de retorno (opcional)
    type: "object";
    properties: Record<string, any>;
  };
}

export interface ToolCallAdapter {
  // Métodos para adaptar entre os formatos
  buscadorToMCP(toolName: string, params: Record<string, unknown>): MCPToolCall;
  mcpToBuscador(mcpResult: any): BuscadorToolResult;
}
```

### Etapas para Implementação da Unificação

1. **Definir os tipos compartilhados em shared-types**

   - Implementar interfaces acima
   - Documentar todos os campos
   - Criar validadores

2. **Implementar adaptadores no buscador_inteligente**

   - Criar conversores de/para formato unificado
   - Manter compatibilidade retroativa

3. **Implementar adaptadores no ferramentas**

   - Criar endpoint compatível com novo formato
   - Converter para/de formato interno

4. **Criar camada de compatibilidade**
   - Implementar versionamento da API
   - Suportar formato antigo e novo simultaneamente

### Campos Obrigatórios para Início

Para iniciar a unificação, o foco deve ser nos campos mais essenciais:

1. **Query e Configuração**

   - Formato de consulta
   - Seleção de modelo
   - Tipo de ferramenta necessária

2. **Detecção e Uso de Ferramentas**

   - Análise automática da necessidade
   - Obrigatoriedade quando solicitado
   - Seleção de ferramenta apropriada

3. **Tratamento de Erros**
   - Formato unificado de erros
   - Códigos de erro consistentes
   - Mensagens de erro padronizadas

Esta unificação permitirá que o buscador utilize as ferramentas de forma transparente, mantendo a interface consistente para os usuários finais e facilitando a expansão futura do sistema.

## Recursos do node-DeepResearch-jina para Aproveitar

Após análise do projeto node-DeepResearch-jina, identificamos diversos componentes e abordagens que podem ser aproveitados para enriquecer nossa integração de ferramentas:

### 1. Sistema Avançado de Tipagem e Ações

O projeto node-DeepResearch-jina implementa um sistema robusto de tipos que pode ser adaptado:

```typescript
// Estrutura de ações baseadas em tipo
type BaseAction = {
  action: "search" | "answer" | "reflect" | "visit" | "coding";
  think: string;
};

export type SearchAction = BaseAction & {
  /* ... */
};
export type AnswerAction = BaseAction & {
  /* ... */
};
export type ReflectAction = BaseAction & {
  /* ... */
};
// etc.
```

**Benefícios para integração:**

- Tipos fortemente definidos para cada ação específica
- Sistema de "think" embutido (raciocínio explícito do agente)
- Categorização clara de ações por tipo

### 2. Sistema de Rastreamento de Tokens

O TokenTracker do projeto pode ser adaptado para monitorar o uso de recursos de forma granular:

```typescript
export class TokenTracker extends EventEmitter {
  private usages: TokenUsage[] = [];

  trackUsage(tool: string, usage: LanguageModelUsage) {
    const u = { tool, usage };
    this.usages.push(u);
    this.emit("usage", usage);
  }

  // Métodos para análise e relatórios
  getTotalUsage(): LanguageModelUsage {
    /* ... */
  }
  getUsageBreakdown(): Record<string, number> {
    /* ... */
  }
}
```

**Benefícios para integração:**

- Monitoramento detalhado de uso de tokens por ferramenta
- Emissão de eventos para hooks externos
- Geração de relatórios de uso

### 3. Sistema de Avaliação e Verificação

O ferramental de avaliação pode enriquecer a capacidade de verificar resultados:

```typescript
export type EvaluationResponse = {
  pass: boolean;
  think: string;
  type?: EvaluationType;
  // Análises específicas
  freshness_analysis?: {
    /* ... */
  };
  plurality_analysis?: {
    /* ... */
  };
  // etc.
};
```

**Benefícios para integração:**

- Framework para validação de resultados
- Verificações específicas (atualidade, pluralidade, etc.)
- Feedback explícito sobre qualidade de resposta

### 4. Arquitetura de Ferramentas Plugáveis

O projeto implementa ferramentas como módulos independentes e facilmente extensíveis:

- `jina-search.ts`: Busca semântica via API Jina
- `read.ts`: Leitura e extração de conteúdo de URLs
- `evaluator.ts`: Avaliação da qualidade das respostas
- `query-rewriter.ts`: Reformulação de consultas

**Benefícios para integração:**

- Padrão consistente para implementação de ferramentas
- Abstração de APIs externas
- Tratamento adequado de erros e timeout

### 5. Fluxo de Execução Baseado em Agente

O sistema usa um fluxo sofisticado para gerenciar a execução de tarefas:

```typescript
export async function getResponse(
  question?: string,
  tokenBudget: number = 1_000_000,
  maxBadAttempts: number = 3
  // ...outros parâmetros
): Promise<{
  result: StepAction;
  context: TrackerContext;
  visitedURLs: string[];
  readURLs: string[];
  allURLs: string[];
}> {
  // Implementação
}
```

**Benefícios para integração:**

- Modelo de execução baseado em etapas
- Controle de orçamento de tokens
- Rastreamento de contexto entre chamadas

### 6. Configuração Flexível via JSON

O sistema de configuração permite personalização avançada:

```json
{
  "providers": {
    "gemini": { "createClient": "createGoogleGenerativeAI" },
    "openai": {
      "createClient": "createOpenAI",
      "clientConfig": { "compatibility": "strict" }
    }
  },
  "models": {
    "gemini": {
      "default": {
        /* configurações padrão */
      },
      "tools": {
        "coder": { "temperature": 0.7 },
        "dedup": { "temperature": 0.1 }
        // configurações específicas por ferramenta
      }
    }
  }
}
```

**Benefícios para integração:**

- Configuração granular por modelo e ferramenta
- Suporte a múltiplos provedores de LLM
- Definições de fallback

### Propostas de Adaptação

Para implementar esses recursos em nossa integração:

1. **Adotar a Tipagem Baseada em Ações**

   - Implementar sistema de tipos no `shared-types`
   - Adaptar o modelo de ações para o contexto do buscador/ferramentas

2. **Incorporar o TokenTracker**

   - Adaptar o rastreador para ambos os ambientes Node.js e Python
   - Usar como componente central de monitoramento

3. **Aproveitar o Sistema de Avaliação**

   - Implementar verificações de qualidade em respostas
   - Adicionar validações específicas por tipo de ferramenta

4. **Adaptar a Arquitetura de Ferramentas**

   - Usar como inspiração para a estrutura do `ToolAgent`
   - Implementar padrão consistente para todas as ferramentas

5. **Implementar Configuração Flexível**
   - Criar sistema de configuração unificado
   - Permitir configurações específicas por ferramenta/modelo

Esta adaptação traria uma arquitetura mais robusta e flexível, aproveitando o trabalho já realizado no projeto node-DeepResearch-jina, enquanto mantém a conformidade com as regras do projeto e o design proposto no plano de integração.
