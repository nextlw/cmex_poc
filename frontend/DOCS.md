# Documentação CMEX Frontend

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   ├── pages/                # Componentes de página
│   ├── utils/                # Utilitários e funções auxiliares
│   │   ├── api/              # Funções para interação com a API
│   │   ├── transformers/     # Transformadores de dados
│   │   ├── types/            # Definições de tipos TypeScript
│   │   ├── styles/           # Estilos CSS e temas
│   │   ├── contexts/         # Contextos React para estado global
│   │   ├── hooks/            # Custom hooks
│   │   ├── App.tsx           # Componente principal
│   │   └── main.tsx          # Ponto de entrada
│   ├── public/               # Arquivos estáticos
│   ├── tests/                # Testes
│   └── package.json          # Dependências e scripts
```

## Convenções de Código

### Nomenclatura

- **Componentes**: PascalCase (ex: `QueryHistory.tsx`)
- **Funções/Variáveis**: camelCase (ex: `fetchData`, `isLoading`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_URL`)
- **Tipos/Interfaces**: PascalCase (ex: `QueryHistoryProps`)

### Importações

Organize as importações na seguinte ordem:

1. Bibliotecas externas (React, etc.)
2. Componentes
3. Utilitários/Funções
4. Tipos
5. Estilos

```typescript
// Bibliotecas
import React, { useState, useEffect } from 'react';

// Componentes
import { Button } from '../components/Button';

// Utilitários
import { transformQueryData } from '../utils/transformers';

// Tipos
import { QueryProps } from '../types';

// Estilos
import './styles.css';
```

## Transformadores

Os transformadores são funções que convertem dados entre o formato do backend e o formato esperado pelo frontend.

### Query Transformers

- `transformQueryStatus`: Converte status de consulta do backend para o frontend
- `transformQueryObject`: Transforma um objeto de consulta completo
- `transformQueryList`: Transforma uma lista de consultas

### Stream Transformers

- `transformStreamMessageType`: Converte tipo de mensagem de streaming
- `transformStreamMessage`: Transforma objeto de mensagem de streaming completo

### Logs Transformers

- `transformServerLog`: Converte log do servidor para formato do frontend
- `transformLogsResponse`: Transforma resposta de logs completa

## APIs

### Consultas

```typescript
// Obter lista de consultas
GET /api/v1/queries

// Obter detalhe de uma consulta
GET /api/v1/query/:id

// Criar nova consulta
POST /api/v1/query
{
  "question": "Como implementar transformadores?",
  "title": "Implementação de Transformadores"
}

// Excluir consulta
POST /api/v1/trash-query
{
  "id": "123"
}
```

### Streaming

Conexão WebSocket para `/api/v1/stream` com mensagens:

```typescript
// Mensagem do cliente
{
  "type": "query",
  "content": "Como implementar transformadores?"
}

// Mensagem do servidor
{
  "type": "progress" | "answer" | "error" | "connected",
  "content": "Conteúdo da mensagem",
  "data": { ... } // Dados específicos do tipo
}
```

### Logs

```typescript
// Obter logs do servidor
GET /api/v1/logs

// Resposta
{
  "serverLogs": [
    {
      "timestamp": "2023-02-25T12:00:00Z",
      "message": "Servidor iniciado",
 