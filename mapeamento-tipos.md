# Mapeamento de Tipos entre Frontend e Backend

## Introdução

Este documento mapeia as conexões entre os tipos definidos no frontend (`frontend/src`) e no backend (`buscador_inteligente/src`), identificando possíveis incompatibilidades. Este mapeamento é essencial para garantir a consistência de dados entre as aplicações.

## Estrutura de Tipos

### Arquivos Principais de Tipos

**Frontend:**
- `frontend/src/types/globalTypes.ts` - Define tipos globais reutilizáveis
- `frontend/src/types/index.ts` - Exporta tipos do arquivo globalTypes
- `frontend/src/components/**/types.ts` - Tipos específicos para componentes
- `frontend/src/pages/**/types.ts` - Tipos específicos para páginas

**Backend:**
- `buscador_inteligente/src/types/globalTypes.ts` - Define tipos globais do backend
- `buscador_inteligente/src/types/index.ts` - Exporta tipos do globalTypes
- `buscador_inteligente/src/types/session.ts` - Tipos relacionados a sessões de consulta
- `buscador_inteligente/src/utils/token-tracker.ts` - Implementação da classe TokenTracker

## Tipos Compartilhados e Incompatibilidades

### 1. Interface `Reference`

**Frontend:** 
```typescript
export interface Reference {
  exactQuote: string;
  url: string;
}
```

**Backend:**
```typescript
export interface Reference {
  exactQuote: string;
  url: string;
}
```

**Status:** ✅ Compatível

### 2. Interface `StreamMessage`

**Frontend (ChatPage):**
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

**Backend:**
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

**Status:** ❌ **Incompatível**

**Incompatibilidades:**
1. Tipos para o campo `type` não coincidem totalmente (frontend tem menos opções)
2. Estrutura do campo `data` é diferente
3. Backend tem campo `trackers` obrigatório, enquanto no frontend é opcional
4. Backend inclui campos adicionais como `outputs`, `step` e `budget`
5. Estrutura interna dos `trackers` difere entre as implementações

### 3. Interface `QuerySession` e `QueryStep`

**Frontend (QueryHistory):**
```typescript
export interface QuerySession {
  id: string;
  question: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'error';
  summary?: string;
  steps: QueryStep[];
  metadata: {
    model: string;
    totalTokens?: number;
    elapsedTime?: string;
    urlCount?: number;
  };
}
```

**Backend:**
```typescript
export interface QuerySession {
  id: string;
  question: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'error';
  summary?: string;
  steps: QueryStep[];
  metadata: {
    model: string;
    totalTokens?: number;
    elapsedTime?: string;
    urlCount?: number;
  };
}
```

**Status:** ✅ Compatível

### 4. Interface `Query`

**Frontend (ChatPage):**
```typescript
export interface Query {
  id: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'error';
  question: string;
}
```

**Frontend (QueryHistory):**
```typescript
export interface Query {
  id: string;
  title: string;
  timestamp: string;
  status: 'in_progress' | 'completed' | 'error';
  question: string;
}
```

**Status:** ❌ **Incompatível internamente no frontend**

**Incompatibilidades:**
1. Valores possíveis para `status` diferem: 'pending' vs 'in_progress'

### 5. Interface `ServerLog` e `LogsResponse`

**Frontend (globalTypes):**
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

**Backend (globalTypes):**
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

**Status:** ❌ **Parcialmente Incompatível**

**Incompatibilidades:**
1. O frontend utiliza uma estrutura `LogsResponse` que contém um array de logs sem o campo `context` presente no backend
2. O backend define o tipo individual `ServerLog` com informações de contexto adicionais que não são refletidas no frontend
3. A API provavelmente transforma `ServerLog[]` em um objeto `LogsResponse` omitindo o campo `context`

### 6. Classes `TokenTracker` e Interface `TokenUsage`

**Frontend (ChatPage):**
```typescript
// Representação no componente do TokenTracker
tokenTracker: {
  usage: Array<{tool: string; tokens: number}>;
  totalTokens: number;
}
```

