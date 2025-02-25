# @cmex/shared-types

Pacote para tipos compartilhados entre frontend e backend da CMEX, com validação usando Zod.

## Instalação

```bash
npm install @cmex/shared-types
```

## Objetivo

Este pacote tem como objetivo:

1. **Centralizar definições de tipos** entre frontend e backend
2. **Facilitar a validação** de dados usando Zod
3. **Padronizar transformadores** para garantir compatibilidade de tipos
4. **Documentar incompatibilidades** entre backend e frontend

## Uso Básico

### Importando Tipos e Transformadores

```typescript
// Importações diretas dos tipos e funções específicas
import { 
  transformQueryStatus, 
  BackendQueryStatus, 
  FrontendQueryStatus 
} from '@cmex/shared-types';

// OU importações por namespaces
import { Query, Stream, Logs, TokenTracker } from '@cmex/shared-types';
```

### Transformando Consultas

```typescript
import { Query } from '@cmex/shared-types';

// Dados recebidos do backend
const backendQuery = {
  id: '123',
  title: 'Consulta de teste',
  timestamp: '2023-02-25T12:00:00Z',
  status: 'processing', // Status do backend
  question: 'Como implementar transformadores de tipo?'
};

// Transformar para o formato do frontend
const frontendQuery = Query.transformQueryObject(backendQuery);
// frontendQuery.status será 'in_progress'
```

### Lidando com Mensagens de Streaming

```typescript
import { Stream } from '@cmex/shared-types';

// Mensagem recebida do backend
const backendMessage = {
  type: 'search',
  data: 'buscando informações',
  trackers: {
    tokenTracker: {
      usages: [{ tool: 'search', tokens: 10 }],
      getTotalUsage: () => 10
    }
  }
};

// Transformar para o formato do frontend
const frontendMessage = Stream.transformStreamMessage(backendMessage);
// frontendMessage.type será 'progress'
```

### Validando Dados com Zod

```typescript
import { Query } from '@cmex/shared-types';

// Validar status
try {
  const validStatus = Query.backendQueryStatusSchema.parse('in_progress');
  console.log('Status válido:', validStatus);
} catch (error) {
  console.error('Status inválido');
}

// Validar objeto de consulta completo
try {
  const validQuery = Query.backendQuerySchema.parse({
    id: '123',
    title: 'Consulta válida',
    timestamp: '2023-02-25T12:00:00Z',
    status: 'completed',
    question: 'Esta é uma pergunta válida?'
  });
  console.log('Consulta válida:', validQuery);
} catch (error) {
  console.error('Consulta inválida');
}
```

## Módulos Disponíveis

### Query

Tipos e transformadores para consultas:

- `BackendQueryStatus` e `FrontendQueryStatus`
- `BackendQuery` e `FrontendQuery`
- `transformQueryStatus`, `transformQueryObject`, `transformQueryList`

### Stream

Tipos e transformadores para mensagens de streaming:

- `BackendStreamMessageType` e `FrontendStreamMessageType`
- `BackendStreamMessage` e `FrontendStreamMessage`
- `transformStreamMessageType`, `transformStreamMessage`

### Logs

Tipos e transformadores para logs do servidor:

- `ServerLog` e `FrontendLog`
- `LogsResponse` (contém os campos obrigatórios `serverLogs` e `logs`, e o campo opcional `promptContents`)
- `transformServerLog`, `transformLogsResponse`

### TokenTracker

Tipos e transformadores para o rastreador de tokens:

- `TokenUsage`
- `BackendTokenTracker` e `FrontendTokenTracker`
- `transformTokenTracker`

## Tratamento de Erros

O pacote inclui utilitários para tratamento de erros de validação:

```typescript
import { logTransformationError } from '@cmex/shared-types';

try {
  // Tentativa de validação
} catch (error) {
  logTransformationError('MinhaTranformação', dadosInválidos, error);
  // Retornar valores fallback seguros
}
```

## Incompatibilidades Conhecidas

### BackendQueryStatus -> FrontendQueryStatus

- `'processing'` no backend é mapeado para `'in_progress'` no frontend
- Ambos compartilham `'completed'` e `'error'`

### BackendStreamMessageType -> FrontendStreamMessageType

- `'search'`, `'reflect'`, `'visit'`, `'log'` no backend são mapeados para `'progress'` no frontend
- Ambos compartilham `'answer'`, `'error'` e `'connected'`

## Contribuindo

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Execute os testes: `npm test`
4. Faça suas alterações seguindo as convenções estabelecidas
5. Adicione testes para suas alterações
6. Envie um PR

## Versionamento

Este pacote segue o versionamento semântico (SemVer):

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Funcionalidades novas compatíveis
- **PATCH**: Correções de bugs compatíveis 

## Histórico de Mudanças

### v1.0.1 (25/02/2025)
- Alteração na interface `LogsResponse`: o campo `logs` agora é obrigatório em vez de opcional
- Correções em transformadores para garantir que o campo `logs` sempre esteja definido 