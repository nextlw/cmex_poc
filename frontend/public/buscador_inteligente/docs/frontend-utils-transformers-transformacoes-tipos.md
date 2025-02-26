# Mapeamento de Transformações de Tipos

Este documento detalha as transformações de tipos entre o backend e o frontend, servindo como referência para desenvolvedores.

## 1. Query Status

### Backend para Frontend
```typescript
// Backend (types.ts)
type BackendQueryStatus = 
  | 'processing'    // Em processamento
  | 'in_progress'   // Em progresso
  | 'completed'     // Finalizado
  | 'error'        // Erro

// Frontend (types/index.ts)
type FrontendQueryStatus = 
  | 'in_progress'   // Em progresso (unifica 'processing' e 'in_progress')
  | 'completed'     // Finalizado
  | 'error'        // Erro
```

### Transformações
- `processing` -> `in_progress`
- `in_progress` -> `in_progress`
- `completed` -> `completed`
- `error` -> `error`
- Outros valores -> `in_progress` (fallback)

## 2. Stream Message Types

### Backend para Frontend
```typescript
// Backend
type BackendStreamMessageType = 
  | 'progress'   // Progresso geral
  | 'answer'     // Resposta final
  | 'error'      // Erro
  | 'search'     // Busca em andamento
  | 'reflect'    // Reflexão/pensamento
  | 'visit'      // Visitando recurso
  | 'log'        // Log de sistema
  | 'connected'  // Conexão estabelecida

// Frontend
type FrontendStreamMessageType = 
  | 'progress'   // Progresso (unifica vários tipos do backend)
  | 'answer'     // Resposta final
  | 'error'      // Erro
  | 'connected'  // Conexão estabelecida
```

### Transformações
- Tipos mantidos: `progress`, `answer`, `error`, `connected`
- Tipos unificados para `progress`: `search`, `reflect`, `visit`, `log`

## 3. Token Tracker

### Backend para Frontend
```typescript
// Backend
class TokenTracker {
  usages: Array<{ tool: string; tokens: number }>;
  budget: number;
  getTotalUsage(): number;
}

// Frontend
interface FrontendTokenTracker {
  usage: Array<{ tool: string; tokens: number }>;
  totalTokens: number;
}
```

### Transformações
- Remove `budget` (informação interna)
- Simplifica para interface plana
- Calcula `totalTokens` do array de `usage` se `getTotalUsage()` não disponível
- Valores default: `{ usage: [], totalTokens: 0 }`

## 4. Logs

### Backend para Frontend
```typescript
// Backend
interface ServerLog {
  context: {
    pid: number;
    env: string;
    requestId?: string;
  };
  timestamp: string;
  message: string;
  level: 'log' | 'error' | 'warn' | 'info';
}

// Frontend
interface FrontendLog {
  timestamp: string;
  message: string;
  level: 'log' | 'error' | 'warn' | 'info';
}
```

### Transformações
- Remove `context` (informação interna)
- Mantém campos essenciais: `timestamp`, `message`, `level`
- Valores default: `level: 'error'` para logs inválidos

## Validação e Tratamento de Erros

Todos os transformadores utilizam Zod para validação, com os seguintes comportamentos:

1. **Validação de Tipos**
   - Verifica tipos corretos para cada campo
   - Garante valores de enum válidos
   - Valida estruturas aninhadas

2. **Tratamento de Erros**
   - Logs detalhados para erros de validação
   - Valores fallback seguros
   - Nunca retorna undefined/null sem intenção

3. **Valores Default**
   - QueryStatus: `in_progress`
   - StreamMessage: tipo `error` com mensagem genérica
   - TokenTracker: `{ usage: [], totalTokens: 0 }`
   - Logs: nível `error` com mensagem original

## Manutenção

1. **Atualizações de Tipo**
   - Documente novas incompatibilidades aqui
   - Atualize os transformadores correspondentes
   - Adicione testes para novos casos

2. **Verificação de Mudanças**
   - Execute `npm test` para validar transformações
   - Verifique logs de erro em produção
   - Monitore falhas de validação 