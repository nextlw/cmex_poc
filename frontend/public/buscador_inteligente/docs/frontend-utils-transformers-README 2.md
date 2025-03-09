# Transformadores de Tipos

Este módulo contém transformadores para garantir a consistência de tipos entre o backend e o frontend.

## Status dos Testes

✅ **Todos os testes passaram (33 testes em 4 arquivos)**

- `queryTransformers.test.ts`: 9 testes ✓
- `tokenTrackerTransformers.test.ts`: 8 testes ✓
- `streamMessageTransformers.test.ts`: 11 testes ✓
- `logsTransformers.test.ts`: 5 testes ✓

### Comportamentos Validados

#### QueryTransformers

- Mantém status compatíveis inalterados
- Converte 'processing' para 'in_progress'
- Lida com status inválidos usando fallback

#### TokenTrackerTransformers

- Transforma trackers completos corretamente
- Calcula totais quando getTotalUsage não está disponível
- Lida com propriedades faltantes e valores inválidos
- Validação via schemas Zod

#### StreamMessageTransformers

- Mantém tipos básicos compatíveis
- Transforma tipos específicos do backend para 'progress'
- Lida com erros de transformação graciosamente

#### LogsTransformers

- Transforma logs válidos mantendo campos essenciais
- Lida com logs inválidos usando valores padrão
- Suporta transformação com promptContents

## Validação com Zod

Todos os transformadores utilizam schemas Zod para validação, garantindo:

- Tipos corretos para todos os campos
- Valores de enum válidos
- Fallbacks apropriados em caso de erro

## Tratamento de Erros

Os transformadores implementam tratamento robusto de erros:

- Logs apropriados para erros de validação
- Valores fallback seguros
- Manutenção da estabilidade da aplicação

## Melhores Práticas

1. Sempre use os transformadores ao receber dados do backend
2. Mantenha o backend como fonte única da verdade
3. Documente mudanças nos tipos
4. Adicione testes para novos casos de uso

## Objetivo

O principal objetivo desses transformadores é:

1. **Padronizar tipos**: Garantir que estruturas de dados similares sigam os mesmos padrões em todo o sistema
2. **Validar dados**: Verificar se os dados recebidos atendem aos formatos esperados
3. **Lidar com incompatibilidades**: Transformar tipos incompatíveis entre backend e frontend
4. **Fornecer fallbacks**: Prover valores padrão quando dados estão ausentes ou inválidos

## Transformadores Disponíveis

### 1. QueryTransformers

Transforma tipos relacionados a consultas:

```typescript
// Transformar status individual
import { transformQueryStatus } from './utils/transformers/queryTransformers';
const frontendStatus = transformQueryStatus(backendStatus);

// Transformar objeto de consulta
import { transformQueryObject } from './utils/transformers/queryTransformers';
const transformedQuery = transformQueryObject(backendQuery);

// Transformar lista de consultas
import { transformQueryList } from './utils/transformers/queryTransformers';
const transformedQueries = transformQueryList(backendQueries);
```

### 2. StreamMessageTransformers

Transforma mensagens de streaming entre backend e frontend:

```typescript
import { transformStreamMessage } from './utils/transformers/streamMessageTransformers';

// Em componentes que processam eventos SSE
eventSource.onmessage = (event) => {
  const rawData = JSON.parse(event.data);
  
  // Aplicar transformador para garantir consistência
  const transformedData = transformStreamMessage(rawData);
  
  // Processar dados transformados
  // ...
};
```

### 3. LogsTransformers

Transforma logs do servidor para o formato esperado pelo cliente:

```typescript
import { transformLogsResponse } from './utils/transformers/logsTransformers';

// Em componentes que exibem logs
fetch('/api/v1/logs')
  .then(res => res.json())
  .then(data => {
    const transformedLogs = transformLogsResponse(data.serverLogs || []);
    setLogs(transformedLogs);
  });
```

### 4. TokenTrackerTransformers

Transforma a classe TokenTracker do backend em um objeto simples para o frontend:

```typescript
import { transformTokenTracker } from './utils/transformers/tokenTrackerTransformers';

// Transformar um tracker de tokens
const frontendTracker = transformTokenTracker(backendTracker);
```

## Boas Práticas

1. **Sempre use transformadores** para dados que vêm do backend
2. **Centralize mudanças** nas transformações, não nos componentes
3. **Escreva testes** para cada transformador
4. **Documente incompatibilidades** no documento `transformacoes-tipos.md`
5. **Mantenha o backend como fonte da verdade** para definições de tipo