**Backend:**
```typescript
// Interface TokenUsage
export interface TokenUsage {
  tool: string;
  tokens: number;
  usage?: LanguageModelUsage;
}

// Classe TokenTracker
export class TokenTracker extends EventEmitter {
  private usages: TokenUsage[] = [];
  private budget?: number;
  
  constructor(budget?: number) {...}
  trackUsage(tool: string, tokens: number) {...}
  getTotalUsage(): number {...}
  getUsageBreakdown(): Record<string, number> {...}
  printSummary() {...}
  reset() {...}
}
```

**Status:** ❌ **Incompatível**

**Incompatibilidades:**
1. No backend, `TokenTracker` é uma classe completa que estende `EventEmitter` e tem métodos e propriedades
2. No frontend, é representado como um objeto simples com propriedades `usage` e `totalTokens`
3. `TokenUsage` no backend inclui um campo opcional `usage` para informações detalhadas que não existe no frontend
4. O frontend não implementa funcionalidades como rastreamento, orçamento e eventos do TokenTracker

### 7. Interface `QueryHistoryItem` e `QueryHistoryProps`

**Frontend (QueryHistory):**
```typescript
export interface QueryHistoryItem {
  id: string;
  title: string;
  question?: string;
  summary?: string;
  status: 'in_progress' | 'completed' | 'error';
  timestamp: string;
  references?: Reference[];
  isDeleting?: boolean;
}

export interface QueryHistoryProps {
  onSelectQuery: (query: QueryHistoryItem) => void;
  selectedQueryId?: string;
  newQuery?: QueryHistoryItem;
  onNewQueryAdded?: () => void;
}
```

**Status:** ⚠️ **Interno do Frontend (sem equivalente direto no Backend)**

**Observações:**
1. Estas interfaces são específicas do componente QueryHistory e não possuem equivalência direta no backend
2. `QueryHistoryItem` compartilha campos similares com `Query`, mas adiciona campos como `isDeleting` para controle de UI
3. As interfaces de componentes precisam mapear para os tipos globais quando se comunicam com a API

## Recomendações

1. **Padronizar `StreamMessage`**:
   - Considerar a criação de um tipo base compartilhado entre frontend e backend
   - Ou implementar um adaptador no frontend para converter entre os formatos

2. **Unificar `Query` no frontend**:
   - Padronizar os valores do status como 'in_progress' | 'completed' | 'error'
   - Mover a definição para `globalTypes.ts` para evitar duplicações

3. **Centralizar tipos compartilhados**:
   - Considerar extrair tipos comuns para um pacote compartilhado
   - Ou estabelecer um processo de sincronização entre os tipos do frontend e backend

4. **Sincronizar `ServerLog` e `LogsResponse`**:
   - Definir claramente a transformação entre `ServerLog` no backend e sua representação no frontend
   - Documentar quais campos são intencionalmente omitidos na API

5. **Mapear tipos complexos como `TokenTracker`**:
   - Documentar a transformação da classe do backend para a representação simples no frontend
   - Garantir que as APIs serializem corretamente os dados relevantes do TokenTracker para o frontend

6. **Estratégia para tipos específicos de componentes**:
   - Estabelecer diretrizes claras para conversão entre tipos globais e tipos específicos de componentes
   - Considerar o uso de funções utilitárias para mapear entre esses tipos de forma consistente

## Observações Adicionais

- A inconsistência de tipos pode causar problemas sutis quando novos campos ou valores são adicionados
- O uso de `any` em alguns campos (como `finalResult?: any`) pode esconder incompatibilidades potenciais
- Alguns componentes definem seus próprios tipos que podem se sobrepor a tipos globais
- Classes no backend sendo representadas como objetos simples no frontend gera desacoplamento, mas requer mapeamento claro
- Manter documentação atualizada quando novos tipos são adicionados ou modificados em qualquer lado

## Plano de Ação Sugerido

1. **Curto Prazo**:
   - Corrigir incompatibilidades críticas como os diferentes valores de status em `Query`
   - Documentar as transformações existentes entre tipos do backend e frontend

2. **Médio Prazo**:
   - Implementar adaptadores ou funções de mapeamento para tipos complexos
   - Padronizar a comunicação entre frontend e backend com contratos de API claros

3. **Longo Prazo**:
   - Considerar a criação de um pacote compartilhado para tipos comuns
   - Implementar validação em tempo de execução (ex: zod) para garantir conformidade dos tipos
