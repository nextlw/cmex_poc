# Mapeamento de Tipos do Sistema

Este documento fornece uma visão geral das estruturas de tipos utilizadas no sistema, tanto no backend quanto no frontend.

## Parte 1: Estruturas Atuais

### 1. Query (Consulta)

#### Backend
```typescript style="background-color: #161921"
export interface Query {
  id: string;
  title: string;
  question: string;
  status: 'processing' | 'in_progress' | 'completed' | 'error';
  timestamp: string;
  summary?: string;
  metadata?: {
    source?: string;
    context?: string;
    tokens?: number;
  };
}
```

#### Frontend
```typescript style="background-color: #161921"
export interface Query {
  id: string;
  title: string;
  question: string;
  status: 'in_progress' | 'completed' | 'error';
  timestamp: string;
  summary?: string;
  isDeleting?: boolean; // Flag UI para animação
}
```

### 2. Stream Messages (Mensagens de Streaming)

#### Backend
```typescript style="background-color: #161921"
export interface StreamMessage {
  type: 'progress' | 'answer' | 'error' | 'search' | 'reflect' | 'visit' | 'log' | 'connected';
  data: any;
  trackers?: {
    tokenTracker?: TokenTracker;
    actionTracker?: ActionTracker;
  };
  outputs?: any[];
  step?: number;
  budget?: number;
}
```

#### Frontend
```typescript style="background-color: #161921"
export interface StreamMessage {
  type: 'progress' | 'answer' | 'error' | 'connected';
  data: {
    error?: string;
    answer?: string;
    searchQuery?: string;
    think?: string;
    action?: string;
  };
  trackers?: {
    tokenTracker?: FrontendTokenTracker;
    actionTracker?: ActionTracker;
  };
}
```

### 3. Token Tracking

#### Backend
```typescript style="background-color: #161921"
export class TokenTracker {
  usages: TokenUsage[];
  budget: number;
  
  constructor(budget: number) {
    this.usages = [];
    this.budget = budget;
  }
  
  addUsage(tool: string, tokens: number): void;
  getTotalUsage(): number;
  getRemainingBudget(): number;
}

export interface TokenUsage {
  tool: string;
  tokens: number;
}
```

#### Frontend
```typescript style="background-color: #161921"
export interface FrontendTokenTracker {
  usage: Array<{
    tool: string;
    tokens: number;
  }>;
  totalTokens: number;
}
```

### 4. Logs

#### Backend
```typescript style="background-color: #161921"
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

export interface LogsResponse {
  serverLogs: ServerLog[];
  promptContents?: Array<{
    filename: string;
    content: string;
  }>;
}
```

#### Frontend
```typescript style="background-color: #161921"
export interface FrontendLog {
  timestamp: string;
  message: string;
  level: 'log' | 'error' | 'warn' | 'info';
}

export interface LogsResponse {
  serverLogs: FrontendLog[];
  promptContents?: Array<{
    filename: string;
    content: string;
  }>;
}
```

## Sessão e Estado

### Backend
```typescript style="background-color: #161921"
export interface QuerySession {
  id: string;
  query: Query;
  context: {
    history: string[];
    metadata: Record<string, any>;
  };
  startTime: Date;
  endTime?: Date;
}
```

### Frontend
```typescript style="background-color: #161921"
export interface QuerySession {
  id: string;
  query: Query;
  messages: StreamMessage[];
  isActive: boolean;
  startTime: string;
  endTime?: string;
}
```

## Histórico

### Backend
```typescript style="background-color: #161921"
export interface QueryHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  status: BackendQueryStatus;
  summary?: string;
  question: string;
}
```

### Frontend
```typescript style="background-color: #161921"
export interface QueryHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  status: FrontendQueryStatus;
  summary?: string;
  question: string;
  isDeleting?: boolean;
}

export interface QueryHistoryProps {
  onSelectQuery: (query: QueryHistoryItem) => void;
  newQuery?: QueryHistoryItem;
  onNewQueryAdded?: () => void;
}
```

## Validação

Todos os tipos são validados usando schemas Zod. Consulte o documento `transformacoes-tipos.md` para detalhes sobre as transformações e validações específicas entre backend e frontend.

## Convenções de Nomenclatura

1. **Tipos do Backend**
   - Usar prefixo `Backend` quando houver equivalente no frontend
   - Usar nomes descritivos completos (ex: `ServerLog` vs `Log`)
   - Incluir metadados internos nos tipos

2. **Tipos do Frontend**
   - Usar prefixo `Frontend` quando houver equivalente no backend
   - Simplificar para o mínimo necessário
   - Incluir flags de UI quando necessário (ex: `isDeleting`)

## Manutenção

1. **Adicionando Novos Tipos**
   - Documente em ambos `mapeamento-tipos.md` e `transformacoes-tipos.md`
   - Siga as convenções de nomenclatura
   - Adicione validação Zod apropriada

2. **Modificando Tipos Existentes**
   - Atualize ambos os documentos
   - Verifique impactos nos transformadores
   - Atualize testes relacionados

3. **Removendo Tipos**
   - Documente a remoção
   - Atualize transformadores
   - Remova testes relacionados

## Parte 2: Histórico de Incompatibilidades

### Estrutura de Tipos Original

#### Arquivos Principais de Tipos

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

### Incompatibilidades Históricas

#### 1. Interface `Reference`

**Frontend:** 
```typescript style="background-color: #161921"
export interface Reference {
  exactQuote: string;
  url: string;
}
```

**Backend:**
```typescript style="background-color: #161921"
export interface Reference {
  exactQuote: string;
  url: string;
}
```

**Status:** ✅ Compatível

#### 2. Interface `StreamMessage` (Versão Antiga)

**Frontend (ChatPage):**
```typescript style="background-color: #161921"
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
```typescript style="background-color: #161921"
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

#### 3. Interface `QuerySession` e `QueryStep` (Versão Antiga)

**Frontend (QueryHistory):**
```typescript style="background-color: #161921"
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
```typescript style="background-color: #161921"
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

#### 4. Interface `Query` (Versão Antiga)

**Frontend (ChatPage):**
```typescript style="background-color: #161921"
export interface Query {
  id: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'error';
  question: string;
}
```

**Frontend (QueryHistory):**
```typescript style="background-color: #161921"
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

### Recomendações Históricas

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

### Plano de Ação Original

1. **Curto Prazo**:
   - Corrigir incompatibilidades críticas como os diferentes valores de status em `Query`
   - Documentar as transformações existentes entre tipos do backend e frontend

2. **Médio Prazo**:
   - Implementar adaptadores ou funções de mapeamento para tipos complexos
   - Padronizar a comunicação entre frontend e backend com contratos de API claros

3. **Longo Prazo**:
   - Considerar a criação de um pacote compartilhado para tipos comuns
   - Implementar validação em tempo de execução (ex: zod) para garantir conformidade dos tipos
