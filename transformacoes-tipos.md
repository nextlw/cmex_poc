# Transformações de Tipos entre Frontend e Backend

Este documento descreve como os tipos são transformados entre o backend (`buscador_inteligente/src`) e o frontend (`frontend/src`), utilizando o backend como a "fonte da verdade".

## Transformações Principais

### 1. `Query` → Status

**Backend (fonte da verdade):**
```typescript
type QueryStatus = 'in_progress' | 'processing' | 'completed' | 'error';
```

**Frontend:**
```typescript
// Em todos os componentes/arquivos
status: 'in_progress' | 'completed' | 'error';
```

**Transformação:**
- O backend possui um status adicional `'processing'` que não é exposto ao frontend
- Na API, `'processing'` é mapeado para `'in_progress'` quando enviado para o frontend
- Todas as instâncias em que o frontend usava `'pending'` foram atualizadas para `'in_progress'`

### 2. `ServerLog` → `LogsResponse`

**Backend (fonte da verdade):**
```typescript
export interface ServerLog {
  context: { 
    pid: number;
    env: string;
    requestId?: string;
  };
  timestamp: string;
  message: string;
  level: 'log' | 'error' | 'warn' | 'info';
}
```

**Frontend:**
```typescript
export interface LogsResponse {
  serverLogs: Array<{
    timestamp: string;
    message: string;
    level: "log" | "error" | "warn" | "info";
  }>;
  promptContents?: Array<{
    filename: string;
    content: string;
  }>;
}
```

**Transformação:**
- O campo `context` do backend é omitido ao enviar logs para o frontend
- Os logs são encapsulados em um array dentro da propriedade `serverLogs`
- O frontend recebe informações adicionais de `promptContents` que não existem no tipo original

### 3. `TokenTracker` (Classe) → Objeto Simples

**Backend (fonte da verdade):**
```typescript
export class TokenTracker extends EventEmitter {
  private usages: TokenUsage[] = [];
  private budget?: number;
  
  // Métodos e propriedades...
}
```

**Frontend:**
```typescript
tokenTracker: {
  usage: Array<{tool: string; tokens: number}>;
  totalTokens: number;
}
```

**Transformação:**
- A classe complexa `TokenTracker` do backend é serializada em um objeto simples
- `TokenTracker.usages` é mapeado para `usage` no frontend
- `TokenTracker.getTotalUsage()` é calculado e enviado como `totalTokens`
- A propriedade `budget` e os métodos da classe são omitidos

### 4. `StreamMessage`

**Backend (fonte da verdade):**
```typescript
export interface StreamMessage {
  trackers: {
    tokenTracker: TokenTracker;
    actionTracker: ActionTracker;
  };
  type: 'progress' | 'answer' | 'error' | 'search' | 'reflect' | 'visit' | 'log' | 'connected';
  data: string | StepAction;
  outputs?: any[];
  step?: number;
  budget?: {
    used: number;
    total: number;
    percentage: string;
  };
}
```

**Frontend:**
```typescript
export interface StreamMessage {
  type: 'progress' | 'answer' | 'error' | 'connected';
  data?: {
    action?: 'search' | 'answer' | 'reflect';
    think?: string;
    answer?: string;
    searchQuery?: string;
    references?: Reference[];
    error?: string;
  };
  trackers?: {
    tokenTracker: {
      usage: Array<{tool: string; tokens: number}>;
      totalTokens: number;
    };
    actionTracker: {
      think: string;
      action: string;
      totalStep: number;
      badAttempts: number;
    };
  };
}
```

**Transformação:**
- O backend usa um conjunto maior de tipos para o campo `type`
- O frontend recebe apenas um subconjunto de tipos: 'progress', 'answer', 'error', 'connected'
- Tipos como 'search', 'reflect', 'visit', 'log' são transformados ou não expostos ao frontend
- O campo `data` é estruturado de forma diferente:
  - No backend: pode ser uma string ou objeto complexo do tipo `StepAction`
  - No frontend: é um objeto com propriedades específicas
- O campo `trackers` é obrigatório no backend, mas opcional no frontend
- O backend inclui campos adicionais como `outputs`, `step` e `budget` que não são expostos diretamente

## Princípios de Transformação

1. **Simplificação**: Os tipos do backend são geralmente simplificados para o frontend, eliminando detalhes de implementação desnecessários.

2. **Adaptação**: Tipos complexos (como classes) são convertidos em objetos simples para serialização JSON.

3. **Filtragem**: Campos sensitivos ou internos (como `context` em `ServerLog`) são frequentemente omitidos.

4. **Padronização**: Status e enums são padronizados, com o backend como fonte da verdade.

## Implementação das Transformações

As transformações são geralmente implementadas de duas formas:

1. **Backend**: Através de funções/métodos que formatam os dados antes de enviá-los como resposta da API.

2. **API Layer**: Middleware ou interceptores que transformam os objetos do backend antes de serializá-los como JSON.

Para manter a consistência, quando uma nova propriedade é adicionada no backend, deve-se decidir explicitamente se e como ela deve ser exposta ao frontend.

## Recomendações para Novas Transformações

1. Documentar todas as transformações neste arquivo
2. Implementar funções helper para transformações complexas
3. Considerar o uso de TypeScript para validação em tempo de compilação
4. Adicionar testes automatizados para verificar a corretude das transformações